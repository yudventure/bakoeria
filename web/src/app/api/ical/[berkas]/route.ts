import { databaseReady } from "@/lib/db";
import { kalenderKeluar } from "@/lib/server/sinkron";

type Ctx = { params: Promise<{ berkas: string }> };

/** Kalender keluar untuk OTA. Publik; pengamannya token 32 heksadesimal di alamat. */
export async function GET(_req: Request, ctx: Ctx) {
  const { berkas } = await ctx.params;
  const token = berkas.replace(/\.ics$/, "");
  if (!/^[0-9a-f]{32}$/.test(token) || !databaseReady()) return new Response("Tidak ditemukan", { status: 404 });
  const isi = await kalenderKeluar(token);
  if (!isi) return new Response("Tidak ditemukan", { status: 404 });
  return new Response(isi, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" } });
}
