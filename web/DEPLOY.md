# Deploy ke Hostinger (Node.js Web Apps)

Satu aplikasi Next.js (React + Tailwind CSS) melayani dua hal:

| Alamat | Isi | Untuk |
|---|---|---|
| `/` | Situs publik Bakoeria Dive Resort, termasuk pemesanan langsung | tamu |
| `/kelola` | Dashboard resort | pemilik dan staf |
| `/version.json` | Commit yang sedang tayang | pemeriksaan deploy |
| `/api/health` | Status server dan database | monitor |

Cara kerjanya sama dengan Unmehopa Management: **build di GitHub Actions, hasilnya
diterbitkan ke branch `deploy`, dan Hostinger menariknya.** Hostinger tidak pernah
menjalankan `next build`, karena build butuh sekitar 1,5 GB memori.

## Yang dibutuhkan

1. **Paket Hostinger dengan Node.js Web Apps** (Business Web Hosting atau Cloud).
2. **Database PostgreSQL.** Hostinger hosting bersama hanya menyediakan MySQL, jadi
   pakai Postgres terkelola, misalnya Neon atau Supabase (paket gratis cukup untuk
   mulai). Catat dua alamat: yang *pooled* (untuk aplikasi) dan yang *direct*
   (untuk migrasi).
3. Repositori ini di GitHub dengan branch `main`.

Kenapa PostgreSQL: pencegah pesanan ganda dijaga oleh database
(`EXCLUDE USING gist`), bukan oleh kode. Dua resepsionis yang menyimpan kamar sama
pada detik yang sama tetap tidak bisa membuat dua pesanan bertabrakan.

## Langkah 1: GitHub

Di **Settings → Secrets and variables → Actions**:

| Jenis | Nama | Isi |
|---|---|---|
| Secret | `DIRECT_URL` | Alamat Postgres *direct* (untuk migrasi otomatis) |
| Variable | `SITE_URL` | `https://domainanda.com` (opsional; workflow menunggu sampai build baru tayang) |

Lalu push ke `main`. Workflow **Build web** (`.github/workflows/build-web.yml`)
akan menjalankan typecheck, uji, build, migrasi database, dan menerbitkan hasilnya
ke branch `deploy`.

## Langkah 2: Hostinger

Di hPanel → **Websites → Node.js Web Apps → Add**, pilih sumber **GitHub** dan
beri izin repositori ini.

```
Repositori       : yudventure/bakoeria
Branch           : deploy          <- bukan main
Preset framework : Next.js
Build command    : npm run build   <- di branch deploy ini tidak membangun apa-apa
Direktori output : ./
Entry file       : server.js
Versi Node       : 22
Root directory   : ./
```

Formulir Hostinger mewajibkan build command dan direktori output. Branch `deploy`
membawa script `build` yang hanya mencetak satu kalimat, dan direktori outputnya
memang akar branch itu (`server.js`, `.next`, `public`, `node_modules`).
Jangan pilih `npm run start` sebagai build command: server akan menyala sebagai
langkah build lalu menggantung.

## Langkah 3: Variabel lingkungan di Hostinger

Di panel aplikasi Node.js → **Environment variables**:

| Variabel | Wajib | Tanpa ini |
|---|---|---|
| `DATABASE_URL` | ya | Situs publik tetap tayang, tetapi dashboard dan pemesanan online mati dengan pesan yang jelas |
| `PENYIAPAN_KUNCI` | ya, sekali | Akun pertama tidak bisa dibuat |
| `SITE_URL` | disarankan | Pratinjau tautan memakai localhost |
| `SESSION_SECRET` | tidak | Dibuat sekali dan disimpan di folder data |
| `BAKOERIA_DATA_DIR` | tidak | Memakai `~/.bakoeria-data` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_DARI` | tidak | Pesanan website tidak dikirim lewat email (tetap masuk dashboard). Untuk email Hostinger: `smtp.hostinger.com`, port `465` |

Daftar lengkap ada di `.env.example`. Jangan mengisi `PORT`: Hostinger yang
menentukannya dan `server.js` membacanya sendiri.

Pilih **Save and redeploy**.

## Langkah 4: Pemeriksaan

1. Buka `https://domainanda.com/version.json`. `commit` harus sama dengan commit
   terakhir di `main`.
2. Buka `https://domainanda.com/api/health`. Harus `{"ok":true,"database":"ok"}`.
3. Buka `/kelola`. Halamannya menawarkan **Buat akun pertama**. Isi dengan
   `PENYIAPAN_KUNCI`, nama, email, dan sandi. Akun ini menjadi developer.
4. Di dashboard: tambahkan cottage di **Kamar & tarif**, lalu isi kontak di
   **Website**, lalu coba satu pemesanan dari situs publik.

## Data dan cadangan

| Data | Tempat |
|---|---|
| Kamar, tarif musiman, pesanan, tamu, pembayaran, sinkron iCal, riwayat perubahan | PostgreSQL |
| Akun, pengaturan, isi website, keuangan, SDM, gudang | Berkas JSON di `BAKOERIA_DATA_DIR` (bawaan `~/.bakoeria-data`) |

Folder data ada **di luar folder aplikasi**, jadi deploy ulang tidak menghapusnya.
Cadangkan keduanya: database lewat fitur backup penyedia Postgres, dan folder
data lewat File Manager atau backup harian Hostinger.

## Sinkronisasi OTA

Di **Sinkronisasi OTA**, tambahkan satu sambungan per cottage per OTA. Tempel
alamat iCal dari extranet OTA, lalu tempel alamat ekspor dari dashboard ke OTA.
Sambungan dibaca ulang otomatis tiap 15 menit selama dashboard dibuka, atau
segera lewat tombol **Sinkronkan OTA**.

## Pengembangan lokal

```bash
cd web
cp .env.example .env          # isi DATABASE_URL dan PENYIAPAN_KUNCI
npm install
npx prisma migrate deploy
npm run db:seed:demo          # opsional: kamar dan pesanan contoh
npm run dev                   # http://localhost:3000 dan /kelola
```

Uji: `npm run typecheck` dan `npm run uji`.
