import type { Channel } from "@/lib/booking";
import { KOMISI_BAWAAN } from "@/lib/booking";

export interface Pengaturan {
  namaResort: string;
  /** Jam berlakunya tahanan dari website sebelum batal otomatis. */
  jamTahanan: number;
  /** Persen uang muka yang diminta, untuk pesan konfirmasi. */
  persenDp: number;
  komisi: Partial<Record<Channel, number>>;
  /** Email penerima pemberitahuan pesanan dari website. */
  emailNotifikasi: string;
  /** Situs publik menerima pemesanan langsung. */
  terimaPesananWeb: boolean;
}

export const PENGATURAN_BAWAAN: Pengaturan = {
  namaResort: "Bakoeria Dive Resort",
  jamTahanan: 24,
  persenDp: 30,
  komisi: KOMISI_BAWAAN,
  emailNotifikasi: "",
  terimaPesananWeb: true,
};

export function rapikanPengaturan(o: Partial<Pengaturan> | null | undefined): Pengaturan {
  const b = PENGATURAN_BAWAAN;
  const k = (o ?? {}) as Record<string, unknown>;
  const n = (v: unknown, d: number, min: number, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d);
  const komisi: Partial<Record<Channel, number>> = { ...b.komisi };
  if (k.komisi && typeof k.komisi === "object") for (const [c, v] of Object.entries(k.komisi)) komisi[c as Channel] = n(v, 0, 0, 0.5);
  return {
    namaResort: typeof k.namaResort === "string" && k.namaResort.trim() ? k.namaResort.trim().slice(0, 80) : b.namaResort,
    jamTahanan: n(k.jamTahanan, b.jamTahanan, 1, 168),
    persenDp: n(k.persenDp, b.persenDp, 0, 100),
    komisi,
    emailNotifikasi: typeof k.emailNotifikasi === "string" ? k.emailNotifikasi.trim().slice(0, 120) : b.emailNotifikasi,
    terimaPesananWeb: typeof k.terimaPesananWeb === "boolean" ? k.terimaPesananWeb : b.terimaPesananWeb,
  };
}
