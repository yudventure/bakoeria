# Bakoeria Dive Resort: Panduan Identitas Merek v2.0

Versi lengkap bergambar: `brand/Bakoeria-Brand-Guidelines.pdf`. Paket klien: `dist/Bakoeria-Brand-Identity.zip`.

Versi 2.0 menggantikan identitas lama (logo emas di atas navy). Logo resminya sekarang lambang bundar berisi ombak, penyelam, rumah panggung, pohon kelapa, dan ukiran, dengan nama navy dan sublabel pasir. Aset versi lama disimpan di `research/v1-emas/`.

## Logo

- Sumber: `assets/source/bakoeria-logo-v2.png` (1080 x 1080 px), divektorisasi dengan `tools/trace_mark.py`, tidak digambar ulang.
- Lapisan lambang: ombak bergradasi biru ke toska, penyelam navy, serta palem, rumah, dan ukiran berwarna pasir. Batang kelapa melebur ke ombak dalam satu bentuk bergradasi.
- Kecocokan dengan aslinya (IoU, 1 = identik): lambang 0,970; logo utuh 0,917. Bukti: `research/logo-accuracy.png`.
- Susunan: bertumpuk (utama), horizontal, lambang saja, nama saja.
- Warna:
  - `warna`: versi utama, hanya untuk latar putih atau sangat terang.
  - `terbalik`: untuk latar gelap. Ombak dan pasir dicerahkan, penyelam dan nama putih.
  - `navy`, `putih`, `hitam`: satu warna untuk cetak satu warna, stempel, bordir, dan ukiran.
- Ruang aman: setinggi huruf "B" di semua sisi.
- Ukuran minimum: logo lengkap 30 mm atau 140 px; lambang 12 mm atau 32 px.
- Jangan: meregangkan, memutar, memisah bagian lambang, mengganti warna lapisan, memberi bayangan, atau memakai versi warna di latar gelap.

## Tipografi

Dipilih lewat `tools/font_match.py`: tiap huruf logo dibandingkan dengan 144 font serif dan 238 font sans (skor siluet dan kerangka).

| Peran | Font | Catatan |
|---|---|---|
| Nama, judul | Spectral 500 | Skor gabungan 0,710, tertinggi untuk "BAKOERIA" |
| Tagline, kutipan | Spectral Italic 400 | |
| Sublabel, label, tombol | Albert Sans 500 sampai 700, kapital, jarak huruf 0,2 sampai 0,3 em | Skor gabungan 0,865 untuk "DIVE RESORT" |
| Paragraf | Albert Sans 400 | Baris 1,65 |

Kedua font berlisensi SIL OFL 1.1 dan disertakan di `assets/fonts/`.

## Warna

Lima warna inti diukur dari logo; sisanya diturunkan untuk latar dan teks. Token: `brand/tokens/`.

| Nama | Hex | Pakai untuk |
|---|---|---|
| Navy Samudra | #133250 | Nama di logo, judul, teks utama |
| Laut Dalam | #0A2440 | Latar gelap, footer |
| Biru Ombak | #0F6490 | Ombak, tautan, tombol utama |
| Toska Karang | #188B9A | Ujung gradasi ombak, aksen |
| Busa Toska | #D7EEF0 | Latar lembut, sorotan |
| Pasir Pantai | #947C5F | Palem, rumah, ukiran, sublabel |
| Pasir Tua | #6B5840 | Teks bernuansa pasir di latar terang |
| Pasir Muda | #E9DFCD | Latar hangat, garis pemisah |
| Kerang | #F7F3EC | Latar halaman dan cetak |
| Putih Garam | #FFFFFF | Latar logo utama |

Gradasi Ombak: `linear-gradient(135deg,#0F4F7B,#0F6490 45%,#188B9A)`.

Kontras (WCAG 2.2, lengkapnya di `research/contrast-table.md`): Navy Samudra di atas putih 13,13:1 (AAA); Biru Ombak di atas putih 6,47:1 (AA); Pasir Pantai dan Toska Karang hanya untuk teks besar atau bidang warna.

## Gaya dan suara

- Latar putih atau kerang dengan banyak ruang kosong; lengkung ombak dan sudut membulat.
- Foto: air jernih dan cahaya alami siang hari; lampu hangat cottage saat senja dan malam.
- Suara: hangat, tenang, jelas, seperti pemandu selam yang ramah. Tanpa huruf kapital berteriak.
- Tagline: "Menyelam siang, bermalam di bawah bintang." (Inggris: "Dive by day, sleep under the stars.")

## Membangun ulang aset

```bash
python3 tools/trace_mark.py assets/source/bakoeria-logo-v2.png tools/logo-trace.json
python3 tools/build_tokens.py && python3 tools/build_logos.py && python3 tools/banding_logo.py
python3 tools/build_favicon.py && node tools/build_favicon.js && node tools/batch_logo_png.js
python3 tools/build_social.py && node tools/render_all.js social/jobs.json
python3 tools/build_mockups.py && node tools/render_all.js mockups/jobs.json
python3 tools/build_pdf.py && node tools/render_pdf.js && python3 tools/build_zip.py
```
