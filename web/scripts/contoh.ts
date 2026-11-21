/**
 * Data contoh untuk mencoba dashboard di komputer sendiri:
 *   npm run db:seed:demo
 * Tidak pernah dijalankan di produksi. Nama tamu ditandai "(contoh)".
 * Membaca DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD dari lingkungan.
 */
import { randomBytes } from "node:crypto";
import mysql from "mysql2/promise";
import { SKEMA } from "../src/lib/server/skema";

const id = () => randomBytes(12).toString("hex");
const tgl = (n: number) => new Date(Date.now() + 9 * 3600000 + n * 86400000).toISOString().slice(0, 10);

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    socketPath: process.env.DB_SOCKET || undefined,
  });
  for (const s of SKEMA) await db.query(s);
  const [[ada]] = (await db.query("SELECT COUNT(*) AS n FROM rooms")) as unknown as [{ n: number }[]];
  if (ada.n > 0) {
    console.log("Sudah ada kamar; data contoh tidak ditambahkan.");
    return db.end();
  }
  const kamar: { id: string; rate: number }[] = [];
  for (const [i, [nama, rate]] of ([["Cottage Jati 1", 1250000], ["Cottage Jati 2", 1250000], ["Cottage Pantai", 1650000], ["Cottage Keluarga", 1950000]] as const).entries()) {
    const k = { id: id(), rate };
    kamar.push(k);
    await db.query("INSERT INTO rooms (id, name, room_type, cap_adult, cap_child, base_rate, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)", [k.id, nama, i === 3 ? "Cottage keluarga" : "Cottage panggung", i === 3 ? 4 : 2, i === 3 ? 2 : 1, rate, i + 1]);
  }
  await db.query("INSERT INTO seasonal_rates (id, room_id, date_from, date_to, rate, label) VALUES (?, ?, ?, ?, ?, ?)", [id(), kamar[2].id, tgl(30), tgl(45), 1950000, "Musim ramai (contoh)"]);
  const tamu = ["Rina Kartika", "Daniel Weber", "Sari Mahendra", "Tom Becker", "Ayu Lestari", "Marco Rossi", "Kenji Sato", "Dewi Anggraini"];
  const asal = ["Jakarta", "Jerman", "Bali", "Belanda", "Surabaya", "Italia", "Jepang", "Makassar"];
  const rencana: [number, number, number, string, string][] = [
    [0, -2, 3, "CHECKED_IN", "WHATSAPP"],
    [1, 0, 4, "CONFIRMED", "BOOKING_COM"],
    [2, 2, 5, "CONFIRMED", "WEBSITE"],
    [3, 5, 9, "TENTATIVE", "WEBSITE"],
    [0, 6, 10, "CONFIRMED", "AGODA"],
    [1, -10, -6, "CHECKED_OUT", "WHATSAPP"],
    [2, -20, -14, "CHECKED_OUT", "AGEN"],
    [3, 12, 16, "CONFIRMED", "AIRBNB"],
  ];
  const komisi: Record<string, number> = { BOOKING_COM: 0.15, AGODA: 0.15, AIRBNB: 0.03, AGEN: 0.1 };
  for (const [i, [k, a, b, status, channel]] of rencana.entries()) {
    const g = id();
    await db.query("INSERT INTO guests (id, name, phone, origin, dive_cert) VALUES (?, ?, ?, ?, ?)", [g, `${tamu[i]} (contoh)`, `+62 812 0000 ${1000 + i}`, asal[i], i % 2 ? "Advanced Open Water" : "Open Water"]);
    const total = kamar[k].rate * (b - a);
    const bk = id();
    await db.query(
      "INSERT INTO bookings (id, code, room_id, guest_id, check_in, check_out, channel, status, source, pax, dives, total_amount, ota_commission_est, created_by, hold_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 2, ?, ?, ?, 'Data contoh', ?)",
      [bk, `BK-DEMO${i}`, kamar[k].id, g, tgl(a), tgl(b), channel, status, channel === "WEBSITE" ? "WEBSITE" : "MANUAL", status === "TENTATIVE" ? null : 4, total, komisi[channel] ? Math.round(total * komisi[channel]) : null, status === "TENTATIVE" ? new Date(Date.now() + 20 * 3600000) : null],
    );
    if (status !== "TENTATIVE")
      await db.query("INSERT INTO payments (id, booking_id, amount, kind, method, paid_at, recorded_by) VALUES (?, ?, ?, ?, 'TRANSFER', ?, 'Data contoh')", [id(), bk, Math.round(total * (status === "CHECKED_OUT" ? 1 : 0.3)), status === "CHECKED_OUT" ? "BALANCE" : "DEPOSIT", tgl(a - 5)]);
  }
  await db.query("INSERT INTO bookings (id, code, room_id, check_in, check_out, channel, status, notes, created_by) VALUES (?, 'BK-DEMOBL', ?, ?, ?, 'BLOCK', 'BLOCKED', 'Perbaikan atap (contoh)', 'Data contoh')", [id(), kamar[1].id, tgl(8), tgl(11)]);
  console.log(`Data contoh: ${kamar.length} kamar, ${rencana.length + 1} pesanan.`);
  await db.end();
})();
