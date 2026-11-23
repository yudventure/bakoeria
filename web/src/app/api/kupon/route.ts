import { wajib } from "@/lib/server/akses";
import { bacaIsianKupon, daftarKupon, hapusKupon, KodeDipakaiError, simpanKupon } from "@/lib/server/kupon";
import { badan, gagal, ok, tanpaDb } from "@/lib/server/rute";

const UBAH = ["developer", "pemilik", "manajer"];

async function izin() {
  const a = await wajib("kamar");
  if (a instanceof Response) return a;
  if (!UBAH.includes(a.peran)) return gagal("Peran Anda tidak bisa mengatur kupon.", 403);
  return tanpaDb();
}

/** Daftar kupon diskon beserta jumlah pemakaiannya. */
export async function GET() {
  const t = await izin();
  if (t) return t;
  return ok({ kupon: await daftarKupon() });
}

/** Buat kupon (tanpa id) atau ubah kupon (dengan id). */
export async function POST(req: Request) {
  const t = await izin();
  if (t) return t;
  const o = await badan(req);
  const r = bacaIsianKupon(o);
  if ("galat" in r) return gagal(r.galat);
  try {
    await simpanKupon(typeof o.id === "string" && o.id ? o.id : null, r.data);
  } catch (e) {
    if (e instanceof KodeDipakaiError) return gagal(`Kode ${r.data.kode} sudah dipakai kupon lain.`, 409);
    throw e;
  }
  return ok({ kupon: await daftarKupon() });
}

/** Hapus kupon ?id=. Kupon yang sudah dipakai pesanan dinonaktifkan saja. */
export async function DELETE(req: Request) {
  const t = await izin();
  if (t) return t;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return gagal("Kupon tidak disebut.");
  const hasil = await hapusKupon(id);
  return ok({ hasil, kupon: await daftarKupon() });
}
