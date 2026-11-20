import { wajib } from "@/lib/server/akses";
import { badan, ok } from "@/lib/server/rute";
import { bacaPengaturan, simpanPengaturan } from "@/lib/server/simpanan";
import { databaseReady } from "@/lib/db";
import { emailSiap } from "@/lib/server/email";

/** Pengaturan resort, beserta pemeriksaan kesiapan server. */
export async function GET() {
  const a = await wajib("pengaturan");
  if (a instanceof Response) return a;
  return ok({
    pengaturan: await bacaPengaturan(),
    status: {
      database: databaseReady(),
      sessionSecret: Boolean(process.env.SESSION_SECRET?.trim()),
      penyiapanKunci: Boolean(process.env.PENYIAPAN_KUNCI?.trim()),
      email: emailSiap(),
      folderData: Boolean(process.env.BAKOERIA_DATA_DIR?.trim()),
    },
  });
}

export async function PUT(req: Request) {
  const a = await wajib("pengaturan");
  if (a instanceof Response) return a;
  const o = await badan(req);
  return ok({ pengaturan: await simpanPengaturan(o.pengaturan) });
}
