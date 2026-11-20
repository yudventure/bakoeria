import { jumlahMalam, MENEMPATI, tanggalSah, tumpang, hariIniWit } from "@/lib/booking";
import { databaseReady } from "@/lib/db";
import { ambilKamar, bookingDalam } from "@/lib/server/buku";
import { gagal, ok } from "@/lib/server/rute";
import { rincianHarga } from "@/lib/booking";

/** Kamar yang kosong untuk [masuk, keluar), dengan total harga. Tanpa data tamu. */
export async function GET(req: Request) {
  if (!databaseReady()) return gagal("Pemesanan online belum aktif. Hubungi kami lewat WhatsApp.", 503);
  const u = new URL(req.url).searchParams;
  const masuk = u.get("masuk");
  const keluar = u.get("keluar");
  if (!tanggalSah(masuk) || !tanggalSah(keluar) || keluar <= masuk) return gagal("Pilih tanggal tiba dan tanggal pulang.");
  if (masuk < hariIniWit()) return gagal("Tanggal tiba sudah lewat.");
  if (jumlahMalam(masuk, keluar) > 30) return gagal("Untuk menginap lebih dari 30 malam, hubungi kami langsung.");
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
