"""Menyusun varian logo SVG.
Lambang  : hasil vektorisasi logo asli (tools/logo-trace.json)
Nama     : Crimson Pro Medium, diubah menjadi outline
Sublabel : Lato Bold, diubah menjadi outline"""
import json, pathlib, io
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
root=pathlib.Path(__file__).resolve().parent.parent
fd=root/'assets/fonts'
T=json.load(open(root/'tools/logo-trace.json')); M=T['mark']; BB=T['bbox']
serif=TTFont(fd/'crimson-pro-latin-500-normal.woff2')
sans=TTFont(fd/'lato-latin-700-normal.woff2')

def text_path(font,text,cap_h,track):
    gs=font.getGlyphSet(); cmap=font.getBestCmap(); upm=font['head'].unitsPerEm
    cap=font['OS/2'].sCapHeight; s=cap_h/cap; x=0; parts=[]
    for i,ch in enumerate(text):
        if ch==' ': x+=font['hmtx'][cmap[32]][0]*s+track*upm*s; continue
        gn=cmap[ord(ch)]; lsb=font['hmtx'][gn][1] if i==0 else 0
        pen=SVGPathPen(gs,ntos=lambda v:f'{v:.2f}')
        gs[gn].draw(TransformPen(pen,(s,0,0,-s,x-lsb*s,cap_h)))
        parts.append(pen.getCommands()); x+=(gs[gn].width-lsb)*s
        if i<len(text)-1: x+=track*upm*s
    return ''.join(parts),x
def fit(font,text,cap,width):
    lo,hi=-.05,.8
    for _ in range(40):
        mid=(lo+hi)/2
        if text_path(font,text,cap,mid)[1]<width: lo=mid
        else: hi=mid
    return text_path(font,text,cap,lo)+(lo,)

# Ukuran diambil dari logo asli (piksel foto): lihat research/logo-measurements.md
WORD_CAP=68; SUB_CAP=28
word_d,word_w,word_tr=fit(serif,'BAKOERIA',WORD_CAP,572)
sub_d,sub_w,sub_tr=fit(sans,'DIVE RESORT',SUB_CAP,353)
LINE_LEN=70; GAP=30; LINE_H=3.6
sub_total=LINE_LEN+GAP+sub_w+GAP+LINE_LEN
def sub_block(x0,y0):
    ly=y0+SUB_CAP/2-LINE_H/2
    return (f'<path transform="translate({x0+LINE_LEN+GAP:.2f} {y0})" d="{sub_d}"/>'
            f'<rect x="{x0:.2f}" y="{ly:.2f}" width="{LINE_LEN}" height="{LINE_H}" rx="1.8"/>'
            f'<rect x="{x0+LINE_LEN+GAP+sub_w+GAP:.2f}" y="{ly:.2f}" width="{LINE_LEN}" height="{LINE_H}" rx="1.8"/>')
def word_block(x0,y0): return f'<path transform="translate({x0:.2f} {y0})" d="{word_d}"/>'
# lambang digeser agar kotak pembatasnya mulai di (0,0)
MW,MH=BB[2]-BB[0],BB[3]-BB[1]
def mark_block(x0,y0,s=1): return f'<path transform="translate({x0:.2f} {y0:.2f}) scale({s}) translate({-BB[0]:.2f} {-BB[1]:.2f})" d="{M[0]}"/>'

W=word_w
# stacked: jarak vertikal persis seperti logo asli (lambang-nama 39, nama-sublabel 24)
wy=MH+39; sy=wy+WORD_CAP+24
stack=mark_block((W-MW)/2,0)+word_block(0,wy)+sub_block((W-sub_total)/2,sy)
ST=(W,sy+SUB_CAP)
# horizontal
HH=170; hs=HH/MH; hm=MW*hs; tx=hm+46
blockh=WORD_CAP+24+SUB_CAP; ty=(HH-blockh)/2+6
hor=mark_block(0,0,hs)+word_block(tx,ty)+sub_block(tx+(word_w-sub_total)/2,ty+WORD_CAP+24)
HT=(tx+word_w,HH)
wm=word_block(0,0)+sub_block((word_w-sub_total)/2,WORD_CAP+24); WT=(word_w,WORD_CAP+24+SUB_CAP)
mk=mark_block(0,0); MT=(MW,MH)
print(f'tracking nama {word_tr:.3f} em, sublabel {sub_tr:.3f} em')

GRAD='<defs><linearGradient id="g" x1="0" y1="0" x2="0.55" y2="1"><stop offset="0" stop-color="#F8E7B0"/><stop offset=".5" stop-color="#EECB7C"/><stop offset="1" stop-color="#D6A851"/></linearGradient></defs>'
FILLS={'gold':'url(#g)','gold-flat':'#D9B160','navy':'#071A3D','ivory':'#F7F0DF','black':'#000000'}
def svg(size,body,fill,title,pad=6):
    g=GRAD if fill.startswith('url') else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad} {-pad} {size[0]+2*pad:.1f} {size[1]+2*pad:.1f}" role="img" aria-label="{title}"><title>{title}</title>{g}'
            f'<g fill="{fill}" fill-rule="nonzero">{body}</g></svg>\n')
out=root/'brand/logo'; out.mkdir(parents=True,exist_ok=True)
for f in out.glob('*.svg'): f.unlink()
for n,f in FILLS.items():
    (out/f'bakoeria-logo-stacked-{n}.svg').write_text(svg(ST,stack,f,'Bakoeria Dive Resort'))
    (out/f'bakoeria-logo-horizontal-{n}.svg').write_text(svg(HT,hor,f,'Bakoeria Dive Resort'))
    (out/f'bakoeria-wordmark-{n}.svg').write_text(svg(WT,wm,f,'Bakoeria Dive Resort'))
    (out/f'bakoeria-mark-{n}.svg').write_text(svg(MT,mk,f,'Lambang Bakoeria'))
print(len(list(out.glob('*.svg'))),'svg;',ST,HT,WT,MT)
