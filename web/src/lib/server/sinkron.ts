import "server-only";
import { randomBytes } from "node:crypto";
import { lookup } from "node:dns/promises";
import net from "node:net";

import { idBaru, jalankan, kueri } from "@/lib/db";
import { MENEMPATI, type Channel, type Status } from "@/lib/booking";
import { bacaIcal, tulisIcal } from "@/lib/ical";
import { buatBooking, ubahBooking } from "./buku";

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
 * berarti kehilangan data. Semua penulisan lewat buatBooking/ubahBooking,
 * jadi impor tunduk pada kunci kamar yang sama dengan pesanan manual.
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
  const feed = (await kueri("SELECT * FROM ical_feeds WHERE id = ?", [feedId]))[0];
  if (!feed?.url) return null;
  const runId = idBaru();
  await jalankan("INSERT INTO sync_runs (id, feed_id) VALUES (?, ?)", [runId, feedId]);
  const hitung = { eventsSeen: 0, createdCount: 0, updatedCount: 0, cancelledCount: 0 };
  const label = (feed.ota_label as string) ?? "";
  const roomId = String(feed.room_id);
  try {
    const hariIni = new Date().toISOString().slice(0, 10);
    const events = bacaIcal(await ambilFeed(String(feed.url))).filter((e) => !e.batal && e.selesai >= hariIni);
    hitung.eventsSeen = events.length;
    const awalan = `${feedId}:`;
    const lama = await kueri<{ id: string; external_uid: string; check_in: string; check_out: string; status: string }>(
      "SELECT id, external_uid, check_in, check_out, status FROM bookings WHERE external_uid LIKE ?",
      [awalan + "%"],
    );
    const peta = new Map(lama.map((b) => [b.external_uid, b]));
    const terlihat = new Set<string>();
    for (const e of events) {
      const uid = awalan + e.uid;
      terlihat.add(uid);
      const ada = peta.get(uid);
      if (ada) {
        if (String(ada.check_in).slice(0, 10) === e.mulai && String(ada.check_out).slice(0, 10) === e.selesai && ada.status !== "CANCELLED") continue;
        await ubahBooking(ada.id, { checkIn: e.mulai, checkOut: e.selesai, status: ada.status === "CONFLICT" || ada.status === "CANCELLED" ? "CONFIRMED" : (ada.status as Status) }, "Sinkron iCal", { bentrokJadiKonflik: true });
        hitung.updatedCount++;
      } else {
        await buatBooking(
          { roomId, checkIn: e.mulai, checkOut: e.selesai, channel: tebakChannel(label), status: "CONFIRMED", source: "ICAL", externalUid: uid, notes: `Dari iCal ${label}: ${e.ringkasan}`.trim() },
          "Sinkron iCal",
          { bentrokJadiKonflik: true },
        );
        hitung.createdCount++;
      }
    }
    for (const b of lama) {
      if (!terlihat.has(b.external_uid) && String(b.check_out).slice(0, 10) >= hariIni && b.status !== "CANCELLED") {
        await jalankan("UPDATE bookings SET status = 'CANCELLED', conflict_group = NULL WHERE id = ?", [b.id]);
        hitung.cancelledCount++;
      }
    }
    await jalankan("UPDATE sync_runs SET events_seen = ?, created_count = ?, updated_count = ?, cancelled_count = ?, finished_at = UTC_TIMESTAMP(3) WHERE id = ?", [hitung.eventsSeen, hitung.createdCount, hitung.updatedCount, hitung.cancelledCount, runId]);
    await jalankan("UPDATE ical_feeds SET last_success_at = UTC_TIMESTAMP(3), fail_count = 0, last_error = NULL WHERE id = ?", [feedId]);
    return { ok: true as const, ...hitung };
  } catch (e) {
    const pesan = e instanceof Error ? e.message : String(e);
    await jalankan("UPDATE sync_runs SET events_seen = ?, created_count = ?, updated_count = ?, cancelled_count = ?, finished_at = UTC_TIMESTAMP(3), error = ? WHERE id = ?", [hitung.eventsSeen, hitung.createdCount, hitung.updatedCount, hitung.cancelledCount, pesan, runId]);
    await jalankan("UPDATE ical_feeds SET last_error_at = UTC_TIMESTAMP(3), last_error = ?, fail_count = fail_count + 1 WHERE id = ?", [pesan, feedId]);
    return { ok: false as const, galat: pesan, ...hitung };
  }
}

/** Tarik semua sambungan aktif yang terakhir dibaca lebih dari `menit` lalu. */
export async function tarikYangBasi(menit = 15) {
  const feeds = await kueri<{ id: string }>(
    "SELECT id FROM ical_feeds WHERE is_active = 1 AND url IS NOT NULL AND url <> '' AND (last_success_at IS NULL OR last_success_at < UTC_TIMESTAMP(3) - INTERVAL ? MINUTE)",
    [menit],
  );
  const hasil = [];
  for (const f of feeds) hasil.push({ id: f.id, ...(await tarik(f.id)) });
  return hasil;
}

/** Kalender keluar. Tidak memuat pesanan yang datang dari sambungan itu sendiri. */
export async function kalenderKeluar(token: string): Promise<string | null> {
  const feed = (await kueri("SELECT f.id, f.room_id, f.is_active, r.name AS room_name FROM ical_feeds f JOIN rooms r ON r.id = f.room_id WHERE f.export_token = ?", [token]))[0];
  if (!feed || !feed.is_active) return null;
  const sejak = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  const rows = await kueri<{ check_in: string; check_out: string }>(
    "SELECT check_in, check_out FROM bookings WHERE room_id = ? AND status IN (?) AND check_out >= ? AND (external_uid IS NULL OR external_uid NOT LIKE ?)",
    [String(feed.room_id), MENEMPATI, sejak, `${feed.id}:%`],
  );
  return tulisIcal(`${feed.room_name} - Bakoeria`, rows.map((r) => ({ mulai: String(r.check_in).slice(0, 10), selesai: String(r.check_out).slice(0, 10) })));
}
