import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { bacaJson, rahasiaSesi, ubahJson } from "./gudang";

/**
 * Pembayaran online lewat Midtrans Snap (halaman bayar Midtrans).
 *
 * Sejak 28 Oktober 2026 Midtrans memisahkan kuncinya (Dashboard, Settings, Access Keys, tab Payment):
 * - Server Key: memanggil API (Snap, status transaksi). Bisa sampai 10, dibuat lewat
 *   "Generate server key" dan hanya ditampilkan sekali.
 * - Signature Secret Key: memeriksa `signature_key` di kabar pembayaran (HTTP notification),
 *   SHA512(order_id + status_code + gross_amount + Signature Secret Key). Bisa di-regenerate.
 * - Client Key: hanya untuk Snap.js di peramban; tidak dipakai karena tamu diarahkan ke halaman bayar.
 * Akun yang terhubung sebelum tanggal itu: Signature Secret Key bernilai sama dengan Server Key
 * lama, jadi bila Signature Secret Key belum diisi, Server Key yang dipakai untuk memeriksa.
 *
 * Kunci disimpan di midtrans.json (izin 0600) di folder data, tidak pernah dikirim balik ke
 * dashboard selain empat huruf terakhirnya. Variabel MIDTRANS_SERVER_KEY dan
 * MIDTRANS_SIGNATURE_KEY di hPanel, bila diisi, menang. Bentuk kunci baru tidak lagi
 * menandai sandbox atau produksi, jadi modenya dipilih sendiri.
 */
const BERKAS = "midtrans.json";
const BERKAS_KABAR = "midtrans-kabar.json";
/** Setelah Signature Secret Key diganti, kunci lama masih diterima selama ini (kabar ulangan dari Midtrans). */
const MASA_KUNCI_LAMA_MS = 3 * 86400000;

export type ModeMidtrans = "sandbox" | "produksi";
interface Simpanan {
  aktif?: boolean;
  mode?: ModeMidtrans;
  serverKey?: string;
  signatureKey?: string;
  signatureLama?: string;
  signatureLamaSampai?: string;
  diuji?: string;
}
export interface KonfigMidtrans { serverKey: string; signatureKeys: string[]; produksi: boolean }
export interface KabarTerakhir { waktu: string; orderId: string; hasil: "dicatat" | "sudahTercatat" | "belumLunas" | "bukanPesanan" | "tandaTanganSalah" | "belumDipasang" | "statusTidakCocok" }
export interface StatusMidtrans {
  aktif: boolean;
  mode: ModeMidtrans;
  serverKey: string;
  signatureKey: string;
  /** "env" bila kunci dari variabel hPanel. */
  sumber: "env" | "panel" | null;
  diuji: string;
  kabar: KabarTerakhir | null;
}

const teks = (v: unknown) => (typeof v === "string" ? v.trim() : "");
/** Kunci Midtrans: satu baris tanpa spasi. Bentuknya tidak lagi diperiksa per awalan, karena kunci baru tidak berawalan Mid-server-. */
export const kunciSah = (v: string) => /^[A-Za-z0-9_:\-+/=.]{16,300}$/.test(v);
const ujung = (v: string) => (v ? `…${v.slice(-4)}` : "");

async function baca(): Promise<Simpanan> {
  return (await bacaJson<Simpanan | null>(BERKAS, null)) ?? {};
}

export async function konfigMidtrans(): Promise<KonfigMidtrans | null> {
  const s = await baca();
  const serverKey = teks(process.env.MIDTRANS_SERVER_KEY) || teks(s.serverKey);
  if (!s.aktif && !teks(process.env.MIDTRANS_SERVER_KEY)) return null;
  if (!kunciSah(serverKey)) return null;
  const utama = teks(process.env.MIDTRANS_SIGNATURE_KEY) || teks(s.signatureKey) || serverKey;
  const lama = teks(s.signatureLama) && Date.parse(teks(s.signatureLamaSampai)) > Date.now() ? [teks(s.signatureLama)] : [];
  const produksi = (teks(process.env.MIDTRANS_MODE) || s.mode) === "produksi";
  return { serverKey, signatureKeys: [...new Set([utama, ...lama])], produksi };
}

export async function statusMidtrans(): Promise<StatusMidtrans> {
  const s = await baca();
  const env = Boolean(teks(process.env.MIDTRANS_SERVER_KEY));
  const kb = await bacaJson<KabarTerakhir | null>(BERKAS_KABAR, null);
  return {
    aktif: Boolean(await konfigMidtrans()),
    mode: (teks(process.env.MIDTRANS_MODE) || s.mode) === "produksi" ? "produksi" : "sandbox",
    serverKey: ujung(teks(process.env.MIDTRANS_SERVER_KEY) || teks(s.serverKey)),
    signatureKey: ujung(teks(process.env.MIDTRANS_SIGNATURE_KEY) || teks(s.signatureKey)),
    sumber: env ? "env" : teks(s.serverKey) ? "panel" : null,
    diuji: teks(s.diuji),
    kabar: kb && typeof kb.waktu === "string" ? kb : null,
  };
}

/** Simpan dari dashboard. Kunci kosong berarti tidak diubah; `hapus` mengosongkan semuanya. */
export async function simpanMidtrans(d: { aktif: boolean; mode: ModeMidtrans; serverKey?: string; signatureKey?: string; hapus?: boolean; diuji?: string }) {
  await ubahJson<Simpanan | null>(BERKAS, null, (l) => {
    if (d.hapus) return {};
    const lama = l ?? {};
    const baru: Simpanan = { ...lama, aktif: d.aktif, mode: d.mode };
    if (d.serverKey) baru.serverKey = d.serverKey;
    if (d.signatureKey && d.signatureKey !== lama.signatureKey) {
      if (lama.signatureKey) { baru.signatureLama = lama.signatureKey; baru.signatureLamaSampai = new Date(Date.now() + MASA_KUNCI_LAMA_MS).toISOString(); }
      baru.signatureKey = d.signatureKey;
    }
    if (d.diuji) baru.diuji = d.diuji;
    return baru;
  }, 0o600);
}

export async function catatKabar(k: Omit<KabarTerakhir, "waktu">) {
  await ubahJson<KabarTerakhir | null>(BERKAS_KABAR, null, () => ({ ...k, orderId: k.orderId.slice(0, 80), waktu: new Date().toISOString() }), 0o600).catch(() => undefined);
}

export class GalatMidtrans extends Error {}

function dasar(produksi: boolean) {
  const snap = teks(process.env.MIDTRANS_SNAP_DASAR) || (produksi ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com");
  const api = teks(process.env.MIDTRANS_API_DASAR) || (produksi ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com");
  return { snap: snap.replace(/\/+$/, ""), api: api.replace(/\/+$/, "") };
}

async function panggil(k: { serverKey: string }, url: string, init: RequestInit = {}) {
  let r: Response;
  try {
    r = await fetch(url, {
      ...init,
      /* Basic auth Midtrans: Server Key sebagai nama pengguna, sandi kosong. */
      headers: { authorization: `Basic ${Buffer.from(`${k.serverKey}:`).toString("base64")}`, accept: "application/json", ...(init.body ? { "content-type": "application/json" } : {}) },
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });
  } catch {
    throw new GalatMidtrans("Server tidak bisa menghubungi Midtrans. Coba lagi sebentar lagi.");
  }
  const o = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  return { http: r.status, o };
}

/** Uji Server Key tanpa membuat transaksi: tanya status order yang pasti tidak ada. Kunci sah dijawab "tidak ditemukan". */
export async function ujiServerKey(serverKey: string, produksi: boolean): Promise<void> {
  const { http, o } = await panggil({ serverKey }, `${dasar(produksi).api}/v2/bakoeria-uji-${Date.now()}/status`);
  const kode = String(o.status_code ?? http);
  if (kode === "401" || http === 401) throw new GalatMidtrans(`Server Key ditolak Midtrans ${produksi ? "Produksi" : "Sandbox"}. Periksa kuncinya, dan pastikan mode sama dengan Dashboard tempat kunci dibuat.`);
  if (kode === "403" || http === 403) throw new GalatMidtrans("Server Key ini tidak punya izin. Di Dashboard Midtrans, beri izin Snap dan status transaksi pada kunci ini.");
}

/** Buat transaksi Snap; mengembalikan alamat halaman bayar Midtrans. */
export async function buatTransaksi(k: KonfigMidtrans, t: { orderId: string; jumlah: number; nama: string; idBarang: string; tamu: { nama: string; telepon?: string | null; email?: string | null }; selesai: string; batasMenit: number }): Promise<string> {
  const { http, o } = await panggil(k, `${dasar(k.produksi).snap}/snap/v1/transactions`, {
    method: "POST",
    body: JSON.stringify({
      transaction_details: { order_id: t.orderId, gross_amount: t.jumlah },
      item_details: [{ id: t.idBarang.slice(0, 50), price: t.jumlah, quantity: 1, name: t.nama.replace(/\s+/g, " ").trim().slice(0, 50) }],
      customer_details: { first_name: t.tamu.nama.slice(0, 255), ...(t.tamu.telepon ? { phone: t.tamu.telepon } : {}), ...(t.tamu.email ? { email: t.tamu.email } : {}) },
      callbacks: { finish: t.selesai },
      expiry: { unit: "minutes", duration: Math.max(15, Math.round(t.batasMenit)) },
    }),
  });
  const tautan = teks(o.redirect_url);
  if (http >= 300 || !tautan) {
    console.error("[midtrans] snap:", http, Array.isArray(o.error_messages) ? o.error_messages.join(" ") : "");
    if (http === 401) throw new GalatMidtrans("Pembayaran online sedang tidak tersedia. Hubungi kami lewat WhatsApp.");
    throw new GalatMidtrans("Halaman pembayaran belum bisa dibuat. Coba lagi, atau hubungi kami lewat WhatsApp.");
  }
  return tautan;
}

/** Status transaksi langsung dari Midtrans (dipakai setelah kabar masuk, supaya tidak hanya percaya isi kabar). */
export async function statusTransaksi(k: KonfigMidtrans, orderId: string) {
  const { o } = await panggil(k, `${dasar(k.produksi).api}/v2/${encodeURIComponent(orderId)}/status`);
  return { status: teks(o.transaction_status), fraud: teks(o.fraud_status), jumlah: Math.round(Number(o.gross_amount) || 0), metode: teks(o.payment_type), idTransaksi: teks(o.transaction_id), kode: String(o.status_code ?? "") };
}

/** Periksa signature_key kabar Midtrans dengan Signature Secret Key (atau kunci lama dalam masa peralihan). */
export function tandaTanganSah(k: KonfigMidtrans, o: Record<string, unknown>): boolean {
  const sig = teks(o.signature_key).toLowerCase();
  if (!/^[0-9a-f]{128}$/.test(sig)) return false;
  return k.signatureKeys.some((kunci) => {
    const hitung = createHash("sha512").update(`${teks(o.order_id)}${teks(o.status_code)}${teks(o.gross_amount)}${kunci}`).digest("hex");
    return timingSafeEqual(Buffer.from(hitung), Buffer.from(sig));
  });
}

/** Lunas menurut Midtrans: settlement, atau capture kartu yang tidak ditahan fraud. */
export const lunas = (status: string, fraud: string) => status === "settlement" || (status === "capture" && (fraud === "" || fraud === "accept"));

/** Token pembayaran untuk satu pesanan: tamu yang memegang kode pesanan saja belum bisa membuka pembayaran. */
export async function tokenBayar(idPesanan: string) {
  return createHmac("sha256", await rahasiaSesi()).update(`bayar:${idPesanan}`).digest("base64url").slice(0, 24);
}
export async function tokenSah(idPesanan: string, token: unknown) {
  const benar = await tokenBayar(idPesanan);
  return typeof token === "string" && token.length === benar.length && timingSafeEqual(Buffer.from(token), Buffer.from(benar));
}
/** order_id Midtrans: kode pesanan + "-PAY" + penanda waktu, unik per percobaan bayar. Tamu membayar total penuh (tanpa uang muka). */
export const orderIdDari = (kode: string) => `${kode}-PAY${Date.now().toString(36).toUpperCase()}`;
export const kodeDariOrder = (orderId: string) => /^([A-Z0-9-]+?)-PAY[0-9A-Z]+$/.exec(orderId)?.[1] ?? null;
