/**
 * Peran akun dashboard Bakoeria dan layar yang boleh dibuka tiap peran.
 *
 * Satu resort, jadi tidak ada pembatasan per properti seperti di Unmehopa:
 * yang membedakan akun cuma perannya. Peran yang tidak dikenal dianggap staf,
 * supaya gagal ke arah yang paling sempit.
 */
export type Peran = "developer" | "pemilik" | "manajer" | "keuangan" | "resepsionis" | "dive" | "pr" | "staf";

export type Layar =
  | "ringkasan"
  | "kalender"
  | "pesanan"
  | "tamu"
  | "kamar"
  | "laporan"
  | "keuangan"
  | "sdm"
  | "gudang"
  | "sinkron"
  | "website"
  | "statistik"
  | "pengguna"
  | "pengaturan";

export const PERAN: Peran[] = ["developer", "pemilik", "manajer", "keuangan", "resepsionis", "dive", "pr", "staf"];

export const LABEL_PERAN: Record<Peran, string> = {
  developer: "Developer",
  pemilik: "Pemilik",
  manajer: "Manajer resort",
  keuangan: "Keuangan",
  resepsionis: "Resepsionis",
  dive: "Dive center",
  pr: "Public relation",
  staf: "Staf",
};

export const KET_PERAN: Record<Peran, string> = {
  developer: "Memegang sistem. Akses penuh, termasuk akun dan pengaturan.",
  pemilik: "Akses penuh seperti developer.",
  manajer: "Mengelola operasional: kalender, pesanan, tamu, kamar, keuangan, SDM, gudang, sinkronisasi, laporan, website, dan statistik pengunjung. Tidak mengatur akun.",
  keuangan: "Laporan, catatan keuangan, aset, dan angka rupiah. Melihat kalender, pesanan, SDM, dan gudang.",
  resepsionis: "Mencatat dan mengubah pesanan, check-in, check-out, dan pembayaran. Tanpa laporan keuangan.",
  dive: "Melihat kalender, pesanan, dan tamu untuk menyiapkan jadwal selam. Tanpa angka rupiah.",
  pr: "Mengelola isi website dan melihat statistik pengunjung.",
  staf: "Melihat kalender dan kamar, serta mencatat barang keluar masuk gudang. Tanpa angka rupiah.",
};

const SEMUA: Layar[] = ["ringkasan", "kalender", "pesanan", "tamu", "kamar", "laporan", "keuangan", "sdm", "gudang", "sinkron", "website", "statistik", "pengguna", "pengaturan"];

const AKSES: Record<Peran, Layar[]> = {
  developer: SEMUA,
  pemilik: SEMUA,
  manajer: ["ringkasan", "kalender", "pesanan", "tamu", "kamar", "laporan", "keuangan", "sdm", "gudang", "sinkron", "website", "statistik"],
  keuangan: ["ringkasan", "kalender", "pesanan", "laporan", "keuangan", "sdm", "gudang"],
  resepsionis: ["ringkasan", "kalender", "pesanan", "tamu", "kamar"],
  dive: ["ringkasan", "kalender", "pesanan", "tamu"],
  pr: ["ringkasan", "website", "statistik"],
  staf: ["ringkasan", "kalender", "kamar", "gudang"],
};

export const rapikanPeran = (v: unknown): Peran => (PERAN.includes(v as Peran) ? (v as Peran) : "staf");
export const layarUntuk = (p: Peran): Layar[] => AKSES[p] ?? AKSES.staf;
export const bolehLayar = (p: Peran, l: Layar) => layarUntuk(p).includes(l);
/** Melihat angka rupiah (tarif, total, pembayaran). */
export const lihatRupiah = (p: Peran) => ["developer", "pemilik", "manajer", "keuangan", "resepsionis"].includes(p);
/** Mencatat dan mengubah pesanan. */
export const bolehCatat = (p: Peran) => ["developer", "pemilik", "manajer", "resepsionis"].includes(p);
/** Mengatur akun dan pengaturan sistem. */
export const pengelolaSistem = (p: Peran) => p === "developer" || p === "pemilik";

/** Hak atas modul data (keuangan, sdm, gudang): "tulis", "baca", atau null. */
export function aksesModul(p: Peran, m: "keuangan" | "sdm" | "gudang", koleksi?: string): "tulis" | "baca" | null {
  if (!bolehLayar(p, m)) return null;
  if (["developer", "pemilik", "manajer"].includes(p)) return "tulis";
  if (p === "keuangan") return m === "keuangan" ? "tulis" : "baca";
  if (p === "staf" && m === "gudang") return koleksi === "mutasi" ? "tulis" : "baca";
  return "baca";
}
