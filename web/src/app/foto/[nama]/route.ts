import { bacaBerkasFoto } from "@/lib/server/foto";

export const dynamic = "force-dynamic";

/** Sajikan foto unggahan dari folder data. Nama berkas unik per unggahan, jadi boleh di-cache selamanya. */
export async function GET(_req: Request, { params }: { params: Promise<{ nama: string }> }) {
  const f = await bacaBerkasFoto((await params).nama);
  if (!f) return new Response("Tidak ditemukan", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(new Uint8Array(f.isi), {
    headers: { "Content-Type": f.jenis, "Content-Length": String(f.isi.length), "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
