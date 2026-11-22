"""Menyusun varian logo SVG Bakoeria v2.
Lambang  : hasil vektorisasi logo asli per lapisan warna (tools/logo-trace.json)
Nama     : Spectral Medium, diubah menjadi outline (hasil tools/font_match.py)
Sublabel : Albert Sans Medium, diubah menjadi outline
Ukuran dan jarak diukur dari logo asli 1080 x 1080 (lihat research/logo-measurements.md).
Warna:
  warna     lambang berwarna penuh, nama navy, sublabel pasir (latar putih/terang, versi utama)
  terbalik  lambang dicerahkan, penyelam putih, nama putih (latar gelap)
  navy, putih, hitam   satu warna (cetak satu warna, bordir, stempel, ukiran)"""
import json, pathlib
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
root = pathlib.Path(__file__).resolve().parent.parent
fd = root/'assets/fonts'
T = json.load(open(root/'tools/logo-trace.json')); BB = T['bbox']
serif = TTFont(fd/'spectral-latin-500-normal.woff2')
sans = TTFont(fd/'albert-sans-latin-500-normal.woff2')

def text_path(font, text, cap_h, track):
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
    cap = font['OS/2'].sCapHeight; s = cap_h/cap; x = 0; parts = []
    for i, ch in enumerate(text):
        if ch == ' ': x += font['hmtx'][cmap[32]][0]*s+track*upm*s; continue
        gn = cmap[ord(ch)]; lsb = font['hmtx'][gn][1] if i == 0 else 0
        pen = SVGPathPen(gs, ntos=lambda v: f'{v:.2f}')
        gs[gn].draw(TransformPen(pen, (s, 0, 0, -s, x-lsb*s, cap_h)))
        parts.append(pen.getCommands()); x += (gs[gn].width-lsb)*s
        if i < len(text)-1: x += track*upm*s
    return ''.join(parts), x
def fit(font, text, cap, width):
    lo, hi = -.05, .9
    for _ in range(40):
        mid = (lo+hi)/2
        if text_path(font, text, cap, mid)[1] < width: lo = mid
        else: hi = mid
    return text_path(font, text, cap, lo)+(lo,)

# Ukuran dari logo asli (piksel pada gambar 1080 x 1080). Kotak tiap huruf diukur
# dari kolom tinta; huruf dari font ditaruh di tengah kotaknya masing-masing,
# jadi jarak antarhuruf persis seperti aslinya walaupun lebar font sedikit beda.
X0, Y0 = 191, 176                                   # kiri nama, atas lambang
NAMA_HURUF = [('B', 191, 64), ('A', 279, 82), ('K', 390, 75), ('O', 489, 81), ('E', 602, 55), ('R', 686, 69), ('I', 779, 23), ('A', 826, 77)]
SUB_HURUF = [('D', 331, 25), ('I', 380, 5), ('V', 407, 27), ('E', 457, 19), ('R', 521, 22), ('E', 566, 20), ('S', 608, 22), ('O', 652, 29), ('R', 704, 22), ('T', 747, 23)]
WORD_CAP, WORD_TOP = 77, 728
SUB_CAP, SUB_TOP = 28.5, 846
GARIS = [(215, 83), (798, 83)]; GARIS_Y = 860; LINE_H = 2.8
LEBAR, TINGGI = 712, 699                             # 191..903 x 176..875

def huruf_di(font, items, cap_h):
    """Tiap huruf diskalakan ke tinggi kapital lalu dipusatkan di kotak ukurnya. Koordinat relatif X0."""
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); s = cap_h/font['OS/2'].sCapHeight; parts = []
    from fontTools.pens.boundsPen import BoundsPen
    for ch, x, w in items:
        g = gs[cmap[ord(ch)]]; bp = BoundsPen(gs); g.draw(bp); xmin, _, xmax, _ = bp.bounds
        pusat = x - X0 + w/2; tx = pusat - (xmin+xmax)/2*s
        pen = SVGPathPen(gs, ntos=lambda v: f'{v:.2f}'); g.draw(TransformPen(pen, (s, 0, 0, -s, tx, cap_h))); parts.append(pen.getCommands())
    return ''.join(parts)
word_d = huruf_di(serif, NAMA_HURUF, WORD_CAP)
sub_d = huruf_di(sans, SUB_HURUF, SUB_CAP)
word_w = LEBAR; sub_total = LEBAR
WORD_TO_SUB = SUB_TOP-(WORD_TOP+WORD_CAP); MARK_TO_WORD = WORD_TOP-Y0-(BB[3]-BB[1])
MW, MH = BB[2]-BB[0], BB[3]-BB[1]
MARK_X = BB[0]+T['box'][0]-X0                      # posisi lambang terhadap kiri nama, seperti aslinya

def campur(h, t, ke='#FFFFFF'):
    a = [int(h[i:i+2], 16) for i in (1, 3, 5)]; b = [int(ke[i:i+2], 16) for i in (1, 3, 5)]
    return '#%02X%02X%02X' % tuple(round(x+(y-x)*t) for x, y in zip(a, b))

SKEMA = {
    'warna':    {'ombak': None, 'selam': None, 'pasir': None, 'nama': '#133250', 'sub': '#947C5F'},
    'terbalik': {'ombak': lambda c: campur(c, .38), 'selam': '#FFFFFF', 'pasir': lambda c: campur(c, .3), 'nama': '#FFFFFF', 'sub': '#D8C7A8'},
    'navy':     {'satu': '#133250'},
    'putih':    {'satu': '#FFFFFF'},
    'hitam':    {'satu': '#000000'},
}

def mark(sk, x0, y0, s=1, pre='bk'):
    defs = []; paths = []
    for i, b in enumerate(T['bentuk']):
        if 'satu' in sk: f = sk['satu']
        elif 'grad' in b:
            ubah = sk['ombak'] or (lambda c: c)
            x1, y1, x2, y2 = b['grad']; gid = f'{pre}{i}'
            titik = ''.join(f'<stop offset="{o}" stop-color="{ubah(c)}"/>' for o, c in b['stops'])
            defs.append(f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{titik}</linearGradient>')
            f = f'url(#{gid})'
        else:
            v = sk[b['lapis']]; f = b['fill'] if v is None else v(b['fill']) if callable(v) else v
        paths.append(f'<path fill="{f}" d="{b["d"]}"/>')
    g = f'<g transform="translate({x0:.2f} {y0:.2f}) scale({s:.4f}) translate({-BB[0]:.2f} {-BB[1]:.2f})">{"".join(paths)}</g>'
    return g, ''.join(defs)

def word(sk, x0, y0): return f'<path fill="{sk.get("satu", sk.get("nama"))}" transform="translate({x0:.2f} {y0:.2f})" d="{word_d}"/>'
def sub(sk, x0, y0):
    """Sublabel dan dua garis pengapit; (x0, y0) = kiri blok nama, atas huruf sublabel."""
    f = sk.get('satu', sk.get('sub')); ly = y0+(GARIS_Y-SUB_TOP)-LINE_H/2
    garis = ''.join(f'<rect x="{x0+gx-X0:.2f}" y="{ly:.2f}" width="{gw}" height="{LINE_H}" rx="1.4"/>' for gx, gw in GARIS)
    return f'<g fill="{f}"><path transform="translate({x0:.2f} {y0:.2f})" d="{sub_d}"/>{garis}</g>'

def svg(size, body, defs, title, pad=8):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad} {-pad} {size[0]+2*pad:.1f} {size[1]+2*pad:.1f}" role="img" aria-label="{title}"><title>{title}</title>'
            + (f'<defs>{defs}</defs>' if defs else '') + f'{body}</svg>\n')

W = LEBAR
out = root/'brand/logo'; out.mkdir(parents=True, exist_ok=True)
for f in out.glob('*.svg'): f.unlink()
for nama, sk in SKEMA.items():
    pre = 'bk' + nama[:2]
    # bertumpuk
    wy = MH+MARK_TO_WORD; sy = wy+WORD_CAP+WORD_TO_SUB
    m, d = mark(sk, MARK_X, 0, 1, pre)
    st = m+word(sk, 0, WORD_TOP-Y0)+sub(sk, 0, SUB_TOP-Y0)
    (out/f'bakoeria-logo-stacked-{nama}.svg').write_text(svg((W, TINGGI), st, d, 'Bakoeria Dive Resort'))
    # horizontal: lambang setinggi blok teks x 1,9
    blok = WORD_CAP+WORD_TO_SUB+SUB_CAP; HH = blok*1.9; hs = HH/MH; hm = MW*hs; tx = hm+48
    tw = max(word_w, sub_total); ty = (HH-blok)/2
    m, d = mark(sk, 0, 0, hs, pre)
    hz = m+word(sk, tx+(tw-word_w)/2, ty)+sub(sk, tx+(tw-sub_total)/2, ty+WORD_CAP+WORD_TO_SUB)
    (out/f'bakoeria-logo-horizontal-{nama}.svg').write_text(svg((tx+tw, HH), hz, d, 'Bakoeria Dive Resort'))
    # nama saja
    tw2 = max(word_w, sub_total)
    wm = word(sk, (tw2-word_w)/2, 0)+sub(sk, (tw2-sub_total)/2, WORD_CAP+WORD_TO_SUB)
    (out/f'bakoeria-wordmark-{nama}.svg').write_text(svg((tw2, blok), wm, '', 'Bakoeria Dive Resort'))
    # lambang saja
    m, d = mark(sk, 0, 0, 1, pre)
    (out/f'bakoeria-mark-{nama}.svg').write_text(svg((MW, MH), m, d, 'Lambang Bakoeria'))
print(f'{len(list(out.glob("*.svg")))} svg')
(root/'research/logo-measurements.md').write_text(f'''# Ukuran logo Bakoeria v2

Diukur dari `assets/source/bakoeria-logo-v2.png` (1080 x 1080 px), dipakai oleh `tools/build_logos.py`.

| Ukuran | Nilai |
|---|---|
| Kotak lambang | {MW:.0f} x {MH:.0f} px |
| Lebar nama BAKOERIA | {LEBAR} px (huruf ditaruh di tengah kotak ukurnya) |
| Tinggi huruf kapital nama (Spectral 500) | {WORD_CAP} px |
| Kotak huruf nama (x, lebar) | {", ".join(f"{c} {x},{w}" for c, x, w in NAMA_HURUF)} |
| Tinggi huruf kapital sublabel (Albert Sans 500) | {SUB_CAP} px |
| Kotak huruf sublabel (x, lebar) | {", ".join(f"{c} {x},{w}" for c, x, w in SUB_HURUF)} |
| Garis pengapit | {GARIS[0][1]} x {LINE_H} px di x {GARIS[0][0]} dan {GARIS[1][0]} |
| Lambang ke nama | {MARK_TO_WORD} px |
| Nama ke sublabel | {WORD_TO_SUB} px |
''')
