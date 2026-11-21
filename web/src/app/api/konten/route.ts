import type { Bahasa } from "@/lib/kamus";
import { wajib } from "@/lib/server/akses";
import { badan, ok } from "@/lib/server/rute";
import { bacaKonten, simpanKonten } from "@/lib/server/simpanan";

const bahasaDari = (v: unknown): Bahasa => (v === "id" ? "id" : "en");

/** Isi situs publik per bahasa (?bahasa=en|id). Tersimpan di folder data dan langsung tayang. */
export async function GET(req: Request) {
  const a = await wajib("website");
  if (a instanceof Response) return a;
  return ok({ konten: await bacaKonten(bahasaDari(new URL(req.url).searchParams.get("bahasa"))) });
}

export async function PUT(req: Request) {
  const a = await wajib("website");
  if (a instanceof Response) return a;
  const o = await badan(req);
  return ok({ konten: await simpanKonten(bahasaDari(o.bahasa), o.konten) });
}
