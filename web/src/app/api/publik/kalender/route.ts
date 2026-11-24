import { hariIniWit, malam as malamDalam, MENEMPATI, tambahHari } from "@/lib/booking";
import { databaseReady } from "@/lib/db";
import { ambilKamar, bookingDalam } from "@/lib/server/buku";
import { gagal, ok } from "@/lib/server/rute";

export const dynamic = "force-dynamic";
/** Hari yang dicakup kalender ketersediaan di situs, dari hari ini. */
const HARI_KALENDER = 400;

/**
 * Kalender ketersediaan untuk situs: berapa cottage aktif, dan untuk tiap malam yang
 * tidak semua cottagenya kosong, berapa yang masih kosong. Tanpa nama tamu atau kode.
 * Tahanan (TENTATIVE) ikut menutup, sama dengan pemeriksaan ketersediaan.
 */
export async function GET() {
  if (!databaseReady()) return gagal("Belum aktif.", 503);
  const dari = hariIniWit();
  const sampai = tambahHari(dari, HARI_KALENDER);
  const [kamar, pesanan] = await Promise.all([ambilKamar(false), bookingDalam(dari, sampai)]);
  const aktif = new Set(kamar.map((k) => k.id));
  const terisi: Record<string, Set<string>> = {};
  for (const p of pesanan) {
    if (!(MENEMPATI.includes(p.status) || p.status === "TENTATIVE") || !aktif.has(p.roomId)) continue;
    for (const d of malamDalam(p.checkIn < dari ? dari : p.checkIn, p.checkOut > sampai ? sampai : p.checkOut)) (terisi[d] ??= new Set()).add(p.roomId);
  }
  const sisa = Object.fromEntries(Object.entries(terisi).map(([d, s]) => [d, Math.max(0, aktif.size - s.size)]));
  return ok({ dari, sampai, unit: aktif.size, sisa });
}
