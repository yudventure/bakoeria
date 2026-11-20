import { wajib } from "@/lib/server/akses";
import { badan, ok } from "@/lib/server/rute";
import { bacaKonten, simpanKonten } from "@/lib/server/simpanan";

/** Isi situs publik. Tersimpan di folder data dan langsung tayang. */
export async function GET() {
  const a = await wajib("website");
  if (a instanceof Response) return a;
  return ok({ konten: await bacaKonten() });
}

export async function PUT(req: Request) {
  const a = await wajib("website");
  if (a instanceof Response) return a;
  const o = await badan(req);
  return ok({ konten: await simpanKonten(o.konten) });
}
