import { angkaRupiah } from "./rupiah-teks";

/**
 * Harga tambahan yang ikut total pesanan (permintaan pemilik, November 2026): perahu
 * antar-jemput dan paket diving yang sudah dipilih dibayar bersama cottage. Diving tanpa
 * paket ("tolong sarankan") dan paket tanpa harga dibayar di tempat (0 di sini).
 * Dipakai formulir dan server, supaya totalnya sama.
 */
export const nilaiHarga = (teks: string | undefined | null) => Number(angkaRupiah(teks ?? "")) || 0;

/** Paket yang harganya per hari, per perahu, atau per trip dihitung sekali; lainnya per penyelam. */
export const kaliPaketSelam = (ket: string, penyelam: number) => (/per (hari|day|perahu|boat|trip|grup|group)/i.test(ket) ? 1 : Math.max(1, penyelam));

export function hitungTambahan(o: { hargaPerahu?: string | null; paket?: { harga: string; ket: string } | null; penyelam: number }) {
  const perahu = nilaiHarga(o.hargaPerahu);
  const kali = o.paket ? kaliPaketSelam(o.paket.ket, o.penyelam) : 0;
  const satuanSelam = o.paket ? nilaiHarga(o.paket.harga) : 0;
  const selam = satuanSelam * kali;
  return { perahu, selam, satuanSelam, kali, jumlah: perahu + selam };
}
