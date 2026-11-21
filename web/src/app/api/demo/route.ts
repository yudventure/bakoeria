import { akunMasuk, tidakAda } from "@/lib/server/akses";
import { DemoError, hapusDemo, isiDemo, statusDemo } from "@/lib/server/demo";
import { gagal, ok, tanpaDb } from "@/lib/server/rute";

/** Pasang atau hapus data demo. Hanya developer dan pemilik. */
async function boleh() {
  const a = await akunMasuk();
  return a && ["developer", "pemilik"].includes(a.peran) ? a : null;
}

export async function GET() {
  if (!(await boleh())) return tidakAda();
  return ok(await statusDemo());
}

export async function POST() {
  if (!(await boleh())) return tidakAda();
  const t = tanpaDb();
  if (t) return t;
  try {
    return ok({ ...(await isiDemo()), status: await statusDemo() }, 201);
  } catch (e) {
    if (e instanceof DemoError) return gagal(e.message, 409);
    throw e;
  }
}

export async function DELETE() {
  if (!(await boleh())) return tidakAda();
  const t = tanpaDb();
  if (t) return t;
  try {
    return ok({ ...(await hapusDemo()), status: await statusDemo() });
  } catch (e) {
    if (e instanceof DemoError) return gagal(e.message, 409);
    throw e;
  }
}
