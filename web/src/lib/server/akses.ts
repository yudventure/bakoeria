import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { bolehLayar, type Layar } from "@/lib/peran";
import { SESSION_COOKIE, valid } from "@/lib/session";
import type { Akun } from "@/lib/server/akun";

export async function akunMasuk(): Promise<Akun | null> {
  const jar = await cookies();
  return valid(jar.get(SESSION_COOKIE)?.value);
}

/** Yang tidak berhak mendapat 404, bukan pengakuan bahwa rutenya ada. */
export const tidakAda = () => NextResponse.json({ galat: "Tidak ditemukan." }, { status: 404 });
export const galat = (pesan: string, status = 400) => NextResponse.json({ galat: pesan }, { status });

/** Akun yang masuk dan berhak atas layar itu, atau respons penolakan. */
export async function wajib(layar: Layar): Promise<Akun | NextResponse> {
  const a = await akunMasuk();
  if (!a) return NextResponse.json({ galat: "Sesi habis. Silakan masuk lagi." }, { status: 401 });
  if (!bolehLayar(a.peran, layar)) return tidakAda();
  return a;
}
