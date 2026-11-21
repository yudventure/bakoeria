import { headers } from "next/headers";

import { jumlahMalam, rupiah, tanggalSah, tglPanjang, hariIniWit } from "@/lib/booking";
import { tglBahasa } from "@/lib/kamus";
import { databaseReady } from "@/lib/db";
import { BentrokError, bookingDalam, buatBooking, hargaOtomatis } from "@/lib/server/buku";
import { MENEMPATI, tumpang } from "@/lib/booking";
import { alamatSaja, kirimEmail, pengirim } from "@/lib/server/email";
import { badan, gagal, ok } from "@/lib/server/rute";
import { bacaPengaturan } from "@/lib/server/simpanan";

/** Pembatas sederhana: lima permintaan per alamat IP per jam. */
const jejak = new Map<string, number[]>();

/**
 * Permintaan pemesanan dari situs publik. Masuk ke kalender sebagai tahanan
 * (TENTATIVE) yang batal sendiri setelah `jamTahanan` bila tidak dikonfirmasi.
 * Harga selalu dihitung di server, tidak pernah dipercaya dari browser.
 */
export async function POST(req: Request) {
  const o = await badan(req);
  const en = o.bahasa !== "id";
  const m = (id: string, ing: string) => (en ? ing : id);
  if (!databaseReady()) return gagal(m("Pemesanan online belum aktif. Hubungi kami lewat WhatsApp.", "Online booking is not open yet. Please contact us on WhatsApp."), 503);
  const set = await bacaPengaturan();
  if (!set.terimaPesananWeb) return gagal(m("Pemesanan online sedang ditutup. Hubungi kami lewat WhatsApp.", "Online booking is closed for now. Please contact us on WhatsApp."), 503);
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "tanpa-ip";
  const kini = Date.now();
  const daftar = (jejak.get(ip) ?? []).filter((t) => kini - t < 3600000);
  if (daftar.length >= 5) return gagal(m("Terlalu banyak permintaan. Coba lagi nanti atau hubungi kami lewat WhatsApp.", "Too many requests. Please try again later or contact us on WhatsApp."), 429);
  if (typeof o.situs === "string" && o.situs) return ok({ diterima: true }); // isian jebakan untuk bot
  const s = (v: unknown, n = 120) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const nama = s(o.nama);
  const telepon = s(o.telepon, 40);
  const email = s(o.email);
  const catatan = s(o.catatan, 1000);
  const minat = s(o.minat, 60);
  const masuk = o.masuk;
  const keluar = o.keluar;
  const tamu = Math.max(1, Math.min(20, Math.round(Number(o.tamu) || 1)));
  if (!nama) return gagal(m("Isi nama Anda.", "Please enter your name."));
  if (!telepon && !email) return gagal(m("Isi nomor WhatsApp atau email supaya kami bisa membalas.", "Please enter a WhatsApp number or email so we can reply."));
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return gagal(m("Alamat email tidak sah.", "That email address is not valid."));
  if (!tanggalSah(masuk) || !tanggalSah(keluar) || keluar <= masuk) return gagal(m("Pilih tanggal tiba dan tanggal pulang.", "Choose your arrival and departure dates."));
  if (masuk < hariIniWit()) return gagal(m("Tanggal tiba sudah lewat.", "That arrival date has already passed."));
  if (jumlahMalam(masuk, keluar) > 30) return gagal(m("Untuk menginap lebih dari 30 malam, hubungi kami langsung.", "For stays longer than 30 nights, please contact us directly."));
  if (typeof o.kamar !== "string") return gagal(m("Pilih cottage.", "Please choose a cottage."));
  const harga = await hargaOtomatis(o.kamar, masuk, keluar);
  if (!harga) return gagal(m("Cottage itu tidak ditemukan.", "That cottage was not found."));
  const kamarId = o.kamar;
  const terisi = (await bookingDalam(masuk, keluar)).some((b) => b.roomId === kamarId && (MENEMPATI.includes(b.status) || b.status === "TENTATIVE") && tumpang(b.checkIn, b.checkOut, masuk, keluar));
  if (terisi) return gagal(m("Cottage itu baru saja terisi untuk tanggal tersebut. Pilih cottage lain.", "That cottage has just been booked for those dates. Please choose another."), 409);
  jejak.set(ip, [...daftar, kini]);
  try {
    const p = await buatBooking(
      {
        roomId: o.kamar,
        checkIn: masuk,
        checkOut: keluar,
        channel: "WEBSITE",
        status: "TENTATIVE",
        source: "WEBSITE",
        pax: tamu,
        totalAmount: harga.total,
        notes: [minat && `Minat: ${minat}`, `Bahasa situs: ${en ? "Inggris" : "Indonesia"}`, catatan].filter(Boolean).join("\n") || null,
        holdExpiresAt: new Date(kini + set.jamTahanan * 3600000).toISOString(),
        guest: { name: nama, phone: telepon || null, email: email || null },
      },
      "Situs web",
    );
    const ringkas = `${p.code}\n${nama} (${tamu} tamu)\n${p.roomName}, ${tglPanjang(masuk)} sampai ${tglPanjang(keluar)} (${jumlahMalam(masuk, keluar)} malam)\nPerkiraan ${rupiah(harga.total)}\nWhatsApp: ${telepon || "-"}\nEmail: ${email || "-"}\n${minat ? "Minat: " + minat + "\n" : ""}${catatan ? "Catatan: " + catatan + "\n" : ""}\nTahanan berlaku ${set.jamTahanan} jam. Konfirmasi di dashboard /kelola.`;
    await kirimEmail(set.emailNotifikasi || alamatSaja(pengirim()), `Pesanan baru ${p.code} dari website`, ringkas, email || undefined);
    if (email) {
      const tb = (d: string) => tglBahasa(d, en ? "en" : "id");
      if (en)
        await kirimEmail(email, `Booking request ${p.code} received`, `Hello ${nama},\n\nThank you. We have received your request:\n${p.roomName}, ${tb(masuk)} to ${tb(keluar)}\nEstimated total ${rupiah(harga.total)}\n\nWe will reply with a confirmation and payment details. Your booking code is ${p.code}.\n\nWarm regards,\n${set.namaResort}`);
      else
        await kirimEmail(email, `Permintaan pemesanan ${p.code} diterima`, `Halo ${nama},\n\nTerima kasih. Permintaan Anda sudah kami terima:\n${p.roomName}, ${tb(masuk)} sampai ${tb(keluar)}\nPerkiraan ${rupiah(harga.total)}\n\nKami akan membalas dengan konfirmasi dan cara pembayaran. Kode pesanan Anda: ${p.code}.\n\nSalam hangat,\n${set.namaResort}`);
    }
    return ok({ kode: p.code, total: harga.total, jamTahanan: set.jamTahanan, persenDp: set.persenDp }, 201);
  } catch (e) {
    if (e instanceof BentrokError) return gagal(m("Cottage itu baru saja terisi untuk tanggal tersebut. Pilih cottage lain.", "That cottage has just been booked for those dates. Please choose another."), 409);
    console.error(e);
    return gagal(m("Permintaan belum tersimpan. Coba lagi atau hubungi kami lewat WhatsApp.", "Your request was not saved. Please try again or contact us on WhatsApp."), 500);
  }
}
