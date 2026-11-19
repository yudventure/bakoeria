"""Riset font: cocokkan tiap huruf logo asli dengan kandidat Google Fonts.
Tiap huruf dipotong dari foto, dinormalkan ke tinggi yang sama, lalu dibandingkan
bentuknya (IoU) dengan glyph kandidat. Skor = rata-rata IoU semua huruf."""
import sys, glob, os, io, json, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage
from fontTools.ttLib import TTFont
SRC=sys.argv[1]; FDIR=sys.argv[2]
im=Image.open(SRC).convert('RGB')
def mask(box,S=6):
    c=im.crop(box); c=c.resize((c.width*S,c.height*S),Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.5))
    a=np.asarray(c).astype(float); lum=.3*a[...,0]+.59*a[...,1]+.11*a[...,2]
    return (lum>108)&(a[...,0]>a[...,2]+15)
def letters(m,n):
    cols=m.sum(0)>0; runs=[]; s=None
    for i,v in enumerate(cols):
        if v and s is None: s=i
        if not v and s is not None: runs.append((s,i)); s=None
    if s is not None: runs.append((s,len(cols)))
    runs=[r for r in runs if r[1]-r[0]>6]
    if len(runs)!=n: print('runs',[(a,b-a) for a,b in runs])
    out=[]
    for a,b in runs:
        sub=m[:,a:b]; rows=np.where(sub.sum(1)>0)[0]; out.append(sub[rows[0]:rows[-1]+1])
    return out,runs
H=120
def norm(g):
    g=Image.fromarray((g*255).astype('uint8')); w=max(1,round(g.width*H/g.height)); return np.asarray(g.resize((w,H),Image.BICUBIC))>127
def glyph(font,ch):
    l,t,r,b=font.getbbox(ch); img=Image.new('L',(r-l+8,b-t+8),0); ImageDraw.Draw(img).text((4-l,4-t),ch,255,font=font)
    a=np.asarray(img)>127; ys,xs=np.where(a); return a[ys.min():ys.max()+1,xs.min():xs.max()+1]
def iou(a,b):
    w=max(a.shape[1],b.shape[1]); 
    def pad(x):
        p=w-x.shape[1]; return np.pad(x,((0,0),(p//2,p-p//2)))
    a,b=pad(a),pad(b); return (a&b).sum()/((a|b).sum())
def run(box,text,pattern_list,label):
    m=mask(box); L,runs=letters(m,len(text))
    assert len(L)==len(text),(len(L),text)
    L=[norm(x) for x in L]
    res=[]
    for path in pattern_list:
        try:
            buf=io.BytesIO(); f=TTFont(path); f.flavor=None; f.save(buf); buf.seek(0)
            font=ImageFont.truetype(buf,300)
            sc=[iou(l,norm(glyph(font,ch))) for l,ch in zip(L,text)]
            wr=np.mean([norm(glyph(font,ch)).shape[1]/l.shape[1] for l,ch in zip(L,text)])
            res.append((float(np.mean(sc)),os.path.basename(path).replace('-latin','').replace('-normal.woff2',''),float(wr),[round(float(x),2) for x in sc]))
        except Exception as e: pass
    res.sort(reverse=True)
    # tracking asli: jarak antar huruf / tinggi huruf
    gaps=[runs[i+1][0]-runs[i][1] for i in range(len(runs)-1)]; ch=np.mean([ (m[:,a:b].sum(1)>0).sum() for a,b in runs])
    print(f'\n## {label}: {text}  (rata-rata celah/tinggi huruf = {np.mean(gaps)/ch:.2f})')
    for s,n,wr,sc in [x for x in res[:10]]+[x for x in res if 'cinzel-7' in x[1] or 'jost-5' in x[1] or 'cinzel-5' in x[1]]: print(f'{s:.3f}  lebar x{wr:.2f}  {n}')
    return res
serif=[p for p in glob.glob(FDIR+'/*/files/*-latin-[4-9]00-normal.woff2') if not any(k in p for k in ['montserrat','lato','josefin','raleway','poppins','nunito','open-sans','outfit','urbanist','mulish','cabin','tenor','questrial','albert','league','hanken','jost','figtree','red-hat','work-sans','dm-sans','manrope','jakarta','sen/','kumbh','spartan','gothic','proza','alegreya'])]
sans=[p for p in glob.glob(FDIR+'/*/files/*-latin-[3-8]00-normal.woff2') if p not in serif]
r1=run((492,328,1072,414),'BAKOERIA',serif,'Nama')
r2=run((600,420,975,468),'DIVERESORT',sans,'Sublabel')
json.dump({'nama':r1[:15],'sublabel':r2[:15]},open(sys.argv[3],'w'),indent=1)
