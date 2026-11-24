import { headers } from "next/headers";
import { sisaTagihan } from "@/lib/booking";
import { databaseReady, kueri } from "@/lib/db";
import { satuBooking } from "@/lib/server/buku";
import { buatTransaksi, GalatMidtrans, konfigMidtrans, orderIdDari, tokenSah } from "@/lib/server/midtrans";
import { badan, gagal, ok } from "@/lib/server/rute";

/**
 * Tamu membayar pesanannya lewat Midtrans: total penuh (tanpa uang muka), dikurangi yang
 * sudah dibayar. Butuh kode pesanan dan token yang hanya diberikan ke tamu yang membuatnya.
 * Mengembalikan alamat halaman bayar Midtrans.
 */
export async function POST(req: Request) {
  const o = await badan(req);
  const en = o.bahasa !== "id";
  const m = (id: string, ing: string) => (en ? ing : id);
  const k = await konfigMidtrans();
  if (!k || !databaseReady()) return gagal(m("Pembayaran online belum aktif. Hubungi kami lewat WhatsApp.", "Online payment is not available yet. Please contact us on WhatsApp."), 503);
  const kode = typeof o.kode === "string" ? o.kode.trim().toUpperCase() : "";
  const id = (await kueri<{ id: string }>("SELECT id FROM bookings WHERE code = ?", [kode]))[0]?.id;
  if (!id || !(await tokenSah(id, o.token))) return gagal(m("Pesanan tidak ditemukan.", "Booking not found."), 404);
  const p = await satuBooking(id);
  if (!p || !["TENTATIVE", "CONFIRMED"].includes(p.status)) return gagal(m("Pesanan ini sudah tidak aktif. Hubungi kami lewat WhatsApp.", "This booking is no longer active. Please contact us on WhatsApp."), 409);
  const sisa = sisaTagihan(p.totalAmount, p.payments).sisa ?? 0;
  if (sisa <= 0) return gagal(m("Pesanan ini sudah lunas.", "This booking is already paid."), 409);
  /* Halaman bayar berlaku selama tahanan masih berjalan (paling lama 24 jam). */
  const batasMenit = p.status === "TENTATIVE" && p.holdExpiresAt ? Math.min(1440, (Date.parse(p.holdExpiresAt) - Date.now()) / 60000) : 1440;
  if (batasMenit < 15) return gagal(m("Waktu tahanan pesanan ini hampir habis. Hubungi kami lewat WhatsApp.", "The hold on this booking is about to expire. Please contact us on WhatsApp."), 409);
  const h = await headers();
  const asal = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  try {
    const tautan = await buatTransaksi(k, {
      orderId: orderIdDari(p.code),
      jumlah: Math.round(sisa),
      nama: `${p.roomName}, ${p.checkIn} ${p.checkOut}`,
      idBarang: p.code,
      tamu: { nama: p.guest?.name ?? "Tamu", telepon: p.guest?.phone, email: p.guest?.email },
      selesai: `${asal}${en ? "/" : "/id"}?bayar=${encodeURIComponent(p.code)}#pesan`,
      batasMenit,
    });
    return ok({ tautan, jumlah: Math.round(sisa) });
  } catch (e) {
    return gagal(e instanceof GalatMidtrans ? e.message : m("Halaman pembayaran belum bisa dibuat.", "The payment page could not be opened."), 502);
  }
}
