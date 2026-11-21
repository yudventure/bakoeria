# Deploy ke Hostinger (Node.js Web Apps)

Satu aplikasi Next.js (React + Tailwind CSS) dengan database MySQL Hostinger,
dipasang dengan cara yang sama seperti Mambetron Homestay.

| Alamat | Isi |
|---|---|
| `/` | Situs publik bahasa Inggris (bawaan), termasuk cek ketersediaan dan pemesanan langsung |
| `/id` | Situs publik bahasa Indonesia |
| `/kelola` | Dashboard resort |
| `/api/health` | Status server dan database |

## 1. Buat database MySQL

hPanel → **Databases → MySQL Databases**. Buat database dan penggunanya, catat
nama database, nama pengguna, dan kata sandinya (biasanya berawalan
`u123456789_`). Tidak perlu mengimpor apa pun: tabel dibuat sendiri pada
kunjungan pertama. Bila tetap ingin lewat phpMyAdmin, impor `database/skema.sql`.

## 2. Buat aplikasi Node.js

hPanel → **Websites → Node.js Web Apps → Add**, sumber **GitHub**, repositori
`yudventure/bakoeria`.

| Isian | Nilai |
|---|---|
| Branch | `main` (atau branch default repo) |
| Preset framework | Next.js |
| Versi node | 22.x |
| **Root directory** | **`./web`** |
| Build command | `npm run build` |
| Package manager | npm |
| Direktori output | `.next` |
| Entry file | `server.js` |

Root directory wajib `./web`; aplikasinya ada di folder itu.

## 3. Variabel environment

Salin dari `.env.example`, hapus baris yang dikosongkan.

| Variabel | Wajib | Isi |
|---|---|---|
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | ya | Dari langkah 1 |
| `DB_HOST` | tidak | `localhost` (bawaan) |
| `PENYIAPAN_KUNCI` | ya, sekali | Kata acak untuk membuat akun pertama di `/kelola` |
| `SITE_URL` | disarankan | `https://domainanda.com` |
| `SESSION_SECRET` | tidak | 64 karakter acak |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_DARI` | tidak | Email Hostinger untuk pemberitahuan pesanan: `smtp.hostinger.com`, `465` |

Untuk host `localhost`, aplikasi mencoba soket MySQL lebih dulu, lalu
`127.0.0.1`, lalu nama host itu sendiri, seperti Mambetron. Jalur soket tertentu
bisa dipaksa dengan `DB_SOCKET`. `DATABASE_URL` berbentuk
`mysql://pengguna:sandi@host:3306/nama` juga terbaca.

## 4. Deploy dan periksa

1. Jalankan deploy. Log build harus menampilkan `next build --webpack` lalu selesai.
2. Buka `/api/health` → `{"ok":true,"database":"ok"}`.
3. Buka `/kelola` → **Buat akun pertama** dengan `PENYIAPAN_KUNCI`.
4. Isi cottage di **Kamar & tarif** dan kontak di **Website**, lalu coba satu
   pemesanan dari situs publik.

## Catatan versi

**Next.js sengaja dikunci di 16.2.12 dan dibangun dengan webpack**
(`next build --webpack`), sama seperti Mambetron. Mulai 16.3 mesin kompilasi
Next.js butuh glibc yang lebih baru daripada server build Hostinger, sehingga
build gagal dengan pesan tentang `GLIBC_2.29` atau `@next/swc-linux-x64-gnu`.
Turbopack juga bermasalah di server build Hostinger. Jangan menaikkan versi
Next.js sebelum memastikan Hostinger mendukungnya.

Perkakas build (Tailwind, TypeScript) ada di `dependencies`, bukan
`devDependencies`, karena Hostinger bisa melewati devDependencies saat memasang.

## Pencegah pesanan ganda

MySQL tidak punya constraint EXCLUDE seperti PostgreSQL. Setiap penyimpanan yang
bisa membuat kamar terisi berjalan di dalam transaksi READ COMMITTED yang lebih
dulu mengunci baris kamarnya (`SELECT … FOR UPDATE`) lalu memeriksa tumpang
tindih dengan bacaan terkunci. Diuji dengan 60 pemindahan serentak ke tanggal
yang sama: tepat satu per kamar yang lolos.

## Data dan cadangan

| Data | Tempat |
|---|---|
| Kamar, tarif musiman, pesanan, tamu, pembayaran, sinkron iCal, riwayat | MySQL |
| Akun, pengaturan, isi website, keuangan, SDM, gudang | Berkas JSON di `~/.bakoeria-data` (atau `BAKOERIA_DATA_DIR`) |

Cadangkan database lewat backup Hostinger atau phpMyAdmin (Export), dan folder
data lewat File Manager.

## Jalur cadangan

- **Root directory `./`**: akar repo juga punya `package.json` dan `server.js`
  yang membangun `web/` dalam mode standalone.
- **Branch `deploy`**: hasil build siap jalan dari GitHub Actions
  (`.github/workflows/build-web.yml`), tidak membangun apa pun di server.
  Isian: branch `deploy`, root `./`, output `./`, entry `server.js`.

## Pengembangan lokal

```bash
cd web
cp .env.example .env      # isi DB_* dengan MySQL/MariaDB lokal
npm install
npm run db:seed:demo      # opsional: kamar dan pesanan contoh
npm run dev               # http://localhost:3000 dan /kelola
```

Uji: `npm run typecheck` dan `npm run uji`.
