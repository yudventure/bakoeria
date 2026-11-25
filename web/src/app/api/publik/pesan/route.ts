import { headers } from "next/headers";

import { jumlahMalam, rupiah, tanggalSah, tglPanjang, hariIniWit, totalDenganAnak } from "@/lib/booking";
import { tglBahasa } from "@/lib/kamus";
import { databaseReady } from "@/lib/db";
import { ambilKamar, BentrokError, bookingDalam, buatBooking, hargaOtomatis } from "@/lib/server/buku";
import { MENEMPATI, tumpang } from "@/lib/booking";
import { alamatSaja, kirimEmail, pengirim } from "@/lib/server/email";
import { emailPesananAdmin } from "@/lib/server/email-pesanan";
import { emailDiterima, simpanRincian } from "@/lib/server/email-tamu";
import { kontakEmail, tautanPesanan } from "@/lib/server/kabar-pesanan";
import { badan, gagal, ok } from "@/lib/server/rute";
import { bacaKonten, bacaPengaturan } from "@/lib/server/simpanan";
import { batasTarif, fleksibelBoleh, hitungKupon, kenaikanFleksibel, rapikanKode, teksKupon } from "@/lib/tarif";
import { konfigMidtrans, tokenBayar } from "@/lib/server/midtrans";
import { KAMUS } from "@/lib/kamus";
import { kuponDenganKode, KuponHabisError, pastikanKuotaKupon } from "@/lib/server/kupon";

/** Pembatas sederhana: lima permintaan per alamat IP per jam. */
const jejak = new Map<string, number[]>();

/**
 * Permintaan pemesanan dari situs publik. Masuk ke kalender sebagai tahanan
 * (TENTATIVE) yang batal sendiri setelah `jamTahanan` bila tidak dikonfirmasi.
 * Harga selalu dihitung di server, tidak pernah dipercaya dari browser.
 */
export async function POST(req: Request) {
  const o = await badan(req);
  const en = o.bahasa !== "id";
  const m = (id: string, ing: string) => (en ? ing : id);
  if (!databaseReady()) return gagal(m("Pemesanan online belum aktif. Hubungi kami lewat WhatsApp.", "Online booking is not open yet. Please contact us on WhatsApp."), 503);
  const set = await bacaPengaturan();
  if (!set.terimaPesananWeb) return gagal(m("Pemesanan online sedang ditutup. Hubungi kami lewat WhatsApp.", "Online booking is closed for now. Please contact us on WhatsApp."), 503);
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "tanpa-ip";
  const kini = Date.now();
  const daftar = (jejak.get(ip) ?? []).filter((t) => kini - t < 3600000);
  if (daftar.length >= 5) return gagal(m("Terlalu banyak permintaan. Coba lagi nanti atau hubungi kami lewat WhatsApp.", "Too many requests. Please try again later or contact us on WhatsApp."), 429);
  if (typeof o.situs === "string" && o.situs) return ok({ diterima: true }); // isian jebakan untuk bot
  const s = (v: unknown, n = 120) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const nama = s(o.nama);
  const telepon = s(o.telepon, 40);
  const email = s(o.email);
  const catatan = s(o.catatan, 1000);
  const minat = s(o.minat, 60);
  const masuk = o.masuk;
  const keluar = o.keluar;
  const bulat = (v: unknown, maks: number) => Math.max(0, Math.min(maks, Math.round(Number(v) || 0)));
  /* Bentuk lama hanya mengirim `tamu`; bentuk baru mengirim dewasa, anak (5 tahun ke atas), dan balita. */
  const dewasa = Math.max(1, bulat(o.dewasa ?? o.tamu, 20));
  const anak = bulat(o.anak, 6);
  const balita = bulat(o.balita, 6);
  const tamu = dewasa + anak + balita;
  const asal = s(o.asal, 80);
  const sertifikat = s(o.sertifikat, 80);
  const jamTiba = s(o.jamTiba, 40);
  /* Asal kunjungan dari peramban (utm, gclid, fbclid, atau situs perujuk), untuk melihat iklan mana yang menghasilkan. */
  const asalKunjungan = s(o.asalKunjungan, 160).replace(/[\r\n]+/g, " ");
  if (!nama) return gagal(m("Isi nama Anda.", "Please enter your name."));
  if (!telepon && !email) return gagal(m("Isi nomor WhatsApp atau email supaya kami bisa membalas.", "Please enter a WhatsApp number or email so we can reply."));
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return gagal(m("Alamat email tidak sah.", "That email address is not valid."));
  if (!tanggalSah(masuk) || !tanggalSah(keluar) || keluar <= masuk) return gagal(m("Pilih tanggal tiba dan tanggal pulang.", "Choose your arrival and departure dates."));
  if (masuk < hariIniWit()) return gagal(m("Tanggal tiba sudah lewat.", "That arrival date has already passed."));
  if (jumlahMalam(masuk, keluar) > 30) return gagal(m("Untuk menginap lebih dari 30 malam, hubungi kami langsung.", "For stays longer than 30 nights, please contact us directly."));
  if (typeof o.kamar !== "string") return gagal(m("Pilih cottage.", "Please choose a cottage."));
  const hargaKamar = await hargaOtomatis(o.kamar, masuk, keluar);
  const kamarDipilih = (await ambilKamar(false)).find((k) => k.id === o.kamar);
  if (!hargaKamar || !kamarDipilih) return gagal(m("Cottage itu tidak ditemukan.", "That cottage was not found."));
  if (dewasa > kamarDipilih.capAdult || anak > kamarDipilih.capChild)
    return gagal(m(`Cottage ini untuk paling banyak ${kamarDipilih.capAdult} dewasa dan ${kamarDipilih.capChild} anak dengan extra bed.`, `This cottage sleeps up to ${kamarDipilih.capAdult} adults and ${kamarDipilih.capChild} children on extra beds.`));
  /* Anak 5 tahun ke atas: 50% harga kamar per malam (extra bed). Balita gratis. Dihitung di server. */
  const harga = totalDenganAnak(hargaKamar.total, anak);
  /* Kupon diperiksa ulang di server; potongan dari browser tidak pernah dipercaya. */
  const kode = rapikanKode(o.kupon);
  let potongan = 0;
  const kupon = kode ? await kuponDenganKode(kode) : null;
  if (kode) {
    const hk = hitungKupon(kupon, { masuk, malam: jumlahMalam(masuk, keluar), tipe: kamarDipilih.roomType, total: harga.total, hariIni: hariIniWit() });
    if (!hk.ok) {
      const tolak = KAMUS[en ? "en" : "id"].form.kuponTolak[hk.alasan];
      return gagal(typeof tolak === "function" ? tolak(hk.batas ?? "") : tolak, 400, { kupon: hk.alasan });
    }
    potongan = hk.potongan;
  }
  /* Tarif: Standar (tidak bisa refund, ganti tanggal sekali) atau Fleksibel (lebih mahal, bisa batal 100%). */
  const tf = set.tarifFleksibel;
  const fleksibel = o.tarif === "fleksibel";
  if (fleksibel && !(tf.aktif && fleksibelBoleh(masuk, hariIniWit(), tf.batasHari))) return gagal(m(`Tarif Fleksibel hanya untuk check-in paling cepat ${tf.batasHari} hari lagi. Pilih tarif Standar.`, `The Flexible rate needs check-in at least ${tf.batasHari} days away. Please choose the Standard rate.`));
  const kenaikan = fleksibel ? kenaikanFleksibel(harga.total, tf.persen) : 0;
  const batas = batasTarif(masuk, tf.batasHari);
  const teksTarifTim = fleksibel ? `Tarif: Fleksibel (+${tf.persen}%, ${rupiah(kenaikan)}). Bisa batal dengan uang kembali 100% sampai ${tglPanjang(batas)}, biaya kirim kembali uang ditanggung tamu.` : `Tarif: Standar. Tidak bisa refund, tanggal bisa diganti sekali sampai ${tglPanjang(batas)}.`;
  const bayar = harga.total - potongan + kenaikan;
  /* Antar-jemput perahu dan diving hanya permintaan: tidak masuk total cottage. Perahu dicocokkan dengan isi situs (versi Indonesia untuk tim). */
  const [ip_, jp_] = typeof o.transport === "string" && /^\d+-\d+$/.test(o.transport) ? o.transport.split("-").map(Number) : [-1, -1];
  const kontenTim = ip_ >= 0 ? await bacaKonten("id") : null;
  const perahuPilih = kontenTim?.perahu[ip_];
  const rutePilih = perahuPilih?.harga[jp_];
  const muatPerahu = Number(perahuPilih?.muat.match(/\d+/)?.[0]) || 0;
  if (rutePilih && muatPerahu && tamu > muatPerahu) return gagal(m(`${perahuPilih!.judul} memuat paling banyak ${muatPerahu} orang. Pilih perahu lain.`, `The ${perahuPilih!.judul} carries up to ${muatPerahu} people. Please choose another boat.`));
  /* Sekali jalan hanya bila harganya diisi; rute yang hanya punya harga sekali jalan selalu sekali jalan. */
  const sekaliJalan = !!rutePilih?.sekali && (o.arah === "sekali" || !rutePilih.harga);
  const arahTim = sekaliJalan ? "sekali jalan" : "pulang pergi";
  const teksTransport = perahuPilih && rutePilih ? `${perahuPilih.judul}, ${rutePilih.rute}, ${arahTim}, ${sekaliJalan ? rutePilih.sekali : rutePilih.harga} (dibayar terpisah)` : "";
  const penyelam = Math.min(tamu, bulat(o.selam, 20));
  /* Paket diving dari daftar harga selam (kunci "kelompok-baris"), atau kursus Open Water bila belum ada baris kursus. */
  const kunciSelam = typeof o.paketSelam === "string" ? o.paketSelam : "";
  const [gs, bs] = /^\d+-\d+$/.test(kunciSelam) ? kunciSelam.split("-").map(Number) : [-1, -1];
  const paketDari = async (b: "en" | "id") => {
    if (!penyelam) return "";
    if (kunciSelam === "kursus-ow") return b === "id" ? "Kursus Open Water (harga menyusul)" : "Open Water course (price to follow)";
    const g = gs >= 0 ? (await bacaKonten(b)).paket[gs] : undefined;
    const x = g?.isi[bs];
    return x ? `${g!.judul}: ${x.nama}${x.harga ? `, ${x.harga}` : ""}` : b === "id" ? "belum memilih paket, minta disarankan" : "no package yet, please advise";
  };
  const teksSelamTim = await paketDari("id");
  const kamarId = o.kamar;
  const terisi = (await bookingDalam(masuk, keluar)).some((b) => b.roomId === kamarId && (MENEMPATI.includes(b.status) || b.status === "TENTATIVE") && tumpang(b.checkIn, b.checkOut, masuk, keluar));
  if (terisi) return gagal(m("Cottage itu baru saja terisi untuk tanggal tersebut. Pilih cottage lain.", "That cottage has just been booked for those dates. Please choose another."), 409);
  jejak.set(ip, [...daftar, kini]);
  try {
    const p = await buatBooking(
      {
        roomId: o.kamar,
        checkIn: masuk,
        checkOut: keluar,
        channel: "WEBSITE",
        status: "TENTATIVE",
        source: "WEBSITE",
        pax: tamu,
        paxChild: anak,
        paxInfant: balita,
        totalAmount: bayar,
        couponCode: potongan || kode ? kode : null,
        discountAmount: kode ? potongan : null,
        notes: [`Tamu: ${dewasa} dewasa${anak ? `, ${anak} anak 5 tahun ke atas (50%, extra bed)` : ""}${balita ? `, ${balita} balita di bawah 5 tahun (gratis)` : ""}`, anak ? `Harga: kamar ${rupiah(harga.kamar)} + anak ${rupiah(harga.tambahanAnak)}` : "", kode && kupon ? `Kupon ${kode} (${teksKupon(kupon)}): potongan ${rupiah(potongan)} dari ${rupiah(harga.total)}` : "", teksTarifTim, `Antar-jemput: ${teksTransport || "tidak, tamu atur sendiri"}`, `Diving: ${penyelam ? `ya, ${penyelam} penyelam, ${sertifikat || "sertifikat belum diisi"}, ${teksSelamTim}` : "tidak"}`, jamTiba && `Perkiraan tiba: ${jamTiba}`, minat && `Minat: ${minat}`, `Bahasa situs: ${en ? "Inggris" : "Indonesia"}`, asalKunjungan && `Asal kunjungan: ${asalKunjungan}`, catatan].filter(Boolean).join("\n") || null,
        holdExpiresAt: new Date(kini + set.jamTahanan * 3600000).toISOString(),
        guest: { name: nama, phone: telepon || null, email: email || null, origin: asal || null, diveCert: sertifikat || null },
      },
      "Situs web",
      kode ? { sebelumSimpan: (k) => pastikanKuotaKupon(k, kode) } : {},
    );
    const ringkas = `${p.code}\n${nama} (${dewasa} dewasa${anak ? `, ${anak} anak 5+` : ""}${balita ? `, ${balita} balita` : ""})\n${p.roomName}, ${tglPanjang(masuk)} sampai ${tglPanjang(keluar)} (${jumlahMalam(masuk, keluar)} malam)\nPerkiraan ${rupiah(bayar)}${anak ? ` (kamar ${rupiah(harga.kamar)} + anak ${rupiah(harga.tambahanAnak)})` : ""}${kode ? `\nKupon ${kode}: potongan ${rupiah(potongan)}` : ""}\n${teksTarifTim}\nAsal: ${asal || "-"} · Sertifikat: ${sertifikat || "-"}${jamTiba ? ` · Tiba: ${jamTiba}` : ""}\nAntar-jemput: ${teksTransport || "tidak"}\nDiving: ${penyelam ? `ya, ${penyelam} penyelam, ${teksSelamTim}` : "tidak"}\nWhatsApp: ${telepon || "-"}\nEmail: ${email || "-"}\n${minat ? "Minat: " + minat + "\n" : ""}${catatan ? "Catatan: " + catatan + "\n" : ""}\nTahanan berlaku ${set.jamTahanan} jam. Konfirmasi di dashboard /kelola.`;
    void ringkas;
    const asalSitus = (process.env.SITE_URL?.trim() || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`).replace(/\/+$/, "");
    const surat = emailPesananAdmin({
      kontak: await kontakEmail(false),
      asal: asalSitus, id: p.id, kode: p.code, nama, telepon, email, cottage: p.roomName, masuk, keluar, malam: jumlahMalam(masuk, keluar),
      tamu: `${dewasa} dewasa${anak ? `, ${anak} anak 5+` : ""}${balita ? `, ${balita} balita` : ""}`, total: bayar, en, jamTahanan: set.jamTahanan, catatan,
      baris: [teksTarifTim, kode ? `Kupon ${kode}: potongan ${rupiah(potongan)}` : "", `Antar-jemput: ${teksTransport || "tidak"}`, `Diving: ${penyelam ? `ya, ${penyelam} penyelam, ${teksSelamTim}` : "tidak"}`, `Sertifikat: ${sertifikat || "-"}`, `Asal: ${asal || "-"}`, jamTiba ? `Perkiraan tiba: ${jamTiba}` : "", minat ? `Minat: ${minat}` : "", `Bahasa tamu: ${en ? "Inggris" : "Indonesia"}`, asalKunjungan ? `Asal kunjungan: ${asalKunjungan}` : ""].filter(Boolean),
    });
    await kirimEmail(set.emailNotifikasi || alamatSaja(pengirim()), surat.subjek, surat.teks, email || undefined, surat.html);
    /* Teks tambahan (perahu, diving) dalam bahasa tamu, untuk email dan invoice. */
    const kt = perahuPilih && en ? await bacaKonten("en") : kontenTim;
    const hk = kt?.perahu[ip_]?.harga[jp_];
    const pt = hk ? `${kt!.perahu[ip_].judul}, ${hk.rute}, ${sekaliJalan ? (en ? "one way" : "sekali jalan") : en ? "return" : "pulang pergi"}, ${(sekaliJalan ? hk.sekali : hk.harga) || (sekaliJalan ? rutePilih!.sekali : rutePilih!.harga)}` : teksTransport;
    const tambahanTamu = [perahuPilih && rutePilih ? (en ? `Boat transfer: ${pt}` : `Antar-jemput perahu: ${pt}`) : "", penyelam ? (en ? `Diving: ${penyelam} ${penyelam === 1 ? "person" : "people"}, ${sertifikat}, ${await paketDari("en")}` : `Diving: ${penyelam} orang, ${sertifikat}, ${teksSelamTim}`) : ""].filter(Boolean);
    const rincian = { en, dewasa, anak, balita, malam: jumlahMalam(masuk, keluar), hargaKamar: harga.kamar, tambahanAnak: harga.tambahanAnak, kupon: kode && potongan ? kode : "", potongan, tarif: (fleksibel ? "fleksibel" : "standar") as "fleksibel" | "standar", persen: tf.persen, kenaikan, batas, tambahan: tambahanTamu };
    await simpanRincian(p.id, rincian).catch((e) => console.error("[pesan] rincian tidak tersimpan", e));
    const midtrans = await konfigMidtrans();
    if (email) {
      const kontak = await kontakEmail(en);
      const tautan = await tautanPesanan(p.id, p.code, asalSitus, en);
      const surat = emailDiterima({ asal: asalSitus, kontak, namaResort: set.namaResort, kode: p.code, nama, email, telepon, cottage: p.roomName, masuk, keluar, total: bayar, rincian, en }, { jamTahanan: set.jamTahanan, bayar: midtrans ? tautan.bayar : "" });
      await kirimEmail(email, surat.subjek, surat.teks, set.emailNotifikasi || alamatSaja(pengirim()) || undefined, surat.html);
    }
    return ok({ kode: p.code, total: bayar, potongan, jamTahanan: set.jamTahanan, ...(midtrans ? { token: await tokenBayar(p.id) } : {}) }, 201);
  } catch (e) {
    if (e instanceof KuponHabisError) return gagal(KAMUS[en ? "en" : "id"].form.kuponTolak.habis, 409, { kupon: "habis" });
    if (e instanceof BentrokError) return gagal(m("Cottage itu baru saja terisi untuk tanggal tersebut. Pilih cottage lain.", "That cottage has just been booked for those dates. Please choose another."), 409);
    console.error(e);
    return gagal(m("Permintaan belum tersimpan. Coba lagi atau hubungi kami lewat WhatsApp.", "Your request was not saved. Please try again or contact us on WhatsApp."), 500);
  }
}
