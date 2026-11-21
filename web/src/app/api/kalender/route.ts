import { tambahHari, tanggalSah, hariIniWit } from "@/lib/booking";
import { lihatRupiah } from "@/lib/peran";
import { wajib } from "@/lib/server/akses";
import { ambilKamar, bersihkanTahanan, bookingDalam } from "@/lib/server/buku";
import { gagal, ok, sensor, tanpaDb } from "@/lib/server/rute";

/** Kamar dan booking dalam rentang [dari, sampai). Bawaan: 3 bulan mulai bulan lalu. */
export async function GET(req: Request) {
  const a = await wajib("kalender");
  if (a instanceof Response) return a;
  const t = tanpaDb();
  if (t) return t;
  const u = new URL(req.url).searchParams;
  const awalBulan = hariIniWit().slice(0, 8) + "01";
  const dari = tanggalSah(u.get("dari")) ? u.get("dari")! : tambahHari(awalBulan, -40);
  const sampai = tanggalSah(u.get("sampai")) ? u.get("sampai")! : tambahHari(awalBulan, 400);
  let kamar, pesanan;
  try {
    await bersihkanTahanan();
    [kamar, pesanan] = await Promise.all([ambilKamar(), bookingDalam(dari, sampai)]);
  } catch (e) {
    console.error("[kalender]", e);
    return gagal("Database tidak bisa dihubungi.", 503, { kode: "db-gagal" });
  }
  const rp = lihatRupiah(a.peran);
  return ok({
    dari,
    sampai,
    kamar: kamar.map((k) => (rp ? k : { ...k, baseRate: 0, musim: [] })),
    pesanan: pesanan.map((p) => sensor(p, a.peran)),
  });
}
