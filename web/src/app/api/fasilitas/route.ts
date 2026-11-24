import { adaJenisFasilitas } from "@/lib/fasilitas";
import { akunMasuk } from "@/lib/server/akses";
import { bacaKatalog, KatalogBerubahError, simpanKatalog } from "@/lib/server/fasilitas";
import { bolehLayar } from "@/lib/peran";
import { badan, gagal, ok } from "@/lib/server/rute";

export const dynamic = "force-dynamic";

/** Fasilitas kamar diatur dari menu Kamar & tarif; fasilitas selam dan trip dari menu Website. */
async function izin(jenis: string | null) {
  const a = await akunMasuk();
  if (!a) return gagal("Sesi habis. Silakan masuk lagi.", 401);
  const boleh = jenis === "kamar" ? bolehLayar(a.peran, "kamar") && ["developer", "pemilik", "manajer"].includes(a.peran) : bolehLayar(a.peran, "website");
  return boleh ? null : gagal("Peran Anda tidak bisa mengatur daftar fasilitas.", 403);
}

export async function GET() {
  const a = await akunMasuk();
  if (!a) return gagal("Sesi habis. Silakan masuk lagi.", 401);
  return ok({ katalog: await bacaKatalog() });
}

/** Ganti satu daftar: { jenis: "kamar" | "selam" | "trip", daftar: [{ kunci, ikon, en, id }] }. */
export async function PUT(req: Request) {
  const o = await badan(req);
  if (!adaJenisFasilitas(o.jenis)) return gagal("Jenis fasilitas tidak dikenal.");
  const t = await izin(o.jenis);
  if (t) return t;
  if (!Array.isArray(o.daftar)) return gagal("Daftar fasilitas tidak terbaca.");
  try {
    return ok({ katalog: await simpanKatalog(o.jenis, o.daftar, typeof o.asal === "string" ? o.asal : undefined) });
  } catch (e) {
    if (e instanceof KatalogBerubahError) return gagal("Daftar fasilitas baru saja diubah di tempat lain. Daftar terbaru sudah dimuat, silakan ulangi perubahan Anda.", 409, { katalog: e.katalog });
    throw e;
  }
}
