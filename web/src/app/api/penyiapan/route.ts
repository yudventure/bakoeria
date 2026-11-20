import { cookies } from "next/headers";

import { emailSah, hashSandi, publik, rapikanEmail, SANDI_MIN, semuaAkun, ubahAkun } from "@/lib/server/akun";
import { badan, gagal, ok } from "@/lib/server/rute";
import { SESSION_COOKIE, samaString, terbitkan } from "@/lib/session";

/** Apakah dashboard masih perlu akun pertama. */
export async function GET() {
  const kosong = (await semuaAkun()).length === 0;
  return ok({ perlu: kosong, kunciAda: Boolean(process.env.PENYIAPAN_KUNCI?.trim()) });
}

/** Membuat akun developer pertama. Hanya bisa sekali, dan hanya dengan PENYIAPAN_KUNCI. */
export async function POST(req: Request) {
  const kunci = process.env.PENYIAPAN_KUNCI?.trim();
  if (!kunci) return gagal("PENYIAPAN_KUNCI belum diisi di panel Node.js Hostinger.", 503);
  if ((await semuaAkun()).length) return gagal("Akun pertama sudah ada. Masuk dengan email dan kata sandi.", 409);
  const o = await badan(req);
  if (typeof o.kunci !== "string" || !samaString(o.kunci, kunci)) return gagal("Kunci penyiapan salah.", 403);
  const email = rapikanEmail(o.email);
  const nama = typeof o.nama === "string" ? o.nama.trim().slice(0, 80) : "";
  const sandi = typeof o.sandi === "string" ? o.sandi : "";
  if (!nama) return gagal("Isi nama.");
  if (!emailSah(email)) return gagal("Email tidak sah.");
  if (sandi.length < SANDI_MIN) return gagal(`Kata sandi minimal ${SANDI_MIN} karakter.`);
  const akun = { email, nama, peran: "developer" as const, aktif: true, sandi: await hashSandi(sandi), versi: 1, dibuat: new Date().toISOString() };
  let sudahAda = false;
  await ubahAkun((d) => {
    if (d.length) {
      sudahAda = true;
      return d;
    }
    return [akun];
  });
  if (sudahAda) return gagal("Akun pertama sudah ada.", 409);
  const s = await terbitkan(akun);
  (await cookies()).set(SESSION_COOKIE, s.value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: s.maxAge });
  return ok({ akun: publik(akun) }, 201);
}
