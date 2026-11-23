import { adaGaleri, adaSlot } from "@/lib/foto";
import { wajib } from "@/lib/server/akses";
import { aturSlot, bacaGaleri, bacaPetaFoto, ID_SAH, resmikan } from "@/lib/server/foto";
import { badan, gagal, ok } from "@/lib/server/rute";

export const dynamic = "force-dynamic";

/** Foto situs per slot. */
export async function GET() {
  const a = await wajib("website");
  if (a instanceof Response) return a;
  const foto = await bacaPetaFoto();
  return ok({ foto, galeri: await bacaGaleri(foto) });
}

/**
 * Pasang foto ke slot setelah semua ukurannya terunggah lewat /api/foto/bagian:
 * { slot, id, lebar: number[], w, h, jenis, kbAsli }. Langsung tayang.
 * Bila ada ukuran yang belum sampai, dibalas 409 dengan daftar `kurang` supaya dashboard mengirim ulang.
 */
export async function POST(req: Request) {
  const a = await wajib("website");
  if (a instanceof Response) return a;
  const o = await badan(req);
  if (!adaSlot(o.slot) && !adaGaleri(o.galeri)) return gagal("Slot foto tidak dikenal.");
  const tujuan = adaGaleri(o.galeri) ? { galeri: o.galeri } : { slot: o.slot as never };
  const lebar = Array.isArray(o.lebar) ? o.lebar.map(Number).filter((w) => Number.isInteger(w) && w >= 64 && w <= 4096) : [];
  if (typeof o.id !== "string" || !ID_SAH.test(o.id) || !lebar.length || lebar.length > 6) return gagal("Data foto tidak lengkap.");
  const n = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));
  const urut = [...new Set(lebar)].sort((x, y) => x - y);
  try {
    const r = await resmikan(tujuan, { id: o.id, lebar: urut, w: urut[urut.length - 1], h: n(o.h) || 1, jenis: o.jenis === "jpg" ? "jpg" : "webp", kbAsli: n(o.kbAsli) });
    if ("kurang" in r) return gagal("Sebagian ukuran foto belum sampai.", 409, { kurang: r.kurang });
    return ok(r);
  } catch (e) {
    console.error("[foto] gagal meresmikan", e);
    return gagal("Penyimpanan di server gagal. Mengulang…", 500);
  }
}

/** Ubah titik fokus foto di satu slot: { slot, fokus: [x, y] } dalam persen. */
export async function PATCH(req: Request) {
  const a = await wajib("website");
  if (a instanceof Response) return a;
  const o = await badan(req);
  if (!adaSlot(o.slot) || !Array.isArray(o.fokus)) return gagal("Data fokus tidak lengkap.");
  const [x, y] = (o.fokus as unknown[]).map((v) => Math.min(100, Math.max(0, Math.round(Number(v) || 50))));
  return ok({ foto: await aturSlot(o.slot, (lama) => (lama ? { ...lama, fokus: [x, y] } : null)) });
}

/** Kembalikan satu slot ke foto bawaan: ?slot=hero */
export async function DELETE(req: Request) {
  const a = await wajib("website");
  if (a instanceof Response) return a;
  const slot = new URL(req.url).searchParams.get("slot");
  if (!adaSlot(slot)) return gagal("Slot foto tidak dikenal.");
  return ok({ foto: await aturSlot(slot, () => null) });
}
