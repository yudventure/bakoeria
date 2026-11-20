import "server-only";
import { randomBytes } from "node:crypto";
import { lookup } from "node:dns/promises";
import net from "node:net";

import { db } from "@/lib/db";
import { MENEMPATI, type Channel } from "@/lib/booking";
import { bacaIcal, tulisIcal } from "@/lib/ical";
import { dariTanggal, galatBentrok, keTanggal } from "./buku";

/**
 * Sinkronisasi kalender dengan OTA lewat iCal.
 *
 * Tiap sambungan (IcalFeed) adalah satu kamar di satu OTA: alamat impor dari
 * extranet OTA, dan token ekspor yang ditempel balik ke OTA itu. Ekspor sebuah
 * sambungan tidak memuat event yang datang dari sambungan itu sendiri, supaya
 * blokir tidak dipantulkan balik ke OTA asalnya.
 *
 * UID event disimpan sebagai `<feedId>:<uid>`, jadi tiap siklus tarik
 * memperbarui booking yang sama alih-alih menduplikasinya. Event yang hilang
 * dari feed dibatalkan. Event yang ditolak constraint anti-bentrok disimpan
 * sebagai CONFLICT, karena booking itu sudah terjadi di OTA dan membuangnya
 * berarti kehilangan data.
 */

export const tokenBaru = () => randomBytes(16).toString("hex");

export function tebakChannel(label: string | null | undefined): Channel {
  const l = (label ?? "").toLowerCase();
  if (l.includes("booking")) return "BOOKING_COM";
  if (l.includes("agoda")) return "AGODA";
  if (l.includes("traveloka")) return "TRAVELOKA";
  if (l.includes("airbnb")) return "AIRBNB";
  return "AGEN";
}

function ipPribadi(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const s = ip.toLowerCase();
  return s === "::1" || s === "::" || s.startsWith("fc") || s.startsWith("fd") || s.startsWith("fe80") || s.startsWith("::ffff:");
}

/** Mengambil feed dengan pengaman: hanya http(s) publik, 5 MB, 20 detik, maksimal 4 pengalihan. */
export async function ambilFeed(alamat: string): Promise<string> {
  let url = alamat.trim().replace(/^webcal:/i, "https:");
  for (let i = 0; i < 5; i++) {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) throw new Error("Alamat harus http atau https.");
    const host = u.hostname.replace(/^\[|\]$/g, "");
    const ips = net.isIP(host) ? [host] : (await lookup(host, { all: true })).map((x) => x.address);
    if (!ips.length || ips.some(ipPribadi)) throw new Error("Alamat mengarah ke jaringan internal dan ditolak.");
    const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "BakoeriaCalendarSync/1.0" } });
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
      url = new URL(r.headers.get("location")!, url).toString();
      continue;
    }
    if (!r.ok) throw new Error(`Situs menjawab ${r.status}.`);
    const buf = await r.arrayBuffer();
    if (buf.byteLength > 5 * 1024 * 1024) throw new Error("Feed lebih dari 5 MB.");
    const teks = new TextDecoder().decode(buf);
    if (!teks.includes("BEGIN:VCALENDAR")) throw new Error("Isi alamat itu bukan kalender iCal.");
    return teks;
  }
  throw new Error("Terlalu banyak pengalihan.");
}

/** Satu siklus tarik untuk satu sambungan. Gagal membaca tidak pernah melepas kamar yang terisi. */
export async function tarik(feedId: string) {
  const feed = await db().icalFeed.findUnique({ where: { id: feedId } });
  if (!feed?.url) return null;
  const run = await db().syncRun.create({ data: { feedId } });
  const hitung = { eventsSeen: 0, createdCount: 0, updatedCount: 0, cancelledCount: 0 };
  try {
    const hariIni = new Date().toISOString().slice(0, 10);
    const events = bacaIcal(await ambilFeed(feed.url)).filter((e) => !e.batal && e.selesai >= hariIni);
    hitung.eventsSeen = events.length;
    const awalan = `${feed.id}:`;
    const lama = await db().booking.findMany({ where: { externalUid: { startsWith: awalan } } });
    const peta = new Map(lama.map((b) => [b.externalUid!, b]));
    const terlihat = new Set<string>();
    for (const e of events) {
      const uid = awalan + e.uid;
      terlihat.add(uid);
      const ada = peta.get(uid);
      const catatan = `Dari iCal ${feed.otaLabel ?? ""}: ${e.ringkasan}`.trim();
      if (ada) {
        if (dariTanggal(ada.checkIn) === e.mulai && dariTanggal(ada.checkOut) === e.selesai && ada.status !== "CANCELLED") continue;
        try {
          await db().booking.update({ where: { id: ada.id }, data: { checkIn: keTanggal(e.mulai), checkOut: keTanggal(e.selesai), status: ada.status === "CONFLICT" || ada.status === "CANCELLED" ? "CONFIRMED" : ada.status, conflictGroup: null } });
        } catch (err) {
          if (!galatBentrok(err)) throw err;
          await db().booking.update({ where: { id: ada.id }, data: { checkIn: keTanggal(e.mulai), checkOut: keTanggal(e.selesai), status: "CONFLICT", conflictGroup: `${feed.roomId}:${e.mulai}` } });
        }
        hitung.updatedCount++;
      } else {
        const dasar = { code: "IC-" + randomBytes(3).toString("hex").toUpperCase(), roomId: feed.roomId, checkIn: keTanggal(e.mulai), checkOut: keTanggal(e.selesai), channel: tebakChannel(feed.otaLabel), source: "ICAL" as const, externalUid: uid, notes: catatan, createdBy: "Sinkron iCal" };
        try {
          await db().booking.create({ data: { ...dasar, status: "CONFIRMED" } });
        } catch (err) {
          if (!galatBentrok(err)) throw err;
          await db().booking.create({ data: { ...dasar, status: "CONFLICT", conflictGroup: `${feed.roomId}:${e.mulai}` } });
        }
        hitung.createdCount++;
      }
    }
    for (const b of lama) {
      if (!terlihat.has(b.externalUid!) && dariTanggal(b.checkOut) >= hariIni && b.status !== "CANCELLED") {
        await db().booking.update({ where: { id: b.id }, data: { status: "CANCELLED", conflictGroup: null } });
        hitung.cancelledCount++;
      }
    }
    await db().syncRun.update({ where: { id: run.id }, data: { ...hitung, finishedAt: new Date() } });
    await db().icalFeed.update({ where: { id: feed.id }, data: { lastSuccessAt: new Date(), failCount: 0, lastError: null } });
    return { ok: true as const, ...hitung };
  } catch (e) {
    const pesan = e instanceof Error ? e.message : String(e);
    await db().syncRun.update({ where: { id: run.id }, data: { ...hitung, finishedAt: new Date(), error: pesan } });
    await db().icalFeed.update({ where: { id: feed.id }, data: { lastErrorAt: new Date(), lastError: pesan, failCount: { increment: 1 } } });
    return { ok: false as const, galat: pesan, ...hitung };
  }
}

/** Tarik semua sambungan aktif yang terakhir dibaca lebih dari `menit` lalu. */
export async function tarikYangBasi(menit = 15) {
  const batas = new Date(Date.now() - menit * 60000);
  const feeds = await db().icalFeed.findMany({ where: { isActive: true, url: { not: null }, OR: [{ lastSuccessAt: null }, { lastSuccessAt: { lt: batas } }] } });
  const hasil = [];
  for (const f of feeds) hasil.push({ id: f.id, ...(await tarik(f.id)) });
  return hasil;
}

export async function kalenderKeluar(token: string): Promise<string | null> {
  const feed = await db().icalFeed.findUnique({ where: { exportToken: token }, include: { room: true } });
  if (!feed || !feed.isActive) return null;
  const sejak = new Date(Date.now() - 2 * 86400000);
  const rows = await db().booking.findMany({
    where: {
      roomId: feed.roomId,
      status: { in: MENEMPATI },
      checkOut: { gte: sejak },
      // Kolom NULL harus disebut terang-terangan: NOT (NULL LIKE ...) bernilai NULL di SQL,
      // dan tanpa cabang ini semua pesanan manual ikut tersaring sehingga feed kosong.
      OR: [{ externalUid: null }, { NOT: { externalUid: { startsWith: `${feed.id}:` } } }],
    },
    select: { checkIn: true, checkOut: true },
  });
  return tulisIcal(`${feed.room.name} - Bakoeria`, rows.map((r) => ({ mulai: dariTanggal(r.checkIn), selesai: dariTanggal(r.checkOut) })));
}
