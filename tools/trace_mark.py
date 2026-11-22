"""Vektorisasi lambang Bakoeria (logo v2) dari file sumber, per lapisan warna.
  python3 tools/trace_mark.py assets/source/bakoeria-logo-v2.png tools/logo-trace.json

Lapisan dipisah menurut warna piksel:
  ombak   biru ke toska (B jauh di atas R), gradasinya diukur per bentuk
  selam   penyelam dan gelembung: biru yang sama tetapi bentuknya terpisah dari ombak,
          dikenali dari letaknya (kotak penyelam) dan warnanya yang lebih gelap
  pasir   palem, rumah panggung, dan ukiran (R di atas B)
Tiap lapisan diperbesar 10x, dihaluskan, lalu ditelusuri dengan potrace.
Warna tiap bentuk diambil dari median pikselnya; ombak diberi gradasi linear
hasil regresi warna terhadap posisi."""
import sys, json, numpy as np, potrace
from PIL import Image, ImageFilter
from scipy import ndimage

im = Image.open(sys.argv[1]).convert('RGB')
BOX = (280, 166, 826, 698)          # lambang saja, tanpa tulisan
S = 10
c = im.crop(BOX); a = np.asarray(c).astype(float)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
lum = .3*R+.59*G+.11*B
isi = (255-np.minimum(np.minimum(R, G), B)) / 255          # 0 = putih, 1 = tinta penuh
biru = np.clip((B-R-12)/40, 0, 1) * np.clip(isi*2.2, 0, 1)
pasir = np.clip((R-B-6)/30, 0, 1) * np.clip(isi*2.6, 0, 1)

# Penyelam dan gelembung: komponen biru yang seluruhnya ada di kotak penyelam.
mb = biru > .5
lab, n = ndimage.label(mb)
DIVER = (15, 100, 278, 400)   # x0, y0, x1, y1 dalam koordinat potongan
selam_id = []
for i, sl in enumerate(ndimage.find_objects(lab), 1):
    y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
    if x0 >= DIVER[0] and x1 <= DIVER[2] and y0 >= DIVER[1] and y1 <= DIVER[3]: selam_id.append(i)
selam_m = np.isin(lab, selam_id)
# perluas sedikit supaya tepi lembutnya ikut, lalu pakai sebagai pemilah
selam_zona = ndimage.binary_dilation(selam_m, iterations=3)
lapisan = {'ombak': biru*(~selam_zona), 'selam': biru*selam_zona, 'pasir': pasir}

def telusur(g):
    gi = Image.fromarray((np.clip(g, 0, 1)*255).astype('uint8')).resize((c.width*S, c.height*S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(S*.45))
    m = np.asarray(gi) > 128
    pl = potrace.Bitmap(~m).trace(turdsize=S*S*3, alphamax=1.0, opttolerance=.4)
    return pl, m

def ke_d(curves):
    d = []
    for cv in curves:
        s = cv.start_point; d.append(f"M{s.x/S:.2f} {s.y/S:.2f}")
        for seg in cv.segments:
            if seg.is_corner: d.append(f"L{seg.c.x/S:.2f} {seg.c.y/S:.2f}L{seg.end_point.x/S:.2f} {seg.end_point.y/S:.2f}")
            else: d.append(f"C{seg.c1.x/S:.2f} {seg.c1.y/S:.2f} {seg.c2.x/S:.2f} {seg.c2.y/S:.2f} {seg.end_point.x/S:.2f} {seg.end_point.y/S:.2f}")
        d.append("Z")
    return "".join(d)

def hex_(v): return '#%02X%02X%02X' % tuple(int(round(x)) for x in np.clip(v, 0, 255))

def warna(mask_px, gradasi, arah=None, N=9):
    """Warna rata, atau gradasi linear beberapa titik yang dicuplik dari piksel inti bentuk (tepi diabaikan)."""
    inti = ndimage.binary_erosion(mask_px, iterations=2)
    if inti.sum() < 30: inti = mask_px
    ys, xs = np.where(inti); px = a[ys, xs]
    if not gradasi: return {'fill': hex_(np.median(px, 0))}
    X = np.c_[np.ones(len(xs)), xs, ys]
    coef, *_ = np.linalg.lstsq(X, px, rcond=None)          # warna = c0 + cx*x + cy*y
    if arah is None: arah = np.linalg.svd(coef[1:].T)[2][0]    # arah perubahan warna terbesar
    t = xs*arah[0]+ys*arah[1]; t0, t1 = np.percentile(t, 1), np.percentile(t, 99)
    pusat = np.array([xs.mean(), ys.mean()]); tp = pusat @ arah
    p0 = pusat + arah*(t0-tp); p1 = pusat + arah*(t1-tp)
    # cuplik median warna di N pita sepanjang arah itu
    u = np.clip((t-t0)/(t1-t0), 0, 1); stops = []
    for i in range(N):
        lo, hi = i/N, (i+1)/N; sel = (u >= lo) & (u <= hi)
        if sel.sum() >= 8: stops.append([round((lo+hi)/2, 3), hex_(np.median(px[sel], 0))])
    stops[0][0] = 0; stops[-1][0] = 1
    return {'grad': [round(p0[0], 1), round(p0[1], 1), round(p1[0], 1), round(p1[1], 1)], 'stops': stops}

# Zona peralihan: tinta yang bukan biru dan bukan pasir (batang kelapa melebur ke ombak
# lewat gradasi pasir ke toska). Zona ini digabung ke bentuk ombak yang disentuhnya,
# ditambah sedikit tumpang ke batang, supaya jadi satu bentuk bergradasi tanpa celah.
tinta = isi > .5
ragu = ndimage.binary_opening(tinta & ~(biru > .5) & ~(pasir > .5), iterations=2)
labr, nr = ndimage.label(ragu)
sambung = np.zeros_like(ragu)
for i in range(1, nr+1):
    if (labr == i).sum() >= 40: sambung |= ndimage.binary_dilation(labr == i, iterations=3) & tinta
tumpang = ndimage.binary_dilation(sambung, iterations=5) & (pasir > .5)     # sedikit masuk ke batang
print('zona peralihan:', int(sambung.sum()), 'px')

bentuk = []; topeng = {}
for nama, g in lapisan.items():
    pl, m = telusur(g); topeng[nama] = m
    # kelompokkan kurva per bentuk luar (kurva luar + lubangnya)
    kel = []
    for cv in pl:
        if cv.children if hasattr(cv, 'children') else False: pass
    # potrace memberi kurva berurutan: luar lalu lubang-lubangnya; pisahkan memakai komponen topeng kecil
    lab2, n2 = ndimage.label(g > .5)
    if nama == 'ombak':
        # tiap komponen ombak jadi satu path bergradasi sendiri
        for i in range(1, n2+1):
            mk = lab2 == i
            if mk.sum() < 40: continue
            sub = np.where(ndimage.binary_dilation(mk, iterations=2), g, 0)
            arah = None; N = 9
            if (ndimage.binary_dilation(mk, iterations=4) & sambung).any():
                # gradasi mengikuti badan bentuk: dari tengah ombak menuju batang
                ya, xa = np.where(mk); yb, xb = np.where(tumpang)
                arah = np.array([xb.mean()-xa.mean(), yb.mean()-ya.mean()]); arah /= np.linalg.norm(arah); N = 16
                tambah = sambung | tumpang
                mk = mk | tambah; sub = np.maximum(sub, tambah.astype(float))
            p2, _ = telusur(sub)
            if not len(p2): continue
            w = warna(mk, True, arah, N)
            if arah is not None: w['stops'][-1][1] = hex_(np.median(a[pasir > .9], 0))   # ujungnya persis warna pasir
            bentuk.append({'lapis': nama, 'd': ke_d(p2), **w})
    else:
        bentuk.append({'lapis': nama, 'd': ke_d(pl), **warna(g > .5, False)})

semua = np.zeros_like(next(iter(topeng.values())))
for m in topeng.values(): semua |= m
ys, xs = np.where(semua); bb = [xs.min()/S, ys.min()/S, xs.max()/S, ys.max()/S]
json.dump({'box': BOX, 'ukuran': [c.width, c.height], 'bbox': bb, 'bentuk': bentuk}, open(sys.argv[2], 'w'))
for b in bentuk: print(b['lapis'], b.get('fill') or [x[1] for x in b['stops']], len(b['d']), 'karakter')
print('bbox', bb)
