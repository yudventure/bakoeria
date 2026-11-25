import { cookies } from "next/headers";
import { publik, rapikanEmail, SANDI_MIN } from "@/lib/server/akun";
import { gantiDenganKode } from "@/lib/server/reset-sandi";
import { badan, gagal, ok } from "@/lib/server/rute";
import { SESSION_COOKIE, terbitkan } from "@/lib/session";

/** Ganti kata sandi dengan kode dari email, lalu langsung masuk. */
export async function POST(req: Request) {
  const o = await badan(req);
  const email = rapikanEmail(o.email);
  const kode = typeof o.kode === "string" ? o.kode : "";
  const sandi = typeof o.sandi === "string" ? o.sandi : "";
  if (!/^\d{6}$/.test(kode.replace(/\s/g, ""))) return gagal("Kode terdiri dari 6 angka.");
  if (sandi.length < SANDI_MIN) return gagal(`Kata sandi baru minimal ${SANDI_MIN} karakter.`);
  const h = await gantiDenganKode(email, kode.replace(/\s/g, ""), sandi);
  if (!h.ok) return gagal(h.pesan, 400);
  const s = await terbitkan(h.akun);
  (await cookies()).set(SESSION_COOKIE, s.value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: s.maxAge });
  return ok({ akun: publik(h.akun) });
}
