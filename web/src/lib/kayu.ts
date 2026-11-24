/**
 * November 2026, pemilik: cottage dibangun dari kayu besi berkualitas, bukan kayu jati.
 * Mengganti sebutan kayu jati / teak di teks bebas, dipakai sekali untuk isi yang sudah
 * tersimpan (konten.json dan deskripsi kamar).
 */
const GANTI: [RegExp, string][] = [
  [/dinding kayu jati/g, "dinding kayu besi berkualitas"],
  [/Kayu jati/g, "Kayu besi"],
  [/kayu jati/g, "kayu besi"],
  [/\b([Cc])ottage jati\b/g, "$1ottage kayu besi"],
  [/\bteak walls\b/g, "walls of quality ironwood"],
  [/\bteak wood\b/g, "ironwood"],
  [/\ba teak\b/g, "an ironwood"],
  [/\bA teak\b/g, "An ironwood"],
  [/\bTeak\b/g, "Ironwood"],
  [/\bteak\b/g, "ironwood"],
];
export const gantiKayu = (s: string) => GANTI.reduce((x, [re, b]) => x.replace(re, b), s);

/** Ganti di semua teks dalam objek bersarang; mengembalikan objek yang sama bila tidak ada yang berubah. */
export function gantiKayuDalam<T>(v: T): T {
  if (typeof v === "string") return gantiKayu(v) as T;
  if (Array.isArray(v)) return v.map(gantiKayuDalam) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, gantiKayuDalam(x)])) as T;
  return v;
}
