"""Favicon, ikon aplikasi, dan avatar dari lambang v2 (brand/logo/bakoeria-mark-warna.svg).
Lambang aslinya dibuat untuk latar putih (penyelamnya navy), jadi ikon selalu
berlatar putih agar tetap terbaca di tab gelap.
  python3 tools/build_favicon.py && node tools/build_favicon.js"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
m = (root/'brand/logo/bakoeria-mark-warna.svg').read_text()
vb = [float(x) for x in re.search(r'viewBox="([^"]+)"', m).group(1).split()]
isi = re.search(r'<svg[^>]*>(.*)</svg>', m, re.S).group(1)
isi = re.sub(r'<title>.*?</title>', '', isi)
def ikon(skala, rx, nama):
    S = 512; w = S*skala; s = w/max(vb[2], vb[3]); h = vb[3]*s; ww = vb[2]*s
    g = f'<g transform="translate({(S-ww)/2:.1f} {(S-h)/2:.1f}) scale({s:.4f}) translate({-vb[0]:.1f} {-vb[1]:.1f})">{isi}</g>'
    (root/f'brand/favicon/{nama}').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}"><rect width="{S}" height="{S}" rx="{rx}" fill="#FFFFFF"/>{g}</svg>\n')
d = root/'brand/favicon'; d.mkdir(parents=True, exist_ok=True)
for f in d.glob('*'): f.unlink()
ikon(.9, 104, 'icon.svg')               # favicon dan ikon kecil: lambang sebesar mungkin
ikon(.72, 0, 'icon-maskable.svg')       # Android: zona aman 80%
ikon(.74, 0, 'avatar.svg')              # foto profil (dipotong lingkaran)
print('svg siap')
