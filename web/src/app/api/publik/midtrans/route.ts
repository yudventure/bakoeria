import { hariIniWit, rupiah } from "@/lib/booking";
import { databaseReady, kueri } from "@/lib/db";
import { BentrokError, satuBooking, tambahBayar, ubahBooking } from "@/lib/server/buku";
import { alamatSaja, kirimEmail, pengirim } from "@/lib/server/email";
import { catatKabar, kodeDariOrder, konfigMidtrans, lunas, statusTransaksi, tandaTanganSah } from "@/lib/server/midtrans";
import { bacaPengaturan } from "@/lib/server/simpanan";
import { asalSitus, kirimEmailLunas, kontakEmail } from "@/lib/server/kabar-pesanan";
import { deretTombol, esc, kepala, kerangka, kotak, ringkasan, tombol, WARNA } from "@/lib/server/email-kerangka";

/**
 * Payment Notification URL Midtrans (Dashboard, Settings, Payment, Notification URL):
 * https://bakoeria.com/api/publik/midtrans
 *
 * Tanda tangan diperiksa dengan Signature Secret Key, lalu status transaksi ditanyakan ulang
 * ke Midtrans. Pembayaran lunas dicatat sekali per order_id (metode Midtrans, pelunasan),
 * dan pesanan yang masih ditahan menjadi terkonfirmasi.
 */
const sedang = new Set<string>();

export async function POST(req: Request) {
  const o = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const orderId = typeof o.order_id === "string" ? o.order_id : "";
  const k = await konfigMidtrans();
  if (!k) { await catatKabar({ orderId, hasil: "belumDipasang" }); return Response.json({ galat: "belum dipasang" }, { status: 503 }); }
  if (!tandaTanganSah(k, o)) { await catatKabar({ orderId, hasil: "tandaTanganSalah" }); return Response.json({ galat: "tanda tangan" }, { status: 401 }); }
  const kode = kodeDariOrder(orderId);
  if (!kode || !databaseReady()) { await catatKabar({ orderId, hasil: "bukanPesanan" }); return Response.json({ ok: true }); }
  const st = await statusTransaksi(k, orderId);
  if (st.status !== String(o.transaction_status ?? "")) { await catatKabar({ orderId, hasil: "statusTidakCocok" }); }
  if (!lunas(st.status, st.fraud)) { await catatKabar({ orderId, hasil: "belumLunas" }); return Response.json({ ok: true }); }
  if (sedang.has(orderId)) return Response.json({ ok: true });
  sedang.add(orderId);
  try {
    const id = (await kueri<{ id: string }>("SELECT id FROM bookings WHERE code = ?", [kode]))[0]?.id;
    if (!id) { await catatKabar({ orderId, hasil: "bukanPesanan" }); return Response.json({ ok: true }); }
    const sudah = await kueri("SELECT id FROM payments WHERE booking_id = ? AND reference LIKE ?", [id, `%${orderId}%`]);
    if (sudah.length) { await catatKabar({ orderId, hasil: "sudahTercatat" }); return Response.json({ ok: true }); }
    await tambahBayar(id, { amount: st.jumlah, kind: "BALANCE", method: "MIDTRANS", paidAt: hariIniWit(), reference: `Midtrans ${orderId} · ${st.idTransaksi} · ${st.metode}` }, "Midtrans");
    let p = await satuBooking(id);
    let catatan = "";
    if (p?.status === "TENTATIVE") {
      try {
        p = await ubahBooking(id, { status: "CONFIRMED" }, "Midtrans");
      } catch (e) {
        if (!(e instanceof BentrokError)) throw e;
        catatan = "\nPerhatian, cottage bentrok dengan pesanan lain, status belum diubah. Periksa di dashboard.";
      }
    } else if (p && p.status !== "CONFIRMED") catatan = `\nPerhatian, status pesanan ${p.status}, pembayaran tetap dicatat. Periksa di dashboard.`;
    await catatKabar({ orderId, hasil: "dicatat" });
    const set = await bacaPengaturan();
    const asal = await asalSitus();
    const teksAdmin = `${kode}\n${p?.guest?.name ?? "-"} · ${p?.roomName ?? ""}, ${p?.checkIn ?? ""} sampai ${p?.checkOut ?? ""}\nDibayar ${rupiah(st.jumlah)} (${st.metode})\nOrder ${orderId}, transaksi ${st.idTransaksi}${catatan}\nDashboard: ${asal}/kelola#pesanan=${id}`;
    const htmlAdmin = kerangka({ asal, en: false, kontak: await kontakEmail(false), pratinjau: `${p?.guest?.name ?? ""} membayar ${rupiah(st.jumlah)}`, isi: `${kepala("Pembayaran diterima lewat Midtrans", `${kode} · ${p?.guest?.name ?? ""}`, `${p?.roomName ?? ""}, ${p?.checkIn ?? ""} sampai ${p?.checkOut ?? ""}`)}${ringkasan([["Dibayar", rupiah(st.jumlah)], ["Cara bayar", st.metode || "-"], ["Order ID", orderId], ["ID transaksi", st.idTransaksi || "-"], ["Status pesanan", p?.status === "CONFIRMED" ? "Terkonfirmasi otomatis" : String(p?.status ?? "-")]])}${catatan ? kotak(esc(catatan.trim()), "#FFF4D6") : ""}${deretTombol(tombol(`${asal}/kelola#pesanan=${id}`, "Buka di dashboard", WARNA.malam))}` });
    await kirimEmail(set.emailNotifikasi || alamatSaja(pengirim()), `Pembayaran ${kode} diterima lewat Midtrans`, teksAdmin, undefined, htmlAdmin).catch(() => undefined);
    /* Tamu menerima email pesanan terkonfirmasi beserta invoice. */
    await kirimEmailLunas(id).catch((e) => console.error("[midtrans] email invoice gagal", e));
    return Response.json({ ok: true });
  } finally {
    sedang.delete(orderId);
  }
}
