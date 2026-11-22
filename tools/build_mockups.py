"""Membuat sumber HTML mockup di mockups/src/. Render dengan: node tools/render_all.js mockups/jobs.json"""
import pathlib, json
root=pathlib.Path(__file__).resolve().parent.parent; out=root/'mockups/src'
L='../../brand/logo/'; I='../../assets/img/'; S='../../social/export/'
jobs=[]
BASE='''@import url(../../social/src/_base.css);
.stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:120px}
.bg-navy{background:radial-gradient(ellipse at 50% 30%,#0F5A86 0%,#0A2440 55%,#061A30 100%)}
.bg-sand{background:radial-gradient(ellipse at 40% 30%,#F4EEE3 0%,#E9DFCD 60%,#D8CBB4 100%)}
.bg-teak{background:repeating-linear-gradient(90deg,rgba(0,0,0,.16) 0 3px,transparent 3px 300px),linear-gradient(180deg,#4b3320,#33210f)}
.sh{box-shadow:0 60px 90px rgba(0,0,0,.45),0 14px 24px rgba(0,0,0,.3)}
.cap{position:absolute;left:80px;bottom:64px;font-weight:700;font-size:22px;letter-spacing:.28em;text-transform:uppercase}
.wood{background:repeating-linear-gradient(90deg,rgba(0,0,0,.18) 0 2px,transparent 2px 120px),repeating-linear-gradient(90deg,rgba(255,220,160,.05) 0 1px,transparent 1px 37px),linear-gradient(180deg,#5a3d24,#3d2817)}
.paper{background:#F7F3EC;color:#0A2440}
'''
def page(name,body,css='',w=2400,h=1600):
    (out/f'{name}.html').write_text(f'<!doctype html><meta charset="utf-8"><style>{BASE}{css}</style><body>{body}</body>')
    jobs.append({'src':f'mockups/src/{name}.html','out':f'mockups/export/{name}.png','w':w,'h':h})
cap=lambda t,c='var(--emas)':f'<div class="cap" style="color:{c}">{t}</div>'

# 1 kartu nama
card_f=f'<div class="sh" style="width:900px;height:514px;background:#0A2440;display:flex;align-items:center;justify-content:center;border:1px solid rgba(216,199,168,.25)"><img src="{L}bakoeria-logo-stacked-terbalik.svg" style="width:400px"></div>'
card_b=f'''<div class="sh paper" style="width:900px;height:514px;padding:60px 64px;display:flex;flex-direction:column;justify-content:space-between">
<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div style="font-family:Spectral;font-weight:500;font-size:50px;letter-spacing:.06em;text-transform:uppercase">Nama Staf</div><div style="font-weight:700;font-size:17px;letter-spacing:.28em;text-transform:uppercase;color:#947C5F;margin-top:10px">Dive Master</div></div><img src="{L}bakoeria-mark-warna.svg" style="width:120px"></div>
<div style="border-top:1.5px solid rgba(10,36,64,.25);padding-top:26px;font-size:24px;line-height:1.75;font-weight:400"><b style="color:#947C5F;letter-spacing:.2em;font-size:16px;margin-right:16px">T</b>+62 800 0000 0000<br><b style="color:#947C5F;letter-spacing:.2em;font-size:16px;margin-right:16px">E</b>halo@bakoeria.example<br><b style="color:#947C5F;letter-spacing:.2em;font-size:16px;margin-right:16px">W</b>bakoeria.example</div></div>'''
page('01-kartu-nama',f'<div class="stage bg-sand" style="gap:0"><div style="transform:rotate(-7deg) translate(120px,-90px)">{card_f}</div><div style="transform:rotate(5deg) translate(-90px,150px)">{card_b}</div></div>{cap("Kartu nama · 90 × 55 mm · navy dan gading","#422D1B")}')

# 2 kop surat + amplop
letter=f'''<div class="sh paper" style="width:900px;height:1273px;padding:90px 86px;display:flex;flex-direction:column">
<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:40px;border-bottom:1.5px solid #947C5F"><img src="{L}bakoeria-logo-horizontal-warna.svg" style="width:330px"><div style="text-align:right;font-size:15px;line-height:1.7;letter-spacing:.04em">halo@bakoeria.example<br>+62 800 0000 0000</div></div>
<div style="font-size:17px;margin-top:70px;letter-spacing:.04em">19 November 2026</div>
<div style="font-family:Spectral;font-size:34px;margin-top:44px">Kepada Yth. Bapak/Ibu Tamu,</div>
<div style="margin-top:30px;display:grid;gap:17px">{"".join(f'<i style="display:block;height:9px;width:{w}%;background:rgba(10,36,64,.13)"></i>' for w in [100,96,99,91,60,0,100,94,97,88,98,40,0,100,93,70])}</div>
<div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end"><div style="font-family:Spectral;font-style:italic;font-size:26px">Salam hangat,<br>Tim Bakoeria</div><img src="{L}bakoeria-mark-warna.svg" style="width:110px;opacity:.9"></div></div>'''
env=f'''<div class="sh" style="width:1000px;height:480px;background:#0A2440;position:relative;overflow:hidden"><div style="position:absolute;inset:0;background:linear-gradient(to bottom right,transparent 49.8%,rgba(216,199,168,.35) 50%,transparent 50.2%),linear-gradient(to bottom left,transparent 49.8%,rgba(216,199,168,.35) 50%,transparent 50.2%);height:62%"></div><img src="{L}bakoeria-mark-terbalik.svg" style="position:absolute;width:150px;left:50%;top:54%;transform:translate(-50%,-50%);background:#0A2440;padding:14px 20px"></div>'''
page('02-kop-surat-amplop',f'<div class="stage bg-navy" style="gap:110px"><div style="transform:rotate(-2deg)">{letter}</div><div style="transform:rotate(3deg) translateY(160px)">{env}</div></div>{cap("Kop surat A4 dan amplop DL")}')

# 3 papan nama
sign=f'''<div style="position:relative;display:flex;flex-direction:column;align-items:center">
<div class="wood sh" style="width:1150px;height:640px;border:6px solid #2a1a0d;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;z-index:2"><img src="{L}bakoeria-logo-stacked-terbalik.svg" style="width:560px"><div style="position:absolute;inset:26px;border:2px solid rgba(216,199,168,.45)"></div></div>
<div style="display:flex;gap:700px;margin-top:-10px"><i class="wood" style="display:block;width:70px;height:330px;border:5px solid #2a1a0d"></i><i class="wood" style="display:block;width:70px;height:330px;border:5px solid #2a1a0d"></i></div></div>'''
page('03-papan-nama',f'''<div class="f sky"><div class="stars"></div></div><div class="photo" style="background-image:url({I}resort-night.jpg);background-size:100% auto;background-position:50% 100%;background-repeat:no-repeat;filter:blur(7px) brightness(.75);-webkit-mask-image:linear-gradient(transparent 38%,#000 60%);mask-image:linear-gradient(transparent 38%,#000 60%)"></div>
<div class="stage" style="align-items:flex-end;padding-bottom:110px">{sign}</div><div style="position:absolute;left:0;right:0;bottom:0;height:150px;background:linear-gradient(transparent,rgba(2,15,38,.85))"></div>{cap("Papan nama gerbang · kayu jati, cat warna")}''')

# 4 kunci, gantungan pintu, kartu sambutan
tag=lambda n:f'''<div class="wood sh" style="width:330px;height:560px;border-radius:30px 30px 170px 170px/30px 30px 110px 110px;display:flex;flex-direction:column;align-items:center;padding-top:44px;position:relative"><i style="width:44px;height:44px;border-radius:50%;background:#E9DFCD;box-shadow:inset 0 0 0 7px #947C5F,inset 0 6px 12px rgba(0,0,0,.5)"></i><img src="{L}bakoeria-mark-terbalik.svg" style="width:190px;margin-top:44px"><div style="font-family:Spectral;font-size:120px;line-height:1;margin-top:36px;background:var(--grad);-webkit-background-clip:text;color:transparent;font-variant-numeric:lining-nums">{n}</div><div class="lb" style="font-size:17px;margin-top:6px">Cottage</div></div>'''
door=f'''<div class="sh" style="width:400px;height:960px;background:#0A2440;border:1px solid rgba(216,199,168,.3);display:flex;flex-direction:column;align-items:center;padding:60px 40px;justify-content:space-between;position:relative"><i style="width:150px;height:150px;border-radius:50%;background:#E9DFCD;box-shadow:inset 0 8px 20px rgba(0,0,0,.3)"></i><div style="text-align:center"><h1 class="d" style="font-size:60px">Sedang<br>menyelam</h1><p class="it" style="font-size:30px;margin-top:22px">Mohon rapikan kamar.</p></div><img src="{L}bakoeria-mark-terbalik.svg" style="width:150px"></div>'''
welcome=f'''<div class="sh paper" style="width:640px;height:880px;padding:70px 60px;display:flex;flex-direction:column;align-items:center;text-align:center;justify-content:space-between;border:1px solid rgba(10,36,64,.1)"><img src="{L}bakoeria-mark-warna.svg" style="width:150px"><div><div style="font-family:Spectral;font-weight:500;font-size:62px;letter-spacing:.07em;text-transform:uppercase;line-height:1.1">Selamat<br>datang</div><p style="font-family:Spectral;font-style:italic;font-size:32px;line-height:1.4;margin-top:30px">Briefing selam besok pukul 07.30 di dermaga. Malam ini, nikmati langitnya.</p></div><div style="font-weight:700;font-size:16px;letter-spacing:.28em;text-transform:uppercase;color:#947C5F">Wi-Fi · Bakoeria-Tamu</div></div>'''
page('04-kunci-dan-kamar',f'<div class="stage bg-sand" style="gap:110px"><div style="transform:rotate(-8deg)">{tag("07")}</div><div style="transform:rotate(2deg)">{welcome}</div><div style="transform:rotate(4deg)">{door}</div></div>{cap("Gantungan kunci kayu · kartu sambutan · gantungan pintu","#422D1B")}')

# 5 seragam dan tas
tee=lambda fill,logo,stroke:f'''<svg viewBox="0 0 800 820" width="880" style="filter:drop-shadow(0 50px 60px rgba(0,0,0,.4))"><path d="M270 40 C310 90 490 90 530 40 L690 100 L790 290 L660 350 L620 280 L620 790 L180 790 L180 280 L140 350 L10 290 L110 100 Z" fill="{fill}" stroke="{stroke}" stroke-width="3"/><path d="M270 40 C310 90 490 90 530 40 C500 130 300 130 270 40Z" fill="rgba(0,0,0,.18)"/><image href="{L}{logo}" x="465" y="215" width="120" height="80"/></svg>'''
tote=f'''<svg viewBox="0 0 700 900" width="720" style="filter:drop-shadow(0 50px 60px rgba(0,0,0,.4))"><path d="M210 260 C210 30 490 30 490 260" fill="none" stroke="#E9DFCD" stroke-width="30"/><rect x="60" y="250" width="580" height="620" fill="#F7F3EC"/><image href="{L}bakoeria-logo-stacked-warna.svg" x="170" y="420" width="360" height="250"/></svg>'''
cap_=f'''<svg viewBox="0 0 700 420" width="560" style="filter:drop-shadow(0 40px 50px rgba(0,0,0,.4))"><path d="M90 300 C90 60 610 60 610 300 Z" fill="#0A2440"/><path d="M60 300 C200 250 500 250 690 330 C500 300 200 300 60 330Z" fill="#12406B"/><image href="{L}bakoeria-mark-terbalik.svg" x="270" y="140" width="160" height="106"/></svg>'''
page('05-seragam-dan-tas',f'<div class="stage bg-navy" style="gap:60px">{tee("#12406B","bakoeria-mark-terbalik.svg","#0F6490")}<div style="display:flex;flex-direction:column;align-items:center;gap:70px">{cap_}</div>{tote}</div>{cap("Kaus staf · topi · tas kanvas")}')

# 6 digital
phone=lambda src:f'''<div class="sh" style="width:560px;height:1180px;border-radius:76px;background:#0a0a0c;padding:22px;border:3px solid #2b2b30"><div style="width:100%;height:100%;border-radius:56px;overflow:hidden;background:#0A2440"><img src="{src}" style="width:100%;display:block"></div></div>'''
laptop=f'''<div style="display:flex;flex-direction:column;align-items:center"><div class="sh" style="width:1320px;background:#0a0a0c;border-radius:28px 28px 0 0;padding:26px 26px 30px;border:3px solid #2b2b30"><img src="shot-desktop.png" style="width:100%;display:block;border-radius:6px"></div><div style="width:1560px;height:34px;background:linear-gradient(#c9ccd1,#8d9096);border-radius:0 0 30px 30px"></div></div>'''
page('06-website-digital',f'<div class="stage bg-teak" style="gap:90px;align-items:center">{laptop}<div style="margin-left:-260px;margin-top:140px">{phone("shot-mobile.png")}</div></div>{cap("Website · desktop dan ponsel")}')
ig=lambda f:f'<div class="sh" style="width:500px"><img src="{S}{f}.png" style="width:100%;display:block"></div>'
page('07-instagram',f'<div class="stage bg-navy" style="gap:70px">{ig("ig-feed-01-tagline")}<div style="transform:translateY(-60px)">{ig("ig-feed-02-foto")}</div>{ig("ig-feed-03-program")}<div style="transform:translateY(-60px)">{ig("ig-feed-04-ulasan")}</div></div>{cap("Instagram feed 4:5")}')

# 7 perlengkapan selam
logbook=f'''<div class="sh" style="width:640px;height:900px;background:#0A2440;border-left:26px solid #061A30;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:90px 60px;position:relative"><div style="position:absolute;inset:30px 30px 30px 20px;border:1.5px solid rgba(216,199,168,.4)"></div><span class="lb" style="font-size:19px">Dive Logbook</span><img src="{L}bakoeria-logo-stacked-terbalik.svg" style="width:400px"><span class="it" style="font-size:28px">Nama penyelam ______________</span></div>'''
flag=f'''<div style="display:flex;align-items:flex-start"><i style="display:block;width:16px;height:900px;background:linear-gradient(90deg,#c9b98f,#E9DFCD,#a8966b);border-radius:8px"></i><div class="sh" style="width:760px;height:500px;background:#0A2440;margin-top:30px;display:flex;align-items:center;justify-content:center;position:relative;clip-path:polygon(0 0,100% 0,88% 50%,100% 100%,0 100%)"><div style="position:absolute;left:0;right:0;top:36px;height:5px;background:var(--emas)"></div><div style="position:absolute;left:0;right:0;bottom:36px;height:5px;background:var(--emas)"></div><img src="{L}bakoeria-logo-stacked-terbalik.svg" style="width:330px;margin-right:60px"></div></div>'''
sticker=f'''<div class="sh" style="width:380px;height:380px;border-radius:50%;background:#F7F3EC;display:flex;align-items:center;justify-content:center;border:10px solid #D8C7A8;outline:2px solid #947C5F;outline-offset:-22px"><img src="{L}bakoeria-mark-warna.svg" style="width:230px"></div>'''
page('08-perlengkapan-selam',f'<div class="stage bg-sand" style="gap:120px"><div style="transform:rotate(-4deg)">{logbook}</div><div style="display:flex;flex-direction:column;gap:80px;align-items:center"><div style="transform:rotate(8deg)">{sticker}</div></div>{flag}</div>{cap("Logbook selam · stiker tabung · bendera perahu","#422D1B")}')

# 9 pola khas "Ukir Ombak": satu motif besar, dan versi sederhana sebagai ikon
P='../../brand/pattern/'
map_=f"""<div class="sh" style="width:720px;height:980px;background:#F7F3EC;position:relative;overflow:hidden;transform:rotate(-4deg);padding:70px 64px;display:flex;flex-direction:column;justify-content:space-between">
<img src="{P}bakoeria-ukiran-pasir.svg" style="position:absolute;right:-250px;bottom:-40px;width:1050px;opacity:.22">
<img src="{L}bakoeria-logo-horizontal-warna.svg" style="width:330px;position:relative">
<div style="position:relative"><div style="font-family:Spectral;font-size:58px;line-height:1.1;color:#133250">Panduan<br>tamu</div><div style="font-weight:600;font-size:17px;letter-spacing:.28em;text-transform:uppercase;color:#6B5840;margin-top:16px">Selamat datang di Bakoeria</div></div></div>"""
handuk=f"""<div class="sh" style="width:520px;height:1040px;background:#0F6490;border-radius:10px;position:relative;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;padding-top:110px">
<img src="{P}bakoeria-ukiran-putih.svg" style="position:absolute;left:-190px;bottom:60px;width:1000px;opacity:.2">
<img src="{L}bakoeria-mark-putih.svg" style="width:200px;position:relative"></div>"""
kotak=f"""<div style="display:flex;flex-direction:column;gap:64px;align-items:center">
<div class="sh" style="width:540px;height:540px;background:#0A2440;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center"><img src="{P}bakoeria-ukiran-putih.svg" style="position:absolute;right:-230px;top:-30px;width:900px;opacity:.09"><img src="{P}bakoeria-ukir-cap-kerang.svg" style="width:250px;position:relative;box-shadow:0 10px 24px rgba(0,0,0,.35);border-radius:50%"></div>
<div style="display:flex;gap:34px;align-items:center"><img class="sh" src="{P}bakoeria-ukir-cap-navy.svg" style="width:150px;border-radius:50%"><img class="sh" src="{P}bakoeria-ukir-cap-pasir.svg" style="width:150px;border-radius:50%"><div class="sh paper" style="width:170px;height:150px;display:flex;align-items:center;justify-content:center"><img src="{P}bakoeria-ukir-ikon-navy.svg" style="width:120px"></div></div></div>"""
page('09-pola-khas',f'<div class="stage bg-sand" style="gap:120px">{map_}{handuk}{kotak}</div>{cap("Pola khas Ukir Ombak · satu motif besar di sampul, handuk, dan kotak · versi sederhana sebagai ikon dan cap","#422D1B")}')

# 8 brand board
cols=json.load(open(root/'brand/tokens/colors.json'))
sw=''.join(f'<div style="flex:1;min-width:0"><div style="height:210px;background:{v["hex"]};border:1px solid rgba(216,199,168,.25)"></div><div style="font-family:Spectral;font-size:26px;margin-top:14px;color:var(--gading)">{v["name"]}</div><div style="font-size:18px;letter-spacing:.08em;color:var(--pasir);font-weight:300">{v["hex"]}</div></div>' for k,v in cols.items() if k in ['navy-samudra','laut-dalam','biru-ombak','toska-karang','busa-toska','pasir-pantai','pasir-muda','kerang'])
page('00-brand-board',f'''<div class="f" style="background:#061A30;padding:90px 100px;display:grid;grid-template-columns:1.05fr 1fr;grid-template-rows:auto 1fr auto;gap:60px 80px">
<div style="grid-column:1/-1;display:flex;justify-content:space-between;align-items:baseline;border-bottom:1.5px solid var(--garis);padding-bottom:30px"><span class="lb" style="font-size:22px">Bakoeria Dive Resort · Brand board</span><span class="lb" style="font-size:22px">v2.0 · 2026</span></div>
<div style="position:relative;display:flex;align-items:center;justify-content:center;background:#FFFFFF"><img src="{L}bakoeria-logo-stacked-warna.svg" style="width:560px;position:relative"></div>
<div style="display:grid;grid-template-rows:1fr 1fr;gap:40px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:40px"><div class="sky" style="position:relative;display:flex;align-items:center;justify-content:center"><img src="{L}bakoeria-logo-horizontal-terbalik.svg" style="width:380px;position:relative"></div><div class="wood" style="display:flex;align-items:center;justify-content:center"><img src="{L}bakoeria-mark-terbalik.svg" style="width:230px"></div></div>
<div style="border:1px solid var(--garis);padding:40px 50px;display:flex;flex-direction:column;justify-content:center"><div class="d" style="font-size:86px">Spectral</div><div class="it" style="font-size:38px;margin-top:6px">Menyelam siang, bermalam di bawah bintang.</div><div style="font-weight:500;font-size:40px;letter-spacing:.3em;color:var(--emas);margin-top:34px">ALBERT SANS</div><div style="font-weight:300;font-size:30px;color:var(--pasir);margin-top:8px">Albert Sans untuk label dan teks bacaan yang jelas.</div></div></div>
<div style="grid-column:1/-1;display:flex;gap:26px">{sw}</div></div>''')
json.dump(jobs,open(root/'mockups/jobs.json','w'),indent=1); print(len(jobs),'mockup')
