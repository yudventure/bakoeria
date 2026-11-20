import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

import { cariAkun, type Akun } from "@/lib/server/akun";
import { rahasiaSesi } from "@/lib/server/gudang";

/**
 * Cookie sesi dashboard: email, versi sandi, dan batas waktu, ditandatangani
 * HMAC. Tiap pemeriksaan membuka akunnya lagi, jadi akun yang dinonaktifkan
 * atau berganti sandi langsung keluar tanpa menunggu cookie kedaluwarsa.
 */
export const SESSION_COOKIE = "bakoeria_session";
const TTL_SECONDS = 60 * 60 * 10;

async function tandai(isi: string) {
  return createHmac("sha256", await rahasiaSesi()).update(isi).digest("hex");
}

export function samaString(a: string, b: string) {
  const kiri = Buffer.from(a);
  const kanan = Buffer.from(b);
  if (kiri.length !== kanan.length) {
    timingSafeEqual(kiri, kiri);
    return false;
  }
  return timingSafeEqual(kiri, kanan);
}

export async function terbitkan(akun: Pick<Akun, "email" | "versi">) {
  const habis = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const isi = Buffer.from(JSON.stringify({ e: akun.email, v: akun.versi, x: habis })).toString("base64url");
  return { value: `${isi}.${await tandai(isi)}`, maxAge: TTL_SECONDS };
}

export async function valid(cookie: string | undefined): Promise<Akun | null> {
  if (!cookie) return null;
  const [isi, tanda] = cookie.split(".");
  if (!isi || !tanda) return null;
  if (!samaString(tanda, await tandai(isi))) return null;
  let o: { e?: unknown; v?: unknown; x?: unknown };
  try {
    o = JSON.parse(Buffer.from(isi, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof o.e !== "string" || typeof o.x !== "number") return null;
  if (o.x <= Math.floor(Date.now() / 1000)) return null;
  const akun = await cariAkun(o.e);
  if (!akun || !akun.aktif || akun.versi !== o.v) return null;
  return akun;
}
