import { databaseReady, db } from "@/lib/db";

/** Pemeriksaan hidup untuk monitor. Tidak membuka data apa pun. */
export async function GET() {
  let database: "ok" | "tidak-diisi" | "gagal" = databaseReady() ? "ok" : "tidak-diisi";
  if (database === "ok") {
    try {
      await db().$queryRaw`SELECT 1`;
    } catch {
      database = "gagal";
    }
  }
  return Response.json({ ok: true, database }, { headers: { "Cache-Control": "no-store" } });
}
