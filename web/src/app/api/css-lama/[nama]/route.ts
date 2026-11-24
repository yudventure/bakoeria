import { promises as fs } from "node:fs";
import path from "node:path";
import { bukaLayer } from "@/lib/buka-layer";

/**
 * CSS situs tanpa @layer, untuk Safari sebelum 15.4 (iPhone lama) yang membuang
 * semua aturan di dalam @layer. Dibuat dari CSS hasil build yang sama, sekali per
 * proses. Nama berkas memuat sidik isinya, jadi aman disimpan lama oleh peramban.
 * Lewat route ini karena Hostinger hanya menyajikan berkas statis yang ada saat build.
 */
const simpanan = new Map<string, string>();

export async function GET(_req: Request, { params }: { params: Promise<{ nama: string }> }) {
  const { nama } = await params;
  if (!/^[a-z0-9]{8,32}\.css$/.test(nama)) return new Response("Not Found", { status: 404 });
  let css = simpanan.get(nama);
  if (css === undefined) {
    try {
      css = bukaLayer(await fs.readFile(/*turbopackIgnore: true*/ path.join(process.cwd(), ".next", "static", "css", nama), "utf8"));
    } catch {
      return new Response("Not Found", { status: 404 });
    }
    simpanan.set(nama, css);
  }
  return new Response(css, { headers: { "Content-Type": "text/css; charset=utf-8", "Cache-Control": "public, max-age=31536000, immutable" } });
}
