import "server-only";
import { headers } from "next/headers";
import { nomorTampil, nomorWa } from "@/lib/konten";
import { satuBooking } from "./buku";
import { alamatSaja, kirimEmail, pengirim } from "./email";
import { bacaRincian, emailLunas, emailTerkonfirmasi, halamanInvoice, type Bayaran, type DataEmail } from "./email-tamu";
import { tokenBayar } from "./midtrans";
import { bacaKonten, bacaPengaturan } from "./simpanan";
import { LABEL_METHOD, sisaTagihan } from "@/lib/booking";

/** Alamat situs untuk tautan di email: SITE_URL, atau host permintaan ini. */
export async function asalSitus(): Promise<string> {
  const env = process.env.SITE_URL?.trim();
  if (env) return env.replace(/\/+$/, "");
  try { const h = await headers(); return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`; } catch { return "https://bakoeria.com"; }
}

/** Kontak di kaki email, dari isi situs (Website, Kontak). */
export async function kontakEmail(en: boolean) {
  const k = (await bacaKonten(en ? "en" : "id")).kontak;
  return { wa: nomorWa(k.whatsapp), waTampil: nomorTampil(k.whatsapp), email: k.email, alamat: k.alamat };
}

/** Data email dari satu pesanan. Bahasa tamu dari rincian, atau dari catatan pesanan lama. */
export async function dataEmailPesanan(id: string): Promise<{ data: DataEmail; bayar: Bayaran[]; lunas: boolean } | null> {
  const p = await satuBooking(id);
  if (!p) return null;
  const rincian = await bacaRincian(id);
  const en = rincian ? rincian.en : !/Bahasa situs: Indonesia/.test(p.notes ?? "");
  const set = await bacaPengaturan();
  const bayar: Bayaran[] = p.payments.filter((x) => x.kind !== "REFUND").map((x) => {
    const ref = x.reference ?? "";
    return { jumlah: x.amount, tanggal: x.paidAt, cara: x.method === "MIDTRANS" ? `Midtrans${/· ([a-z_]+)$/.exec(ref)?.[1] ? ` (${/· ([a-z_]+)$/.exec(ref)![1].replace(/_/g, " ")})` : ""}` : LABEL_METHOD[x.method], idTransaksi: x.method === "MIDTRANS" ? ref.split(" · ")[1] ?? "" : "" };
  });
  const sisa = sisaTagihan(p.totalAmount, p.payments).sisa ?? 0;
  return {
    data: { asal: await asalSitus(), kontak: await kontakEmail(en), namaResort: set.namaResort, kode: p.code, nama: p.guest?.name ?? "", email: p.guest?.email ?? "", telepon: p.guest?.phone ?? "", cottage: p.roomName, masuk: p.checkIn, keluar: p.checkOut, total: p.totalAmount ?? 0, rincian, en },
    bayar,
    lunas: sisa <= 0 && bayar.length > 0,
  };
}

/** Alamat invoice yang bisa dicetak, dan alamat yang langsung membuka pembayaran Midtrans. */
export async function tautanPesanan(id: string, kode: string, asal: string, en: boolean) {
  const t = await tokenBayar(id);
  return { invoice: `${asal}/api/publik/invoice?kode=${encodeURIComponent(kode)}&t=${t}`, bayar: `${asal}/api/publik/bayar/mulai?kode=${encodeURIComponent(kode)}&t=${t}&bahasa=${en ? "en" : "id"}` };
}

/** Pembayaran lunas: email invoice ke tamu. */
export async function kirimEmailLunas(id: string) {
  const d = await dataEmailPesanan(id);
  if (!d?.data.email) return false;
  const { invoice } = await tautanPesanan(id, d.data.kode, d.data.asal, d.data.en);
  const e = emailLunas(d.data, d.bayar, invoice);
  return kirimEmail(d.data.email, e.subjek, e.teks, alamatSaja(pengirim()) || undefined, e.html);
}

/** Admin mengonfirmasi pesanan website: email konfirmasi ke tamu. */
export async function kirimEmailTerkonfirmasi(id: string, midtransAktif: boolean) {
  const d = await dataEmailPesanan(id);
  if (!d?.data.email) return false;
  const { bayar } = await tautanPesanan(id, d.data.kode, d.data.asal, d.data.en);
  const e = emailTerkonfirmasi(d.data, { sudahLunas: d.lunas, bayar: midtransAktif ? bayar : "" });
  return kirimEmail(d.data.email, e.subjek, e.teks, alamatSaja(pengirim()) || undefined, e.html);
}

export async function htmlInvoice(id: string) {
  const d = await dataEmailPesanan(id);
  return d ? halamanInvoice(d.data, d.bayar) : null;
}
