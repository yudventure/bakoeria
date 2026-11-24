import { jumlahMalam, MENEMPATI, tanggalSah, tumpang, hariIniWit } from "@/lib/booking";
import { databaseReady } from "@/lib/db";
import { ambilKamar, bookingDalam } from "@/lib/server/buku";
import { gagal, ok } from "@/lib/server/rute";
import { rincianHarga, totalDenganAnak } from "@/lib/booking";
import { batasTarif, fleksibelBoleh, hitungKupon, kenaikanFleksibel, rapikanKode } from "@/lib/tarif";
import { bacaPengaturan } from "@/lib/server/simpanan";
import { kuponDenganKode } from "@/lib/server/kupon";

/** Kamar yang kosong untuk [masuk, keluar), dengan total harga. Tanpa data tamu. */
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const en = u.get("bahasa") !== "id";
  const m = (id: string, ing: string) => (en ? ing : id);
  if (!databaseReady()) return gagal(m("Pemesanan online belum aktif. Hubungi kami lewat WhatsApp.", "Online booking is not open yet. Please contact us on WhatsApp."), 503);
  const masuk = u.get("masuk");
  const keluar = u.get("keluar");
  if (!tanggalSah(masuk) || !tanggalSah(keluar) || keluar <= masuk) return gagal(m("Pilih tanggal tiba dan tanggal pulang.", "Choose your arrival and departure dates."));
  if (masuk < hariIniWit()) return gagal(m("Tanggal tiba sudah lewat.", "That arrival date has already passed."));
  if (jumlahMalam(masuk, keluar) > 30) return gagal(m("Untuk menginap lebih dari 30 malam, hubungi kami langsung.", "For stays longer than 30 nights, please contact us directly."));
  const [kamar, pesanan] = await Promise.all([ambilKamar(false), bookingDalam(masuk, keluar)]);
  const terisi = new Set(pesanan.filter((p) => MENEMPATI.includes(p.status) || p.status === "TENTATIVE").filter((p) => tumpang(p.checkIn, p.checkOut, masuk, keluar)).map((p) => p.roomId));
  const anak = Math.max(0, Math.min(6, Math.round(Number(u.get("anak")) || 0)));
  /* Kupon opsional: potongan dihitung per cottage (kupon bisa dibatasi untuk jenis tertentu). */
  const kode = rapikanKode(u.get("kupon"));
  const kupon = kode ? await kuponDenganKode(kode) : null;
  const hariIni = hariIniWit();
  const hasilKupon: ReturnType<typeof hitungKupon>[] = [];
  const malam = jumlahMalam(masuk, keluar);
  const tf = (await bacaPengaturan()).tarifFleksibel;
  const fleksibel = tf.aktif && fleksibelBoleh(masuk, hariIni, tf.batasHari);
  const daftar = kamar.map((k) => {
    const h = rincianHarga(masuk, keluar, k.baseRate, k.musim);
    const t = totalDenganAnak(h.total, anak);
    /* Harga normal (dicoret) hanya bila semua malam memakai tarif dasar yang sedang promo. */
    const promo = k.normalRate && k.normalRate > k.baseRate && h.baris.every((b) => b.tarif === k.baseRate);
    const hk = kode ? hitungKupon(kupon, { masuk, malam, tipe: k.roomType, total: t.total, hariIni }) : null;
    if (hk) hasilKupon.push(hk);
    const potongan = hk?.ok ? hk.potongan : 0;
    return {
      id: k.id,
      nama: k.name,
      tipe: k.roomType,
      ket: (en ? k.descEn || k.descId : k.descId || k.descEn) || null,
      dewasa: k.capAdult,
      anak: k.capChild,
      kapasitas: k.capAdult + k.capChild,
      tersedia: !terisi.has(k.id),
      hargaKamar: t.kamar,
      tambahanAnak: t.tambahanAnak,
      /** Nama musim (misalnya "Musim ramai") bila ada malam yang memakai tarif musiman. */
      musim: h.baris.find((b) => b.label)?.label ?? (h.baris.some((b) => b.tarif !== k.baseRate) ? "" : null),
      potongan,
      total: t.total - potongan,
      /** Tambahan bila memilih tarif Fleksibel (dari total sebelum kupon). */
      kenaikanFleksibel: fleksibel ? kenaikanFleksibel(t.total, tf.persen) : 0,
      normal: promo ? totalDenganAnak(k.normalRate! * h.baris.length, anak).total : potongan ? t.total : null,
    };
  });
  const diterima = hasilKupon.find((x) => x.ok);
  const ditolak = hasilKupon.find((x) => !x.ok) as { ok: false; alasan: string; batas?: number | string } | undefined;
  return ok({
    malam,
    kamar: daftar,
    tarif: { fleksibel, aktif: tf.aktif, persen: tf.persen, batasHari: tf.batasHari, batas: batasTarif(masuk, tf.batasHari) },
    kupon: !kode ? null : diterima ? { kode, ok: true } : { kode, ok: false, alasan: ditolak?.alasan ?? "tidakAda", batas: ditolak?.batas ?? null },
  });
}
