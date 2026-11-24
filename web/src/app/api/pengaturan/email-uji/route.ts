import { wajib } from "@/lib/server/akses";
import { alamatSaja, pengirim, ujiEmail } from "@/lib/server/email";
import { gagal, ok } from "@/lib/server/rute";
import { bacaPengaturan } from "@/lib/server/simpanan";

/** Kirim email uji ke alamat pemberitahuan pesanan (atau ke pengirim bila kosong). */
export async function POST() {
  const a = await wajib("pengaturan");
  if (a instanceof Response) return a;
  const ke = (await bacaPengaturan()).emailNotifikasi || alamatSaja(pengirim());
  const h = await ujiEmail(ke);
  return h.ok ? ok({ ke, jalur: h.jalur }) : gagal(h.galat, 502);
}
