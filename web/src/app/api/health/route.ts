import { cekDb } from "@/lib/db";

/** Pemeriksaan hidup untuk monitor. Tidak membuka data apa pun. */
export async function GET() {
  return Response.json({ ok: true, database: await cekDb() }, { headers: { "Cache-Control": "no-store" } });
}
