import { db } from "@/lib/db";
import { tanggalSah } from "@/lib/booking";
import { wajib } from "@/lib/server/akses";
import { ambilKamar, keTanggal } from "@/lib/server/buku";
import { badan, gagal, ok, tanpaDb } from "@/lib/server/rute";

const UBAH = ["developer", "pemilik", "manajer"];

export async function GET() {
  const a = await wajib("kamar");
  if (a instanceof Response) return a;
  const t = tanpaDb();
  if (t) return t;
  return ok({ kamar: await ambilKamar() });
}

function bacaKamar(o: Record<string, unknown>) {
  const name = typeof o.name === "string" ? o.name.trim().slice(0, 60) : "";
  if (!name) return { galat: "Isi nama kamar." };
  const baseRate = Number(o.baseRate);
  if (!Number.isFinite(baseRate) || baseRate < 0) return { galat: "Isi tarif per malam." };
  const int = (v: unknown, d: number) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : d);
  return {
    data: {
      name,
      roomType: typeof o.roomType === "string" ? o.roomType.trim().slice(0, 60) || null : null,
      capAdult: int(o.capAdult, 2),
      capChild: int(o.capChild, 0),
      baseRate,
      isActive: o.isActive !== false,
      inactiveReason: o.isActive === false && typeof o.inactiveReason === "string" ? o.inactiveReason.slice(0, 200) : null,
      sortOrder: int(o.sortOrder, 0),
    },
  };
}

/** Tambah kamar, atau tarif musiman bila badannya `{ musim: {...} }`. */
export async function POST(req: Request) {
  const a = await wajib("kamar");
  if (a instanceof Response) return a;
  if (!UBAH.includes(a.peran)) return gagal("Peran Anda tidak bisa mengubah kamar.", 403);
  const t = tanpaDb();
  if (t) return t;
  const o = await badan(req);
  if (o.musim && typeof o.musim === "object") {
    const m = o.musim as Record<string, unknown>;
    if (typeof m.roomId !== "string") return gagal("Pilih kamar.");
    if (!tanggalSah(m.dateFrom) || !tanggalSah(m.dateTo) || m.dateTo < m.dateFrom) return gagal("Isi rentang tanggal yang benar.");
    const rate = Number(m.rate);
    if (!Number.isFinite(rate) || rate < 0) return gagal("Isi tarif.");
    try {
      await db().seasonalRate.create({ data: { roomId: m.roomId, dateFrom: keTanggal(m.dateFrom), dateTo: keTanggal(m.dateTo), rate, label: typeof m.label === "string" ? m.label.slice(0, 60) : null } });
    } catch (e) {
      if (String(JSON.stringify(e, Object.getOwnPropertyNames(e ?? {}))).includes("23P01")) return gagal("Rentang itu tumpang tindih dengan tarif musiman lain untuk kamar ini.", 409);
      throw e;
    }
    return ok({ kamar: await ambilKamar() }, 201);
  }
  const r = bacaKamar(o);
  if ("galat" in r) return gagal(r.galat!);
  if (await db().room.findUnique({ where: { name: r.data.name } })) return gagal("Nama kamar itu sudah dipakai.", 409);
  await db().room.create({ data: r.data });
  return ok({ kamar: await ambilKamar() }, 201);
}

export async function PATCH(req: Request) {
  const a = await wajib("kamar");
  if (a instanceof Response) return a;
  if (!UBAH.includes(a.peran)) return gagal("Peran Anda tidak bisa mengubah kamar.", 403);
  const t = tanpaDb();
  if (t) return t;
  const o = await badan(req);
  if (typeof o.id !== "string") return gagal("Kamar tidak disebut.");
  const r = bacaKamar(o);
  if ("galat" in r) return gagal(r.galat!);
  const lain = await db().room.findUnique({ where: { name: r.data.name } });
  if (lain && lain.id !== o.id) return gagal("Nama kamar itu sudah dipakai.", 409);
  await db().room.update({ where: { id: o.id }, data: r.data });
  return ok({ kamar: await ambilKamar() });
}

/** Hapus kamar (`?id=`) atau tarif musiman (`?musim=`). Kamar dengan riwayat pesanan tidak bisa dihapus. */
export async function DELETE(req: Request) {
  const a = await wajib("kamar");
  if (a instanceof Response) return a;
  if (!UBAH.includes(a.peran)) return gagal("Peran Anda tidak bisa mengubah kamar.", 403);
  const t = tanpaDb();
  if (t) return t;
  const u = new URL(req.url).searchParams;
  const musim = u.get("musim");
  if (musim) {
    await db().seasonalRate.delete({ where: { id: musim } });
    return ok({ kamar: await ambilKamar() });
  }
  const id = u.get("id");
  if (!id) return gagal("Kamar tidak disebut.");
  const n = await db().booking.count({ where: { roomId: id } });
  if (n) return gagal(`Kamar ini punya ${n} pesanan. Nonaktifkan saja supaya riwayatnya tetap utuh.`, 409);
  await db().room.delete({ where: { id } });
  return ok({ kamar: await ambilKamar() });
}
