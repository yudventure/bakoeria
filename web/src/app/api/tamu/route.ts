import { bolehCatat, lihatRupiah } from "@/lib/peran";
import { wajib } from "@/lib/server/akses";
import { semuaTamu, ubahTamu } from "@/lib/server/buku";
import { badan, gagal, ok, tanpaDb } from "@/lib/server/rute";

export async function GET(req: Request) {
  const a = await wajib("tamu");
  if (a instanceof Response) return a;
  const t = tanpaDb();
  if (t) return t;
  const daftar = await semuaTamu(new URL(req.url).searchParams.get("q") ?? undefined);
  const rp = lihatRupiah(a.peran);
  return ok({ tamu: rp ? daftar : daftar.map((g) => ({ ...g, bookings: g.bookings.map((b) => ({ ...b, totalAmount: null })) })) });
}

export async function PATCH(req: Request) {
  const a = await wajib("tamu");
  if (a instanceof Response) return a;
  if (!bolehCatat(a.peran) && a.peran !== "dive") return gagal("Peran Anda tidak bisa mengubah data tamu.", 403);
  const t = tanpaDb();
  if (t) return t;
  const o = await badan(req);
  if (typeof o.id !== "string") return gagal("Tamu tidak disebut.");
  const s = (v: unknown, n = 200) => (typeof v === "string" ? v.trim().slice(0, n) || null : null);
  const name = s(o.name, 120);
  if (!name) return gagal("Isi nama tamu.");
  await ubahTamu(o.id, { name, phone: s(o.phone), email: s(o.email), origin: s(o.origin), diveCert: s(o.diveCert), notes: s(o.notes, 2000) });
  return ok({ diubah: true });
}
