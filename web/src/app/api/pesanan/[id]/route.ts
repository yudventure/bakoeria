import { bolehCatat } from "@/lib/peran";
import { wajib } from "@/lib/server/akses";
import { hapusBooking, riwayat, satuBooking, ubahBooking } from "@/lib/server/buku";
import { kirimEmailTerkonfirmasi } from "@/lib/server/kabar-pesanan";
import { konfigMidtrans } from "@/lib/server/midtrans";
import { bacaBooking, badan, gagal, jawabBentrok, ok, sensor, tanpaDb } from "@/lib/server/rute";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const a = await wajib("pesanan");
  if (a instanceof Response) return a;
  const t = tanpaDb();
  if (t) return t;
  const { id } = await ctx.params;
  const p = await satuBooking(id);
  if (!p) return gagal("Pesanan tidak ditemukan.", 404);
  return ok({ pesanan: sensor(p, a.peran), riwayat: await riwayat(id) });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const a = await wajib("pesanan");
  if (a instanceof Response) return a;
  if (!bolehCatat(a.peran)) return gagal("Peran Anda tidak bisa mengubah pesanan.", 403);
  const t = tanpaDb();
  if (t) return t;
  const { id } = await ctx.params;
  const r = bacaBooking(await badan(req), true);
  if ("galat" in r) return gagal(r.galat);
  try {
    const sebelum = r.data.status === "CONFIRMED" ? await satuBooking(id) : null;
    const baru = await ubahBooking(id, r.data, a.nama);
    /* Pesanan dari website yang dikonfirmasi admin: tamu otomatis menerima email konfirmasi. */
    if (sebelum && sebelum.status === "TENTATIVE" && baru.status === "CONFIRMED" && baru.source === "WEBSITE" && baru.guest?.email) {
      await kirimEmailTerkonfirmasi(id, Boolean(await konfigMidtrans())).catch((e) => console.error("[pesanan] email konfirmasi gagal", e));
    }
    return ok({ pesanan: sensor(baru, a.peran) });
  } catch (e) {
    return jawabBentrok(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const a = await wajib("pesanan");
  if (a instanceof Response) return a;
  if (!["developer", "pemilik", "manajer"].includes(a.peran)) return gagal("Hanya pemilik dan manajer yang bisa menghapus pesanan. Gunakan status Batal.", 403);
  const t = tanpaDb();
  if (t) return t;
  const { id } = await ctx.params;
  await hapusBooking(id, a.nama);
  return ok({ dihapus: true });
}
