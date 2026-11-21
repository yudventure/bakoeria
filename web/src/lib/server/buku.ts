import "server-only";
import type { PoolConnection } from "mysql2/promise";

import { idBaru, jalankan, kueri, transaksi, type Nilai } from "@/lib/db";
import { kodeBooking, MENEMPATI, rincianHarga, type Channel, type PaymentKind, type PaymentMethod, type Status } from "@/lib/booking";

/**
 * Semua akses database untuk kamar, pesanan, tamu, dan pembayaran (MySQL).
 *
 * Pencegah pesanan ganda: setiap penulisan yang bisa membuat kamar terisi
 * berjalan di dalam transaksi yang lebih dulu mengunci baris kamarnya
 * (SELECT ... FOR UPDATE). Dua resepsionis yang menyimpan kamar yang sama pada
 * detik yang sama jadi antre, dan yang kedua melihat pesanan yang pertama.
 */

type K = PoolConnection;
const angka = (v: unknown) => (v == null ? null : Number(v));
/** DATETIME UTC dari MySQL ("YYYY-MM-DD HH:MM:SS.mmm") ke ISO. */
const iso = (v: unknown) => (v == null ? null : String(v).replace(" ", "T") + (String(v).endsWith("Z") ? "" : "Z"));
const tglSaja = (v: unknown) => String(v).slice(0, 10);

export interface Kamar {
  id: string;
  name: string;
  roomType: string | null;
  capAdult: number;
  capChild: number;
  baseRate: number;
  isActive: boolean;
  inactiveReason: string | null;
  sortOrder: number;
  sizeM2: number | null;
  descEn: string;
  descId: string;
  featuresEn: string[];
  featuresId: string[];
  musim: { id: string; dateFrom: string; dateTo: string; rate: number; label: string | null }[];
}

const daftarBaris = (v: unknown) => String(v ?? "").split("\n").map((x) => x.trim()).filter(Boolean);

export async function ambilKamar(semua = true): Promise<Kamar[]> {
  const rows = await kueri(`SELECT * FROM rooms ${semua ? "" : "WHERE is_active = 1"} ORDER BY sort_order, name`);
  const musim = await kueri("SELECT * FROM seasonal_rates ORDER BY date_from");
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    roomType: (r.room_type as string) ?? null,
    capAdult: Number(r.cap_adult),
    capChild: Number(r.cap_child),
    baseRate: Number(r.base_rate),
    isActive: Boolean(r.is_active),
    inactiveReason: (r.inactive_reason as string) ?? null,
    sortOrder: Number(r.sort_order),
    sizeM2: r.size_m2 == null ? null : Number(r.size_m2),
    descEn: String(r.desc_en ?? ""),
    descId: String(r.desc_id ?? ""),
    featuresEn: daftarBaris(r.features_en),
    featuresId: daftarBaris(r.features_id),
    musim: musim.filter((m) => m.room_id === r.id).map((m) => ({ id: String(m.id), dateFrom: tglSaja(m.date_from), dateTo: tglSaja(m.date_to), rate: Number(m.rate), label: (m.label as string) ?? null })),
  }));
}

export interface Pembayaran {
  id: string;
  amount: number;
  kind: PaymentKind;
  method: PaymentMethod;
  paidAt: string;
  reference: string | null;
  recordedBy: string | null;
}

export interface Pesanan {
  id: string;
  code: string;
  roomId: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  channel: Channel;
  status: Status;
  source: "MANUAL" | "ICAL" | "WEBSITE";
  pax: number | null;
  dives: number | null;
  totalAmount: number | null;
  otaCommissionEst: number | null;
  notes: string | null;
  holdExpiresAt: string | null;
  conflictGroup: string | null;
  createdBy: string | null;
  createdAt: string;
  guest: { id: string; name: string; phone: string | null; email: string | null; origin: string | null; diveCert: string | null } | null;
  payments: Pembayaran[];
}

const PILIH = `SELECT b.*, r.name AS room_name, g.name AS g_name, g.phone AS g_phone, g.email AS g_email, g.origin AS g_origin, g.dive_cert AS g_cert
  FROM bookings b JOIN rooms r ON r.id = b.room_id LEFT JOIN guests g ON g.id = b.guest_id`;

async function bentuk(rows: Record<string, unknown>[], lewat?: K): Promise<Pesanan[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => String(r.id));
  const bayar = await kueri("SELECT * FROM payments WHERE booking_id IN (?) ORDER BY paid_at, created_at", [ids], lewat);
  return rows.map((b) => ({
    id: String(b.id),
    code: String(b.code),
    roomId: String(b.room_id),
    roomName: String(b.room_name),
    checkIn: tglSaja(b.check_in),
    checkOut: tglSaja(b.check_out),
    channel: b.channel as Channel,
    status: b.status as Status,
    source: b.source as Pesanan["source"],
    pax: angka(b.pax),
    dives: angka(b.dives),
    totalAmount: angka(b.total_amount),
    otaCommissionEst: angka(b.ota_commission_est),
    notes: (b.notes as string) ?? null,
    holdExpiresAt: iso(b.hold_expires_at),
    conflictGroup: (b.conflict_group as string) ?? null,
    createdBy: (b.created_by as string) ?? null,
    createdAt: iso(b.created_at)!,
    guest: b.guest_id
      ? { id: String(b.guest_id), name: String(b.g_name), phone: (b.g_phone as string) ?? null, email: (b.g_email as string) ?? null, origin: (b.g_origin as string) ?? null, diveCert: (b.g_cert as string) ?? null }
      : null,
    payments: bayar
      .filter((p) => p.booking_id === b.id)
      .map((p) => ({ id: String(p.id), amount: Number(p.amount), kind: p.kind as PaymentKind, method: p.method as PaymentMethod, paidAt: tglSaja(p.paid_at), reference: (p.reference as string) ?? null, recordedBy: (p.recorded_by as string) ?? null })),
  }));
}

/** Pesanan yang menyentuh rentang [dari, sampai). */
export async function bookingDalam(dari: string, sampai: string): Promise<Pesanan[]> {
  return bentuk(await kueri(`${PILIH} WHERE b.check_in < ? AND b.check_out > ? ORDER BY b.check_in`, [sampai, dari]));
}

export async function cariBooking(opsi: { q?: string; status?: Status | ""; dari?: string; sampai?: string; ambil?: number }): Promise<Pesanan[]> {
  const syarat: string[] = [];
  const nilai: Nilai[] = [];
  if (opsi.status) (syarat.push("b.status = ?"), nilai.push(opsi.status));
  if (opsi.dari) (syarat.push("b.check_out > ?"), nilai.push(opsi.dari));
  if (opsi.sampai) (syarat.push("b.check_in < ?"), nilai.push(opsi.sampai));
  const q = opsi.q?.trim();
  if (q) {
    const pola = `%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
    syarat.push("(b.code LIKE ? OR g.name LIKE ? OR g.phone LIKE ? OR b.notes LIKE ?)");
    nilai.push(pola, pola, pola, pola);
  }
  nilai.push(Math.min(500, opsi.ambil ?? 200));
  return bentuk(await kueri(`${PILIH} ${syarat.length ? "WHERE " + syarat.join(" AND ") : ""} ORDER BY b.check_in DESC LIMIT ?`, nilai));
}

export async function satuBooking(id: string, lewat?: K): Promise<Pesanan | null> {
  return (await bentuk(await kueri(`${PILIH} WHERE b.id = ?`, [id], lewat), lewat))[0] ?? null;
}

export class BentrokError extends Error {
  constructor(public lawan: Pesanan[]) {
    super("Kamar sudah terisi pada sebagian tanggal itu.");
  }
}

/** Pesanan aktif yang menempati kamar itu dalam rentang, kecuali `kecuali`. */
export async function penghuni(roomId: string, masuk: string, keluar: string, kecuali?: string, lewat?: K): Promise<Pesanan[]> {
  const rows = await kueri(
    `${PILIH} WHERE b.room_id = ? AND b.status IN (?) AND b.check_in < ? AND b.check_out > ? ${kecuali ? "AND b.id <> ?" : ""}`,
    [roomId, MENEMPATI, keluar, masuk, ...(kecuali ? [kecuali] : [])],
    lewat,
  );
  return bentuk(rows, lewat);
}

/**
 * Di dalam transaksi: pesanan aktif yang bertabrakan, dibaca dengan kunci
 * (FOR UPDATE), jadi selalu melihat data terbaru meski transaksi lain baru
 * saja menyimpan. Detailnya dimuat sesudahnya untuk pesan galat.
 */
async function tabrakan(k: K, roomId: string, masuk: string, keluar: string, kecuali?: string): Promise<Pesanan[]> {
  const ids = await kueri<{ id: string }>(
    `SELECT id FROM bookings WHERE room_id = ? AND status IN (?) AND check_in < ? AND check_out > ? ${kecuali ? "AND id <> ?" : ""} FOR UPDATE`,
    [roomId, MENEMPATI, keluar, masuk, ...(kecuali ? [kecuali] : [])],
    k,
  );
  if (!ids.length) return [];
  return bentuk(await kueri(`${PILIH} WHERE b.id IN (?)`, [ids.map((x) => x.id)], k), k);
}

/** Mengunci baris kamar sampai transaksi selesai. Melempar bila kamarnya tidak ada. */
async function kunciKamar(k: K, roomId: string) {
  const r = await kueri("SELECT id FROM rooms WHERE id = ? FOR UPDATE", [roomId], k);
  if (!r.length) throw new Error("Kamar tidak ditemukan.");
}

export async function hargaOtomatis(roomId: string, masuk: string, keluar: string) {
  const kamar = (await ambilKamar()).find((r) => r.id === roomId);
  if (!kamar) return null;
  return rincianHarga(masuk, keluar, kamar.baseRate, kamar.musim);
}

export interface DataBooking {
  roomId: string;
  checkIn: string;
  checkOut: string;
  channel: Channel;
  status: Status;
  pax?: number | null;
  dives?: number | null;
  totalAmount?: number | null;
  otaCommissionEst?: number | null;
  notes?: string | null;
  holdExpiresAt?: string | null;
  guest?: { id?: string; name: string; phone?: string | null; email?: string | null; origin?: string | null; diveCert?: string | null } | null;
  source?: "MANUAL" | "ICAL" | "WEBSITE";
  externalUid?: string | null;
  conflictGroup?: string | null;
}

async function catatAudit(k: K, entityId: string, action: string, actor: string | null, diff: unknown) {
  await jalankan("INSERT INTO audit_log (id, entity, entity_id, action, actor, diff_json) VALUES (?, 'booking', ?, ?, ?, ?)", [idBaru(), entityId, action, actor, diff == null ? null : JSON.stringify(diff)], k);
}

async function simpanTamu(k: K, g: DataBooking["guest"]): Promise<string | null> {
  if (!g || !g.name?.trim()) return null;
  const v = [g.name.trim(), g.phone?.trim() || null, g.email?.trim() || null, g.origin?.trim() || null, g.diveCert?.trim() || null];
  if (g.id) {
    await jalankan("UPDATE guests SET name = ?, phone = ?, email = ?, origin = ?, dive_cert = ? WHERE id = ?", [...v, g.id], k);
    return g.id;
  }
  const id = idBaru();
  await jalankan("INSERT INTO guests (id, name, phone, email, origin, dive_cert) VALUES (?, ?, ?, ?, ?, ?)", [id, ...v], k);
  return id;
}

const tanggalWaktu = (s: string | null | undefined) => (s ? new Date(s) : null);

/**
 * Membuat pesanan. Dengan `bentrokJadiKonflik` (dipakai impor iCal), pesanan
 * yang menabrak tidak ditolak tetapi disimpan berstatus CONFLICT, karena
 * pesanan itu sudah terjadi di OTA dan membuangnya berarti kehilangan data.
 */
export async function buatBooking(d: DataBooking, aktor: string | null, opsi: { bentrokJadiKonflik?: boolean } = {}): Promise<Pesanan> {
  return transaksi(async (k) => {
    await kunciKamar(k, d.roomId);
    let status = d.status;
    let conflictGroup = d.conflictGroup ?? null;
    if (MENEMPATI.includes(status)) {
      const lawan = await tabrakan(k, d.roomId, d.checkIn, d.checkOut);
      if (lawan.length) {
        if (!opsi.bentrokJadiKonflik) throw new BentrokError(lawan);
        status = "CONFLICT";
        conflictGroup = `${d.roomId}:${d.checkIn}`;
      }
    }
    const guestId = await simpanTamu(k, d.guest);
    let code = kodeBooking();
    for (let i = 0; i < 5 && (await kueri("SELECT 1 FROM bookings WHERE code = ?", [code], k)).length; i++) code = kodeBooking();
    const id = idBaru();
    await jalankan(
      `INSERT INTO bookings (id, code, room_id, guest_id, check_in, check_out, channel, status, source, external_uid, pax, dives, total_amount, ota_commission_est, notes, hold_expires_at, conflict_group, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, d.externalUid ? "IC-" + code.slice(3) : code, d.roomId, guestId, d.checkIn, d.checkOut, d.channel, status, d.source ?? "MANUAL", d.externalUid ?? null, d.pax ?? null, d.dives ?? null, d.totalAmount ?? null, d.otaCommissionEst ?? null, d.notes?.trim() || null, tanggalWaktu(d.holdExpiresAt), conflictGroup, aktor],
      k,
    );
    await catatAudit(k, id, "buat", aktor, d);
    return (await satuBooking(id, k))!;
  });
}

const KOLOM: Partial<Record<keyof DataBooking, string>> = {
  roomId: "room_id",
  checkIn: "check_in",
  checkOut: "check_out",
  channel: "channel",
  status: "status",
  pax: "pax",
  dives: "dives",
  totalAmount: "total_amount",
  otaCommissionEst: "ota_commission_est",
  notes: "notes",
  holdExpiresAt: "hold_expires_at",
  conflictGroup: "conflict_group",
};

export async function ubahBooking(id: string, d: Partial<DataBooking>, aktor: string | null, opsi: { bentrokJadiKonflik?: boolean } = {}): Promise<Pesanan> {
  return transaksi(async (k) => {
    // Kunci dulu, baca sesudahnya. Kamar lama dan baru dikunci dalam urutan
    // tetap supaya dua transaksi tidak saling menunggu selamanya.
    const asal = (await kueri<{ room_id: string }>("SELECT room_id FROM bookings WHERE id = ?", [id], k))[0];
    if (!asal) throw new Error("Pesanan tidak ditemukan.");
    for (const r of [...new Set([asal.room_id, d.roomId ?? asal.room_id])].sort()) await kunciKamar(k, r);
    const lama = await satuBooking(id, k);
    if (!lama) throw new Error("Pesanan tidak ditemukan.");
    const akhir = { roomId: d.roomId ?? lama.roomId, checkIn: d.checkIn ?? lama.checkIn, checkOut: d.checkOut ?? lama.checkOut, status: d.status ?? lama.status };
    const ubah: Partial<DataBooking> = { ...d };
    if (MENEMPATI.includes(akhir.status)) {
      const lawan = await tabrakan(k, akhir.roomId, akhir.checkIn, akhir.checkOut, id);
      if (lawan.length) {
        if (!opsi.bentrokJadiKonflik) throw new BentrokError(lawan);
        ubah.status = "CONFLICT";
        ubah.conflictGroup = `${akhir.roomId}:${akhir.checkIn}`;
      }
    }
    if (ubah.status !== undefined) {
      if (ubah.status !== "CONFLICT" && ubah.conflictGroup === undefined) ubah.conflictGroup = null;
      if (ubah.status !== "TENTATIVE" && ubah.holdExpiresAt === undefined) ubah.holdExpiresAt = null;
    }
    const set: string[] = [];
    const nilai: Nilai[] = [];
    for (const [kunci, kolom] of Object.entries(KOLOM) as [keyof DataBooking, string][]) {
      if (ubah[kunci] === undefined) continue;
      set.push(`${kolom} = ?`);
      const v = ubah[kunci];
      nilai.push(kunci === "holdExpiresAt" ? tanggalWaktu(v as string | null) : kunci === "notes" ? (v as string | null)?.trim() || null : (v as Nilai) ?? null);
    }
    if (d.guest !== undefined) {
      set.push("guest_id = ?");
      nilai.push(await simpanTamu(k, d.guest ? { ...d.guest, id: d.guest.id ?? lama.guest?.id } : null));
    }
    if (set.length) await jalankan(`UPDATE bookings SET ${set.join(", ")} WHERE id = ?`, [...nilai, id], k);
    const beda: Record<string, { dari: unknown; ke: unknown }> = {};
    for (const [kunci, v] of Object.entries(ubah)) {
      const sebelum = (lama as unknown as Record<string, unknown>)[kunci];
      if (kunci !== "guest" && kunci !== "conflictGroup" && JSON.stringify(sebelum ?? null) !== JSON.stringify(v ?? null)) beda[kunci] = { dari: sebelum, ke: v };
    }
    await catatAudit(k, id, "ubah", aktor, beda);
    return (await satuBooking(id, k))!;
  });
}

export async function hapusBooking(id: string, aktor: string | null) {
  await transaksi(async (k) => {
    await jalankan("DELETE FROM bookings WHERE id = ?", [id], k);
    await catatAudit(k, id, "hapus", aktor, null);
  });
}

export async function tambahBayar(bookingId: string, p: Omit<Pembayaran, "id" | "recordedBy">, aktor: string | null) {
  return transaksi(async (k) => {
    const id = idBaru();
    await jalankan("INSERT INTO payments (id, booking_id, amount, kind, method, paid_at, reference, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id, bookingId, p.amount, p.kind, p.method, p.paidAt, p.reference?.trim() || null, aktor], k);
    await catatAudit(k, bookingId, "bayar", aktor, { id, ...p });
    return satuBooking(bookingId, k);
  });
}

export async function hapusBayar(bookingId: string, paymentId: string, aktor: string | null) {
  return transaksi(async (k) => {
    await jalankan("DELETE FROM payments WHERE id = ? AND booking_id = ?", [paymentId, bookingId], k);
    await catatAudit(k, bookingId, "hapus-bayar", aktor, { paymentId });
    return satuBooking(bookingId, k);
  });
}

export async function riwayat(bookingId: string) {
  const rows = await kueri("SELECT * FROM audit_log WHERE entity = 'booking' AND entity_id = ? ORDER BY at DESC LIMIT 50", [bookingId]);
  return rows.map((r) => {
    let diff: unknown = null;
    try {
      diff = r.diff_json ? JSON.parse(String(r.diff_json)) : null;
    } catch {
      diff = null;
    }
    return { id: String(r.id), action: String(r.action), actor: (r.actor as string) ?? null, at: iso(r.at)!, diff };
  });
}

/** Tahanan yang sudah lewat batas waktunya dibatalkan otomatis. */
export async function bersihkanTahanan() {
  const r = await jalankan("UPDATE bookings SET status = 'CANCELLED' WHERE status = 'TENTATIVE' AND hold_expires_at IS NOT NULL AND hold_expires_at < UTC_TIMESTAMP(3)");
  return r.affectedRows;
}

export async function semuaTamu(q?: string) {
  const cari = q?.trim();
  const pola = cari ? `%${cari.replace(/[\\%_]/g, (m) => "\\" + m)}%` : null;
  const tamu = await kueri(`SELECT * FROM guests ${pola ? "WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?" : ""} ORDER BY name LIMIT 300`, pola ? [pola, pola, pola] : []);
  if (!tamu.length) return [];
  const pesan = await kueri("SELECT id, code, guest_id, check_in, check_out, status, total_amount FROM bookings WHERE guest_id IN (?) ORDER BY check_in DESC", [tamu.map((g) => String(g.id))]);
  return tamu.map((g) => ({
    id: String(g.id),
    name: String(g.name),
    phone: (g.phone as string) ?? null,
    email: (g.email as string) ?? null,
    origin: (g.origin as string) ?? null,
    diveCert: (g.dive_cert as string) ?? null,
    notes: (g.notes as string) ?? null,
    bookings: pesan
      .filter((b) => b.guest_id === g.id)
      .map((b) => ({ id: String(b.id), code: String(b.code), checkIn: tglSaja(b.check_in), checkOut: tglSaja(b.check_out), status: b.status as Status, totalAmount: angka(b.total_amount) })),
  }));
}

export async function ubahTamu(id: string, t: { name: string; phone: string | null; email: string | null; origin: string | null; diveCert: string | null; notes: string | null }) {
  await jalankan("UPDATE guests SET name = ?, phone = ?, email = ?, origin = ?, dive_cert = ?, notes = ? WHERE id = ?", [t.name, t.phone, t.email, t.origin, t.diveCert, t.notes, id]);
}

/* ------------------------------------------------------------------ kamar */

export interface DataKamar {
  name: string;
  roomType: string | null;
  capAdult: number;
  capChild: number;
  baseRate: number;
  isActive: boolean;
  inactiveReason: string | null;
  sortOrder: number;
  sizeM2: number | null;
  descEn: string;
  descId: string;
  featuresEn: string[];
  featuresId: string[];
}

export async function kamarDenganNama(name: string) {
  return (await kueri<{ id: string }>("SELECT id FROM rooms WHERE name = ?", [name]))[0] ?? null;
}

const spek = (d: DataKamar) => [d.sizeM2, d.descEn || null, d.descId || null, d.featuresEn.join("\n") || null, d.featuresId.join("\n") || null];

export async function buatKamar(d: DataKamar, id = idBaru()) {
  await jalankan(
    "INSERT INTO rooms (id, name, room_type, cap_adult, cap_child, base_rate, is_active, inactive_reason, sort_order, size_m2, desc_en, desc_id, features_en, features_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [id, d.name, d.roomType, d.capAdult, d.capChild, d.baseRate, d.isActive, d.inactiveReason, d.sortOrder, ...spek(d)],
  );
  return id;
}

export async function ubahKamar(id: string, d: DataKamar) {
  await jalankan(
    "UPDATE rooms SET name = ?, room_type = ?, cap_adult = ?, cap_child = ?, base_rate = ?, is_active = ?, inactive_reason = ?, sort_order = ?, size_m2 = ?, desc_en = ?, desc_id = ?, features_en = ?, features_id = ? WHERE id = ?",
    [d.name, d.roomType, d.capAdult, d.capChild, d.baseRate, d.isActive, d.inactiveReason, d.sortOrder, ...spek(d), id],
  );
}

export async function jumlahPesananKamar(id: string) {
  return Number((await kueri<{ n: number }>("SELECT COUNT(*) AS n FROM bookings WHERE room_id = ?", [id]))[0]?.n ?? 0);
}

export async function hapusKamar(id: string) {
  await jalankan("DELETE FROM rooms WHERE id = ?", [id]);
}

export class MusimTumpangError extends Error {
  constructor() {
    super("Rentang itu tumpang tindih dengan tarif musiman lain untuk kamar ini.");
  }
}

/** Tarif musiman. Rentang tertutup [dari, sampai]; dua tarif tidak boleh menutupi hari yang sama untuk satu kamar. */
export async function tambahMusim(m: { roomId: string; dateFrom: string; dateTo: string; rate: number; label: string | null }) {
  await transaksi(async (k) => {
    await kunciKamar(k, m.roomId);
    const tumpang = await kueri("SELECT id FROM seasonal_rates WHERE room_id = ? AND date_from <= ? AND date_to >= ?", [m.roomId, m.dateTo, m.dateFrom], k);
    if (tumpang.length) throw new MusimTumpangError();
    await jalankan("INSERT INTO seasonal_rates (id, room_id, date_from, date_to, rate, label) VALUES (?, ?, ?, ?, ?, ?)", [idBaru(), m.roomId, m.dateFrom, m.dateTo, m.rate, m.label], k);
  });
}

export async function hapusMusim(id: string) {
  await jalankan("DELETE FROM seasonal_rates WHERE id = ?", [id]);
}
