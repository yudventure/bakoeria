import { headers } from "next/headers";

import { jumlahMalam, rupiah, tanggalSah, tglPanjang, hariIniWit } from "@/lib/booking";
import { databaseReady } from "@/lib/db";
import { BentrokError, bookingDalam, buatBooking, hargaOtomatis } from "@/lib/server/buku";
import { MENEMPATI, tumpang } from "@/lib/booking";
import { kirimEmail } from "@/lib/server/email";
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
  if (!databaseReady()) return gagal("Pemesanan online belum aktif. Hubungi kami lewat WhatsApp.", 503);
  const set = await bacaPengaturan();
  if (!set.terimaPesananWeb) return gagal("Pemesanan online sedang ditutup. Hubungi kami lewat WhatsApp.", 503);
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "tanpa-ip";
  const kini = Date.now();
  const daftar = (jejak.get(ip) ?? []).filter((t) => kini - t < 3600000);
  if (daftar.length >= 5) return gagal("Terlalu banyak permintaan. Coba lagi nanti atau hubungi kami lewat WhatsApp.", 429);
  const o = await badan(req);
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
  if (!nama) return gagal("Isi nama Anda.");
  if (!telepon && !email) return gagal("Isi nomor WhatsApp atau email supaya kami bisa membalas.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return gagal("Alamat email tidak sah.");
  if (!tanggalSah(masuk) || !tanggalSah(keluar) || keluar <= masuk) return gagal("Pilih tanggal tiba dan tanggal pulang.");
  if (masuk < hariIniWit()) return gagal("Tanggal tiba sudah lewat.");
  if (jumlahMalam(masuk, keluar) > 30) return gagal("Untuk menginap lebih dari 30 malam, hubungi kami langsung.");
  if (typeof o.kamar !== "string") return gagal("Pilih cottage.");
  const harga = await hargaOtomatis(o.kamar, masuk, keluar);
  if (!harga) return gagal("Cottage itu tidak ditemukan.");
  const kamarId = o.kamar;
  const terisi = (await bookingDalam(masuk, keluar)).some((b) => b.roomId === kamarId && (MENEMPATI.includes(b.status) || b.status === "TENTATIVE") && tumpang(b.checkIn, b.checkOut, masuk, keluar));
  if (terisi) return gagal("Cottage itu baru saja terisi untuk tanggal tersebut. Pilih cottage lain.", 409);
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
        notes: [minat && `Minat: ${minat}`, catatan].filter(Boolean).join("\n") || null,
        holdExpiresAt: new Date(kini + set.jamTahanan * 3600000).toISOString(),
        guest: { name: nama, phone: telepon || null, email: email || null },
      },
      "Situs web",
    );
    const ringkas = `${p.code}\n${nama} (${tamu} tamu)\n${p.roomName}, ${tglPanjang(masuk)} sampai ${tglPanjang(keluar)} (${jumlahMalam(masuk, keluar)} malam)\nPerkiraan ${rupiah(harga.total)}\nWhatsApp: ${telepon || "-"}\nEmail: ${email || "-"}\n${minat ? "Minat: " + minat + "\n" : ""}${catatan ? "Catatan: " + catatan + "\n" : ""}\nTahanan berlaku ${set.jamTahanan} jam. Konfirmasi di dashboard /kelola.`;
    await kirimEmail(set.emailNotifikasi, `Pesanan baru ${p.code} dari website`, ringkas, email || undefined);
    if (email) await kirimEmail(email, `Permintaan pemesanan ${p.code} diterima`, `Halo ${nama},\n\nTerima kasih. Permintaan Anda sudah kami terima:\n${p.roomName}, ${tglPanjang(masuk)} sampai ${tglPanjang(keluar)}\nPerkiraan ${rupiah(harga.total)}\n\nKami akan membalas dengan konfirmasi dan cara pembayaran. Kode pesanan Anda: ${p.code}.\n\nSalam hangat,\n${set.namaResort}`);
    return ok({ kode: p.code, total: harga.total, jamTahanan: set.jamTahanan, persenDp: set.persenDp }, 201);
  } catch (e) {
    if (e instanceof BentrokError) return gagal("Cottage itu baru saja terisi untuk tanggal tersebut. Pilih cottage lain.", 409);
    console.error(e);
    return gagal("Permintaan belum tersimpan. Coba lagi atau hubungi kami lewat WhatsApp.", 500);
  }
}
