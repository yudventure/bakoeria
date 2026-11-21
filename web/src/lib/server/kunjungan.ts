import "server-only";
import { createHash } from "node:crypto";

import { bacaJson, rahasiaSesi, ubahJson } from "./gudang";

/**
 * Penghitung kunjungan website publik, milik sendiri, tanpa layanan luar
 * (diambil dari Unmehopa, untuk satu situs).
 *
 * Menjaga privasi: tanpa cookie, alamat IP tidak disimpan. Pengunjung dikenali
 * dalam satu hari lewat sidik `sha256(rahasia|tanggal|ip|ua)` 16 huruf yang
 * tidak bisa dilacak ke hari lain. Do Not Track dan Global Privacy Control
 * dihormati, robot disaring, dan pengelola yang sedang masuk tidak dihitung.
 *
 * Negara, berurutan: header negara dari CDN bila ada; lalu basis data IP ke
 * negara yang ikut terpasang di server (geoip-country, data GeoLite2 dari
 * MaxMind), dicari di server sendiri tanpa mengirim IP ke mana pun; terakhir
 * perkiraan dari bahasa peramban. Yang tetap tidak diketahui dihitung terpisah.
 */

interface Hari {
  tampil: number;
  /** Sidik pengunjung hari itu. */
  unik: string[];
  /** Pengunjung unik per kode negara. */
  negara: Record<string, number>;
  /** Tampilan per halaman. */
  halaman: Record<string, number>;
  /** Pengunjung unik per bahasa situs (en/id). */
  bahasa?: Record<string, number>;
}
interface Simpanan {
  hari: Record<string, Hari>;
  /** Terakhir terlihat per sidik, untuk "aktif sekarang". */
  aktif: Record<string, number>;
}
const KOSONG: Simpanan = { hari: {}, aktif: {} };
const BERKAS = "kunjungan.json";
const SIMPAN_HARI = 400;
const AKTIF_MS = 5 * 60 * 1000;

/** Tanggal di zona resort (Papua), bukan zona server. */
export function tanggalWit(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jayapura", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
const geser = (t: string, n: number) => new Date(Date.parse(`${t}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

const ROBOT = /bot\b|crawl|spider|slurp|headless|lighthouse|pingdom|facebookexternalhit|whatsapp|preview|curl\/|wget|python-requests|httpclient|axios|go-http|java\/|monitor|uptime|check_http/i;
export const robot = (ua: string) => !ua || ROBOT.test(ua);

/* Dimuat sekali saat pertama dibutuhkan; bila gagal (misalnya datanya tidak ikut terpasang), negara dicari dengan cara lain. */
type Geoip = { lookup: (ip: string) => { country?: string } | null };
let geoip: Promise<Geoip | null> | undefined;
async function cariIp(ip: string): Promise<string> {
  if (!ip || ip === "lokal") return "";
  geoip ??= import("geoip-country")
    .then((m) => ((m as { default?: Geoip }).default ?? (m as unknown as Geoip)))
    .catch((e) => {
      console.error("[kunjungan] geoip-country tidak termuat", e instanceof Error ? e.message : e);
      return null;
    });
  try {
    return (await geoip)?.lookup(ip.replace(/^::ffff:/, ""))?.country ?? "";
  } catch {
    return "";
  }
}

const BAHASA: Record<string, string> = { id: "ID", ja: "JP", fr: "FR", de: "DE", ru: "RU", zh: "CN", nl: "NL", es: "ES", it: "IT", ko: "KR", pt: "PT", ms: "MY", th: "TH", pl: "PL", sv: "SE", da: "DK" };

/** Kode negara dua huruf, atau "" bila tidak diketahui. */
export async function negaraDari(h: { negaraHeader: string; ip: string; bahasa: string }): Promise<string> {
  const kode = h.negaraHeader.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(kode) && kode !== "XX" && kode !== "T1") return kode;
  const dariIp = await cariIp(h.ip);
  if (dariIp) return dariIp;
  for (const bagian of h.bahasa.split(",")) {
    const wilayah = /^[a-z]{2,3}-([A-Za-z]{2})$/.exec(bagian.split(";")[0].trim());
    if (wilayah) return wilayah[1].toUpperCase();
  }
  const dasar = h.bahasa.split(",")[0]?.split(";")[0].trim().toLowerCase().split("-")[0] ?? "";
  return BAHASA[dasar] ?? "";
}

export async function catatKunjungan(o: { jalur: string; ip: string; ua: string; negara: string; bahasa: string }) {
  const tgl = tanggalWit();
  const sidik = createHash("sha256").update(`${await rahasiaSesi()}|${tgl}|${o.ip}|${o.ua}`).digest("hex").slice(0, 16);
  const sekarang = Date.now();
  await ubahJson<Simpanan>(BERKAS, KOSONG, (s) => {
    const hari = { ...(s.hari ?? {}) };
    const h: Hari = hari[tgl] ? { ...hari[tgl] } : { tampil: 0, unik: [], negara: {}, halaman: {}, bahasa: {} };
    h.tampil += 1;
    h.halaman = { ...h.halaman, [o.jalur]: (h.halaman[o.jalur] ?? 0) + 1 };
    if (!h.unik.includes(sidik)) {
      h.unik = [...h.unik, sidik];
      const k = o.negara || "??";
      h.negara = { ...h.negara, [k]: (h.negara[k] ?? 0) + 1 };
      h.bahasa = { ...(h.bahasa ?? {}), [o.bahasa]: (h.bahasa?.[o.bahasa] ?? 0) + 1 };
    }
    hari[tgl] = h;
    const batas = geser(tgl, -SIMPAN_HARI);
    for (const k of Object.keys(hari)) if (k < batas) delete hari[k];
    const aktif: Simpanan["aktif"] = {};
    for (const [k, t] of Object.entries(s.aktif ?? {})) if (sekarang - t < 15 * 60 * 1000) aktif[k] = t;
    aktif[sidik] = sekarang;
    return { hari, aktif };
  });
}

export interface Statistik {
  diperbarui: string;
  aktif: number;
  hariIni: { unik: number; tampil: number };
  tujuhHari: { unik: number; tampil: number };
  tigaPuluhHari: { unik: number; tampil: number };
  /** Pengunjung unik per hari, terlama dulu. */
  seri: { tanggal: string; unik: number; tampil: number }[];
  /** Rincian satu hari. */
  detail: { tanggal: string; unik: number; tampil: number; negara: [string, number][]; halaman: [string, number][] };
  /** Pengunjung unik per negara dalam rentang yang dipilih, terbanyak dulu. */
  negara: { kode: string; n: number }[];
  /** Pengunjung dalam rentang yang negaranya tidak diketahui. */
  tanpaNegara: number;
  /** Tampilan halaman per bahasa situs dalam rentang. */
  bahasa: { en: number; id: number };
  mulai: string | null;
}

const jumlah = (a: Record<string, number>[]) => {
  const o: Record<string, number> = {};
  for (const x of a) for (const [k, v] of Object.entries(x)) o[k] = (o[k] ?? 0) + v;
  return o;
};

export async function bacaStatistik(rentang: 7 | 30 | 90, hariDipilih?: string): Promise<Statistik> {
  const s = await bacaJson<Simpanan>(BERKAS, KOSONG);
  const hariIni = tanggalWit();
  const ambil = (t: string): Hari | undefined => s.hari?.[t];
  const ringkas = (n: number) => {
    let unik = 0, tampil = 0;
    for (let i = 0; i < n; i++) {
      const h = ambil(geser(hariIni, -i));
      if (h) { unik += h.unik.length; tampil += h.tampil; }
    }
    return { unik, tampil };
  };
  const seri = Array.from({ length: rentang }, (_, i) => {
    const t = geser(hariIni, -(rentang - 1 - i));
    const h = ambil(t);
    return { tanggal: t, unik: h?.unik.length ?? 0, tampil: h?.tampil ?? 0 };
  });
  const tgl = hariDipilih && /^\d{4}-\d{2}-\d{2}$/.test(hariDipilih) ? hariDipilih : hariIni;
  const hd = ambil(tgl);
  const urut = (o: Record<string, number>, n: number): [string, number][] => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
  const negaraHari = { ...(hd?.negara ?? {}) };
  delete negaraHari["??"];
  const dalam = seri.map((x) => ambil(x.tanggal)).filter((h): h is Hari => Boolean(h));
  const semuaNegara = jumlah(dalam.map((h) => h.negara));
  const tanpaNegara = semuaNegara["??"] ?? 0;
  delete semuaNegara["??"];
  /* Bahasa dari tampilan halaman: satu pengunjung bisa membuka versi Inggris dan Indonesia. */
  const halamanRentang = jumlah(dalam.map((h) => h.halaman));
  const bahasa = { id: 0, en: 0 };
  for (const [j, n] of Object.entries(halamanRentang)) bahasa[j === "/id" || j.startsWith("/id/") ? "id" : "en"] += n;
  const aktif = Object.values(s.aktif ?? {}).filter((t) => Date.now() - t < AKTIF_MS).length;
  const hariAda = Object.keys(s.hari ?? {}).sort();
  return {
    diperbarui: new Date().toISOString(),
    aktif,
    hariIni: ringkas(1),
    tujuhHari: ringkas(7),
    tigaPuluhHari: ringkas(30),
    seri,
    detail: { tanggal: tgl, unik: hd?.unik.length ?? 0, tampil: hd?.tampil ?? 0, negara: urut(negaraHari, 5), halaman: urut(hd?.halaman ?? {}, 5) },
    negara: urut(semuaNegara, 60).map(([kode, n]) => ({ kode, n })),
    tanpaNegara,
    bahasa,
    mulai: hariAda[0] ?? null,
  };
}
