import "server-only";

/**
 * Kerangka HTML email Bakoeria, dipakai semua email: pesanan baru untuk admin,
 * pesanan diterima, pembayaran dan invoice, dan pesanan terkonfirmasi untuk tamu.
 *
 * HTML email bukan HTML situs. Gmail, Outlook, dan aplikasi email di ponsel hanya
 * membaca tabel dan gaya yang ditulis langsung di tiap elemen, jadi tata letaknya
 * tabel 600 px dengan gaya inline, tanpa kelas, tanpa gambar latar, huruf sistem,
 * dan logo PNG (banyak aplikasi email tidak menampilkan SVG). Setiap nilai dari
 * luar di-escape.
 */
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export const WARNA = { malam: "#133250", laut: "#0F6490", busa: "#D7EEF0", pasir: "#F6F4EF", kertas: "#FBFAF7", teks2: "#5B6B7B", redup: "#8A96A3", pasirTua: "#A8916A", wa: "#1F9D55", hijau: "#1E7A4C", hijauLembut: "#E3F4EA" };
export const HURUF = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

export interface KontakEmail { wa: string; waTampil: string; email: string; alamat: string }

/** Label kecil berhuruf kapital, lalu judul besar bergaya serif seperti situs. */
export function kepala(label: string, judul: string, sub = "") {
  return `
          <p style="margin:0 0 8px;font:700 11px/1.4 ${HURUF};letter-spacing:.14em;text-transform:uppercase;color:${WARNA.laut};">${esc(label)}</p>
          <h1 style="margin:0 0 ${sub ? "8" : "18"}px;font:400 28px/1.25 ${SERIF};color:${WARNA.malam};">${esc(judul)}</h1>
          ${sub ? `<p style="margin:0 0 20px;font:15px/1.6 ${HURUF};color:${WARNA.teks2};">${esc(sub)}</p>` : ""}`;
}

export const paragraf = (s: string) => `<p style="margin:0 0 14px;font:15px/1.65 ${HURUF};color:${WARNA.malam};">${esc(s)}</p>`;
export const subjudul = (s: string) => `<p style="margin:24px 0 10px;font:700 12px/1.4 ${HURUF};letter-spacing:.12em;text-transform:uppercase;color:${WARNA.pasirTua};">${esc(s)}</p>`;

/** Baris ringkasan: label di kiri, nilai tebal di kanan, latar belang tanpa garis. */
export function ringkasan(baris: [string, string][]) {
  return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:14px;overflow:hidden;">${baris.map(([l, v], i) => `
            <tr>
              <td style="padding:11px 14px;background:${i % 2 ? "#FFFFFF" : WARNA.kertas};font:13px/1.5 ${HURUF};color:${WARNA.teks2};width:38%;vertical-align:top;">${esc(l)}</td>
              <td style="padding:11px 14px;background:${i % 2 ? "#FFFFFF" : WARNA.kertas};font:600 14px/1.5 ${HURUF};color:${WARNA.malam};vertical-align:top;">${esc(v)}</td>
            </tr>`).join("")}
          </table>`;
}

/** Kotak lembut berisi teks, misalnya kebijakan tarif atau langkah berikutnya. */
export function kotak(isi: string, latar: string = WARNA.busa) {
  return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 0;"><tr>
            <td style="padding:14px 16px;background:${latar};border-radius:14px;font:14px/1.6 ${HURUF};color:${WARNA.malam};">${isi}</td>
          </tr></table>`;
}

/** Tombol "anti peluru": sel tabel berwarna, supaya Outlook pun menggambarnya sebagai tombol. */
export function tombol(href: string, label: string, warna: string = WARNA.malam) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;margin:0 8px 10px 0;"><tr><td align="center" bgcolor="${warna}" style="border-radius:999px;background:${warna};">
              <a href="${esc(href)}" target="_blank" style="display:inline-block;padding:13px 24px;font:700 14px/1.2 ${HURUF};color:#FFFFFF;text-decoration:none;border-radius:999px;">${esc(label)}</a>
            </td></tr></table>`;
}
export const deretTombol = (isi: string) => `<div style="margin:22px 0 4px;">${isi}</div>`;

export function salam(pembuka: string, tim: string) {
  return `
          <p style="margin:26px 0 2px;font:15px/1.6 ${HURUF};color:${WARNA.malam};">${esc(pembuka)}</p>
          <p style="margin:0;font:700 15px/1.6 ${HURUF};color:${WARNA.malam};">${esc(tim)}</p>`;
}

/**
 * Seluruh email: logo, kartu putih berisi `isi`, lalu kaki dengan slogan, alamat, dan kontak.
 * `pratinjau` adalah teks yang tampil di daftar kotak masuk sebelum email dibuka.
 */
export function kerangka(o: { asal: string; en: boolean; pratinjau: string; isi: string; kontak: KontakEmail; catatanKaki?: string }) {
  const k = o.kontak;
  const tautan = (href: string, label: string) => `<a href="${esc(href)}" target="_blank" style="color:${WARNA.laut};text-decoration:none;">${esc(label)}</a>`;
  const kontak = [k.wa ? tautan(`https://wa.me/${k.wa}`, `WhatsApp ${k.waTampil}`) : "", k.email ? tautan(`mailto:${k.email}`, k.email) : "", tautan(o.asal, o.asal.replace(/^https?:\/\//, ""))].filter(Boolean).join(" &nbsp;·&nbsp; ");
  return `<!doctype html>
<html lang="${o.en ? "en" : "id"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Bakoeria Dive Resort</title></head>
<body style="margin:0;padding:0;background:${WARNA.pasir};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(o.pratinjau)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${WARNA.pasir};">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr><td align="center" style="padding:4px 0 22px;">
          <a href="${esc(o.asal)}" target="_blank"><img src="${esc(o.asal)}/brand/email-logo.png" width="200" height="56" alt="Bakoeria Dive Resort" style="display:block;border:0;width:200px;height:auto;"></a>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:22px;padding:34px 30px;">
          ${o.isi}
        </td></tr>
        <tr><td align="center" style="padding:24px 16px 8px;">
          <p style="margin:0 0 6px;font:italic 15px/1.5 ${SERIF};color:${WARNA.malam};">${o.en ? "Dive by day, sleep under the stars." : "Menyelam siang, bermalam di bawah bintang."}</p>
          <p style="margin:0 0 8px;font:12px/1.6 ${HURUF};color:${WARNA.teks2};">${esc(k.alamat || "Yenbeser, Gam Island, Raja Ampat, Southwest Papua, Indonesia")}</p>
          <p style="margin:0 0 10px;font:12px/1.6 ${HURUF};">${kontak}</p>
          ${o.catatanKaki ? `<p style="margin:0;font:11px/1.6 ${HURUF};color:${WARNA.redup};">${esc(o.catatanKaki)}</p>` : ""}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
