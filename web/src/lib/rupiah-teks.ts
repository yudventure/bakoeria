/** Angka saja dari isian rupiah ("Rp 4,000,000" atau "4.000.000" menjadi "4000000"). */
export const angkaRupiah = (s: string | number | null | undefined) => String(s ?? "").replace(/\D/g, "").replace(/^0+(?=\d)/, "");
/** "4000000" menjadi "4.000.000". */
export const titikRibuan = (d: string) => d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/**
 * Harga yang ditulis sebagai teks di isi situs: angka pertama dan keterangan di belakangnya
 * ("Rp 1.200.000 per orang" menjadi { angka: "1200000", akhiran: "per orang" }).
 */
export function pecahHarga(s: string): { angka: string; akhiran: string } {
  const m = /\d[\d.,]*/.exec(s);
  if (!m) return { angka: "", akhiran: s.replace(/^\s*Rp\.?\s*/i, "").replace(/^\s+/, "") };
  return { angka: angkaRupiah(m[0].replace(/[.,]\d{1,2}$/, "")), akhiran: s.slice(m.index + m[0].length).replace(/^\s+/, "") };
}
export const susunHarga = (angka: string, akhiran = "") => [angka ? `Rp ${titikRibuan(angka)}` : "", akhiran.replace(/^\s+/, "")].filter(Boolean).join(" ");

/** Harga teks yang hanya berisi angka ("Rp 2,000,000", "2000000") ditulis seragam "Rp 2.000.000". Teks lain dibiarkan. */
export function seragamkanHarga(s: string): string {
  if (!/^\s*(Rp\.?\s*)?\d[\d.,]*\s*$/i.test(s)) return s;
  const d = angkaRupiah(s);
  return d ? `Rp ${titikRibuan(d)}` : s;
}
