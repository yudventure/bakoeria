import "server-only";
import type { PoolConnection } from "mysql2/promise";

import { idBaru, jalankan, kueri } from "@/lib/db";
import { tanggalSah } from "@/lib/booking";
import { rapikanKode, type Kupon } from "@/lib/tarif";

/**
 * Kupon diskon. Pemakaian dihitung dari pesanan yang memakai kodenya dan tidak
 * batal/tidak datang, jadi tahanan website yang kedaluwarsa (otomatis batal)
 * mengembalikan kuotanya sendiri.
 */
const TIDAK_DIHITUNG = "('CANCELLED','NO_SHOW')";

const keKupon = (r: Record<string, unknown>): Kupon => ({
  id: String(r.id),
  kode: String(r.code),
  jenis: r.kind === "NOMINAL" ? "NOMINAL" : "PERSEN",
  nilai: Number(r.value),
  maksPotongan: r.max_discount == null ? null : Number(r.max_discount),
  minMalam: Number(r.min_nights) || 1,
  berlakuSampai: (r.valid_until as string) ?? null,
  tibaDari: (r.arrive_from as string) ?? null,
  tibaSampai: (r.arrive_to as string) ?? null,
  tipeKamar: String(r.room_types ?? "").split("\n").map((x) => x.trim()).filter(Boolean),
  maksPakai: r.max_uses == null ? null : Number(r.max_uses),
  aktif: Boolean(r.is_active),
  catatan: (r.note as string) ?? null,
  terpakai: Number(r.terpakai ?? 0),
});

const PILIH = `SELECT c.*, (SELECT COUNT(*) FROM bookings b WHERE b.coupon_code = c.code AND b.status NOT IN ${TIDAK_DIHITUNG}) AS terpakai FROM coupons c`;

export async function daftarKupon(): Promise<Kupon[]> {
  return (await kueri(`${PILIH} ORDER BY c.is_active DESC, c.created_at DESC`)).map(keKupon);
}

export async function kuponDenganKode(kode: string): Promise<Kupon | null> {
  const k = rapikanKode(kode);
  if (!k) return null;
  const r = await kueri(`${PILIH} WHERE c.code = ?`, [k]);
  return r[0] ? keKupon(r[0]) : null;
}

export class KuponHabisError extends Error {}

/** Dipanggil di dalam transaksi pembuatan pesanan: kunci baris kupon lalu pastikan kuotanya masih ada. */
export async function pastikanKuotaKupon(k: PoolConnection, kode: string) {
  const [baris] = (await k.query("SELECT max_uses FROM coupons WHERE code = ? FOR UPDATE", [kode])) as unknown as [{ max_uses: number | null }[]];
  const maks = baris[0]?.max_uses;
  if (maks == null) return;
  const [[n]] = (await k.query(`SELECT COUNT(*) AS n FROM bookings WHERE coupon_code = ? AND status NOT IN ${TIDAK_DIHITUNG}`, [kode])) as unknown as [{ n: number }[]];
  if (Number(n.n) >= Number(maks)) throw new KuponHabisError();
}

/** Baca dan periksa isian kupon dari dashboard. */
export function bacaIsianKupon(o: Record<string, unknown>): { data: Omit<Kupon, "id" | "terpakai"> } | { galat: string } {
  const kode = rapikanKode(o.kode);
  if (kode.length < 3) return { galat: "Kode kupon minimal 3 huruf atau angka (tanpa spasi)." };
  const jenis = o.jenis === "NOMINAL" ? "NOMINAL" : "PERSEN";
  const nilai = Number(o.nilai);
  if (!Number.isFinite(nilai) || nilai <= 0) return { galat: "Isi besar diskon." };
  if (jenis === "PERSEN" && nilai > 100) return { galat: "Diskon persen paling besar 100%." };
  const angkaAtauNull = (v: unknown) => (v === "" || v == null || !Number.isFinite(Number(v)) || Number(v) <= 0 ? null : Math.round(Number(v)));
  const tgl = (v: unknown) => (tanggalSah(v) ? v : null);
  const tibaDari = tgl(o.tibaDari);
  const tibaSampai = tgl(o.tibaSampai);
  if (tibaDari && tibaSampai && tibaSampai < tibaDari) return { galat: "Rentang tanggal tiba terbalik." };
  return {
    data: {
      kode,
      jenis,
      nilai,
      maksPotongan: jenis === "PERSEN" ? angkaAtauNull(o.maksPotongan) : null,
      minMalam: Math.max(1, Math.min(60, Math.round(Number(o.minMalam) || 1))),
      berlakuSampai: tgl(o.berlakuSampai),
      tibaDari,
      tibaSampai,
      tipeKamar: (Array.isArray(o.tipeKamar) ? o.tipeKamar : []).map((x) => String(x).trim().slice(0, 80)).filter(Boolean).slice(0, 10),
      maksPakai: angkaAtauNull(o.maksPakai),
      aktif: o.aktif !== false,
      catatan: typeof o.catatan === "string" && o.catatan.trim() ? o.catatan.trim().slice(0, 200) : null,
    },
  };
}

const nilaiKolom = (d: Omit<Kupon, "id" | "terpakai">) => [d.kode, d.jenis, d.nilai, d.maksPotongan, d.minMalam, d.berlakuSampai, d.tibaDari, d.tibaSampai, d.tipeKamar.join("\n") || null, d.maksPakai, d.aktif ? 1 : 0, d.catatan];

export class KodeDipakaiError extends Error {}

export async function simpanKupon(id: string | null, d: Omit<Kupon, "id" | "terpakai">) {
  const lain = await kueri<{ id: string }>("SELECT id FROM coupons WHERE code = ?", [d.kode]);
  if (lain.length && lain[0].id !== id) throw new KodeDipakaiError();
  if (id) await jalankan("UPDATE coupons SET code = ?, kind = ?, value = ?, max_discount = ?, min_nights = ?, valid_until = ?, arrive_from = ?, arrive_to = ?, room_types = ?, max_uses = ?, is_active = ?, note = ? WHERE id = ?", [...nilaiKolom(d), id]);
  else await jalankan("INSERT INTO coupons (code, kind, value, max_discount, min_nights, valid_until, arrive_from, arrive_to, room_types, max_uses, is_active, note, id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [...nilaiKolom(d), idBaru()]);
}

/** Kupon yang sudah dipakai pesanan tidak dihapus (riwayatnya tetap terbaca); cukup dinonaktifkan. */
export async function hapusKupon(id: string): Promise<"dihapus" | "dinonaktifkan"> {
  const r = await kueri<{ n: number }>("SELECT COUNT(*) AS n FROM bookings b JOIN coupons c ON c.code = b.coupon_code WHERE c.id = ?", [id]);
  if (Number(r[0]?.n ?? 0) > 0) {
    await jalankan("UPDATE coupons SET is_active = 0 WHERE id = ?", [id]);
    return "dinonaktifkan";
  }
  await jalankan("DELETE FROM coupons WHERE id = ?", [id]);
  return "dihapus";
}
