import { databaseReady, kueri } from "@/lib/db";
import { htmlInvoice } from "@/lib/server/kabar-pesanan";
import { tokenSah } from "@/lib/server/midtrans";

/** Invoice pesanan sebagai halaman yang bisa dicetak atau disimpan PDF. Butuh token dari email tamu. */
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  if (!databaseReady()) return new Response("Not found", { status: 404 });
  const kode = (q.get("kode") ?? "").trim().toUpperCase();
  const id = (await kueri<{ id: string }>("SELECT id FROM bookings WHERE code = ?", [kode]))[0]?.id;
  if (!id || !(await tokenSah(id, q.get("t")))) return new Response("Not found", { status: 404 });
  const html = await htmlInvoice(id);
  if (!html) return new Response("Not found", { status: 404 });
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
