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
