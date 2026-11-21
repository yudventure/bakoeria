import { jumlahMalam, MENEMPATI, tanggalSah, tumpang, hariIniWit } from "@/lib/booking";
import { databaseReady } from "@/lib/db";
import { ambilKamar, bookingDalam } from "@/lib/server/buku";
import { gagal, ok } from "@/lib/server/rute";
import { rincianHarga } from "@/lib/booking";

/** Kamar yang kosong untuk [masuk, keluar), dengan total harga. Tanpa data tamu. */
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const en = u.get("bahasa") !== "id";
  const m = (id: string, ing: string) => (en ? ing : id);
  if (!databaseReady()) return gagal(m("Pemesanan online belum aktif. Hubungi kami lewat WhatsApp.", "Online booking is not open yet. Please contact us on WhatsApp."), 503);
  const masuk = u.get("masuk");
  const keluar = u.get("keluar");
  if (!tanggalSah(masuk) || !tanggalSah(keluar) || keluar <= masuk) return gagal(m("Pilih tanggal tiba dan tanggal pulang.", "Choose your arrival and departure dates."));
  if (masuk < hariIniWit()) return gagal(m("Tanggal tiba sudah lewat.", "That arrival date has already passed."));
  if (jumlahMalam(masuk, keluar) > 30) return gagal(m("Untuk menginap lebih dari 30 malam, hubungi kami langsung.", "For stays longer than 30 nights, please contact us directly."));
  const [kamar, pesanan] = await Promise.all([ambilKamar(false), bookingDalam(masuk, keluar)]);
  const terisi = new Set(pesanan.filter((p) => MENEMPATI.includes(p.status) || p.status === "TENTATIVE").filter((p) => tumpang(p.checkIn, p.checkOut, masuk, keluar)).map((p) => p.roomId));
  return ok({
    malam: jumlahMalam(masuk, keluar),
    kamar: kamar.map((k) => ({
      id: k.id,
      nama: k.name,
      tipe: k.roomType,
      kapasitas: k.capAdult + k.capChild,
      tersedia: !terisi.has(k.id),
      total: rincianHarga(masuk, keluar, k.baseRate, k.musim).total,
    })),
  });
}
