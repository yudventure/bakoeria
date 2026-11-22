# Aturan kerja repo ini

## "Brand identity" selalu berarti paket lengkap
Saat diminta membuat brand identity, hasil akhirnya wajib mencakup:
1. **File ZIP untuk klien** (`dist/<Nama>-Brand-Identity.zip`) berisi semua aset: logo, warna dan font, website, sosial media, mockup.
2. **Presentasi PDF untuk klien** di dalam ZIP itu (panduan identitas merek).

Bangun ulang dengan `python3 tools/build_pdf.py && node tools/render_pdf.js && python3 tools/build_zip.py`. Rantai lengkap (logo, favicon, sosial media, mockup) ada di bagian akhir `brand/BRAND-GUIDELINES.md`.

## Akurasi logo
Logo klien tidak digambar ulang dengan tangan. Vektorisasi dari file sumber (`tools/trace_mark.py`), cocokkan font secara terukur (`tools/font_match.py`), dan tunjukkan perbandingan dengan aslinya (`tools/banding_logo.py`, hasilnya `research/logo-accuracy.png`).

Logo resmi saat ini adalah v2 (`assets/source/bakoeria-logo-v2.png`: ombak, penyelam, rumah panggung, ukiran). Logo emas v1 sudah tidak dipakai; arsipnya di `research/v1-emas/`.
