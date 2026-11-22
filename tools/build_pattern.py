"""Pola khas Bakoeria: "Ukir Ombak".
Pemakaian utama: SATU motif besar yang samar di sudut bidang (bakoeria-ukiran-*),
dan versi sederhananya sebagai ikon (bakoeria-ukir-ikon-*). Pola ulang, pita, dan
medali adalah turunan untuk kemasan dan kain.
Motifnya adalah ukiran di bawah ombak pada lambang, diambil langsung dari hasil
vektorisasi logo (tools/logo-trace.json, kunci 'ukiran'), tidak digambar ulang.
  python3 tools/build_pattern.py && node tools/build_pattern.js

Hasil di brand/pattern/:
  bakoeria-ukiran-<warna>.svg   motif tunggal
  bakoeria-pola-<nama>.svg      satu ubin pola ulang tanpa sambungan (ulang ke segala arah)
  bakoeria-pita-<warna>.svg     satu ruas pita pembatas (ulang mendatar)
  bakoeria-medali-<warna>.svg   tiga motif melingkar pada lingkaran lambang
Susunan pola: baris ganjil motif asli, baris genap dicerminkan dan digeser setengah."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
T = json.load(open(root/'tools/logo-trace.json')); U = T['ukiran']
x0, y0, x1, y1 = U['bbox']; w, h = x1-x0, y1-y0
BB = T['bbox']; cx, cy = (BB[0]+BB[2])/2-x0, (BB[1]+BB[3])/2-y0      # pusat lingkaran lambang, relatif motif
out = root/'brand/pattern'; out.mkdir(parents=True, exist_ok=True)
for f in out.glob('*.svg'): f.unlink()

def motif(fill, tr=''): return f'<path fill="{fill}" transform="{tr} translate({-x0:.2f} {-y0:.2f})" d="{U["d"]}"/>'
def svg(W, H, body, title, vb=None): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb or f"0 0 {W:.1f} {H:.1f}"}" width="{W:.0f}" height="{H:.0f}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'

TINTA = {'pasir': '#947C5F', 'navy': '#133250', 'putih': '#FFFFFF', 'toska': '#188B9A'}
for n, c in TINTA.items():
    (out/f'bakoeria-ukiran-{n}.svg').write_text(svg(w+16, h+16, motif(c, 'translate(8 8)'), 'Motif ukiran Bakoeria'))

# Versi sederhana (ikon): lekuk dihaluskan dan serpihan kecil dibuang, terbaca sampai 16 px.
I = T['ukiran_ikon']; ix0, iy0, ix1, iy1 = I['bbox']; iw, ih = ix1-ix0, iy1-iy0
def ikon(fill, tr=''): return f'<path fill="{fill}" transform="{tr} translate({-ix0:.2f} {-iy0:.2f})" d="{I["d"]}"/>'
for n, c in TINTA.items():
    (out/f'bakoeria-ukir-ikon-{n}.svg').write_text(svg(iw+12, ih+12, ikon(c, 'translate(6 6)'), 'Ikon Ukir Ombak'))
# Ikon dalam bidang bulat (cap, stiker, avatar sorotan): motif sederhana di tengah lingkaran.
for n, (bg, fg) in {'navy': ('#133250', '#FFFFFF'), 'pasir': ('#947C5F', '#FFFFFF'), 'kerang': ('#F7F3EC', '#133250')}.items():
    k = 300/iw
    (out/f'bakoeria-ukir-cap-{n}.svg').write_text(svg(512, 512, f'<circle cx="256" cy="256" r="256" fill="{bg}"/>'+ikon(fg, f'translate({256-150:.1f} {256-ih*k/2:.1f}) scale({k:.4f})'), 'Cap Ukir Ombak'))

# Pola ulang: ubin W x H. Salinan di kiri dan kanan ubin membuat tepinya menyambung.
GX, GY = 78, 64
W, H = round(w+GX), 2*round(h+GY)        # bilangan bulat supaya tepi ubin jatuh tepat di piksel
def ubin(fill):
    a = ''.join(motif(fill, f'translate({x+GX/2:.2f} {GY/2:.2f})') for x in (-W, 0, W))
    b = ''.join(motif(fill, f'translate({x+W/2+GX/2+w:.2f} {H/2+GY/2:.2f}) scale(-1 1)') for x in (-W, 0, W))
    return a+b
POLA = {                      # nama: (latar, motif, keterangan)
    'pasir':  ('#F7F3EC', '#947C5F', 'pasir di atas kerang: kemasan, kain, sampul'),
    'halus':  ('#FFFFFF', '#E9DFCD', 'pasir muda di atas putih: latar kertas dan web'),
    'laut':   ('#0A2440', '#17446E', 'navy di atas laut dalam: latar gelap'),
    'ombak':  ('#0F6490', '#2D84AD', 'biru di atas biru ombak: bidang aksen'),
    'tinta':  (None,      '#947C5F', 'motif pasir tanpa latar: untuk ditimpa di atas warna lain'),
    'tinta-putih': (None, '#FFFFFF', 'motif putih tanpa latar: ditimpa tipis (5 sampai 10%) di atas latar gelap atau foto'),
}
for n, (bg, fg, ket) in POLA.items():
    (out/f'bakoeria-pola-{n}.svg').write_text(svg(W, H, (f'<rect x="-2" y="-2" width="{W+4}" height="{H+4}" fill="{bg}"/>' if bg else '')+ubin(fg), f'Pola Ukiran Ombak, {ket}'))

# Pita: motif dan cerminannya bergantian membentuk gelombang; satu ruas = dua motif.
PW, PH = 2*(w+12), h
for n, c in TINTA.items():
    ruas = motif(c)+motif(c, f'translate({w+12+w:.2f} 0) scale(-1 1)')
    (out/f'bakoeria-pita-{n}.svg').write_text(svg(PW, PH+12, f'<g transform="translate(6 6)">{ruas}</g>', 'Pita Ukiran Ombak', f'0 0 {PW:.1f} {PH+12:.1f}'))

# Medali: tiga motif diputar 120 derajat pada lingkaran lambang.
r = max(cx, cy, w-cx, h-cy)+6; D = 2*(((BB[2]-BB[0])/2)+10)
for n, c in TINTA.items():
    g = ''.join(motif(c, f'translate({D/2-cx:.2f} {D/2-cy:.2f}) rotate({a} {cx:.2f} {cy:.2f})') for a in (0, 120, 240))
    (out/f'bakoeria-medali-{n}.svg').write_text(svg(D, D, g, 'Medali Ukiran Ombak'))
json.dump({'ubin': [round(W, 1), round(H, 1)], 'motif': [round(w, 1), round(h, 1)], 'pola': {k: {'latar': v[0], 'motif': v[1], 'untuk': v[2]} for k, v in POLA.items()}}, open(out/'pola.json', 'w'), indent=1, ensure_ascii=False)
print(len(list(out.glob('*.svg'))), 'svg; ubin', round(W), 'x', round(H))
