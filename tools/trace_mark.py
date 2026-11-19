"""Vektorisasi lambang dari foto logo asli. Hasil: tools/logo-trace.json"""
import sys, json, numpy as np, potrace
from PIL import Image, ImageFilter
im=Image.open(sys.argv[1]).convert('RGB')
BOX=(585,50,978,314); S=10
c=im.crop(BOX); a=np.asarray(c).astype(float)
lum=.3*a[...,0]+.59*a[...,1]+.11*a[...,2]
g=np.clip((lum-70)/70,0,1)*np.clip((a[...,0]-a[...,2])/40,0,1)
gi=Image.fromarray((g*255).astype('uint8')).resize((c.width*S,c.height*S),Image.LANCZOS).filter(ImageFilter.GaussianBlur(S*0.55))
m=np.asarray(gi)>128
pl=potrace.Bitmap(~m).trace(turdsize=S*S*2,alphamax=1.2,opttolerance=1.0)
d=[]
for cv in pl:
    s=cv.start_point; d.append(f"M{s.x/S:.2f} {s.y/S:.2f}")
    for seg in cv.segments:
        if seg.is_corner: d.append(f"L{seg.c.x/S:.2f} {seg.c.y/S:.2f}L{seg.end_point.x/S:.2f} {seg.end_point.y/S:.2f}")
        else: d.append(f"C{seg.c1.x/S:.2f} {seg.c1.y/S:.2f} {seg.c2.x/S:.2f} {seg.c2.y/S:.2f} {seg.end_point.x/S:.2f} {seg.end_point.y/S:.2f}")
    d.append("Z")
ys,xs=np.where(m); bb=[xs.min()/S,ys.min()/S,xs.max()/S,ys.max()/S]
json.dump({'mark':["".join(d),BOX[2]-BOX[0],BOX[3]-BOX[1]],'bbox':bb,'box':BOX},open(sys.argv[2],'w'))
print('paths',len(pl),'bbox',bb)
