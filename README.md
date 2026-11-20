# Bakoeria Dive Resort — Paket Identitas Merek

| Folder | Isi |
|---|---|
| `dist/Bakoeria-Brand-Identity.zip` | Paket klien: semua aset dan presentasi PDF |
| `brand/Bakoeria-Brand-Guidelines.pdf` | Presentasi panduan merek, 23 halaman A4 mendatar |
| `brand/BRAND-GUIDELINES.md` | Panduan merek dan riset font serta warna |
| `brand/logo/` | 20 SVG logo (4 susunan × 5 warna) dan PNG transparan di `png/` |
| `brand/favicon/` | Ikon situs, ikon aplikasi, avatar 1080 px |
| `brand/tokens/` | Warna dan font sebagai `brand.css`, `colors.json`, `tailwind.config.js` |
| `assets/` | Font WOFF2 (Crimson Pro, Lato) dan potongan foto |
| `web/` | **Aplikasi Next.js (React + Tailwind): situs publik dan dashboard `/kelola`.** Deploy ke Hostinger: `web/DEPLOY.md` |
| `website/` | Versi statis awal situs (acuan desain) |
| `social/export/` | 24 PNG: feed 4:5, carousel, story, sampul highlight, cover Facebook, banner YouTube, gambar OG |
| `social/src/` | Sumber HTML tiap template, bisa diedit teksnya |
| `mockups/export/` | 9 mockup 2400 × 1600: brand board, kartu nama, kop surat, papan nama, kunci, seragam, website, Instagram, perlengkapan selam |
| `research/` | Hasil pencocokan font, tabel kontras, perbandingan logo |
| `tools/` | Skrip pembuat semua aset |

## Membangun ulang
```bash
pip install pillow numpy scipy scikit-learn fonttools brotli potracer
python3 tools/build_logos.py && node tools/batch_logo_png.js
python3 tools/build_social.py && node tools/render_all.js social/jobs.json
python3 tools/build_mockups.py && node tools/render_all.js mockups/jobs.json
python3 tools/build_pdf.py && node tools/render_pdf.js
python3 tools/build_zip.py
```
Perlu Node dengan Playwright. `tools/trace_mark.py` dan `tools/font_match.py` membutuhkan foto logo asli sebagai argumen.

## Catatan
Semua teks program, kontak, dan ulasan adalah contoh. Foto berasal dari satu foto sumber dan perlu diganti dengan foto asli sebelum peluncuran. Font berlisensi SIL OFL 1.1.
