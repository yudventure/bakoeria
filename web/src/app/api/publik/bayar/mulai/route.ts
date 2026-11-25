import { sisaTagihan } from "@/lib/booking";
import { databaseReady, kueri } from "@/lib/db";
import { satuBooking } from "@/lib/server/buku";
import { asalSitus } from "@/lib/server/kabar-pesanan";
import { buatTransaksi, konfigMidtrans, orderIdDari, tokenSah } from "@/lib/server/midtrans";

/**
 * Tombol "Bayar sekarang" di email: membuat transaksi Snap baru untuk sisa tagihan,
 * lalu mengalihkan tamu ke halaman bayar Midtrans. Bila tidak bisa (sudah lunas,
 * tahanan habis, Midtrans mati), tamu dibawa ke formulir pesan di situs.
 */
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const en = q.get("bahasa") !== "id";
  const asal = await asalSitus();
  const situs = (s: string) => Response.redirect(`${asal}${en ? "/" : "/id"}?bayar=${encodeURIComponent(q.get("kode") ?? "")}&transaction_status=${s}#pesan`, 302);
  const k = await konfigMidtrans();
  if (!k || !databaseReady()) return situs("gagal");
  const kode = (q.get("kode") ?? "").trim().toUpperCase();
  const id = (await kueri<{ id: string }>("SELECT id FROM bookings WHERE code = ?", [kode]))[0]?.id;
  if (!id || !(await tokenSah(id, q.get("t")))) return new Response("Not found", { status: 404 });
  const p = await satuBooking(id);
  if (!p) return new Response("Not found", { status: 404 });
  const sisa = sisaTagihan(p.totalAmount, p.payments).sisa ?? 0;
  if (sisa <= 0) return situs("settlement");
  if (!["TENTATIVE", "CONFIRMED"].includes(p.status)) return situs("gagal");
  const batasMenit = p.status === "TENTATIVE" && p.holdExpiresAt ? Math.min(1440, (Date.parse(p.holdExpiresAt) - Date.now()) / 60000) : 1440;
  if (batasMenit < 15) return situs("gagal");
  try {
    const tautan = await buatTransaksi(k, { orderId: orderIdDari(p.code), jumlah: Math.round(sisa), nama: `${p.roomName}, ${p.checkIn} ${p.checkOut}`, idBarang: p.code, tamu: { nama: p.guest?.name ?? "Tamu", telepon: p.guest?.phone, email: p.guest?.email }, selesai: `${asal}${en ? "/" : "/id"}?bayar=${encodeURIComponent(p.code)}#pesan`, batasMenit });
    return Response.redirect(tautan, 302);
  } catch {
    return situs("gagal");
  }
}
