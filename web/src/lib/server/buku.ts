import "server-only";

import { db } from "@/lib/db";
import { kodeBooking, MENEMPATI, rincianHarga, type Channel, type PaymentKind, type PaymentMethod, type Status } from "@/lib/booking";
import { Prisma } from "../../../generated/prisma/client";

/**
 * Semua akses database untuk kamar, booking, tamu, dan pembayaran.
 * Tanggal keluar-masuk sebagai string "YYYY-MM-DD"; Decimal sebagai number.
 */

const keTanggal = (s: string) => new Date(s + "T00:00:00Z");
const dariTanggal = (d: Date) => d.toISOString().slice(0, 10);
const angka = (d: Prisma.Decimal | null | undefined) => (d == null ? null : Number(d));

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
  musim: { id: string; dateFrom: string; dateTo: string; rate: number; label: string | null }[];
}

export async function ambilKamar(semua = true): Promise<Kamar[]> {
  const rows = await db().room.findMany({
    where: semua ? {} : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { seasonalRates: { orderBy: { dateFrom: "asc" } } },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    roomType: r.roomType,
    capAdult: r.capAdult,
    capChild: r.capChild,
    baseRate: Number(r.baseRate),
    isActive: r.isActive,
    inactiveReason: r.inactiveReason,
    sortOrder: r.sortOrder,
    musim: r.seasonalRates.map((s) => ({ id: s.id, dateFrom: dariTanggal(s.dateFrom), dateTo: dariTanggal(s.dateTo), rate: Number(s.rate), label: s.label })),
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

const sertakan = { room: true, guest: true, payments: { orderBy: { paidAt: "asc" as const } } };
type BarisBooking = Prisma.BookingGetPayload<{ include: typeof sertakan }>;

function bentuk(b: BarisBooking): Pesanan {
  return {
    id: b.id,
    code: b.code,
    roomId: b.roomId,
    roomName: b.room.name,
    checkIn: dariTanggal(b.checkIn),
    checkOut: dariTanggal(b.checkOut),
    channel: b.channel as Channel,
    status: b.status as Status,
    source: b.source,
    pax: b.pax,
    dives: b.dives,
    totalAmount: angka(b.totalAmount),
    otaCommissionEst: angka(b.otaCommissionEst),
    notes: b.notes,
    holdExpiresAt: b.holdExpiresAt?.toISOString() ?? null,
    conflictGroup: b.conflictGroup,
    createdBy: b.createdBy,
    createdAt: b.createdAt.toISOString(),
    guest: b.guest
      ? { id: b.guest.id, name: b.guest.name, phone: b.guest.phone, email: b.guest.email, origin: b.guest.origin, diveCert: b.guest.diveCert }
      : null,
    payments: b.payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      kind: p.kind,
      method: p.method,
      paidAt: dariTanggal(p.paidAt),
      reference: p.reference,
      recordedBy: p.recordedBy,
    })),
  };
}

/** Booking yang menyentuh rentang [dari, sampai). */
export async function bookingDalam(dari: string, sampai: string): Promise<Pesanan[]> {
  const rows = await db().booking.findMany({
    where: { checkIn: { lt: keTanggal(sampai) }, checkOut: { gt: keTanggal(dari) } },
    include: sertakan,
    orderBy: { checkIn: "asc" },
  });
  return rows.map(bentuk);
}

export async function cariBooking(opsi: { q?: string; status?: Status | ""; dari?: string; sampai?: string; ambil?: number }): Promise<Pesanan[]> {
  const where: Prisma.BookingWhereInput = {};
  if (opsi.status) where.status = opsi.status;
  if (opsi.dari) where.checkOut = { gt: keTanggal(opsi.dari) };
  if (opsi.sampai) where.checkIn = { lt: keTanggal(opsi.sampai) };
  const q = opsi.q?.trim();
  if (q) {
    where.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { guest: { name: { contains: q, mode: "insensitive" } } },
      { guest: { phone: { contains: q } } },
      { notes: { contains: q, mode: "insensitive" } },
    ];
  }
  const rows = await db().booking.findMany({ where, include: sertakan, orderBy: { checkIn: "desc" }, take: opsi.ambil ?? 200 });
  return rows.map(bentuk);
}

export async function satuBooking(id: string): Promise<Pesanan | null> {
  const b = await db().booking.findUnique({ where: { id }, include: sertakan });
  return b ? bentuk(b) : null;
}

/** Galat dari constraint anti-bentrok, dikenali dari kode Postgres 23P01 di pesan mana pun ia dibungkus. */
export function galatBentrok(e: unknown): boolean {
  const s = JSON.stringify(e, Object.getOwnPropertyNames(e ?? {})) + String(e);
  return s.includes("23P01") || s.includes("bookings_no_overlap") || s.includes("exclusion constraint");
}

export class BentrokError extends Error {
  constructor(public lawan: Pesanan[]) {
    super("Kamar sudah terisi pada sebagian tanggal itu.");
  }
}

/** Booking aktif yang menempati kamar itu dalam rentang, kecuali `kecuali`. */
export async function penghuni(roomId: string, masuk: string, keluar: string, kecuali?: string): Promise<Pesanan[]> {
  const rows = await db().booking.findMany({
    where: {
      roomId,
      status: { in: MENEMPATI },
      checkIn: { lt: keTanggal(keluar) },
      checkOut: { gt: keTanggal(masuk) },
      ...(kecuali ? { id: { not: kecuali } } : {}),
    },
    include: sertakan,
  });
  return rows.map(bentuk);
}

export async function hargaOtomatis(roomId: string, masuk: string, keluar: string) {
  const k = (await ambilKamar()).find((r) => r.id === roomId);
  if (!k) return null;
  return rincianHarga(masuk, keluar, k.baseRate, k.musim);
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
}

async function catatAudit(tx: Prisma.TransactionClient, entityId: string, action: string, actor: string | null, diff: unknown) {
  await tx.auditLog.create({ data: { entity: "booking", entityId, action, actor, diffJson: diff as Prisma.InputJsonValue } });
}

async function simpanTamu(tx: Prisma.TransactionClient, g: DataBooking["guest"]): Promise<string | null> {
  if (!g || !g.name?.trim()) return null;
  const data = {
    name: g.name.trim(),
    phone: g.phone?.trim() || null,
    email: g.email?.trim() || null,
    origin: g.origin?.trim() || null,
    diveCert: g.diveCert?.trim() || null,
  };
  if (g.id) {
    await tx.guest.update({ where: { id: g.id }, data });
    return g.id;
  }
  return (await tx.guest.create({ data })).id;
}

export async function buatBooking(d: DataBooking, aktor: string | null): Promise<Pesanan> {
  if (MENEMPATI.includes(d.status)) {
    const lawan = await penghuni(d.roomId, d.checkIn, d.checkOut);
    if (lawan.length) throw new BentrokError(lawan);
  }
  try {
    const id = await db().$transaction(async (tx) => {
      const guestId = await simpanTamu(tx, d.guest);
      let code = kodeBooking();
      for (let i = 0; i < 5 && (await tx.booking.findUnique({ where: { code } })); i++) code = kodeBooking();
      const b = await tx.booking.create({
        data: {
          code,
          roomId: d.roomId,
          guestId,
          checkIn: keTanggal(d.checkIn),
          checkOut: keTanggal(d.checkOut),
          channel: d.channel,
          status: d.status,
          source: d.source ?? "MANUAL",
          externalUid: d.externalUid ?? null,
          pax: d.pax ?? null,
          dives: d.dives ?? null,
          totalAmount: d.totalAmount ?? null,
          otaCommissionEst: d.otaCommissionEst ?? null,
          notes: d.notes?.trim() || null,
          holdExpiresAt: d.holdExpiresAt ? new Date(d.holdExpiresAt) : null,
          createdBy: aktor,
        },
      });
      await catatAudit(tx, b.id, "buat", aktor, d);
      return b.id;
    });
    return (await satuBooking(id))!;
  } catch (e) {
    if (galatBentrok(e)) throw new BentrokError(await penghuni(d.roomId, d.checkIn, d.checkOut));
    throw e;
  }
}

export async function ubahBooking(id: string, d: Partial<DataBooking>, aktor: string | null): Promise<Pesanan> {
  const lama = await satuBooking(id);
  if (!lama) throw new Error("Pesanan tidak ditemukan.");
  const akhir = {
    roomId: d.roomId ?? lama.roomId,
    checkIn: d.checkIn ?? lama.checkIn,
    checkOut: d.checkOut ?? lama.checkOut,
    status: d.status ?? lama.status,
  };
  if (MENEMPATI.includes(akhir.status)) {
    const lawan = await penghuni(akhir.roomId, akhir.checkIn, akhir.checkOut, id);
    if (lawan.length) throw new BentrokError(lawan);
  }
  try {
    await db().$transaction(async (tx) => {
      const data: Prisma.BookingUncheckedUpdateInput = {};
      if (d.roomId !== undefined) data.roomId = d.roomId;
      if (d.checkIn !== undefined) data.checkIn = keTanggal(d.checkIn);
      if (d.checkOut !== undefined) data.checkOut = keTanggal(d.checkOut);
      if (d.channel !== undefined) data.channel = d.channel;
      if (d.status !== undefined) {
        data.status = d.status;
        if (d.status !== "CONFLICT") data.conflictGroup = null;
        if (d.status !== "TENTATIVE") data.holdExpiresAt = null;
      }
      if (d.pax !== undefined) data.pax = d.pax;
      if (d.dives !== undefined) data.dives = d.dives;
      if (d.totalAmount !== undefined) data.totalAmount = d.totalAmount;
      if (d.otaCommissionEst !== undefined) data.otaCommissionEst = d.otaCommissionEst;
      if (d.notes !== undefined) data.notes = d.notes?.trim() || null;
      if (d.holdExpiresAt !== undefined) data.holdExpiresAt = d.holdExpiresAt ? new Date(d.holdExpiresAt) : null;
      if (d.guest !== undefined) data.guestId = await simpanTamu(tx, d.guest ? { ...d.guest, id: d.guest.id ?? lama.guest?.id } : null);
      await tx.booking.update({ where: { id }, data });
      const beda: Record<string, { dari: unknown; ke: unknown }> = {};
      for (const [k, v] of Object.entries(d)) {
        const sebelum = (lama as unknown as Record<string, unknown>)[k];
        if (k !== "guest" && JSON.stringify(sebelum) !== JSON.stringify(v)) beda[k] = { dari: sebelum, ke: v };
      }
      await catatAudit(tx, id, "ubah", aktor, beda);
    });
  } catch (e) {
    if (galatBentrok(e)) throw new BentrokError(await penghuni(akhir.roomId, akhir.checkIn, akhir.checkOut, id));
    throw e;
  }
  return (await satuBooking(id))!;
}

export async function hapusBooking(id: string, aktor: string | null) {
  await db().$transaction(async (tx) => {
    await tx.booking.delete({ where: { id } });
    await catatAudit(tx, id, "hapus", aktor, null);
  });
}

export async function tambahBayar(bookingId: string, p: Omit<Pembayaran, "id" | "recordedBy">, aktor: string | null) {
  await db().$transaction(async (tx) => {
    const r = await tx.payment.create({
      data: { bookingId, amount: p.amount, kind: p.kind, method: p.method, paidAt: keTanggal(p.paidAt), reference: p.reference?.trim() || null, recordedBy: aktor },
    });
    await catatAudit(tx, bookingId, "bayar", aktor, { id: r.id, ...p });
  });
  return satuBooking(bookingId);
}

export async function hapusBayar(bookingId: string, paymentId: string, aktor: string | null) {
  await db().$transaction(async (tx) => {
    await tx.payment.delete({ where: { id: paymentId } });
    await catatAudit(tx, bookingId, "hapus-bayar", aktor, { paymentId });
  });
  return satuBooking(bookingId);
}

export async function riwayat(bookingId: string) {
  const rows = await db().auditLog.findMany({ where: { entity: "booking", entityId: bookingId }, orderBy: { at: "desc" }, take: 50 });
  return rows.map((r) => ({ id: r.id, action: r.action, actor: r.actor, at: r.at.toISOString(), diff: r.diffJson }));
}

/** Tahanan yang sudah lewat batas waktunya dibatalkan otomatis. Dipanggil saat kalender dimuat. */
export async function bersihkanTahanan() {
  const r = await db().booking.updateMany({
    where: { status: "TENTATIVE", holdExpiresAt: { lt: new Date() } },
    data: { status: "CANCELLED" },
  });
  return r.count;
}

export async function semuaTamu(q?: string) {
  const rows = await db().guest.findMany({
    where: q?.trim()
      ? { OR: [{ name: { contains: q.trim(), mode: "insensitive" } }, { phone: { contains: q.trim() } }, { email: { contains: q.trim(), mode: "insensitive" } }] }
      : {},
    include: { bookings: { select: { id: true, code: true, checkIn: true, checkOut: true, status: true, totalAmount: true }, orderBy: { checkIn: "desc" } } },
    orderBy: { name: "asc" },
    take: 300,
  });
  return rows.map((g) => ({
    id: g.id,
    name: g.name,
    phone: g.phone,
    email: g.email,
    origin: g.origin,
    diveCert: g.diveCert,
    notes: g.notes,
    bookings: g.bookings.map((b) => ({ id: b.id, code: b.code, checkIn: dariTanggal(b.checkIn), checkOut: dariTanggal(b.checkOut), status: b.status as Status, totalAmount: angka(b.totalAmount) })),
  }));
}

export { keTanggal, dariTanggal };
