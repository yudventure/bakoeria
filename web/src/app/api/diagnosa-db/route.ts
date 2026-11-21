import { akunMasuk, tidakAda } from "@/lib/server/akses";
import { diagnosaDb } from "@/lib/db";
import { ok } from "@/lib/server/rute";

/** Diagnosis koneksi database. Hanya untuk developer dan pemilik; tidak pernah memuat sandi. */
export async function GET() {
  const a = await akunMasuk();
  if (!a || !["developer", "pemilik"].includes(a.peran)) return tidakAda();
  return ok({ diagnosa: await diagnosaDb() });
}
