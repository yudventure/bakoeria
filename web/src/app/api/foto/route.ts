import { adaSlot } from "@/lib/foto";
import { wajib } from "@/lib/server/akses";
import { aturSlot, bacaPetaFoto, MAKS_ASLI, muatSharp, olahFoto, simpanHasilKlien } from "@/lib/server/foto";
import { badan, gagal, ok } from "@/lib/server/rute";

export const dynamic = "force-dynamic";

/** Foto situs per slot, dan apakah server bisa mengubah foto sendiri. */
export async function GET() {
  const a = await wajib("website");
  if (a instanceof Response) return a;
  return ok({ foto: await bacaPetaFoto(), sharp: Boolean(await muatSharp()) });
}

/**
 * Unggah foto untuk satu slot (multipart).
 *  - `slot` + `berkas`: foto asli, diubah di server.
 *  - `slot` + `klien=1` + `h` + `kbAsli` + `v<lebar>`: hasil yang sudah diubah browser.
 * Langsung tayang; foto lama di slot itu dihapus.
 */
export async function POST(req: Request) {
  const a = await wajib("website");
  if (a instanceof Response) return a;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return gagal("Unggahan tidak terbaca. Coba lagi.");
  }
  const slot = form.get("slot");
  if (!adaSlot(slot)) return gagal("Slot foto tidak dikenal.");
  try {
    let hasil;
    if (form.get("klien") === "1") {
      const berkas: { w: number; isi: Buffer }[] = [];
      for (const [k, v] of form.entries()) {
        const m = /^v(\d{2,4})$/.exec(k);
        if (m && typeof v !== "string") berkas.push({ w: Number(m[1]), isi: Buffer.from(await v.arrayBuffer()) });
      }
      hasil = await simpanHasilKlien(berkas, Number(form.get("h")) || 1, Number(form.get("kbAsli")) || 0);
    } else {
      const f = form.get("berkas");
      if (!f || typeof f === "string") return gagal("Pilih foto dulu.");
      if (f.size > MAKS_ASLI) return gagal("Foto terlalu besar (lebih dari 40 MB).");
      hasil = await olahFoto(Buffer.from(await f.arrayBuffer()));
    }
    const foto = await aturSlot(slot, () => ({ ...hasil, fokus: [50, 50] }));
    return ok({ foto });
  } catch (e) {
    const pesan = e instanceof Error ? e.message : String(e);
    if (pesan === "tanpa-sharp") return gagal("Server tidak bisa mengubah foto; ubah di browser.", 503, { kode: "tanpa-sharp" });
    console.error("[foto] gagal mengolah", e);
    return gagal(/foto|berkas|hasil|ukuran/i.test(pesan) ? pesan : "Foto tidak bisa diolah. Pakai JPG, PNG, WebP, atau AVIF.");
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
