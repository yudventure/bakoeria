import "server-only";
import nodemailer from "nodemailer";

/**
 * Kirim email pemberitahuan. Dua jalur, dipilih dari variabel lingkungan:
 *
 * 1. SMTP (misalnya email Hostinger): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.
 *    Untuk Hostinger: smtp.hostinger.com, port 465 (SSL).
 * 2. Resend: RESEND_API_KEY.
 *
 * EMAIL_DARI adalah alamat pengirim; kosong berarti SMTP_USER. Tanpa jalur yang
 * terisi fungsi ini diam dan mengembalikan false: pesanan tetap tersimpan di
 * dashboard, hanya pemberitahuannya yang tidak terkirim.
 */
export const pengirim = () => process.env.EMAIL_DARI?.trim() || process.env.SMTP_USER?.trim() || "";
export const emailSiap = () => Boolean((process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS) || process.env.RESEND_API_KEY?.trim()) && Boolean(pengirim());

let transport: nodemailer.Transporter | null = null;
function smtp() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST!.trim(),
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER!.trim(), pass: process.env.SMTP_PASS! },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
    });
  }
  return transport;
}

export async function kirimEmail(ke: string, subjek: string, teks: string, balasKe?: string): Promise<boolean> {
  const dari = pengirim();
  if (!ke || !dari) return false;
  try {
    if (process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS) {
      await smtp().sendMail({ from: dari, to: ke, subject: subjek, text: teks, ...(balasKe ? { replyTo: balasKe } : {}) });
      return true;
    }
    const kunci = process.env.RESEND_API_KEY?.trim();
    if (!kunci) return false;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${kunci}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: dari, to: [ke], subject: subjek, text: teks, ...(balasKe ? { reply_to: balasKe } : {}) }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) console.error("[email] Resend menjawab", r.status, await r.text().catch(() => ""));
    return r.ok;
  } catch (e) {
    console.error("[email] gagal", e);
    return false;
  }
}

/** Alamat email dari "Nama <alamat>" atau alamat polos. */
export const alamatSaja = (s: string) => (s.match(/<([^>]+)>/)?.[1] ?? s).trim();

/**
 * Email uji dari dashboard: kirim sungguhan dan kembalikan alasan gagal yang bisa dibaca
 * pemilik (tanpa sandi). Dipakai tombol "Kirim email uji" di Pengaturan.
 */
export async function ujiEmail(ke: string): Promise<{ ok: true; jalur: string } | { ok: false; galat: string }> {
  const dari = pengirim();
  if (!emailSiap()) return { ok: false, galat: "Email belum dipasang. Isi SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (atau RESEND_API_KEY) di panel Node.js Hostinger, lalu mulai ulang aplikasinya." };
  if (!ke) return { ok: false, galat: "Tidak ada alamat tujuan. Isi Email pemberitahuan pesanan di atas." };
  const subjek = "Email uji dari dashboard Bakoeria";
  const teks = `Email ini dikirim dari tombol Kirim email uji di dashboard Bakoeria (${new Date().toISOString()}).\nKalau email ini sampai, pemberitahuan pesanan dan pembayaran juga akan sampai ke alamat ini.`;
  if (process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS) {
    try {
      await smtp().sendMail({ from: dari, to: ke, subject: subjek, text: teks });
      return { ok: true, jalur: `SMTP ${process.env.SMTP_HOST.trim()}:${Number(process.env.SMTP_PORT) || 465}` };
    } catch (e) {
      transport = null;
      const x = e as { code?: string; responseCode?: number; response?: string; message?: string };
      const kode = x.code ?? "";
      const alasan =
        kode === "EAUTH" ? "Server email menolak SMTP_USER atau SMTP_PASS. Periksa sandi kotak surat di hPanel, Email."
        : kode === "ECONNECTION" || kode === "ETIMEDOUT" || kode === "ESOCKET" ? `Tidak bisa terhubung ke ${process.env.SMTP_HOST.trim()} port ${Number(process.env.SMTP_PORT) || 465}. Periksa SMTP_HOST dan SMTP_PORT (Hostinger: smtp.hostinger.com, 465).`
        : kode === "EENVELOPE" ? "Alamat pengirim atau tujuan ditolak. Pengirim harus kotak surat yang sama dengan SMTP_USER."
        : "Server email menolak pengiriman.";
      return { ok: false, galat: `${alasan} (${[kode, x.responseCode, (x.response ?? x.message ?? "").slice(0, 160)].filter(Boolean).join(" ")})` };
    }
  }
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: dari, to: [ke], subject: subjek, text: teks }), signal: AbortSignal.timeout(15000) }).catch(() => null);
  if (!r) return { ok: false, galat: "Tidak bisa menghubungi Resend." };
  return r.ok ? { ok: true, jalur: "Resend" } : { ok: false, galat: `Resend menolak (${r.status}): ${(await r.text().catch(() => "")).slice(0, 200)}` };
}
