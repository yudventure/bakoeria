import { tanggalSah, type PaymentKind, type PaymentMethod } from "@/lib/booking";
import { bolehCatat, lihatRupiah } from "@/lib/peran";
import { wajib } from "@/lib/server/akses";
import { hapusBayar, tambahBayar } from "@/lib/server/buku";
import { badan, gagal, ok, tanpaDb } from "@/lib/server/rute";

type Ctx = { params: Promise<{ id: string }> };
const KIND: PaymentKind[] = ["DEPOSIT", "BALANCE", "EXTRA", "REFUND"];
const METHOD: PaymentMethod[] = ["TRANSFER", "CASH", "EWALLET", "CARD", "OTA_PREPAID", "MIDTRANS"];

export async function POST(req: Request, ctx: Ctx) {
  const a = await wajib("pesanan");
  if (a instanceof Response) return a;
  if (!bolehCatat(a.peran) || !lihatRupiah(a.peran)) return gagal("Peran Anda tidak bisa mencatat pembayaran.", 403);
  const t = tanpaDb();
  if (t) return t;
  const { id } = await ctx.params;
  const o = await badan(req);
  const amount = Number(o.amount);
  if (!Number.isFinite(amount) || amount <= 0) return gagal("Isi jumlah pembayaran.");
  if (!KIND.includes(o.kind as PaymentKind)) return gagal("Pilih jenis pembayaran.");
  if (!METHOD.includes(o.method as PaymentMethod)) return gagal("Pilih cara bayar.");
  if (!tanggalSah(o.paidAt)) return gagal("Isi tanggal bayar.");
  const p = await tambahBayar(id, { amount, kind: o.kind as PaymentKind, method: o.method as PaymentMethod, paidAt: o.paidAt, reference: typeof o.reference === "string" ? o.reference : null }, a.nama);
  return ok({ pesanan: p }, 201);
}

export async function DELETE(req: Request, ctx: Ctx) {
  const a = await wajib("pesanan");
  if (a instanceof Response) return a;
  if (!["developer", "pemilik", "manajer", "keuangan"].includes(a.peran)) return gagal("Hanya pemilik, manajer, dan keuangan yang bisa menghapus pembayaran.", 403);
  const t = tanpaDb();
  if (t) return t;
  const { id } = await ctx.params;
  const pid = new URL(req.url).searchParams.get("pid");
  if (!pid) return gagal("Pembayaran tidak disebut.");
  return ok({ pesanan: await hapusBayar(id, pid, a.nama) });
}
