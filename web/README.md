# Bakoeria Dive Resort — Website dan dashboard

Next.js 16 (React 19) + Tailwind CSS 4 + Prisma 7 + PostgreSQL. Satu resort.
Admin dimodelkan dari Unmehopa Management, tanpa logika multi-properti.

- `/` situs publik dengan cek ketersediaan dan pemesanan langsung
- `/kelola` dashboard: Ringkasan, Kalender, Pesanan, Tamu, Kamar & tarif,
  Sinkronisasi OTA, Laporan, Keuangan & aset, SDM & gaji, Stok gudang,
  Website, Pengguna & peran, Pengaturan

Cara deploy ke Hostinger: [DEPLOY.md](DEPLOY.md).

| Folder | Isi |
|---|---|
| `src/app` | Halaman dan API route |
| `src/components/admin` | Dashboard |
| `src/components/situs` | Situs publik |
| `src/lib` | Logika murni (tanggal, tarif, iCal, peran) dan modul server |
| `prisma` | Skema, migrasi, data contoh |
| `scripts/package.mjs` | Mengemas hasil build untuk Hostinger |
