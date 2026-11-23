import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { rapikanPetaFoto, type Foto, type PetaFoto, type SlotFoto } from "@/lib/foto";
import { bacaJson, dirData, ubahJson } from "./gudang";

/**
 * Penyimpanan foto situs.
 *
 * Server sengaja tidak mengolah foto: di hosting bersama, mengompres foto
 * kamera berukuran puluhan megapiksel memakan CPU dan memori, lambat, dan bisa
 * dihentikan di tengah jalan. Dashboard yang mengubah foto di perangkat
 * pengguna menjadi WebP beberapa lebar, lalu mengunggah tiap ukuran sebagai
 * berkas kecil tersendiri (diulang otomatis bila koneksi putus). Server hanya
 * memeriksa dan menyimpannya, lalu "meresmikan" foto ke slot setelah semua
 * ukurannya lengkap.
 */

export const MAKS_BAGIAN = 6 * 1024 * 1024;
const NAMA = /^([a-z0-9]{6,14}-[a-f0-9]{8})-(\d{2,4})\.(webp|jpg)$/;
export const ID_SAH = /^[a-z0-9]{6,14}-[a-f0-9]{8}$/;

export async function dirFoto() {
  const d = path.join(/*turbopackIgnore: true*/ await dirData(), "foto");
  await fs.mkdir(/*turbopackIgnore: true*/ d, { recursive: true, mode: 0o755 });
  return d;
}

export const bacaPetaFoto = async (): Promise<PetaFoto> => rapikanPetaFoto(await bacaJson<unknown>("foto.json", {}));

const webp = (b: Buffer) => b.length > 12 && b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP";
const jpg = (b: Buffer) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;

/** Simpan satu ukuran foto. Aman diulang: unggahan yang sama menimpa dirinya sendiri secara atomik. */
export async function simpanBagian(id: string, w: number, jenis: "webp" | "jpg", isi: Buffer) {
  if (!ID_SAH.test(id)) throw new Error("Nama foto tidak sah.");
  if (!Number.isInteger(w) || w < 64 || w > 4096) throw new Error("Lebar foto tidak wajar.");
  if (!isi.length || isi.length > MAKS_BAGIAN) throw new Error("Ukuran berkas tidak wajar.");
  if (!(jenis === "webp" ? webp(isi) : jpg(isi))) throw new Error("Berkas bukan WebP atau JPG.");
  const dir = await dirFoto();
  const tujuan = path.join(dir, `${id}-${w}.${jenis}`);
  const sementara = `${tujuan}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(/*turbopackIgnore: true*/ sementara, isi, { mode: 0o644 });
  await fs.rename(/*turbopackIgnore: true*/ sementara, tujuan);
}

/** Periksa semua ukuran sudah ada di server, lalu pasang foto itu ke slot. Mengembalikan ukuran yang belum ada bila belum lengkap. */
export async function resmikan(slot: SlotFoto, f: Omit<Foto, "fokus" | "kb">): Promise<{ foto: PetaFoto } | { kurang: number[] }> {
  if (!ID_SAH.test(f.id)) throw new Error("Nama foto tidak sah.");
  const dir = await dirFoto();
  const kurang: number[] = [];
  let kb = 0;
  for (const w of f.lebar) {
    const st = await fs.stat(/*turbopackIgnore: true*/ path.join(dir, `${f.id}-${w}.${f.jenis}`)).catch(() => null);
    if (!st) kurang.push(w);
    else kb = Math.round(st.size / 1024);
  }
  if (kurang.length) return { kurang };
  return { foto: await aturSlot(slot, (lama) => ({ ...f, kb, fokus: lama?.id === f.id ? lama.fokus : [50, 50] })) };
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

/** Hapus berkas yang tidak dipakai slot mana pun. Yang berumur di bawah 30 menit dibiarkan: bisa jadi unggahan yang sedang berjalan. */
async function bersihkan(peta: PetaFoto) {
  const dipakai = new Set(Object.values(peta).map((f) => f!.id));
  const dir = await dirFoto();
  const batas = Date.now() - 30 * 60 * 1000;
  for (const nama of await fs.readdir(/*turbopackIgnore: true*/ dir)) {
    const m = NAMA.exec(nama);
    const sisa = nama.endsWith(".tmp");
    if (!sisa && (!m || dipakai.has(m[1]))) continue;
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
