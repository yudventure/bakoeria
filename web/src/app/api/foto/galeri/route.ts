import { adaGaleri, galeriDariSlot } from "@/lib/foto";
import { wajib } from "@/lib/server/akses";
import { bacaPetaFoto, ubahGaleri } from "@/lib/server/foto";
import { badan, gagal, ok } from "@/lib/server/rute";

export const dynamic = "force-dynamic";

/**
 * Atur isi galeri: { nama, kunci: [...] } menyusun ulang urutan dan sekaligus
 * membuang foto yang tidak ada di daftar. Foto unggahan yang dibuang dihapus dari server.
 */
export async function PUT(req: Request) {
  const a = await wajib("website");
  if (a instanceof Response) return a;
  const o = await badan(req);
  if (!adaGaleri(o.nama) || !Array.isArray(o.kunci)) return gagal("Galeri tidak dikenal.");
  const urutan = o.kunci.map(String);
  const galeri = await ubahGaleri(o.nama, (lama) => urutan.map((k) => lama.find((x) => x.kunci === k)).filter((x): x is NonNullable<typeof x> => Boolean(x)));
  return ok({ galeri });
}

/** Titik fokus satu foto galeri: { nama, kunci, fokus: [x, y] }. */
export async function PATCH(req: Request) {
  const a = await wajib("website");
  if (a instanceof Response) return a;
  const o = await badan(req);
  if (!adaGaleri(o.nama) || typeof o.kunci !== "string" || !Array.isArray(o.fokus)) return gagal("Data fokus tidak lengkap.");
  const [x, y] = (o.fokus as unknown[]).map((v) => Math.min(100, Math.max(0, Math.round(Number(v) || 50))));
  const galeri = await ubahGaleri(o.nama, (lama) => lama.map((it) => (it.kunci === o.kunci && it.foto ? { ...it, foto: { ...it.foto, fokus: [x, y] } } : it)));
  return ok({ galeri });
}

/** Kembalikan galeri ke susunan awal (lima foto bawaan atau foto slot lama): ?nama=menginap */
export async function DELETE(req: Request) {
  const a = await wajib("website");
  if (a instanceof Response) return a;
  const nama = new URL(req.url).searchParams.get("nama");
  if (!adaGaleri(nama)) return gagal("Galeri tidak dikenal.");
  const peta = await bacaPetaFoto();
  const galeri = await ubahGaleri(nama, () => galeriDariSlot(peta, nama));
  return ok({ galeri });
}
