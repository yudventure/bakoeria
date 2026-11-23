import "server-only";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { daftarLebar, rapikanPetaFoto, type Foto, type PetaFoto, type SlotFoto } from "@/lib/foto";
import { bacaJson, dirData, ubahJson } from "./gudang";

/**
 * Penyimpanan dan konversi foto situs.
 *
 * Konversi memakai sharp (libvips): orientasi kamera dibetulkan, warna diubah
 * ke sRGB, data EXIF (termasuk lokasi GPS) dibuang, lalu dibuat WebP kualitas
 * 82 dalam beberapa lebar. Kualitas 82 dengan subsampling warna cerdas tidak
 * terbedakan mata dari aslinya, tetapi berkasnya biasanya 10-20 kali lebih kecil
 * daripada JPEG kamera. Pengecilan memakai filter Lanczos sehingga tetap tajam.
 *
 * Bila sharp tidak bisa dimuat di server, dashboard mengubah foto di browser
 * dan mengirim hasil jadinya (lihat simpanHasilKlien).
 */

export const MAKS_ASLI = 40 * 1024 * 1024;
const NAMA = /^([a-z0-9-]{6,60})-(\d{2,4})\.(webp|jpg)$/;

export async function dirFoto() {
  const d = path.join(/*turbopackIgnore: true*/ await dirData(), "foto");
  await fs.mkdir(/*turbopackIgnore: true*/ d, { recursive: true, mode: 0o755 });
  return d;
}

export const bacaPetaFoto = async (): Promise<PetaFoto> => rapikanPetaFoto(await bacaJson<unknown>("foto.json", {}));

type Sharp = typeof import("sharp");
let sharpCache: Sharp | null | undefined;
export async function muatSharp(): Promise<Sharp | null> {
  if (sharpCache !== undefined) return sharpCache;
  /* Untuk menguji jalur cadangan (konversi di browser) tanpa membongkar node_modules. */
  if (process.env.BAKOERIA_TANPA_SHARP === "1") return (sharpCache = null);
  try {
    const m = (await import("sharp")) as unknown as { default?: Sharp } & Sharp;
    sharpCache = m.default ?? m;
    sharpCache.cache(false);
    sharpCache.concurrency(1);
  } catch (e) {
    console.error("[foto] sharp tidak bisa dimuat; konversi dilakukan di browser", e);
    sharpCache = null;
  }
  return sharpCache;
}

const idBaru = () => `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;


/** Ubah satu foto asli menjadi beberapa WebP. */
export async function olahFoto(asli: Buffer): Promise<Omit<Foto, "fokus">> {
  const sharp = await muatSharp();
  if (!sharp) throw new Error("tanpa-sharp");
  const meta = await sharp(asli, { failOn: "none", limitInputPixels: 120_000_000 }).metadata();
  if (!meta.width || !meta.height) throw new Error("Berkas ini bukan foto yang bisa dibaca. Pakai JPG, PNG, WebP, atau AVIF.");
  const tegak = (meta.orientation ?? 1) >= 5;
  const W = tegak ? meta.height : meta.width;
  const H = tegak ? meta.width : meta.height;
  const lebar = daftarLebar(W, H);
  const id = idBaru();
  const dir = await dirFoto();
  let kb = 0;
  for (const w of lebar) {
    const isi = await sharp(asli, { failOn: "none", limitInputPixels: 120_000_000 })
      .rotate()
      .resize({ width: w, withoutEnlargement: true, kernel: "lanczos3" })
      .toColourspace("srgb")
      .webp({ quality: 82, effort: 5, smartSubsample: true })
      .toBuffer();
    await fs.writeFile(/*turbopackIgnore: true*/ path.join(dir, `${id}-${w}.webp`), isi, { mode: 0o644 });
    kb = Math.round(isi.length / 1024);
  }
  const maks = lebar[lebar.length - 1];
  return { id, w: maks, h: Math.round((maks * H) / W), lebar, jenis: "webp", kb, kbAsli: Math.round(asli.length / 1024) };
}

/** Hasil yang sudah diubah browser (bila sharp tidak ada): periksa jenis berkas lalu simpan apa adanya. */
export async function simpanHasilKlien(berkas: { w: number; isi: Buffer }[], h: number, kbAsli: number): Promise<Omit<Foto, "fokus">> {
  const webp = (b: Buffer) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP";
  const jpg = (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (!berkas.length || berkas.length > 6) throw new Error("Hasil konversi tidak lengkap.");
  const jenis = berkas.every((b) => webp(b.isi)) ? "webp" : berkas.every((b) => jpg(b.isi)) ? "jpg" : null;
  if (!jenis) throw new Error("Hasil konversi bukan WebP atau JPG.");
  const urut = [...berkas].sort((a, b) => a.w - b.w);
  if (urut.some((b) => !Number.isInteger(b.w) || b.w < 64 || b.w > 2560 || b.isi.length > 8 * 1024 * 1024)) throw new Error("Ukuran hasil konversi tidak wajar.");
  const id = idBaru();
  const dir = await dirFoto();
  for (const b of urut) await fs.writeFile(/*turbopackIgnore: true*/ path.join(dir, `${id}-${b.w}.${jenis}`), b.isi, { mode: 0o644 });
  const maks = urut[urut.length - 1];
  return { id, w: maks.w, h: Math.max(1, Math.round(h)), lebar: urut.map((b) => b.w), jenis, kb: Math.round(maks.isi.length / 1024), kbAsli };
}

/** Ubah isi satu slot (null = kembali ke foto bawaan), lalu hapus berkas yang tidak dipakai lagi. */
export async function aturSlot(slot: SlotFoto, ubah: (lama: Foto | undefined) => Foto | null): Promise<PetaFoto> {
  const peta = rapikanPetaFoto(
    await ubahJson<unknown>("foto.json", {}, (lama) => {
      const p = rapikanPetaFoto(lama);
      const baru = ubah(p[slot]);
      if (baru) p[slot] = baru;
      else delete p[slot];
      return p;
    }, 0o644),
  );
  await bersihkan(peta).catch((e) => console.error("[foto] gagal membersihkan", e));
  return peta;
}

async function bersihkan(peta: PetaFoto) {
  const dipakai = new Set(Object.values(peta).map((f) => f!.id));
  const dir = await dirFoto();
  const batas = Date.now() - 10 * 60 * 1000; // berkas yang baru dibuat bisa jadi sedang menunggu disimpan
  for (const nama of await fs.readdir(/*turbopackIgnore: true*/ dir)) {
    const m = NAMA.exec(nama);
    if (!m || dipakai.has(m[1])) continue;
    const st = await fs.stat(/*turbopackIgnore: true*/ path.join(dir, nama)).catch(() => null);
    if (st && st.mtimeMs < batas) await fs.unlink(/*turbopackIgnore: true*/ path.join(dir, nama)).catch(() => undefined);
  }
}

/** Baca satu berkas untuk disajikan; null bila nama tidak sah atau tidak ada. */
export async function bacaBerkasFoto(nama: string): Promise<{ isi: Buffer; jenis: string } | null> {
  const m = NAMA.exec(nama);
  if (!m) return null;
  try {
    return { isi: await fs.readFile(/*turbopackIgnore: true*/ path.join(await dirFoto(), nama)), jenis: m[3] === "webp" ? "image/webp" : "image/jpeg" };
  } catch {
    return null;
  }
}
