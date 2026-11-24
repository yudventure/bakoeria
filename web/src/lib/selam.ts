import type { PaketGrup } from "./konten";

/**
 * Untuk siapa satu baris harga selam ditawarkan di formulir pesan:
 * - "sertifikat": penyelam bersertifikat (fun dive, night dive, dive trip, penyegaran)
 * - "pemula": tanpa sertifikat (try dive, Discover Scuba)
 * - "kursus": kursus sertifikasi (Open Water, Advanced, dan seterusnya)
 * - "lain": bukan diving (snorkeling, trip pulau, memancing); tidak muncul di pilihan diving
 * Kosong berarti ditebak dari nama kelompok dan barisnya (bisa diubah di dashboard).
 */
export type UntukSelam = "sertifikat" | "pemula" | "kursus" | "lain";
export const UNTUK_SELAM: UntukSelam[] = ["sertifikat", "pemula", "kursus", "lain"];
export const LABEL_UNTUK: Record<UntukSelam, string> = { sertifikat: "Penyelam bersertifikat", pemula: "Tanpa sertifikat", kursus: "Kursus", lain: "Bukan diving" };

export function tebakUntuk(grup: string, nama: string, ket: string): UntukSelam {
  const t = `${nama} ${ket}`.toLowerCase();
  const g = grup.toLowerCase();
  if (/(tanpa sertifikat|without (a )?certific|no certific|not certified|try dive|discover scuba|selam pertama|first dive)/.test(t)) return "pemula";
  if (/(kursus|course|lisensi|license|sertifikasi)/.test(t) && !/(penyegaran|refresh|skill)/.test(t)) return "kursus";
  if (/(snorkel|trip pulau|island trip|memancing|fishing|mengamati burung|bird)/.test(`${g} ${t}`) && !/\bdive|selam|nyelam/.test(t)) return "lain";
  if (/(snorkel|trip pulau|island trip)/.test(g)) return "lain";
  return "sertifikat";
}
export const untukBaris = (grup: string, x: { nama: string; ket: string; untuk?: string }): UntukSelam =>
  UNTUK_SELAM.includes(x.untuk as UntukSelam) ? (x.untuk as UntukSelam) : tebakUntuk(grup, x.nama, x.ket);

/** Pilihan paket diving untuk formulir pesan: kunci "kelompok-baris", menurut sertifikat tamu. */
export interface OpsiSelam { kunci: string; grup: string; nama: string; ket: string; harga: string; untuk: UntukSelam }
export function opsiSelam(paket: PaketGrup[], bersertifikat: boolean): OpsiSelam[] {
  const hasil: OpsiSelam[] = [];
  paket.forEach((g, i) => g.isi.forEach((x, j) => {
    const untuk = untukBaris(g.judul, x);
    if (untuk === "lain") return;
    /* Belum bersertifikat: hanya yang tanpa sertifikat dan kursus. Bersertifikat: semua kecuali try dive. */
    if (bersertifikat ? untuk === "pemula" : untuk === "sertifikat") return;
    hasil.push({ kunci: `${i}-${j}`, grup: g.judul, nama: x.nama, ket: x.ket, harga: x.harga, untuk });
  }));
  return hasil;
}
