import { cookies } from "next/headers";

import { cariAkun, cocokSandi, publik, ubahAkun } from "@/lib/server/akun";
import { badan, gagal, ok } from "@/lib/server/rute";
import { SESSION_COOKIE, terbitkan } from "@/lib/session";

/** Pembatas sederhana: lima kali salah per email per 15 menit. */
const salah = new Map<string, { n: number; sampai: number }>();

export async function POST(req: Request) {
  const o = await badan(req);
  const email = typeof o.email === "string" ? o.email.trim().toLowerCase() : "";
  const sandi = typeof o.sandi === "string" ? o.sandi : "";
  const catat = salah.get(email);
  if (catat && catat.sampai > Date.now() && catat.n >= 5) return gagal("Terlalu banyak percobaan. Coba lagi 15 menit lagi.", 429);
  const akun = await cariAkun(email);
  const benar = akun ? await cocokSandi(sandi, akun.sandi) : false;
  if (!akun || !benar || !akun.aktif) {
    const n = catat && catat.sampai > Date.now() ? catat.n + 1 : 1;
    salah.set(email, { n, sampai: Date.now() + 15 * 60000 });
    return gagal(akun && benar && !akun.aktif ? "Akun ini dinonaktifkan. Hubungi pemilik." : "Email atau kata sandi salah.", 401);
  }
  salah.delete(email);
  await ubahAkun((d) => d.map((a) => (a.email === akun.email ? { ...a, terakhirMasuk: new Date().toISOString() } : a)));
  const s = await terbitkan(akun);
  (await cookies()).set(SESSION_COOKIE, s.value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: s.maxAge });
  return ok({ akun: publik(akun) });
}
