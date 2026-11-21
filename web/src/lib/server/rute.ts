import "server-only";
import { NextResponse } from "next/server";

import { CHANNEL, STATUS, tanggalSah, type Channel, type Status } from "@/lib/booking";
import { lihatRupiah, type Peran } from "@/lib/peran";
import { databaseReady } from "@/lib/db";
import { BentrokError, type DataBooking, type Pesanan } from "./buku";

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const gagal = (pesan: string, status = 400, extra?: Record<string, unknown>) => NextResponse.json({ galat: pesan, ...extra }, { status });

export async function badan(req: Request): Promise<Record<string, unknown>> {
  try {
    const o = await req.json();
    return o && typeof o === "object" ? (o as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const tanpaDb = () =>
  databaseReady() ? null : gagal("Database belum diatur. Isi DB_NAME, DB_USER, dan DB_PASSWORD di panel Node.js Hostinger.", 503, { kode: "tanpa-db" });

/** Peran tanpa hak melihat rupiah mendapat pesanan tanpa angka uang. */
export function sensor(p: Pesanan, peran: Peran): Pesanan {
  if (lihatRupiah(peran)) return p;
  return { ...p, totalAmount: null, otaCommissionEst: null, payments: [] };
}

const angkaAtauNull = (v: unknown) => (v === null || v === "" || v === undefined ? null : Number.isFinite(Number(v)) ? Number(v) : null);
const intAtauNull = (v: unknown) => {
  const n = angkaAtauNull(v);
  return n == null ? null : Math.max(0, Math.round(n));
};

/** Baca dan periksa data booking dari badan permintaan. `sebagian` untuk PATCH. */
export function bacaBooking(o: Record<string, unknown>, sebagian = false): { data: Partial<DataBooking> } | { galat: string } {
  const d: Partial<DataBooking> = {};
  const ada = (k: string) => k in o;
  if (!sebagian || ada("roomId")) {
    if (typeof o.roomId !== "string" || !o.roomId) return { galat: "Pilih kamar." };
    d.roomId = o.roomId;
  }
  if (!sebagian || ada("checkIn") || ada("checkOut")) {
    if (!tanggalSah(o.checkIn) || !tanggalSah(o.checkOut)) return { galat: "Tanggal check-in dan check-out wajib diisi." };
    if (o.checkOut <= o.checkIn) return { galat: "Check-out harus sesudah check-in." };
    d.checkIn = o.checkIn;
    d.checkOut = o.checkOut;
  }
  if (!sebagian || ada("channel")) {
    if (!CHANNEL.includes(o.channel as Channel)) return { galat: "Pilih sumber pesanan." };
    d.channel = o.channel as Channel;
  }
  if (!sebagian || ada("status")) {
    const s = (o.status ?? "CONFIRMED") as Status;
    if (!STATUS.includes(s)) return { galat: "Status tidak dikenal." };
    d.status = s;
  }
  if (ada("pax")) d.pax = intAtauNull(o.pax);
  if (ada("dives")) d.dives = intAtauNull(o.dives);
  if (ada("totalAmount")) d.totalAmount = angkaAtauNull(o.totalAmount);
  if (ada("otaCommissionEst")) d.otaCommissionEst = angkaAtauNull(o.otaCommissionEst);
  if (ada("notes")) d.notes = typeof o.notes === "string" ? o.notes.slice(0, 2000) : null;
  if (ada("holdExpiresAt")) d.holdExpiresAt = typeof o.holdExpiresAt === "string" && o.holdExpiresAt ? o.holdExpiresAt : null;
  if (ada("guest")) {
    const g = o.guest as Record<string, unknown> | null;
    if (g && typeof g === "object" && typeof g.name === "string" && g.name.trim()) {
      const t = (v: unknown) => (typeof v === "string" ? v.slice(0, 200) : null);
      d.guest = { id: typeof g.id === "string" ? g.id : undefined, name: g.name.slice(0, 120), phone: t(g.phone), email: t(g.email), origin: t(g.origin), diveCert: t(g.diveCert) };
    } else d.guest = null;
  }
  return { data: d };
}

export function jawabBentrok(e: unknown) {
  if (e instanceof BentrokError)
    return gagal(e.message, 409, { kode: "bentrok", lawan: e.lawan.map((l) => ({ id: l.id, code: l.code, guest: l.guest?.name ?? null, checkIn: l.checkIn, checkOut: l.checkOut, status: l.status })) });
  console.error(e);
  return gagal(e instanceof Error ? e.message : "Terjadi kesalahan.", 500);
}
