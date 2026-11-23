import { wajib } from "@/lib/server/akses";
import { MAKS_BAGIAN, simpanBagian } from "@/lib/server/foto";
import { gagal, ok } from "@/lib/server/rute";

export const dynamic = "force-dynamic";

/** Satu ukuran foto yang sudah diubah browser (multipart: id, w, jenis, berkas). Aman diulang. */
export async function POST(req: Request) {
  const a = await wajib("website");
  if (a instanceof Response) return a;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return gagal("Unggahan terputus. Mengulang…", 400, { ulang: true });
  }
  const berkas = form.get("berkas");
  if (!berkas || typeof berkas === "string") return gagal("Berkas foto tidak ada.");
  if (berkas.size > MAKS_BAGIAN) return gagal("Berkas terlalu besar.");
  try {
    await simpanBagian(String(form.get("id")), Number(form.get("w")), form.get("jenis") === "jpg" ? "jpg" : "webp", Buffer.from(await berkas.arrayBuffer()));
    return ok({ ok: true });
  } catch (e) {
    console.error("[foto] bagian gagal disimpan", e);
    return gagal(e instanceof Error && /tidak|bukan/.test(e.message) ? e.message : "Penyimpanan di server gagal. Mengulang…", e instanceof Error && /tidak|bukan/.test(e.message) ? 400 : 500);
  }
}
