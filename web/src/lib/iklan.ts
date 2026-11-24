/**
 * Tag promosi: Google Search Console, Meta (Facebook/Instagram) Pixel, dan Google Ads.
 * Semua ID ini memang terlihat publik di halaman (bukan rahasia), disimpan di pengaturan,
 * dan diisi dari dashboard (Pengaturan, Promosi). Pembersih di bawah menerima potongan
 * kode yang ditempel utuh, supaya pemilik tidak perlu memilih bagian yang benar sendiri.
 */
export interface Iklan {
  /** Kode verifikasi Google Search Console (tag HTML google-site-verification). */
  googleVerifikasi: string;
  /** ID Meta Pixel (angka). */
  metaPixel: string;
  /** Kode verifikasi domain Meta (facebook-domain-verification). */
  metaVerifikasi: string;
  /** ID Google Ads, AW-123456789. */
  googleAds: string;
  /** Label konversi Google Ads (bagian setelah garis miring di send_to). */
  labelLead: string;
  labelBeli: string;
  labelKontak: string;
}
export const IKLAN_KOSONG: Iklan = { googleVerifikasi: "", metaPixel: "", metaVerifikasi: "", googleAds: "", labelLead: "", labelBeli: "", labelKontak: "" };

const t = (v: unknown) => (typeof v === "string" ? v.trim() : "");
/** Isi atribut content dari tag meta yang ditempel utuh, atau teksnya sendiri. */
const isiMeta = (v: string) => /content=["']([^"']+)["']/i.exec(v)?.[1] ?? v;
export const kodeVerifikasi = (v: unknown) => { const x = isiMeta(t(v)); return /^[A-Za-z0-9_-]{10,100}$/.test(x) ? x : ""; };
export const idPixel = (v: unknown) => { const s = t(v); const m = /fbq\(\s*['"]init['"]\s*,\s*['"](\d{10,20})['"]/.exec(s)?.[1] ?? /\b(\d{10,20})\b/.exec(s)?.[1]; return m ?? ""; };
export const idGoogleAds = (v: unknown) => /\bAW-(\d{6,15})\b/i.exec(t(v))?.[1] ? `AW-${/\bAW-(\d{6,15})\b/i.exec(t(v))![1]}` : /^\d{6,15}$/.test(t(v)) ? `AW-${t(v)}` : "";
export const labelGoogleAds = (v: unknown) => { const s = t(v); const x = /AW-\d+\/([A-Za-z0-9_-]{6,40})/.exec(s)?.[1] ?? s; return /^[A-Za-z0-9_-]{6,40}$/.test(x) ? x : ""; };

export function rapikanIklan(o: unknown): Iklan {
  const k = (o && typeof o === "object" ? o : {}) as Record<string, unknown>;
  return {
    googleVerifikasi: kodeVerifikasi(k.googleVerifikasi),
    metaPixel: idPixel(k.metaPixel),
    metaVerifikasi: kodeVerifikasi(k.metaVerifikasi),
    googleAds: idGoogleAds(k.googleAds),
    labelLead: labelGoogleAds(k.labelLead),
    labelBeli: labelGoogleAds(k.labelBeli),
    labelKontak: labelGoogleAds(k.labelKontak),
  };
}
