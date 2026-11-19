# Bakoeria Dive Resort — Panduan Identitas Merek v1.0

Dokumen ini menjelaskan keputusan desain dan riset di baliknya. Semua angka di bawah dihitung dari foto logo yang diberikan (1536 × 1024 px), dengan skrip di folder `tools/`.

## 1. Logo

### Cara logo dibuat ulang
- **Lambang** (gazebo beratap rumbia, tiga ombak, pohon kelapa) divektorisasi langsung dari logo asli, bukan digambar ulang. Skrip: `tools/trace_mark.py`.
- **Nama "BAKOERIA"** dan **"DIVE RESORT"** dipasang ulang dengan font hasil pencocokan (lihat bagian 2), lalu diubah menjadi outline sehingga file SVG tidak bergantung pada font terpasang.
- Lebar nama, tinggi huruf, jarak antarhuruf, panjang garis, dan jarak vertikal semuanya diukur dari logo asli dan dipakai apa adanya. Skrip: `tools/build_logos.py`.

Perbandingan asli (kiri) dan hasil vektor (kanan): `research/logo-accuracy.png`.

| Ukuran pada logo asli | Nilai |
|---|---|
| Lebar lambang | 360 px |
| Lebar nama | 572 px, tinggi huruf 68 px |
| Jarak antarhuruf nama | 0,065 em |
| Tinggi huruf sublabel | 28 px, jarak antarhuruf 0,284 em |
| Garis pengapit | panjang 70 px, tebal 3,6 px, jarak ke teks 30 px |
| Jarak lambang ke nama | 39 px |
| Jarak nama ke sublabel | 24 px |

**Batasan yang perlu diketahui.** Sumbernya foto, bukan file vektor. Lambang hanya selebar 360 px di foto, jadi detail halus seperti rumbai atap mengikuti resolusi itu. Font nama adalah yang paling mirip dari sekitar 30 keluarga yang diuji, bukan jaminan font aslinya. Jika file logo asli (AI, EPS, SVG, atau PDF) tersedia, pakai itu sebagai master.

### Varian (`brand/logo/`)
| File | Pemakaian |
|---|---|
| `bakoeria-logo-stacked-*` | Logo utama. Sampul, papan nama, hero website |
| `bakoeria-logo-horizontal-*` | Header website, kop surat, tanda tangan email |
| `bakoeria-mark-*` | Avatar, favicon, stempel, bordir |
| `bakoeria-wordmark-*` | Saat lambang sudah tampil terpisah di dekatnya |

Warna tiap varian: `gold` (gradasi, untuk layar), `gold-flat` (satu warna, untuk cetak dan bordir), `navy`, `ivory`, `black`. Setiap SVG punya PNG transparan di `brand/logo/png/`.

### Aturan
- **Ruang aman:** kosongkan area di semua sisi sebesar tinggi huruf "B" pada nama.
- **Ukuran minimum:** logo lengkap 32 mm cetak atau 140 px layar. Lambang saja 10 mm atau 24 px.
- **Latar:** emas hanya di atas Malam Laut, Malam Dalam, Malam Lembut, atau Kayu Jati. Di atas latar terang pakai varian navy.
- **Jangan:** meregangkan, memutar, mengganti font nama, memberi bayangan, atau menaruh logo emas di atas latar terang.

## 2. Tipografi: riset pemilihan font

### Metode
Tiap huruf pada logo asli dipotong dari foto, dinormalkan ke tinggi yang sama, lalu dibandingkan bentuknya dengan huruf yang sama dari tiap kandidat. Skornya IoU (luas irisan dibagi luas gabungan), dirata-rata untuk semua huruf. Skor 1,0 berarti identik. Kandidat diambil dari Google Fonts agar bebas lisensi (SIL OFL) dan mudah dipakai di web, Canva, dan cetak. Skrip: `tools/font_match.py`. Hasil mentah: `research/font-match.json`. Perbandingan visual: `research/font-candidates.png`.

### Hasil untuk nama "BAKOERIA" (sekitar 30 keluarga serif, 105 gaya, bobot 400 sampai 900)
| Peringkat | Font dan bobot | Skor kemiripan (IoU) | Lebar relatif |
|---|---|---|---|
| 1 | crimson-pro-500 | 0.825 | ×1.05 |
| 2 | spectral-500 | 0.815 | ×1.06 |
| 3 | spectral-600 | 0.812 | ×1.12 |
| 4 | crimson-pro-400 | 0.802 | ×1.01 |
| 5 | libre-baskerville-600 | 0.797 | ×1.14 |
| 6 | lusitana-700 | 0.795 | ×1.09 |
| 7 | lora-500 | 0.791 | ×0.96 |
| 8 | lora-600 | 0.790 | ×0.99 |

Cinzel, yang sekilas tampak cocok karena bergaya huruf Romawi, hanya mendapat 0,747 (Bold) dan 0,672 (Medium). Kontras tebal-tipisnya terlalu tajam dan proporsinya terlalu lebar.

### Hasil untuk "DIVE RESORT" (sekitar 30 keluarga sans-serif, bobot 300 sampai 800)
| Peringkat | Font dan bobot | Skor kemiripan (IoU) | Lebar relatif |
|---|---|---|---|
| 1 | lato-700 | 0.866 | ×1.03 |
| 2 | dm-sans-700 | 0.858 | ×1.03 |
| 3 | cabin-700 | 0.856 | ×1.02 |
| 4 | figtree-600 | 0.855 | ×1.00 |
| 5 | plus-jakarta-sans-700 | 0.853 | ×1.03 |
| 6 | poppins-600 | 0.850 | ×1.01 |
| 7 | dm-sans-800 | 0.848 | ×1.04 |
| 8 | urbanist-700 | 0.847 | ×1.00 |

### Keputusan
| Peran | Font | Alasan |
|---|---|---|
| Judul dan nama | **Crimson Pro** Medium (500) | Skor tertinggi. Serif gaya buku lama dengan kontras sedang, terasa hangat dan elegan tanpa kaku. Punya italic asli untuk kutipan dan tagline, serta 8 bobot |
| Label dan teks | **Lato** Bold (700) untuk label, Light (300) untuk paragraf | Skor tertinggi untuk sublabel. Sans humanis yang ramah, sangat terbaca di ukuran kecil dan di layar ponsel |

Spectral menjadi cadangan untuk judul bila Crimson Pro tidak tersedia. Font sistem cadangan: Georgia dan Helvetica Neue atau Arial.

### Aturan pakai
| Gaya | Font | Ukuran web | Jarak huruf | Catatan |
|---|---|---|---|---|
| Judul besar | Crimson Pro 500, kapital | 30 sampai 50 px | 0,07 em | Sama dengan jarak huruf logo |
| Subjudul | Crimson Pro 500 | 20 sampai 23 px | 0,05 em | Huruf besar-kecil |
| Tagline, kutipan | Crimson Pro Italic 400 | 20 sampai 27 px | 0 | |
| Label, tombol, menu | Lato 700, kapital | 11 sampai 13 px | 0,22 sampai 0,28 em | Sama dengan "DIVE RESORT" |
| Paragraf | Lato 300 | 16 sampai 17 px, baris 1,7 | 0 | Maksimal 65 karakter per baris |
| Angka (jam, harga) | Crimson Pro, lining tabular | | | `font-variant-numeric: lining-nums tabular-nums` |

File font ada di `assets/fonts/` (WOFF2, subset Latin) dan dimuat lewat `assets/fonts.css`.

## 3. Warna: riset palet

### Sumber
Warna dominan foto diambil dengan pengelompokan k-means (10 kelompok):

| Warna foto | Porsi |
|---|---|
| `#031C3D` | 33.0% |
| `#422D1B` | 14.3% |
| `#18170F` | 13.5% |
| `#6B4A1E` | 10.7% |
| `#9E6A1D` | 7.1% |
| `#D69521` | 5.1% |
| `#EAB15F` | 4.7% |
| `#C0A796` | 4.5% |
| `#91725D` | 4.5% |
| `#F5DB9D` | 2.5% |

Sepertiga foto adalah navy langit malam, sekitar sepertiga lagi cokelat kayu, dan sisanya rentang emas dari ambar pekat sampai krem. Palet merek mengikuti proporsi itu.

### Palet
| Nama | Hex | Peran |
|---|---|---|
| Malam Laut | `#041C3E` | Warna dasar: latar utama, teks gelap |
| Malam Dalam | `#020F26` | Latar footer, bagian paling gelap |
| Malam Lembut | `#0B2A5B` | Permukaan kartu di atas Malam Laut |
| Emas Lentera | `#E2B05E` | Logo, judul, garis, tombol utama |
| Emas Muda | `#F5DB9D` | Sorotan, judul besar di atas gelap |
| Emas Tua | `#B98A3A` | Ujung gradasi, garis di atas terang |
| Ambar Lampu | `#D69521` | Aksen cahaya hangat, ikon aktif |
| Kayu Jati | `#422D1B` | Permukaan hangat: papan, kemasan |
| Jati Terang | `#6B4A1E` | Garis dan bayangan hangat |
| Pasir | `#E6D5B3` | Teks pendukung dan latar netral |
| Gading | `#F7F0DF` | Teks di atas gelap, latar cetak |
| Palem | `#7E9A3A` | Aksen: status baik, alam |
| Karang | `#2A8A93` | Aksen: konteks selam siang hari |

Gradasi emas logo: `#F8E7B0` ke `#EECB7C` ke `#D6A851`, sudut 160°.
Karang ditambahkan di luar foto sebagai satu-satunya warna dingin, khusus untuk materi selam siang hari.

**Proporsi pemakaian:** navy 60%, jati dan pasir 20%, emas 15%, aksen 5%. Emas terasa mewah karena dipakai sedikit.

### Kontras (WCAG 2.2)
| Teks / elemen | Latar | Rasio | Hasil WCAG 2.2 |
|---|---|---|---|
| Emas Lentera | Malam Laut | 8.55:1 | AAA |
| Emas Muda | Malam Laut | 12.49:1 | AAA |
| Gading | Malam Laut | 14.90:1 | AAA |
| Pasir | Malam Laut | 11.71:1 | AAA |
| Emas Lentera | Malam Lembut | 7.09:1 | AAA |
| Emas Lentera | Kayu Jati | 6.54:1 | AA |
| Gading | Kayu Jati | 11.39:1 | AAA |
| Malam Laut | Gading | 14.90:1 | AAA |
| Malam Laut | Emas Lentera | 8.55:1 | AAA |
| Emas Tua | Gading | 2.73:1 | Gagal |
| Malam Laut | Pasir | 11.71:1 | AAA |
| Palem | Malam Laut | 5.30:1 | AA |
| Karang | Malam Laut | 4.15:1 | AA besar saja |
| Gading | Karang | 3.59:1 | AA besar saja |
| Malam Laut | Karang | 4.15:1 | AA besar saja |
| Ambar Lampu | Malam Laut | 6.59:1 | AA |
| Emas Lentera | Gading | 1.74:1 | Gagal |

Kesimpulan praktis:
- Semua kombinasi emas atau gading di atas navy lolos AAA.
- **Emas di atas gading gagal (1,74:1).** Di latar terang, teks selalu navy dan emas hanya untuk garis atau ornamen.
- Karang hanya untuk judul besar, ikon, atau bidang warna. Jangan untuk teks kecil.

## 4. Gaya visual
- **Foto:** jam biru dan malam dengan cahaya lampu hangat. Untuk siang hari, air jernih dan cahaya alami. Hindari filter tebal.
- **Garis:** emas tipis 1 sampai 2 px. Bingkai tipis berjarak dari tepi pada materi sosial media.
- **Ornamen:** pola "garis, lambang, garis" sebagai pembatas.
- **Sudut:** siku, tanpa lengkung. Bayangan hanya pada mockup, tidak pada desain datar.

## 5. Suara merek
Hangat, tenang, jelas. Seperti pemandu selam yang ramah. Tagline utama: **"Menyelam siang, bermalam di bawah bintang."** Cadangan: "Tempat laut menjadi rumah."

Tulis seperti ini: "Briefing selam pukul 07.30 di dermaga. Peralatan sudah kami siapkan."
Jangan seperti ini: "PROMO GILA-GILAAN!!! Booking sekarang!"

## 6. Yang masih perlu Anda isi
Teks program, jadwal, fasilitas cottage, ulasan tamu, nomor WhatsApp, email, dan akun Instagram di semua file adalah contoh. Foto hanya berasal dari satu foto yang diberikan dan perlu diganti dengan foto asli resor dan bawah laut.
