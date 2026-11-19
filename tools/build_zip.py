"""Mengemas paket klien: dist/Bakoeria-Brand-Identity.zip (aset + presentasi PDF)."""
import zipfile, pathlib
root=pathlib.Path(__file__).resolve().parent.parent; top='Bakoeria-Brand-Identity/'
MAP=[('brand/Bakoeria-Brand-Guidelines.pdf','01-Presentasi/Bakoeria-Brand-Guidelines.pdf'),
     ('brand/logo','02-Logo'),('brand/favicon','02-Logo/Favicon-dan-Avatar'),
     ('brand/tokens','03-Warna-dan-Font/Token'),('assets/fonts','03-Warna-dan-Font/Font'),('assets/fonts.css','03-Warna-dan-Font/fonts.css'),
     ('website','04-Website'),('social/export','05-Sosial-Media'),('mockups/export','06-Mockup'),('assets/img','07-Foto')]
BACA='''BAKOERIA DIVE RESORT - PAKET IDENTITAS MEREK v1.0

01-Presentasi     Panduan identitas merek (PDF, 23 halaman)
02-Logo           Logo SVG dan PNG transparan: bertumpuk, horizontal, lambang, nama.
                  Warna: gold (gradasi, layar), gold-flat (cetak, bordir), navy, ivory, black.
                  Favicon-dan-Avatar: ikon situs dan foto profil.
03-Warna-dan-Font Kode warna (CSS, JSON, Tailwind) dan font Crimson Pro serta Lato (lisensi SIL OFL 1.1).
04-Website        Situs satu halaman. Buka index.html.
05-Sosial-Media   24 PNG: feed, carousel, story, sampul highlight, cover Facebook, YouTube, WhatsApp.
06-Mockup         9 mockup 2400 x 1600 px.
07-Foto           Potongan foto sumber.

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
