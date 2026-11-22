"""Membandingkan logo vektor (brand/logo/bakoeria-logo-stacked-warna.svg) dengan logo asli.
Hasil: research/logo-accuracy.png dan angka IoU per bagian.
  python3 tools/banding_logo.py   (butuh node + playwright untuk merender SVG)"""
import re, subprocess, pathlib, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
root = pathlib.Path(__file__).resolve().parent.parent
svgf = root/'brand/logo/bakoeria-logo-stacked-warna.svg'
s = svgf.read_text(); vb = [float(x) for x in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
tmp = pathlib.Path('/tmp/bk-banding'); tmp.mkdir(exist_ok=True)
(tmp/'a.html').write_text(f'<body style="margin:0;background:#fff">{s.replace("<svg ", f"<svg width=\"{vb[2]:.0f}\" height=\"{vb[3]:.0f}\" ", 1)}</body>')
subprocess.run(['node', str(root/'tools/render.js'), str(tmp/'a.html'), str(tmp/'a.png'), str(int(round(vb[2]))), str(int(round(vb[3])))], check=True)
src = Image.open(root/'assets/source/bakoeria-logo-v2.png').convert('RGB')
vec = Image.open(tmp/'a.png').convert('RGB')
canvas = Image.new('RGB', src.size, 'white'); canvas.paste(vec, (round(191+vb[0]), round(176+vb[1])))
a = np.asarray(src).astype(int); b = np.asarray(canvas).astype(int)
ma = a.min(2) < 190; mb = b.min(2) < 190
hasil = {'utuh': (ma & mb).sum()/(ma | mb).sum()}
for nm, (y0, y1) in {'lambang': (160, 700), 'nama': (720, 815), 'sublabel': (836, 882)}.items():
    A, B = ma[y0:y1], mb[y0:y1]; hasil[nm] = (A & B).sum()/(A | B).sum()
for k, v in hasil.items(): print(f'IoU {k}: {v:.3f}')
ov = np.full(a.shape, 255); ov[ma & ~mb] = [214, 48, 49]; ov[mb & ~ma] = [30, 110, 220]; ov[ma & mb] = [160, 160, 160]
crop = (170, 160, 920, 890)
S, V, O = Image.fromarray(a.astype('uint8')).crop(crop), canvas.crop(crop), Image.fromarray(ov.astype('uint8')).crop(crop)
W, H = S.size; out = Image.new('RGB', (W*3+80, H+80), 'white'); d = ImageDraw.Draw(out)
f = ImageFont.truetype(str(root/'tools/_lbl.ttf'), 24) if (root/'tools/_lbl.ttf').exists() else None
for i, (im, t) in enumerate([(S, 'Logo asli'), (V, 'Hasil vektor'), (O, 'Tumpang: abu sama, merah hanya asli, biru hanya vektor')]):
    out.paste(im, (i*(W+40), 70)); d.text((i*(W+40)+6, 24), t, fill='#133250', font=f)
out.save(root/'research/logo-accuracy.png')
json.dump({k: round(float(v), 3) for k, v in hasil.items()}, open(root/'research/logo-accuracy.json', 'w'), indent=1)
