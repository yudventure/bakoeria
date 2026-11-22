import { STATUS, type Status } from "@/lib/booking";
import { totalDenganAnak } from "@/lib/booking";
import { bolehCatat } from "@/lib/peran";
import { wajib } from "@/lib/server/akses";
import { buatBooking, cariBooking, hargaOtomatis, type DataBooking } from "@/lib/server/buku";
import { bacaBooking, badan, gagal, jawabBentrok, ok, sensor, tanpaDb } from "@/lib/server/rute";

export async function GET(req: Request) {
  const a = await wajib("pesanan");
  if (a instanceof Response) return a;
  const t = tanpaDb();
  if (t) return t;
  const u = new URL(req.url).searchParams;
  const status = u.get("status") as Status | null;
  const hasil = await cariBooking({
    q: u.get("q") ?? undefined,
    status: status && STATUS.includes(status) ? status : "",
    dari: u.get("dari") ?? undefined,
    sampai: u.get("sampai") ?? undefined,
  });
  return ok({ pesanan: hasil.map((p) => sensor(p, a.peran)) });
}

/** Membuat satu pesanan, atau banyak sekaligus bila badannya `{ banyak: [...] }`. */
export async function POST(req: Request) {
  const a = await wajib("pesanan");
  if (a instanceof Response) return a;
  if (!bolehCatat(a.peran)) return gagal("Peran Anda tidak bisa mencatat pesanan.", 403);
  const t = tanpaDb();
  if (t) return t;
  const o = await badan(req);
  const daftar = Array.isArray(o.banyak) ? (o.banyak as Record<string, unknown>[]).slice(0, 50) : [o];
  const hasil: { ok: boolean; kode?: string; galat?: string }[] = [];
  for (const baris of daftar) {
    const r = bacaBooking(baris);
    if ("galat" in r) {
      hasil.push({ ok: false, galat: r.galat });
      continue;
    }
    const d = r.data as DataBooking;
    if (d.totalAmount == null && baris.hargaOtomatis !== false && d.channel !== "BLOCK") {
      const h = await hargaOtomatis(d.roomId, d.checkIn, d.checkOut);
      if (h) d.totalAmount = totalDenganAnak(h.total, d.paxChild ?? 0).total;
    }
    try {
      const p = await buatBooking(d, a.nama);
      hasil.push({ ok: true, kode: p.code });
      if (daftar.length === 1) return ok({ pesanan: sensor(p, a.peran) }, 201);
    } catch (e) {
      if (daftar.length === 1) return jawabBentrok(e);
      hasil.push({ ok: false, galat: e instanceof Error ? e.message : "Gagal menyimpan." });
    }
  }
  return ok({ hasil }, 207);
}
