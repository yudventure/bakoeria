"""Merapikan kontur hasil telusur: garis tepi dihaluskan sebagai kurva mengalir,
sedangkan sudut runcing (ujung daun ukiran) dikunci supaya tetap tajam.
Dipakai tools/trace_mark.py untuk motif pola khas, yang ditampilkan sangat besar."""
import numpy as np
from scipy.ndimage import gaussian_filter1d
from skimage import measure

def _sudut(p, k):
    """Sudut belok di tiap titik kontur tertutup, diukur dengan lengan k titik."""
    a = p - np.roll(p, k, 0); b = np.roll(p, -k, 0) - p
    na = np.linalg.norm(a, axis=1)+1e-9; nb = np.linalg.norm(b, axis=1)+1e-9
    cos = np.clip((a*b).sum(1)/(na*nb), -1, 1)
    return np.degrees(np.arccos(cos))

def _pojok(p, k, ambang):
    s = _sudut(p, k); n = len(p); idx = []
    for i in np.where(s > ambang)[0]:
        jendela = [(i+j) % n for j in range(-k, k+1)]
        if s[i] >= s[jendela].max(): idx.append(i)
    # buang pojok yang terlalu rapat
    hasil = []
    for i in idx:
        if not hasil or (i-hasil[-1]) > k: hasil.append(i)
    if len(hasil) > 1 and (hasil[0]+n-hasil[-1]) <= k: hasil.pop()
    return hasil

def _halus(seg, sigma):
    """Haluskan satu ruas terbuka; kedua ujungnya tidak bergeser."""
    if len(seg) < 5: return seg
    s = min(sigma, len(seg)/5)
    h = np.c_[gaussian_filter1d(seg[:, 0], s, mode='nearest'), gaussian_filter1d(seg[:, 1], s, mode='nearest')]
    t = np.linspace(0, 1, len(seg))[:, None]
    return h + (seg[0]-h[0])*(1-t) + (seg[-1]-h[-1])*t

def _bezier(pts, tertutup):
    """Catmull-Rom ke kubik Bezier melalui titik-titik."""
    n = len(pts); d = []
    for i in range(n-1 if not tertutup else n):
        p0 = pts[(i-1) % n] if (tertutup or i > 0) else pts[i]
        p1 = pts[i]; p2 = pts[(i+1) % n]
        p3 = pts[(i+2) % n] if (tertutup or i+2 < n) else p2
        c1 = p1+(p2-p0)/6; c2 = p2-(p3-p1)/6
        d.append(f"C{c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {p2[0]:.2f} {p2[1]:.2f}")
    return ''.join(d)

def rapikan(mask, skala, sigma=7.0, lengan=6.0, ambang=62, langkah=3.0, luas_min=60):
    """mask: gambar biner diperbesar `skala` kali. Satuan parameter: piksel sumber.
    Mengembalikan (path d dalam satuan sumber, bbox)."""
    d = []; xs = []; ys = []
    for kon in measure.find_contours(mask.astype(float), .5):
        p = kon[:, ::-1]/skala                                   # (x, y) satuan sumber
        if not np.allclose(p[0], p[-1]): continue
        p = p[:-1]
        luas = abs(np.sum(p[:, 0]*np.roll(p[:, 1], -1)-np.roll(p[:, 0], -1)*p[:, 1]))/2
        if luas < luas_min: continue
        k = max(2, int(round(lengan*skala)))
        pj = _pojok(p, k, ambang)
        if not pj:                                               # tanpa pojok: haluskan melingkar
            q = np.c_[gaussian_filter1d(p[:, 0], sigma*skala, mode='wrap'), gaussian_filter1d(p[:, 1], sigma*skala, mode='wrap')]
            q = q[::max(1, int(langkah*skala))]
            d.append(f"M{q[0][0]:.2f} {q[0][1]:.2f}"+_bezier(q, True)+"Z"); xs += list(q[:, 0]); ys += list(q[:, 1]); continue
        p = np.roll(p, -pj[0], 0); pj = [i-pj[0] for i in pj]+[len(p)]
        bagian = [f"M{p[0][0]:.2f} {p[0][1]:.2f}"]
        for a, b in zip(pj[:-1], pj[1:]):
            seg = np.vstack([p[a:b], p[b % len(p)]])
            h = _halus(seg, sigma*skala)
            n = max(2, int(len(h)/(langkah*skala)))
            q = h[np.linspace(0, len(h)-1, n+1).round().astype(int)]
            bagian.append(_bezier(q, False)); xs += list(q[:, 0]); ys += list(q[:, 1])
        d.append(''.join(bagian)+"Z")
    return ''.join(d), [min(xs), min(ys), max(xs), max(ys)]
