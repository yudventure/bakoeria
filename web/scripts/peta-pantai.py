"""Membuat public/img/peta-pantai.svg: garis pantai asli Raja Ampat untuk peta rute.
Sumber: data garis pantai komponen peta-raja-ampat (© kontributor OpenStreetMap, ODbL; GSHHG, LGPL).
Koordinat: x = (bujur - 130.18) * 1000, y = (0.06 - lintang) * 1000.
  python3 scripts/peta-pantai.py <jalur garis-pantai.json>"""
import json, sys, pathlib
d = json.load(open(sys.argv[1]))
paths = ''.join(f'<path d="{v["d"]}"/>' for v in d['pulau'].values())
# Daratan Papua di sekitar Sorong dan ujung Salawati tidak ada di data itu; diambil dari
# paket npm @geo-maps/earth-lands-10m (GSHHG) dan disimpan di scripts/peta-daratan.json.
paths += ''.join(f'<path d="{x}"/>' for x in json.load(open(pathlib.Path(__file__).with_name('peta-daratan.json'))))
LEBAR, TINGGI = 1270, 1110
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {LEBAR} {TINGGI}">'
       f'<g fill="#F1E9DA" stroke="#FFFFFF" stroke-width="2.2" stroke-linejoin="round" fill-rule="evenodd">{paths}</g></svg>\n')
out = pathlib.Path(__file__).resolve().parent.parent/'public/img/peta-pantai.svg'
out.write_text(svg); print(out, len(svg)//1024, 'KB')
