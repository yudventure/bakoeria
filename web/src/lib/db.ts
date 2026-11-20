import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../generated/prisma/client";

/**
 * Satu-satunya tempat klien database dibuat.
 *
 * Tanpa `DATABASE_URL` aplikasi tetap menyala: situs publik dan halaman masuk
 * jalan, dan dashboard mengatakan di layar bahwa database belum disambungkan.
 * `db()` sendiri melempar, karena layar yang gagal memuat lebih jujur daripada
 * kalender kosong yang seolah-olah memang tidak ada tamu.
 *
 * Prisma 7 tersambung lewat driver `pg` biasa, jadi `output: "standalone"`
 * tidak bisa ketinggalan biner engine.
 */
const simpanan = globalThis as unknown as { prisma?: PrismaClient };

export function databaseReady(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function db(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diisi. Periksa databaseReady() sebelum memanggil db().");
  if (!simpanan.prisma) simpanan.prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  return simpanan.prisma;
}
