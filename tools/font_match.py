"""Riset font: cocokkan tiap huruf logo asli dengan kandidat Google Fonts (paket @fontsource).
Tiap huruf dipotong dari gambar logo, dinormalkan ke tinggi yang sama, lalu
dibandingkan bentuknya (IoU) dengan glyph kandidat. Skor = rata-rata dari IoU siluet dan IoU kerangka (tidak terpengaruh tebal garis).
  python3 tools/font_match.py assets/source/bakoeria-logo-v2.png /tmp/fx/npm/node_modules/@fontsource research/font-match.json
Kotak potong di bawah diukur dari logo v2 (1080 x 1080)."""
import sys, glob, os, io, json, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont
from skimage.morphology import skeletonize, binary_dilation, disk
SRC, FDIR, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(SRC).convert('RGB')
NAMA = ((185, 722, 908, 812), 'BAKOERIA')
SUB = ((325, 840, 775, 880), 'DIVERESORT')   # tanpa garis pengapit di kiri dan kanan

def mask(box, S=6):
    c = im.crop(box); c = c.resize((c.width*S, c.height*S), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))
    a = np.asarray(c).astype(float); lum = .3*a[..., 0]+.59*a[..., 1]+.11*a[..., 2]
    return lum < 175
def letters(m, n):
    cols = m.sum(0) > 0; runs = []; s = None
    for i, v in enumerate(cols):
        if v and s is None: s = i
        if not v and s is not None: runs.append((s, i)); s = None
    if s is not None: runs.append((s, len(cols)))
    runs = [r for r in runs if r[1]-r[0] > 6]
    out = []
    for a, b in runs:
        sub = m[:, a:b]; rows = np.where(sub.sum(1) > 0)[0]; out.append(sub[rows[0]:rows[-1]+1])
    return out, runs
H = 120
def norm(g):
    g = Image.fromarray((g*255).astype('uint8')); w = max(1, round(g.width*H/g.height)); return np.asarray(g.resize((w, H), Image.BICUBIC)) > 127
def glyph(font, ch):
    l, t, r, b = font.getbbox(ch); img = Image.new('L', (r-l+8, b-t+8), 0); ImageDraw.Draw(img).text((4-l, 4-t), ch, 255, font=font)
    a = np.asarray(img) > 127; ys, xs = np.where(a); return a[ys.min():ys.max()+1, xs.min():xs.max()+1]
def iou(a, b):
    w = max(a.shape[1], b.shape[1])
    def pad(x):
        p = w-x.shape[1]; return np.pad(x, ((0, 0), (p//2, p-p//2)))
    a, b = pad(a), pad(b); return (a & b).sum()/((a | b).sum())
def kerangka(g):
    """Bentuk tanpa pengaruh tebal garis: kerangka huruf yang ditebalkan seragam."""
    return binary_dilation(skeletonize(g), disk(4))
def run(box, text, paths, label):
    m = mask(box); L, runs = letters(m, len(text))
    assert len(L) == len(text), (len(L), text)
    L = [norm(x) for x in L]
    res = []
    for path in paths:
        try:
            buf = io.BytesIO(); f = TTFont(path); f.flavor = None; f.save(buf); buf.seek(0)
            font = ImageFont.truetype(buf, 300)
            G = [norm(glyph(font, ch)) for ch in text]
            sc = [iou(l, g) for l, g in zip(L, G)]
            sk = float(np.mean([iou(kerangka(l), kerangka(g)) for l, g in zip(L, G)]))
            wr = np.mean([norm(glyph(font, ch)).shape[1]/l.shape[1] for l, ch in zip(L, text)])
            res.append((round((float(np.mean(sc))+sk)/2, 4), os.path.basename(path).replace('-latin', '').replace('-normal.woff2', ''), float(wr), [round(float(np.mean(sc)), 3), round(sk, 3)]))
        except Exception:
            pass
    res.sort(reverse=True)
    gaps = [runs[i+1][0]-runs[i][1] for i in range(len(runs)-1)]; ch = np.mean([(m[:, a:b].sum(1) > 0).sum() for a, b in runs])
    print(f'\n## {label}: {text}  ({len(paths)} kandidat, rata-rata celah/tinggi huruf = {np.mean(gaps)/ch:.2f})')
    print('gabungan  IoU   kerangka  lebar  font')
    for s, n, wr, sc in res[:12]: print(f'{s:.3f}    {sc[0]:.3f}  {sc[1]:.3f}    x{wr:.2f}  {n}')
    return res
SANS = ['montserrat', 'lato', 'josefin', 'raleway', 'poppins', 'nunito', 'open-sans', 'outfit', 'urbanist', 'mulish', 'cabin', 'tenor', 'questrial', 'albert', 'league', 'hanken', 'jost', 'figtree', 'red-hat', 'work-sans', 'dm-sans', 'manrope', 'jakarta', 'sen/', 'kumbh', 'spartan', 'gothic', 'proza', 'alegreya', 'inter/', 'lexend', 'sora', 'didact', 'karla', 'barlow', 'hind', 'mukta', 'arimo', 'belleza']
semua = glob.glob(FDIR+'/*/files/*-latin-[3-9]00-normal.woff2')
serif = [p for p in semua if not any(k in p for k in SANS)]
sans = [p for p in semua if p not in serif]
r1 = run(*NAMA, serif, 'Nama')
r2 = run(*SUB, sans, 'Sublabel')
json.dump({'sumber': os.path.basename(SRC), 'nama': r1[:15], 'sublabel': r2[:15]}, open(OUT, 'w'), indent=1)
