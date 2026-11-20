/**
 * Data contoh untuk mencoba dashboard di komputer sendiri:
 *   npm run db:seed:demo
 * Tidak pernah dijalankan otomatis di produksi. Semua nama tamu dan harga di
 * sini rekaan dan ditandai "(contoh)". Produksi mulai kosong: pemilik mengisi
 * kamar dan tarifnya sendiri dari menu Kamar & tarif.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

if (!process.argv.includes("--demo")) {
  console.log("Tidak ada yang diisi. Jalankan dengan --demo untuk data contoh.");
  process.exit(0);
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const tgl = (n: number) => {
  const d = new Date(Date.now() + 9 * 3600000);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};

async function main() {
  if (await db.room.count()) {
    console.log("Sudah ada kamar; data contoh tidak ditambahkan.");
    return;
  }
  const kamar = [];
  for (const [i, [name, rate]] of ([["Cottage Jati 1", 1250000], ["Cottage Jati 2", 1250000], ["Cottage Pantai", 1650000], ["Cottage Keluarga", 1950000]] as const).entries()) {
    kamar.push(await db.room.create({ data: { name, roomType: i === 3 ? "Cottage keluarga" : "Cottage panggung", capAdult: i === 3 ? 4 : 2, capChild: i === 3 ? 2 : 1, baseRate: rate, sortOrder: i + 1 } }));
  }
  await db.seasonalRate.create({ data: { roomId: kamar[2].id, dateFrom: tgl(30), dateTo: tgl(45), rate: 1950000, label: "Musim ramai (contoh)" } });
  const tamu = ["Rina Kartika", "Daniel Weber", "Sari Mahendra", "Tom Becker", "Ayu Lestari", "Marco Rossi", "Kenji Sato", "Dewi Anggraini"];
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
  for (const [i, [k, a, b, status, channel]] of rencana.entries()) {
    const g = await db.guest.create({ data: { name: `${tamu[i]} (contoh)`, phone: `+62 812 0000 ${1000 + i}`, origin: ["Jakarta", "Jerman", "Bali", "Belanda", "Surabaya", "Italia", "Jepang", "Makassar"][i], diveCert: i % 2 ? "Advanced Open Water" : "Open Water" } });
    const malam = b - a;
    const total = Number(kamar[k].baseRate) * malam;
    const komisi = { BOOKING_COM: 0.15, AGODA: 0.15, AIRBNB: 0.03, AGEN: 0.1 }[channel as "AGODA"] ?? 0;
    const bk = await db.booking.create({
      data: { code: `BK-DEMO${i}`, roomId: kamar[k].id, guestId: g.id, checkIn: tgl(a), checkOut: tgl(b), channel: channel as "WEBSITE", status: status as "CONFIRMED", source: channel === "WEBSITE" ? "WEBSITE" : "MANUAL", pax: 2, dives: status === "TENTATIVE" ? null : 4, totalAmount: total, otaCommissionEst: komisi ? Math.round(total * komisi) : null, createdBy: "Data contoh", holdExpiresAt: status === "TENTATIVE" ? new Date(Date.now() + 20 * 3600000) : null },
    });
    if (status !== "TENTATIVE") await db.payment.create({ data: { bookingId: bk.id, amount: Math.round(total * (status === "CHECKED_OUT" ? 1 : 0.3)), kind: status === "CHECKED_OUT" ? "BALANCE" : "DEPOSIT", method: "TRANSFER", paidAt: tgl(a - 5), recordedBy: "Data contoh" } });
  }
  await db.booking.create({ data: { code: "BK-DEMOBL", roomId: kamar[1].id, checkIn: tgl(8), checkOut: tgl(11), channel: "BLOCK", status: "BLOCKED", notes: "Perbaikan atap (contoh)", createdBy: "Data contoh" } });
  console.log(`Data contoh: ${kamar.length} kamar, ${rencana.length + 1} pesanan.`);
}
main().finally(() => db.$disconnect());
