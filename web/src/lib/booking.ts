/**
 * Logika booking yang murni: tanggal, malam, tarif, label. Dipakai server dan
 * browser, dan diuji di `booking.test.ts`.
 *
 * Tanggal selalu string "YYYY-MM-DD". Satu malam menginap adalah satuan
 * kalender, jadi tidak pernah dikonversi lewat zona waktu.
 */

export type Status = "TENTATIVE" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW" | "CONFLICT" | "BLOCKED";
export type Channel = "WEBSITE" | "WHATSAPP" | "BOOKING_COM" | "AGODA" | "TRAVELOKA" | "AIRBNB" | "AGEN" | "WALK_IN" | "BLOCK";
export type PaymentKind = "DEPOSIT" | "BALANCE" | "EXTRA" | "REFUND";
export type PaymentMethod = "TRANSFER" | "CASH" | "EWALLET" | "CARD" | "OTA_PREPAID" | "MIDTRANS";

export const STATUS: Status[] = ["TENTATIVE", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW", "CONFLICT", "BLOCKED"];
export const LABEL_STATUS: Record<Status, string> = {
  TENTATIVE: "Tahanan",
  CONFIRMED: "Terkonfirmasi",
  CHECKED_IN: "Menginap",
  CHECKED_OUT: "Selesai",
  CANCELLED: "Batal",
  NO_SHOW: "Tidak datang",
  CONFLICT: "Bentrok",
  BLOCKED: "Ditutup",
};
/** Status yang menempati kamar. Sama dengan WHERE pada constraint anti-bentrok di database. */
export const MENEMPATI: Status[] = ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "BLOCKED"];

export const CHANNEL: Channel[] = ["WEBSITE", "WHATSAPP", "BOOKING_COM", "AGODA", "TRAVELOKA", "AIRBNB", "AGEN", "WALK_IN", "BLOCK"];
export const LABEL_CHANNEL: Record<Channel, string> = {
  WEBSITE: "Website",
  WHATSAPP: "WhatsApp",
  BOOKING_COM: "Booking.com",
  AGODA: "Agoda",
  TRAVELOKA: "Traveloka",
  AIRBNB: "Airbnb",
  AGEN: "Agen perjalanan",
  WALK_IN: "Datang langsung",
  BLOCK: "Tutup kamar",
};
/** Perkiraan komisi OTA, dipakai untuk pendapatan bersih di laporan. Bisa diubah di Pengaturan. */
export const KOMISI_BAWAAN: Partial<Record<Channel, number>> = { BOOKING_COM: 0.15, AGODA: 0.15, TRAVELOKA: 0.15, AIRBNB: 0.03, AGEN: 0.1 };

export const LABEL_KIND: Record<PaymentKind, string> = { DEPOSIT: "Uang muka", BALANCE: "Pelunasan", EXTRA: "Tambahan", REFUND: "Pengembalian" };
export const LABEL_METHOD: Record<PaymentMethod, string> = {
  TRANSFER: "Transfer bank",
  CASH: "Tunai",
  EWALLET: "E-wallet",
  CARD: "Kartu",
  OTA_PREPAID: "Dibayar ke OTA",
  MIDTRANS: "Midtrans",
};

const RE = /^\d{4}-\d{2}-\d{2}$/;
export const tanggalSah = (s: unknown): s is string => typeof s === "string" && RE.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));

const keUtc = (s: string) => Date.parse(s + "T00:00:00Z");
const dariUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const tambahHari = (s: string, n: number) => dariUtc(keUtc(s) + n * 86400000);
export const jumlahMalam = (masuk: string, keluar: string) => Math.round((keUtc(keluar) - keUtc(masuk)) / 86400000);
export const hariIniWit = () => {
  // Waktu Indonesia Timur (UTC+9), tanpa bergantung zona waktu server.
  return dariUtc(Date.now() + 9 * 3600000);
};

/** Daftar malam dalam [masuk, keluar). */
export function malam(masuk: string, keluar: string): string[] {
  const n = jumlahMalam(masuk, keluar);
  return Array.from({ length: Math.max(0, n) }, (_, i) => tambahHari(masuk, i));
}

/** Apakah dua rentang setengah terbuka saling tumpang. */
export const tumpang = (a1: string, a2: string, b1: string, b2: string) => a1 < b2 && b1 < a2;

export interface TarifMusim {
  dateFrom: string;
  dateTo: string;
  rate: number;
  label?: string | null;
}

/** Rincian harga per malam: tarif musiman bila ada (rentang tertutup), selain itu tarif dasar. */
export function rincianHarga(masuk: string, keluar: string, dasar: number, musim: TarifMusim[] = []) {
  const baris = malam(masuk, keluar).map((t) => {
    const m = musim.find((s) => s.dateFrom <= t && t <= s.dateTo);
    return { tanggal: t, tarif: m ? m.rate : dasar, label: m?.label ?? null };
  });
  return { baris, total: baris.reduce((s, b) => s + b.tarif, 0) };
}

/** Kode booking pendek yang mudah diucapkan: tanpa 0/O dan 1/I. */
export function kodeBooking(acak: () => number = Math.random) {
  const huruf = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += huruf[Math.floor(acak() * huruf.length)];
  return `BK-${s}`;
}

export const rupiah = (n: number | null | undefined) =>
  n == null ? "–" : "Rp " + Math.round(n).toLocaleString("id-ID");

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const BULAN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const tglPendek = (s: string) => `${Number(s.slice(8, 10))} ${BULAN[Number(s.slice(5, 7)) - 1]}`;
export const tglPanjang = (s: string) => `${Number(s.slice(8, 10))} ${BULAN_PANJANG[Number(s.slice(5, 7)) - 1]} ${s.slice(0, 4)}`;

/** Sisa tagihan: total dikurangi pembayaran masuk, ditambah pengembalian. */
export function sisaTagihan(total: number | null, bayar: { amount: number; kind: PaymentKind }[]) {
  const masuk = bayar.reduce((s, p) => s + (p.kind === "REFUND" ? -p.amount : p.amount), 0);
  return { dibayar: masuk, sisa: total == null ? null : total - masuk };
}
