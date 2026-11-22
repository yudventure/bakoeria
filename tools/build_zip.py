"""Mengemas paket klien: dist/Bakoeria-Brand-Identity.zip (aset + presentasi PDF)."""
import zipfile, pathlib
root=pathlib.Path(__file__).resolve().parent.parent; top='Bakoeria-Brand-Identity/'
MAP=[('brand/Bakoeria-Brand-Guidelines.pdf','01-Presentasi/Bakoeria-Brand-Guidelines.pdf'),
     ('brand/logo','02-Logo'),('brand/favicon','02-Logo/Favicon-dan-Avatar'),('brand/pattern','09-Pola-Khas'),
     ('brand/tokens','03-Warna-dan-Font/Token'),('assets/fonts','03-Warna-dan-Font/Font'),('assets/fonts.css','03-Warna-dan-Font/fonts.css'),
     ('website','04-Website'),('social/export','05-Sosial-Media'),('mockups/export','06-Mockup'),('assets/img','07-Foto'),
     ('assets/source/bakoeria-logo-v2.png','02-Logo/Sumber/bakoeria-logo-asli.png'),
     ('research/logo-accuracy.png','08-Riset/logo-asli-vs-vektor.png'),('research/logo-accuracy.json','08-Riset/logo-akurasi.json'),('research/logo-measurements.md','08-Riset/ukuran-logo.md'),
     ('research/font-match.json','08-Riset/pencocokan-font.json'),('research/contrast-table.md','08-Riset/tabel-kontras.md')]
BACA='''BAKOERIA DIVE RESORT - PAKET IDENTITAS MEREK v2.0
(logo ombak, penyelam, rumah panggung, dan ukiran)

01-Presentasi     Panduan identitas merek (PDF, 25 halaman)
02-Logo           Logo SVG dan PNG transparan: bertumpuk (stacked), horizontal, lambang (mark), nama (wordmark).
                  Warna: warna (utama, untuk latar putih/terang), terbalik (untuk latar gelap),
                  navy, putih, hitam (satu warna: cetak, stempel, bordir, ukiran).
                  Favicon-dan-Avatar: ikon situs, ikon aplikasi, dan foto profil.
                  Sumber: file logo asli yang divektorisasi.
03-Warna-dan-Font Kode warna (CSS, JSON, Tailwind) dan font Spectral serta Albert Sans (lisensi SIL OFL 1.1).
04-Website        Contoh situs satu halaman statis. Buka index.html.
                  (Website resort yang tayang, beserta dashboard, ada di repositori proyek, folder web/.)
05-Sosial-Media   24 PNG: feed, carousel, story, sampul highlight, cover Facebook, YouTube, WhatsApp.
06-Mockup         10 mockup 2400 x 1600 px.
07-Foto           Potongan foto sumber.
08-Riset          Perbandingan logo asli dan hasil vektor, hasil pencocokan font, tabel kontras warna.
09-Pola-Khas      Pola khas "Ukir Ombak", diambil dari ukiran di lambang. Cara pakai: SATU motif besar yang samar
                  di sudut bidang (bakoeria-ukiran-*; variasi -cermin, -sayap, -lembah, -beriring). Versi sederhana untuk ikon dan cap (bakoeria-ukir-ikon-*,
                  bakoeria-ukir-cap-*). Turunan untuk kemasan dan kain: pola ulang (bakoeria-pola-*), pita, medali.

Catatan: teks program, kontak, dan ulasan masih contoh. Foto perlu diganti dengan foto asli resor.
'''
out=root/'dist'; out.mkdir(exist_ok=True); z=zipfile.ZipFile(out/'Bakoeria-Brand-Identity.zip','w',zipfile.ZIP_DEFLATED); n=0
for src,dst in MAP:
    p=root/src
    files=[p] if p.is_file() else sorted(f for f in p.rglob('*') if f.is_file())
    for f in files:
        rel=dst if p.is_file() else f'{dst}/{f.relative_to(p)}'
        z.write(f,top+rel); n+=1
z.writestr(top+'BACA-SAYA.txt',BACA); z.close(); print(n+1,'file')
