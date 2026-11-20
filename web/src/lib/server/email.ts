import "server-only";

/**
 * Kirim email lewat Resend bila RESEND_API_KEY dan EMAIL_DARI diisi.
 * Tanpa keduanya fungsi ini diam dan mengembalikan false: pesanan tetap
 * tersimpan di dashboard, hanya pemberitahuannya yang tidak terkirim.
 */
export async function kirimEmail(ke: string, subjek: string, teks: string, balasKe?: string): Promise<boolean> {
  const kunci = process.env.RESEND_API_KEY?.trim();
  const dari = process.env.EMAIL_DARI?.trim();
  if (!kunci || !dari || !ke) return false;
  try {
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
