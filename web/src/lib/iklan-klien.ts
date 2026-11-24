/**
 * Di peramban: Meta Pixel dan tag Google Ads baru dimuat setelah tamu menekan Boleh
 * (GDPR untuk tamu Eropa, UU PDP). Do Not Track dan Global Privacy Control dianggap Tidak.
 * Nama, nomor, dan email tamu tidak pernah dikirim; hanya nama kejadian, nilai, dan kode pesanan.
 */
type Kejadian = "Lead" | "Purchase" | "Contact" | "InitiateCheckout";
export interface KonfigIklan { metaPixel: string; googleAds: string; labelLead: string; labelBeli: string; labelKontak: string }
type W = Window & { fbq?: ((...a: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...a: unknown[]) => void; push?: unknown }; _fbq?: unknown; dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; __iklan?: KonfigIklan; __iklanDimuat?: boolean };

const KUNCI_IZIN = "bakoeria-izin-iklan";
const KUNCI_ASAL = "bakoeria-asal";
const w = () => window as W;

export function izinIklan(): "ya" | "tidak" | null {
  try { const v = localStorage.getItem(KUNCI_IZIN); if (v === "ya" || v === "tidak") return v; } catch { /* penyimpanan tidak tersedia */ }
  const n = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (n.globalPrivacyControl || n.doNotTrack === "1") return "tidak";
  return null;
}
export function aturIzin(v: "ya" | "tidak") {
  try { localStorage.setItem(KUNCI_IZIN, v); } catch { /* penyimpanan tidak tersedia */ }
  if (v === "ya") muatTag();
  else {
    /* Cabut: hapus cookie iklan yang sudah tertanam. */
    for (const c of document.cookie.split(";").map((x) => x.split("=")[0].trim())) if (/^(_fbp|_fbc|_gcl_.*)$/.test(c)) document.cookie = `${c}=; Max-Age=0; path=/; domain=${location.hostname.replace(/^www\./, ".")}`;
  }
}

function skrip(src: string) { const s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s); }

/** Muat Pixel dan gtag sekali, setelah ada izin. */
export function muatTag() {
  const x = w();
  const k = x.__iklan;
  if (!k || x.__iklanDimuat || izinIklan() !== "ya") return;
  x.__iklanDimuat = true;
  if (k.metaPixel) {
    if (!x.fbq) {
      const f = function (...a: unknown[]) { if (f.callMethod) f.callMethod(...a); else f.queue!.push(a); } as NonNullable<W["fbq"]>;
      f.queue = []; f.loaded = true; f.version = "2.0"; f.push = f;
      x.fbq = f; x._fbq = f;
      skrip("https://connect.facebook.net/en_US/fbevents.js");
    }
    x.fbq!("init", k.metaPixel);
    x.fbq!("track", "PageView");
  }
  if (k.googleAds) {
    x.dataLayer = x.dataLayer || [];
    x.gtag = function () { (x.dataLayer as unknown[]).push(arguments); };
    /* Mengukur iklan saja, tanpa iklan ulang dan tanpa analitik. */
    x.gtag("consent", "default", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "denied", analytics_storage: "denied" });
    x.gtag("js", new Date());
    x.gtag("config", k.googleAds);
    skrip(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(k.googleAds)}`);
  }
}

/** Kirim satu kejadian ke Meta dan Google Ads (bila ada izin dan ID-nya diisi). */
export function lacakIklan(nama: Kejadian, d: { nilai?: number; id?: string } = {}) {
  const x = w();
  const k = x.__iklan;
  if (!k || izinIklan() !== "ya") return;
  muatTag();
  const nilai = d.nilai ? { value: d.nilai, currency: "IDR" } : {};
  if (k.metaPixel && x.fbq) x.fbq("track", nama, nilai, d.id ? { eventID: `${nama}:${d.id}` } : undefined);
  const label = nama === "Lead" ? k.labelLead : nama === "Purchase" ? k.labelBeli : nama === "Contact" ? k.labelKontak : "";
  if (k.googleAds && label && x.gtag) x.gtag("event", "conversion", { send_to: `${k.googleAds}/${label}`, ...nilai, ...(d.id ? { transaction_id: d.id } : {}) });
}

/**
 * Asal kunjungan (utm_*, gclid, fbclid, atau situs perujuk), disimpan 30 hari di peramban
 * dan dikirim bersama pesanan supaya terlihat iklan mana yang menghasilkan. Asal dari
 * situs perujuk saja tidak menimpa asal dari tautan iklan.
 */
export function catatAsal() {
  try {
    const q = new URLSearchParams(location.search);
    const bagian = [q.get("utm_source"), q.get("utm_medium"), q.get("utm_campaign")].filter(Boolean).map((v) => v!.slice(0, 40));
    const klik = q.get("gclid") || q.get("gbraid") || q.get("wbraid") ? "google · iklan" : q.get("fbclid") ? "facebook" : q.get("igsh") ? "instagram" : "";
    let asal = bagian.length ? bagian.join(" · ") : klik;
    let dariIklan = Boolean(asal);
    if (!asal && document.referrer) { const h = new URL(document.referrer).hostname.replace(/^www\./, ""); if (h && h !== location.hostname.replace(/^www\./, "")) asal = h; }
    if (!asal) return;
    const lama = JSON.parse(localStorage.getItem(KUNCI_ASAL) ?? "null") as { asal: string; iklan: boolean; waktu: number } | null;
    if (lama && lama.iklan && !dariIklan && Date.now() - lama.waktu < 30 * 864e5) return;
    if (klik && bagian.length) { asal = `${asal} (${klik})`; dariIklan = true; }
    localStorage.setItem(KUNCI_ASAL, JSON.stringify({ asal: asal.slice(0, 160), iklan: dariIklan, waktu: Date.now() }));
  } catch { /* penyimpanan tidak tersedia */ }
}
export function asalKunjungan(): string {
  try { const x = JSON.parse(localStorage.getItem(KUNCI_ASAL) ?? "null"); return x && Date.now() - x.waktu < 30 * 864e5 ? String(x.asal) : ""; } catch { return ""; }
}
