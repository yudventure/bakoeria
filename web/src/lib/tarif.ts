/**
 * Aturan harga yang murni (dipakai server dan browser): perubahan harga massal,
 * harga musim ramai, dan kupon diskon. Diuji di `tarif.test.ts`.
 */

/** Cara mengubah satu angka harga: jadikan angka tetap, naik/turun persen, atau naik/turun rupiah. */
export type CaraUbah = { mode: "tetap"; nilai: number } | { mode: "persen"; nilai: number } | { mode: "rupiah"; nilai: number };

/** Dibulatkan ke ribuan terdekat supaya harga hasil persen tetap rapi (Rp 1.837.500 menjadi Rp 1.838.000). */
export const bulatRibu = (n: number) => Math.max(0, Math.round(n / 1000) * 1000);

export function terapkan(harga: number, c: CaraUbah): number {
  if (c.mode === "tetap") return Math.max(0, Math.round(c.nilai));
  if (c.mode === "persen") return bulatRibu((harga * (100 + c.nilai)) / 100);
  return Math.max(0, Math.round(harga + c.nilai));
}

export function bacaCara(v: unknown): CaraUbah | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const nilai = Number(o.nilai);
  if (!Number.isFinite(nilai)) return null;
  if (o.mode === "tetap" && nilai >= 0) return { mode: "tetap", nilai };
  if (o.mode === "persen" && nilai >= -95 && nilai <= 500) return { mode: "persen", nilai };
  if (o.mode === "rupiah") return { mode: "rupiah", nilai };
  return null;
}

export const teksCara = (c: CaraUbah) =>
  c.mode === "tetap" ? `menjadi Rp ${Math.round(c.nilai).toLocaleString("id-ID")}` : c.mode === "persen" ? `${c.nilai >= 0 ? "naik" : "turun"} ${Math.abs(c.nilai)}%` : `${c.nilai >= 0 ? "naik" : "turun"} Rp ${Math.abs(Math.round(c.nilai)).toLocaleString("id-ID")}`;

/* ------------------------------------------------------------------ Kupon */

export type JenisKupon = "PERSEN" | "NOMINAL";
export interface Kupon {
  id: string;
  kode: string;
  jenis: JenisKupon;
  /** Persen (1-100) atau rupiah, tergantung jenis. */
  nilai: number;
  /** Batas potongan untuk kupon persen; null = tanpa batas. */
  maksPotongan: number | null;
  minMalam: number;
  /** Kupon bisa dipakai sampai tanggal ini (tanggal pemesanan, WIT); null = tidak kedaluwarsa. */
  berlakuSampai: string | null;
  /** Rentang tanggal tiba yang boleh memakai kupon; null = kapan saja. */
  tibaDari: string | null;
  tibaSampai: string | null;
  /** Jenis cottage yang boleh memakai kupon; kosong = semua. */
  tipeKamar: string[];
  /** Batas jumlah pemakaian; null = tanpa batas. */
  maksPakai: number | null;
  aktif: boolean;
  catatan: string | null;
  /** Jumlah pesanan (tidak batal) yang memakai kupon ini. */
  terpakai: number;
}

export const rapikanKode = (v: unknown) => (typeof v === "string" ? v.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24) : "");

export type AlasanTolak = "tidakAda" | "nonaktif" | "kedaluwarsa" | "habis" | "minMalam" | "tanggal" | "kamar";

/**
 * Periksa kupon untuk satu pesanan dan hitung potongannya. Potongan dikenakan pada
 * total menginap (kamar + extra bed anak) dan tidak pernah melebihi total itu.
 */
export function hitungKupon(k: Kupon | null, p: { masuk: string; malam: number; tipe: string | null; total: number; hariIni: string }): { ok: true; potongan: number } | { ok: false; alasan: AlasanTolak; batas?: number | string } {
  if (!k) return { ok: false, alasan: "tidakAda" };
  if (!k.aktif) return { ok: false, alasan: "nonaktif" };
  if (k.berlakuSampai && p.hariIni > k.berlakuSampai) return { ok: false, alasan: "kedaluwarsa" };
  if (k.maksPakai != null && k.terpakai >= k.maksPakai) return { ok: false, alasan: "habis" };
  if (p.malam < k.minMalam) return { ok: false, alasan: "minMalam", batas: k.minMalam };
  if ((k.tibaDari && p.masuk < k.tibaDari) || (k.tibaSampai && p.masuk > k.tibaSampai)) return { ok: false, alasan: "tanggal" };
  if (k.tipeKamar.length && !k.tipeKamar.includes(p.tipe ?? "")) return { ok: false, alasan: "kamar" };
  let potongan = k.jenis === "PERSEN" ? Math.round((p.total * k.nilai) / 100) : Math.round(k.nilai);
  if (k.jenis === "PERSEN" && k.maksPotongan != null) potongan = Math.min(potongan, k.maksPotongan);
  return { ok: true, potongan: Math.max(0, Math.min(p.total, potongan)) };
}

export const teksKupon = (k: Pick<Kupon, "jenis" | "nilai" | "maksPotongan">) =>
  k.jenis === "PERSEN" ? `${k.nilai}%${k.maksPotongan != null ? ` (maks. Rp ${k.maksPotongan.toLocaleString("id-ID")})` : ""}` : `Rp ${Math.round(k.nilai).toLocaleString("id-ID")}`;

/** Kenaikan tarif Fleksibel dari total kamar sebelum kupon, dibulatkan ke ribuan. Sama di situs dan server. */
export const kenaikanFleksibel = (totalKamar: number, persen: number) => bulatRibu((totalKamar * persen) / 100);
/** Tarif Fleksibel hanya bisa dipilih bila check-in masih paling sedikit `batasHari` hari lagi. */
export const fleksibelBoleh = (masuk: string, hariIni: string, batasHari: number) => Date.parse(masuk + "T00:00:00Z") - Date.parse(hariIni + "T00:00:00Z") >= batasHari * 86400000;
/** Tanggal terakhir untuk batal (Fleksibel) atau ganti tanggal (Standar). */
export const batasTarif = (masuk: string, batasHari: number) => new Date(Date.parse(masuk + "T00:00:00Z") - batasHari * 86400000).toISOString().slice(0, 10);
