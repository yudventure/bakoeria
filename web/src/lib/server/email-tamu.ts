import "server-only";
import { rupiah } from "@/lib/booking";
import { tglBahasa } from "@/lib/kamus";
import { bacaJson, ubahJson } from "./gudang";
import { deretTombol, esc, HURUF, kepala, kerangka, kotak, paragraf, ringkasan, salam, subjudul, tombol, WARNA, type KontakEmail } from "./email-kerangka";

/**
 * Email untuk tamu dan admin, dalam kerangka yang sama (email-kerangka.ts):
 * - pesanan baru (admin): rincian, tombol dashboard, WhatsApp, dan email
 * - pesanan diterima (tamu): ringkasan, kebijakan tarif, langkah berikutnya, Bayar sekarang
 * - pembayaran diterima (tamu): pesanan terkonfirmasi beserta invoice
 * - pesanan terkonfirmasi (tamu): saat admin mengonfirmasi di dashboard
 * Invoice yang sama juga tersedia sebagai halaman yang bisa dicetak (/api/publik/invoice).
 *
 * Rincian harga dan teks dalam bahasa tamu disimpan saat pesanan dibuat
 * (rincian-pesanan.json), karena pesanan di database hanya menyimpan totalnya.
 */
export interface RincianPesanan {
  en: boolean;
  dewasa: number;
  anak: number;
  balita: number;
  malam: number;
  hargaKamar: number;
  tambahanAnak: number;
  kupon: string;
  potongan: number;
  tarif: "standar" | "fleksibel";
  persen: number;
  kenaikan: number;
  /** Batas batal (Fleksibel) atau ganti tanggal (Standar), YYYY-MM-DD. */
  batas: string;
  /** Tambahan yang dibayar di tempat, dalam bahasa tamu (diving tanpa paket). */
  tambahan: string[];
  /** Tambahan yang masuk total pesanan (perahu, paket diving): label dalam bahasa tamu dan jumlahnya. */
  ekstra?: [string, number][];
}
const BERKAS = "rincian-pesanan.json";
export const simpanRincian = (id: string, r: RincianPesanan) => ubahJson<Record<string, RincianPesanan>>(BERKAS, {}, (l) => ({ ...l, [id]: r }), 0o600);
export const bacaRincian = async (id: string) => (await bacaJson<Record<string, RincianPesanan>>(BERKAS, {}))[id] ?? null;

export interface DataEmail {
  asal: string;
  kontak: KontakEmail;
  namaResort: string;
  kode: string;
  nama: string;
  email: string;
  telepon: string;
  cottage: string;
  masuk: string;
  keluar: string;
  total: number;
  rincian: RincianPesanan | null;
  en: boolean;
}

const T = {
  en: {
    tamu: (d: number, a: number, b: number) => [`${d} adult${d === 1 ? "" : "s"}`, a ? `${a} child${a === 1 ? "" : "ren"} 5+` : "", b ? `${b} under 5` : ""].filter(Boolean).join(", "),
    malam: (n: number) => `${n} night${n === 1 ? "" : "s"}`,
    kode: "Booking code", cottage: "Cottage", tanggal: "Dates", tamuL: "Guests", tarif: "Rate", total: "Total",
    standar: "Standard", fleksibel: "Flexible",
    kebStandar: (t: string) => `<b>Standard rate.</b> Non-refundable. The dates can be changed once, until ${t}.`,
    kebFleksibel: (t: string) => `<b>Flexible rate.</b> Cancel until ${t} and get 100% back. The cost of sending the money back is paid by the guest and depends on the payment method and exchange rate.`,
    terpisah: "Paid at the resort", termasuk: "Included in your total", makan: "All rates include three meals a day.",
    salam: "Warm regards,", tim: "The Bakoeria Dive Resort team",
    wa: "Chat with us on WhatsApp", bayar: (j: string) => `Pay now · ${j}`,
    diterima: { label: "Booking request received", judul: (n: string) => `Thank you, ${n}`, sub: "We have received your booking request. Here are the details.", subjek: (k: string) => `Booking request ${k} received · Bakoeria Dive Resort`, langkah: (jam: number, online: boolean) => online ? `<b>Next step.</b> Pay online now to confirm your booking right away. We hold the cottage for ${jam} hours. You can also wait for our team, who will reply with a confirmation and payment details.` : `<b>Next step.</b> We hold the cottage for ${jam} hours. Our team will reply shortly with a confirmation and payment details.`, pratinjau: (k: string) => `Your booking request ${k} at Bakoeria Dive Resort` },
    lunas: { label: "Payment received", judul: "Your booking is confirmed", sub: (n: string) => `Thank you, ${n}. We have received your payment and your stay is confirmed. Your invoice is below.`, subjek: (k: string) => `Booking ${k} confirmed · Invoice · Bakoeria Dive Resort`, cetak: "View and print invoice", pratinjau: (k: string) => `Payment received, booking ${k} confirmed` },
    konfirmasi: { label: "Booking confirmed", judul: "See you in Raja Ampat", sub: (n: string) => `Good news, ${n}. Your booking is confirmed.`, subjek: (k: string) => `Booking ${k} confirmed · Bakoeria Dive Resort`, bayarNanti: "Our team will send the payment details on WhatsApp or email.", pratinjau: (k: string) => `Your booking ${k} is confirmed` },
    tiba: "<b>Getting here.</b> Fly to Sorong, then take the ferry to Waisai or our private speedboat. Send us your arrival time and we will arrange the pick-up.",
    inv: { judul: "Invoice", nomor: "Invoice no.", tanggal: "Date", untuk: "Billed to", status: "Status", lunas: "PAID", belum: "UNPAID", deskripsi: "Description", jumlah: "Amount", anak: (n: number) => `${n} child${n === 1 ? "" : "ren"} 5+ (50%, extra bed)`, fleks: (p: number) => `Flexible rate (+${p}%)`, kupon: (k: string) => `Coupon ${k}`, dibayar: "Paid", sisa: "Balance due", cara: "Payment method", idTr: "Transaction ID", cetak: "Print or save as PDF", catatan: "This invoice was issued electronically and is valid without a signature." },
  },
  id: {
    tamu: (d: number, a: number, b: number) => [`${d} dewasa`, a ? `${a} anak 5+` : "", b ? `${b} balita` : ""].filter(Boolean).join(", "),
    malam: (n: number) => `${n} malam`,
    kode: "Kode pesanan", cottage: "Cottage", tanggal: "Tanggal", tamuL: "Tamu", tarif: "Tarif", total: "Total",
    standar: "Standar", fleksibel: "Fleksibel",
    kebStandar: (t: string) => `<b>Tarif Standar.</b> Tidak bisa refund. Tanggal bisa diganti sekali, sampai ${t}.`,
    kebFleksibel: (t: string) => `<b>Tarif Fleksibel.</b> Bisa batal sampai ${t} dengan uang kembali 100%. Biaya kirim kembali uang ditanggung tamu, besarnya tergantung cara bayar dan nilai tukar.`,
    terpisah: "Dibayar di tempat", termasuk: "Termasuk dalam total", makan: "Semua tarif sudah termasuk makan 3 kali sehari.",
    salam: "Salam hangat,", tim: "Tim Bakoeria Dive Resort",
    wa: "Chat lewat WhatsApp", bayar: (j: string) => `Bayar sekarang · ${j}`,
    diterima: { label: "Permintaan pesanan diterima", judul: (n: string) => `Terima kasih, ${n}`, sub: "Permintaan pesanan Anda sudah kami terima. Berikut rinciannya.", subjek: (k: string) => `Permintaan pesanan ${k} diterima · Bakoeria Dive Resort`, langkah: (jam: number, online: boolean) => online ? `<b>Langkah berikutnya.</b> Bayar online sekarang supaya pesanan langsung terkonfirmasi. Cottage kami tahan ${jam} jam. Anda juga bisa menunggu tim kami membalas dengan konfirmasi dan cara pembayaran.` : `<b>Langkah berikutnya.</b> Cottage kami tahan ${jam} jam. Tim kami akan segera membalas dengan konfirmasi dan cara pembayaran.`, pratinjau: (k: string) => `Permintaan pesanan ${k} di Bakoeria Dive Resort` },
    lunas: { label: "Pembayaran diterima", judul: "Pesanan Anda terkonfirmasi", sub: (n: string) => `Terima kasih, ${n}. Pembayaran Anda sudah kami terima dan pesanan terkonfirmasi. Invoice ada di bawah.`, subjek: (k: string) => `Pesanan ${k} terkonfirmasi · Invoice · Bakoeria Dive Resort`, cetak: "Lihat dan cetak invoice", pratinjau: (k: string) => `Pembayaran diterima, pesanan ${k} terkonfirmasi` },
    konfirmasi: { label: "Pesanan terkonfirmasi", judul: "Sampai jumpa di Raja Ampat", sub: (n: string) => `Kabar baik, ${n}. Pesanan Anda sudah terkonfirmasi.`, subjek: (k: string) => `Pesanan ${k} terkonfirmasi · Bakoeria Dive Resort`, bayarNanti: "Tim kami akan mengirim cara pembayaran lewat WhatsApp atau email.", pratinjau: (k: string) => `Pesanan ${k} terkonfirmasi` },
    tiba: "<b>Menuju ke sini.</b> Terbang ke Sorong, lalu naik feri ke Waisai atau speedboat privat kami. Kabari jam tiba Anda dan kami atur penjemputannya.",
    inv: { judul: "Invoice", nomor: "No. invoice", tanggal: "Tanggal", untuk: "Ditagihkan kepada", status: "Status", lunas: "LUNAS", belum: "BELUM DIBAYAR", deskripsi: "Keterangan", jumlah: "Jumlah", anak: (n: number) => `${n} anak 5+ (50%, extra bed)`, fleks: (p: number) => `Tarif Fleksibel (+${p}%)`, kupon: (k: string) => `Kupon ${k}`, dibayar: "Dibayar", sisa: "Sisa tagihan", cara: "Cara bayar", idTr: "ID transaksi", cetak: "Cetak atau simpan sebagai PDF", catatan: "Invoice ini diterbitkan secara elektronik dan sah tanpa tanda tangan." },
  },
};

const teks = (en: boolean) => (en ? T.en : T.id);
const tb = (s: string, en: boolean) => tglBahasa(s, en ? "en" : "id");

/** Ringkasan pesanan, dipakai email tamu. */
function barisPesanan(d: DataEmail): [string, string][] {
  const t = teks(d.en);
  const r = d.rincian;
  return [
    [t.kode, d.kode],
    [t.cottage, d.cottage],
    [t.tanggal, `${tb(d.masuk, d.en)} – ${tb(d.keluar, d.en)}${r ? ` · ${t.malam(r.malam)}` : ""}`],
    ...(r ? [[t.tamuL, t.tamu(r.dewasa, r.anak, r.balita)] as [string, string], [t.tarif, r.tarif === "fleksibel" ? t.fleksibel : t.standar] as [string, string]] : []),
    [t.total, rupiah(d.total)],
  ];
}
const kebijakan = (d: DataEmail) => {
  const t = teks(d.en);
  const r = d.rincian;
  if (!r?.batas) return "";
  return kotak(`${r.tarif === "fleksibel" ? t.kebFleksibel(esc(tb(r.batas, d.en))) : t.kebStandar(esc(tb(r.batas, d.en)))} ${esc(t.makan)}`, WARNA.kertas);
};
const tambahan = (d: DataEmail, denganTermasuk = true) => {
  const r = d.rincian;
  const termasuk = denganTermasuk && r?.ekstra?.length ? subjudul(teks(d.en).termasuk) + ringkasan(r.ekstra.map(([l, v]) => [l, rupiah(v)])) : "";
  if (!r?.tambahan.length) return termasuk;
  return termasuk + subjudul(teks(d.en).terpisah) + ringkasan(r.tambahan.map((x) => { const i = x.indexOf(":"); return i > 0 ? [x.slice(0, i), x.slice(i + 1).trim()] : ["", x]; }));
};
const tombolWa = (d: DataEmail) => (d.kontak.wa ? tombol(`https://wa.me/${d.kontak.wa}?text=${encodeURIComponent(`${d.en ? "Hello, my booking code is" : "Halo, kode pesanan saya"} ${d.kode}.`)}`, teks(d.en).wa, WARNA.wa) : "");

/** Pesanan diterima (tamu). `bayar` = alamat yang langsung membuka halaman bayar Midtrans, bila aktif. */
export function emailDiterima(d: DataEmail, o: { jamTahanan: number; bayar: string }) {
  const t = teks(d.en);
  const sapa = d.nama.split(" ")[0];
  const isi = `${kepala(t.diterima.label, t.diterima.judul(sapa), t.diterima.sub)}
          ${ringkasan(barisPesanan(d))}
          ${kebijakan(d)}
          ${tambahan(d)}
          ${kotak(t.diterima.langkah(o.jamTahanan, Boolean(o.bayar)))}
          ${deretTombol(`${o.bayar ? tombol(o.bayar, t.bayar(rupiah(d.total)), WARNA.malam) : ""}${tombolWa(d)}`)}
          ${salam(t.salam, t.tim)}`;
  const teksPolos = [`${t.diterima.judul(sapa)}`, t.diterima.sub, "", ...barisPesanan(d).map(([a, b]) => `${a}: ${b}`), ...(d.rincian?.tambahan ?? []), "", o.bayar ? `${t.bayar(rupiah(d.total))}: ${o.bayar}` : "", `${t.salam}\n${t.tim}`].filter((x) => x !== "").join("\n");
  return { subjek: t.diterima.subjek(d.kode), html: kerangka({ asal: d.asal, en: d.en, pratinjau: t.diterima.pratinjau(d.kode), isi, kontak: d.kontak }), teks: teksPolos };
}

export interface Bayaran { jumlah: number; tanggal: string; cara: string; idTransaksi: string }

/** Isi invoice (tabel), dipakai email pembayaran dan halaman invoice. */
export function blokInvoice(d: DataEmail, bayar: Bayaran[]) {
  const t = teks(d.en).inv;
  const r = d.rincian;
  const dibayar = bayar.reduce((s, b) => s + b.jumlah, 0);
  const sisa = Math.max(0, d.total - dibayar);
  const lunas = sisa === 0 && dibayar > 0;
  const nomor = `INV/${d.kode}`;
  const item: [string, number][] = r
    ? [
        [`${d.cottage} · ${teks(d.en).malam(r.malam)} (${tb(d.masuk, d.en)} – ${tb(d.keluar, d.en)})`, r.hargaKamar],
        ...(r.tambahanAnak ? [[t.anak(r.anak), r.tambahanAnak] as [string, number]] : []),
        ...(r.kenaikan ? [[t.fleks(r.persen), r.kenaikan] as [string, number]] : []),
        ...(r.ekstra ?? []),
        ...(r.potongan ? [[t.kupon(r.kupon), -r.potongan] as [string, number]] : []),
      ]
    : [[`${d.cottage} (${tb(d.masuk, d.en)} – ${tb(d.keluar, d.en)})`, d.total]];
  const sel = (s: string, kanan = false, tebal = false) => `<td style="padding:10px 12px;font:${tebal ? "700 " : ""}14px/1.5 ${HURUF};color:${WARNA.malam};${kanan ? "text-align:right;white-space:nowrap;" : ""}">${s}</td>`;
  const tanggalInv = bayar.length ? bayar[bayar.length - 1].tanggal : new Date().toISOString().slice(0, 10);
  return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 0;">
            <tr>
              <td style="vertical-align:top;padding:0 0 14px;">
                <p style="margin:0;font:400 24px/1.2 Georgia, serif;color:${WARNA.malam};">${esc(t.judul)}</p>
                <p style="margin:4px 0 0;font:13px/1.6 ${HURUF};color:${WARNA.teks2};">${esc(t.nomor)} <b style="color:${WARNA.malam};">${esc(nomor)}</b><br>${esc(t.tanggal)} ${esc(tb(tanggalInv, d.en))}</p>
              </td>
              <td align="right" style="vertical-align:top;padding:0 0 14px;">
                <span style="display:inline-block;padding:6px 14px;border-radius:999px;background:${lunas ? WARNA.hijauLembut : "#FFF4D6"};color:${lunas ? WARNA.hijau : "#8A5A00"};font:700 12px/1.2 ${HURUF};letter-spacing:.1em;">${esc(lunas ? t.lunas : t.belum)}</span>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 14px;font:13px/1.6 ${HURUF};color:${WARNA.teks2};">${esc(t.untuk)}<br><b style="color:${WARNA.malam};">${esc(d.nama)}</b>${d.email ? `<br>${esc(d.email)}` : ""}${d.telepon ? `<br>${esc(d.telepon)}` : ""}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:14px;overflow:hidden;">
            <tr style="background:${WARNA.malam};"><td style="padding:10px 12px;font:700 12px/1.4 ${HURUF};color:#FFFFFF;letter-spacing:.06em;">${esc(t.deskripsi)}</td><td style="padding:10px 12px;font:700 12px/1.4 ${HURUF};color:#FFFFFF;text-align:right;letter-spacing:.06em;">${esc(t.jumlah)}</td></tr>
            ${item.map(([k, v], i) => `<tr style="background:${i % 2 ? "#FFFFFF" : WARNA.kertas};">${sel(esc(k))}${sel(`${v < 0 ? "−" : ""}${esc(rupiah(Math.abs(v)))}`, true)}</tr>`).join("")}
            <tr style="background:${WARNA.busa};">${sel(esc(teks(d.en).total), false, true)}${sel(esc(rupiah(d.total)), true, true)}</tr>
            ${bayar.map((b) => `<tr style="background:#FFFFFF;">${sel(`${esc(t.dibayar)} · ${esc(tb(b.tanggal, d.en))}<br><span style="font-size:12px;color:${WARNA.teks2};">${esc(t.cara)}: ${esc(b.cara)}${b.idTransaksi ? ` · ${esc(t.idTr)}: ${esc(b.idTransaksi)}` : ""}</span>`)}${sel(`−${esc(rupiah(b.jumlah))}`, true)}</tr>`).join("")}
            <tr style="background:${WARNA.kertas};">${sel(esc(t.sisa), false, true)}${sel(esc(rupiah(sisa)), true, true)}</tr>
          </table>
          <p style="margin:12px 0 0;font:12px/1.6 ${HURUF};color:${WARNA.redup};">${esc(t.catatan)}</p>`;
}

/** Pembayaran diterima: pesanan terkonfirmasi beserta invoice (tamu). */
export function emailLunas(d: DataEmail, bayar: Bayaran[], tautanInvoice: string) {
  const t = teks(d.en);
  const sapa = d.nama.split(" ")[0];
  const isi = `${kepala(t.lunas.label, t.lunas.judul, t.lunas.sub(sapa))}
          ${blokInvoice(d, bayar)}
          ${kebijakan(d)}
          ${tambahan(d, false)}
          ${kotak(t.tiba)}
          ${deretTombol(`${tombol(tautanInvoice, t.lunas.cetak, WARNA.malam)}${tombolWa(d)}`)}
          ${salam(t.salam, t.tim)}`;
  const teksPolos = [t.lunas.judul, t.lunas.sub(sapa), "", ...barisPesanan(d).map(([a, b]) => `${a}: ${b}`), ...bayar.map((b) => `${t.inv.dibayar} ${rupiah(b.jumlah)} · ${b.cara}${b.idTransaksi ? ` · ${b.idTransaksi}` : ""}`), "", `${t.lunas.cetak}: ${tautanInvoice}`, "", `${t.salam}\n${t.tim}`].join("\n");
  return { subjek: t.lunas.subjek(d.kode), html: kerangka({ asal: d.asal, en: d.en, pratinjau: t.lunas.pratinjau(d.kode), isi, kontak: d.kontak }), teks: teksPolos };
}

/** Pesanan terkonfirmasi oleh admin di dashboard (tamu). */
export function emailTerkonfirmasi(d: DataEmail, o: { sudahLunas: boolean; bayar: string }) {
  const t = teks(d.en);
  const sapa = d.nama.split(" ")[0];
  const isi = `${kepala(t.konfirmasi.label, t.konfirmasi.judul, t.konfirmasi.sub(sapa))}
          ${ringkasan(barisPesanan(d))}
          ${kebijakan(d)}
          ${tambahan(d)}
          ${o.sudahLunas ? "" : kotak(esc(t.konfirmasi.bayarNanti))}
          ${kotak(t.tiba)}
          ${deretTombol(`${!o.sudahLunas && o.bayar ? tombol(o.bayar, t.bayar(rupiah(d.total)), WARNA.malam) : ""}${tombolWa(d)}`)}
          ${salam(t.salam, t.tim)}`;
  const teksPolos = [t.konfirmasi.judul, t.konfirmasi.sub(sapa), "", ...barisPesanan(d).map(([a, b]) => `${a}: ${b}`), "", `${t.salam}\n${t.tim}`].join("\n");
  return { subjek: t.konfirmasi.subjek(d.kode), html: kerangka({ asal: d.asal, en: d.en, pratinjau: t.konfirmasi.pratinjau(d.kode), isi, kontak: d.kontak }), teks: teksPolos };
}

/** Halaman invoice yang bisa dicetak atau disimpan sebagai PDF dari peramban. */
export function halamanInvoice(d: DataEmail, bayar: Bayaran[]) {
  const t = teks(d.en).inv;
  const isi = `${blokInvoice(d, bayar)}${tambahan(d, false)}`;
  return kerangka({ asal: d.asal, en: d.en, pratinjau: `${t.judul} ${d.kode}`, isi, kontak: d.kontak })
    .replace("</head>", `<style>@media print{.cetak{display:none!important}body{background:#fff!important}}</style></head>`)
    .replace(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${WARNA.pasir};">`, `<div class="cetak" style="text-align:center;padding:16px 0 0;"><button onclick="window.print()" style="padding:12px 22px;border:0;border-radius:999px;background:${WARNA.malam};color:#fff;font:700 14px ${HURUF};cursor:pointer;">${esc(t.cetak)}</button></div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${WARNA.pasir};">`);
}
