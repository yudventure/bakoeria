import { akunMasuk } from "@/lib/server/akses";
import { cocokSandi, hashSandi, publik, SANDI_MIN, ubahAkun } from "@/lib/server/akun";
import { badan, gagal, ok } from "@/lib/server/rute";

export async function GET() {
  const a = await akunMasuk();
  return a ? ok({ akun: publik(a) }) : gagal("Belum masuk.", 401);
}

/** Mengganti kata sandi sendiri. Versi naik, jadi sesi di perangkat lain keluar. */
export async function PATCH(req: Request) {
  const a = await akunMasuk();
  if (!a) return gagal("Belum masuk.", 401);
  const o = await badan(req);
  if (typeof o.lama !== "string" || !(await cocokSandi(o.lama, a.sandi))) return gagal("Kata sandi lama salah.", 403);
  if (typeof o.baru !== "string" || o.baru.length < SANDI_MIN) return gagal(`Kata sandi baru minimal ${SANDI_MIN} karakter.`);
  const sandi = await hashSandi(o.baru);
  await ubahAkun((d) => d.map((x) => (x.email === a.email ? { ...x, sandi, versi: x.versi + 1 } : x)));
  return ok({ diganti: true });
}
