import { headers } from "next/headers";
import { emailSah, rapikanEmail } from "@/lib/server/akun";
import { kirimKode } from "@/lib/server/reset-sandi";
import { badan, gagal, ok } from "@/lib/server/rute";

/** Minta kode reset kata sandi. Paling banyak 5 permintaan per alamat IP per jam. */
const jejak = new Map<string, number[]>();
export async function POST(req: Request) {
  const ip = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim() || "lokal";
  const kini = Date.now();
  const daftar = (jejak.get(ip) ?? []).filter((t) => kini - t < 3600000);
  if (daftar.length >= 5) return gagal("Terlalu banyak permintaan. Coba lagi sejam lagi.", 429);
  jejak.set(ip, [...daftar, kini]);
  const email = rapikanEmail((await badan(req)).email);
  if (!emailSah(email)) return gagal("Isi alamat email akun Anda.");
  const h = await kirimKode(email);
  if (!h.ok && h.alasan === "email") return gagal("Pengiriman email belum dipasang di server, jadi kode tidak bisa dikirim. Minta pemilik atau developer mengganti kata sandi Anda dari menu Pengguna.", 503);
  if (!h.ok && h.alasan === "jeda") return gagal(`Kode baru saja dikirim. Tunggu ${h.tunggu} detik sebelum meminta lagi.`, 429);
  return ok({ terkirim: true });
}
