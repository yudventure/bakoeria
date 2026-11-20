import { wajib } from "@/lib/server/akses";
import { tarik, tarikYangBasi } from "@/lib/server/sinkron";
import { badan, ok, tanpaDb } from "@/lib/server/rute";

/** "Sinkronkan sekarang": satu sambungan (`{id}`) atau semuanya. */
export async function POST(req: Request) {
  const a = await wajib("kalender");
  if (a instanceof Response) return a;
  const t = tanpaDb();
  if (t) return t;
  const o = await badan(req);
  if (typeof o.id === "string") return ok({ hasil: [{ id: o.id, ...(await tarik(o.id)) }] });
  return ok({ hasil: await tarikYangBasi(o.semua === true ? 0 : 15) });
}
