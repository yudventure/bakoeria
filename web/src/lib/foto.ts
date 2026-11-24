import type { CSSProperties } from "react";

/**
 * Foto situs yang bisa diganti dari dashboard (menu Website, kotak Foto).
 *
 * Tiap foto unggahan diubah di server menjadi WebP dalam beberapa lebar
 * (misalnya 640, 1080, 1600, 2560 px). Browser memilih sendiri ukuran yang
 * pas dengan layarnya lewat `srcset`, jadi ponsel tidak mengunduh foto
 * selebar layar desktop. Berkasnya disimpan di folder data (bukan public/)
 * supaya tidak hilang saat deploy, dan disajikan dari /foto/<nama>.
 */

export interface Foto {
  /** Nama unik berkas, tanpa lebar dan ekstensi. Berubah tiap unggahan, jadi aman di-cache selamanya. */
  id: string;
  /** Ukuran hasil terbesar. */
  w: number;
  h: number;
  /** Lebar yang tersedia, dari kecil ke besar. */
  lebar: number[];
  jenis: "webp" | "jpg";
  /** Titik fokus dalam persen (x, y): bagian foto yang tetap terlihat saat dipotong. */
  fokus: [number, number];
  /** Ukuran berkas terbesar dan asli, dalam kilobyte, untuk info di dashboard. */
  kb: number;
  kbAsli: number;
}

export const SLOT_FOTO = [
  { id: "hero", grup: "Pembuka", label: "Foto utama", bawaan: "/img/resort-night.jpg", saran: "Lanskap lebar" },
  { id: "tentang1", grup: "Tentang kami", label: "Foto 1", bawaan: "/img/cottage-left.jpg", saran: "4:3" },
  { id: "tentang2", grup: "Tentang kami", label: "Foto 2", bawaan: "/img/cottage-right.jpg", saran: "4:3" },
  { id: "tentang3", grup: "Tentang kami", label: "Foto 3", bawaan: "/img/lights-path.jpg", saran: "4:3" },
  { id: "aksen", grup: "Tentang kami", label: "Pil kecil di kalimat besar", bawaan: "/img/lights-path.jpg", saran: "Lanskap" },
  { id: "keunggulan", grup: "Keunggulan", label: "Latar panel", bawaan: "/img/palms.jpg", saran: "Lanskap lebar" },
  { id: "video", grup: "Menginap", label: "Sampul video", bawaan: "/img/resort-night.jpg", saran: "16:9, tampil sebelum video berputar" },
  { id: "kamar1", grup: "Menginap", label: "Galeri 1 (tegak besar)", bawaan: "/img/cottage-left.jpg", saran: "Tegak 3:4" },
  { id: "kamar2", grup: "Menginap", label: "Galeri 2 (lebar)", bawaan: "/img/resort-night.jpg", saran: "Lanskap" },
  { id: "kamar3", grup: "Menginap", label: "Galeri 3", bawaan: "/img/lights-path.jpg", saran: "Lanskap" },
  { id: "kamar4", grup: "Menginap", label: "Galeri 4", bawaan: "/img/cottage-right.jpg", saran: "Lanskap" },
  { id: "kamar5", grup: "Menginap", label: "Galeri 5", bawaan: "/img/palms.jpg", saran: "Lanskap" },
  { id: "selam1", grup: "Program selam", label: "Kartu 1", bawaan: "/img/resort-night.jpg", saran: "Foto selam, tegak atau persegi" },
  { id: "selam2", grup: "Program selam", label: "Kartu 2", bawaan: "/img/palms.jpg", saran: "Foto selam" },
  { id: "selam3", grup: "Program selam", label: "Kartu 3", bawaan: "/img/cottage-right.jpg", saran: "Foto selam" },
  { id: "selam4", grup: "Program selam", label: "Kartu 4", bawaan: "/img/lights-path.jpg", saran: "Foto selam" },
  { id: "selam5", grup: "Program selam", label: "Kartu 5", bawaan: "/img/cottage-left.jpg", saran: "Foto selam" },
  { id: "selam6", grup: "Program selam", label: "Kartu 6", bawaan: "/img/resort-night.jpg", saran: "Foto selam" },
  { id: "aktivitas1", grup: "Aktivitas lain", label: "Kartu 1", bawaan: "/img/palms.jpg", saran: "Tegak 9:16, tampil bila video kosong" },
  { id: "aktivitas2", grup: "Aktivitas lain", label: "Kartu 2", bawaan: "/img/lights-path.jpg", saran: "Tegak 9:16" },
  { id: "aktivitas3", grup: "Aktivitas lain", label: "Kartu 3", bawaan: "/img/resort-night.jpg", saran: "Tegak 9:16" },
  { id: "galeri1", grup: "Aktivitas lain", label: "Galeri 1 (besar)", bawaan: "/img/resort-night.jpg", saran: "Lanskap" },
  { id: "galeri2", grup: "Aktivitas lain", label: "Galeri 2", bawaan: "/img/palms.jpg", saran: "Lanskap" },
  { id: "galeri3", grup: "Aktivitas lain", label: "Galeri 3", bawaan: "/img/lights-path.jpg", saran: "Lanskap" },
  { id: "galeri4", grup: "Aktivitas lain", label: "Galeri 4", bawaan: "/img/cottage-left.jpg", saran: "Lanskap" },
  { id: "galeri5", grup: "Aktivitas lain", label: "Galeri 5", bawaan: "/img/cottage-right.jpg", saran: "Lanskap" },
  { id: "perahu1", grup: "Perahu antar-jemput", label: "Perahu 1 (longboat)", bawaan: "/img/perahu-longboat.svg", saran: "Foto perahu, lanskap 16:10" },
  { id: "perahu2", grup: "Perahu antar-jemput", label: "Perahu 2 (speedboat)", bawaan: "/img/perahu-speedboat.svg", saran: "Foto perahu, lanskap 16:10" },
  { id: "perahu3", grup: "Perahu antar-jemput", label: "Perahu 3", bawaan: "/img/perahu-speedboat.svg", saran: "Bila ada perahu ketiga" },
  { id: "pesan", grup: "Pemesanan", label: "Latar bawah", bawaan: "/img/resort-night.jpg", saran: "Lanskap lebar" },
] as const;

export type SlotFoto = (typeof SLOT_FOTO)[number]["id"];
export type PetaFoto = Partial<Record<SlotFoto, Foto>>;
export const adaSlot = (v: unknown): v is SlotFoto => SLOT_FOTO.some((s) => s.id === v);

/** Lebar keluaran. Yang lebih besar dari foto aslinya tidak dibuat. */
export const LEBAR_FOTO = [640, 1080, 1600, 2560] as const;
/** Lebar yang dibuat untuk foto selebar `w` dan setinggi `h`; sisi terpanjang paling banyak 2560 px. */
export function daftarLebar(w: number, h: number): number[] {
  const maks = Math.min(w, Math.round((2560 * w) / Math.max(w, h)));
  return [...new Set([...LEBAR_FOTO.filter((x) => x < maks - 80), maks])];
}
export const urlFoto = (f: Pick<Foto, "id" | "jenis">, w: number) => `/foto/${f.id}-${w}.${f.jenis}`;

/** Atribut <img> untuk satu slot: foto unggahan (dengan srcset dan titik fokus) atau foto bawaan. */
export interface Gambar { src: string; srcSet?: string; style?: CSSProperties; w?: number; h?: number }
export function gambar(peta: PetaFoto | undefined, slot: SlotFoto): Gambar {
  const f = peta?.[slot];
  if (!f) return { src: SLOT_FOTO.find((s) => s.id === slot)!.bawaan };
  const tengah = f.lebar.find((w) => w >= 1080) ?? f.lebar[f.lebar.length - 1];
  return {
    src: urlFoto(f, tengah),
    srcSet: f.lebar.map((w) => `${urlFoto(f, w)} ${w}w`).join(", "),
    style: { objectPosition: `${f.fokus[0]}% ${f.fokus[1]}%` },
    w: f.w,
    h: f.h,
  };
}

/** Rapikan peta tersimpan: hanya slot dikenal dan isian yang masuk akal. */
export function rapikanPetaFoto(o: unknown): PetaFoto {
  const hasil: PetaFoto = {};
  if (!o || typeof o !== "object") return hasil;
  for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
    const f = adaSlot(k) ? rapikanFoto(v) : null;
    if (f) hasil[k as SlotFoto] = f;
  }
  return hasil;
}

/** Satu foto tersimpan, atau null bila isinya tidak masuk akal. */
export function rapikanFoto(v: unknown): Foto | null {
  if (!v || typeof v !== "object") return null;
  const x = v as Record<string, unknown>;
  const n = (a: unknown, d = 0) => (typeof a === "number" && Number.isFinite(a) ? a : d);
  if (typeof x.id !== "string" || !/^[a-z0-9-]{6,60}$/.test(x.id)) return null;
  const lebar = Array.isArray(x.lebar) ? x.lebar.map((y) => n(y)).filter((y) => y > 0 && y <= 4096) : [];
  if (!lebar.length) return null;
  const fk = Array.isArray(x.fokus) ? x.fokus : [];
  const persen = (a: unknown) => Math.min(100, Math.max(0, Math.round(n(a, 50))));
  return { id: x.id, w: n(x.w), h: n(x.h), lebar: lebar.sort((a, b) => a - b), jenis: x.jenis === "jpg" ? "jpg" : "webp", fokus: [persen(fk[0]), persen(fk[1])], kb: n(x.kb), kbAsli: n(x.kbAsli) };
}

/* ------------------------------------------------------------------ Galeri */

/**
 * Galeri foto yang jumlahnya bebas dan urutannya bisa diatur. Foto-foto pertama
 * mengisi mosaik; sisanya muncul setelah pengunjung menekan "Show more".
 * Sebelum pemilik mengubah galeri, isinya diambil dari slot lama (kamar1-5, galeri1-5).
 */
export const GALERI = {
  /* Menginap: 5 foto mosaik + 4 foto sebaris di bawahnya selalu tampil (permintaan pemilik), selebihnya lewat "Show more". */
  menginap: { label: "Galeri menginap", mosaik: 5, tetap: 4, slot: ["kamar1", "kamar2", "kamar3", "kamar4", "kamar5"] as SlotFoto[] },
  aktivitas: { label: "Galeri aktivitas", mosaik: 5, tetap: 0, slot: ["galeri1", "galeri2", "galeri3", "galeri4", "galeri5"] as SlotFoto[] },
} as const;
export type NamaGaleri = keyof typeof GALERI;
export const adaGaleri = (v: unknown): v is NamaGaleri => v === "menginap" || v === "aktivitas";
export const MAKS_GALERI = 60;

/** Satu foto galeri: unggahan, atau foto bawaan situs (`bawaan` berisi alamatnya). `kunci` unik dalam galeri. */
export interface ItemGaleri { kunci: string; foto: Foto | null; bawaan: string | null }
export type PetaGaleri = Record<NamaGaleri, ItemGaleri[]>;

export function galeriDariSlot(peta: PetaFoto, nama: NamaGaleri): ItemGaleri[] {
  return GALERI[nama].slot.map((s) => {
    const f = peta[s];
    return f ? { kunci: f.id, foto: f, bawaan: null } : { kunci: `bawaan-${s}`, foto: null, bawaan: SLOT_FOTO.find((x) => x.id === s)!.bawaan };
  });
}

export function rapikanGaleri(v: unknown): ItemGaleri[] | null {
  if (!Array.isArray(v)) return null;
  const hasil: ItemGaleri[] = [];
  for (const x of v.slice(0, MAKS_GALERI)) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const foto = rapikanFoto(o.foto);
    const bawaan = typeof o.bawaan === "string" && /^\/img\/[a-z0-9-]+\.(jpg|webp|png)$/.test(o.bawaan) ? o.bawaan : null;
    const kunci = typeof o.kunci === "string" ? o.kunci.slice(0, 80) : foto?.id ?? "";
    if ((foto || bawaan) && kunci && !hasil.some((h) => h.kunci === kunci)) hasil.push({ kunci, foto, bawaan: foto ? null : bawaan });
  }
  return hasil;
}

export function gambarItem(it: ItemGaleri): Gambar {
  const f = it.foto;
  if (!f) return { src: it.bawaan ?? "" };
  const tengah = f.lebar.find((w) => w >= 1080) ?? f.lebar[f.lebar.length - 1];
  return { src: urlFoto(f, tengah), srcSet: f.lebar.map((w) => `${urlFoto(f, w)} ${w}w`).join(", "), style: { objectPosition: `${f.fokus[0]}% ${f.fokus[1]}%` }, w: f.w, h: f.h };
}

/** Atribut siap pakai untuk <img>: `sizes` memberi tahu browser selebar apa foto tampil, supaya ukuran yang diunduh pas. */
export const atribut = (g: Gambar, sizes: string, style?: CSSProperties) => ({
  src: g.src,
  ...(g.srcSet ? { srcSet: g.srcSet, sizes } : {}),
  ...(g.style || style ? { style: { ...style, ...g.style } } : {}),
});
