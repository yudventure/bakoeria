"""Membuat sumber HTML template sosial media di social/src/. Render ke PNG dengan tools/render_all.js"""
import pathlib, json
root=pathlib.Path(__file__).resolve().parent.parent; out=root/'social/src'
L='../../brand/logo/'; I='../../assets/img/'
jobs=[]
def page(name,w,h,body,css=''):
    (out/f'{name}.html').write_text(f'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="_base.css"><style>{css}</style><body>{body}</body>')
    jobs.append({'src':f'social/src/{name}.html','out':f'social/export/{name}.png','w':w,'h':h})
mark=f'<img src="{L}bakoeria-mark-gold.svg" style="width:150px">'
foot=lambda handle='@bakoeria':f'<div style="display:flex;justify-content:space-between;align-items:flex-end;width:100%"><img src="{L}bakoeria-logo-horizontal-gold.svg" style="width:330px"><span class="lb" style="font-size:20px">{handle}</span></div>'

# 1 kutipan / tagline
page('ig-feed-01-tagline',1080,1350,f'''<div class="f sky c" style="padding:150px 110px 110px;justify-content:space-between"><div class="stars"></div><div class="frame"></div>
<span class="lb" style="font-size:22px;position:relative">Bakoeria Dive Resort</span>
<div style="position:relative"><h1 class="d" style="font-size:104px">Menyelam siang,<br>bermalam<br>di bawah bintang.</h1>
<div class="rule" style="margin-top:60px"><i></i><img src="{L}bakoeria-mark-gold.svg" style="width:96px"><i></i></div></div>
<p class="it" style="font-size:40px;position:relative">Tempat laut menjadi rumah.</p></div>''')
# 2 foto
page('ig-feed-02-foto',1080,1350,f'''<div class="f" style="justify-content:flex-end;padding:90px"><div class="photo" style="background-image:url({I}resort-night.jpg);background-position:38% 100%;background-size:auto 62%;background-repeat:no-repeat;background-color:#041C3E"></div>
<div class="f sky" style="bottom:auto;height:58%;-webkit-mask-image:linear-gradient(#000 70%,transparent);mask-image:linear-gradient(#000 70%,transparent)"><div class="stars"></div></div>
<div class="f" style="background:linear-gradient(180deg,transparent 60%,rgba(2,15,38,.92) 100%)"></div><div class="frame"></div>
<div class="f c" style="padding:150px 90px 0;justify-content:flex-start"><img src="{L}bakoeria-mark-gold.svg" style="width:170px"><h1 class="d" style="font-size:86px;margin-top:44px">Selamat malam<br>dari Bakoeria</h1><p class="it" style="font-size:38px;margin-top:26px">Lampu teras sudah menyala.</p></div>
<div style="position:relative">{foot()}</div></div>''')
# 3 program
page('ig-feed-03-program',1080,1350,f'''<div class="f" style="background:var(--dalam);padding:110px 100px;justify-content:space-between"><div class="frame"></div>
<div><span class="lb" style="font-size:22px">Program selam</span><h1 class="d" style="font-size:150px;margin-top:30px">Fun Dive</h1><p class="it" style="font-size:42px;margin-top:20px;max-width:760px">Dua penyelaman sehari, dipandu dive master yang mengenal titik selamnya.</p></div>
<div style="display:grid;gap:0">{"".join(f'<div style="display:flex;justify-content:space-between;align-items:baseline;padding:30px 0;border-top:1.5px solid var(--garis)"><span class="lb" style="font-size:21px">{a}</span><span style="font-family:Crimson Pro;font-size:44px;color:var(--gading)">{b}</span></div>' for a,b in [("Untuk","Penyelam bersertifikat"),("Briefing","07.30 di dermaga"),("Termasuk","Tabung, pemberat, pemandu"),("Pesan","WhatsApp di bio")])}</div>
{foot()}</div>''')
# 4 carousel
tips=[("Tidur cukup","Datang segar. Hindari alkohol malam sebelumnya."),("Makan ringan","Sarapan secukupnya, jangan menyelam dengan perut kosong."),("Dengarkan briefing","Rencana selam, sinyal tangan, dan batas kedalaman."),("Samakan tekanan","Lakukan sejak awal turun dan jangan dipaksa."),("Jangan sentuh apa pun","Karang tumbuh sangat lambat. Jaga jarak dan daya apung.")]
page('ig-carousel-01-sampul',1080,1350,f'''<div class="f sky c" style="padding:130px 100px 110px;justify-content:space-between"><div class="stars"></div><div class="frame"></div>
<span class="lb" style="font-size:22px;position:relative">Panduan tamu · geser</span>
<div style="position:relative"><div style="font-family:Crimson Pro;font-size:330px;line-height:.8;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent">5</div><h1 class="d" style="font-size:84px;margin-top:40px">Hal sebelum<br>selam pertama</h1></div>
<div style="position:relative;width:100%">{foot()}</div></div>''')
for i,(t,s) in enumerate(tips,1):
    page(f'ig-carousel-0{i+1}-tips',1080,1350,f'''<div class="f" style="background:{"var(--dalam)" if i%2 else "var(--malam)"};padding:120px 100px 110px;justify-content:space-between"><div class="frame"></div>
<div style="display:flex;justify-content:space-between"><span class="lb" style="font-size:22px">Selam pertama</span><span class="lb" style="font-size:22px">{i} / 5</span></div>
<div><div style="font-family:Crimson Pro;font-size:240px;line-height:.9;color:transparent;-webkit-text-stroke:2px var(--emas)">0{i}</div><h1 class="d" style="font-size:98px;margin-top:36px">{t}</h1><p style="font-weight:300;font-size:44px;line-height:1.45;color:var(--pasir);margin-top:34px;max-width:800px">{s}</p></div>
{foot()}</div>''')
# 5 ulasan
page('ig-feed-04-ulasan',1080,1350,f'''<div class="f c" style="background:var(--gading);color:var(--malam);padding:130px 110px 110px;justify-content:space-between"><div class="frame" style="border-color:rgba(4,28,62,.3)"></div>
<span class="lb" style="font-size:22px;color:var(--malam)">Kata tamu</span>
<div><div style="font-family:Crimson Pro;font-size:220px;line-height:.5;color:var(--emas-tua)">“</div><p style="font-family:Crimson Pro;font-style:italic;font-size:70px;line-height:1.25;color:var(--malam)">Pulang dari laut, lampu teras sudah menyala dan kopi sudah menunggu.</p>
<p class="lb" style="font-size:22px;color:var(--malam);margin-top:56px">Nama tamu · contoh ulasan</p></div>
<img src="{L}bakoeria-logo-horizontal-navy.svg" style="width:380px"></div>''')
# 6 square pengumuman
page('ig-square-01-pengumuman',1080,1080,f'''<div class="f c" style="background:var(--jati);background-image:repeating-linear-gradient(90deg,rgba(0,0,0,.14) 0 2px,transparent 2px 180px),linear-gradient(180deg,#4b3320,#3a2616);padding:110px 90px;justify-content:space-between"><div class="frame"></div>
<img src="{L}bakoeria-mark-gold.svg" style="width:190px"><div><h1 class="d" style="font-size:92px">Kini menerima<br>pemesanan</h1><p class="it" style="font-size:40px;margin-top:26px">Musim selam berikutnya sudah dibuka.</p></div>
<span class="lb" style="font-size:22px">Pesan lewat WhatsApp · tautan di bio</span></div>''')
# stories
page('ig-story-01-foto',1080,1920,f'''<div class="f sky"><div class="stars"></div></div><div class="photo" style="background-image:url({I}resort-night.jpg);background-size:auto 46%;background-position:42% 100%;background-repeat:no-repeat;-webkit-mask-image:linear-gradient(transparent 54%,#000 64%);mask-image:linear-gradient(transparent 54%,#000 64%)"></div>
<div class="f c" style="padding:300px 90px 0"><img src="{L}bakoeria-logo-stacked-gold.svg" style="width:640px"><p class="it" style="font-size:52px;margin-top:70px">Menyelam siang,<br>bermalam di bawah bintang.</p></div>''')
rows=[("06.30","Sarapan"),("07.30","Briefing di dermaga"),("08.30","Selam pagi"),("13.00","Makan siang"),("15.00","Selam sore"),("19.00","Makan malam")]
page('ig-story-02-jadwal',1080,1920,f'''<div class="f" style="background:var(--dalam);padding:280px 100px 300px;justify-content:space-between"><div class="frame"></div>
<div><span class="lb" style="font-size:26px">Hari ini di Bakoeria</span><h1 class="d" style="font-size:120px;margin-top:30px">Jadwal<br>selam</h1></div>
<div>{"".join(f'<div style="display:flex;gap:50px;align-items:baseline;padding:34px 0;border-top:1.5px solid var(--garis)"><span style="font-family:Crimson Pro;font-size:66px;color:var(--emas);width:190px;font-variant-numeric:lining-nums tabular-nums">{a}</span><span style="font-weight:300;font-size:46px;color:var(--gading)">{b}</span></div>' for a,b in rows)}</div>
<img src="{L}bakoeria-logo-horizontal-gold.svg" style="width:400px;align-self:center"></div>''')
page('ig-story-03-tanya',1080,1920,f'''<div class="f sky c" style="padding:320px 100px 320px;justify-content:space-between"><div class="stars"></div><div class="frame"></div>
<img src="{L}bakoeria-mark-gold.svg" style="width:200px;position:relative">
<div style="position:relative"><span class="lb" style="font-size:26px">Tanya kami</span><h1 class="d" style="font-size:112px;margin-top:34px">Belum pernah<br>menyelam?</h1><p class="it" style="font-size:54px;margin-top:40px">Mulai dari Discover Scuba.<br>Tanpa sertifikat.</p></div>
<div style="position:relative;border:2px solid var(--emas);padding:34px 70px"><span class="lb" style="font-size:26px;color:var(--emas-muda)">Balas story ini</span></div></div>''')
# highlight covers
icons={'menyelam':'<path d="M22 38h56a8 8 0 0 1 8 8v8a14 14 0 0 1-14 14h-6l-8-12h-16l-8 12h-6a14 14 0 0 1-14-14v-8a8 8 0 0 1 8-8z"/><path d="M14 44H6M86 44h8"/>',
'cottage':'<path d="M12 50 50 20l38 30"/><path d="M24 44v36h52V44"/><path d="M42 80V60h16v20"/>',
'lokasi':'<path d="M50 88C32 64 24 52 24 40a26 26 0 0 1 52 0c0 12-8 24-26 48z"/><circle cx="50" cy="40" r="9"/>',
'tarif':'<path d="M14 14h34l38 38-34 34-38-38z"/><circle cx="32" cy="32" r="6"/>',
'ulasan':'<path d="M50 12l11 24 26 3-19 18 5 26-23-13-23 13 5-26-19-18 26-3z"/>',
'galeri':'<rect x="12" y="20" width="76" height="60" rx="4"/><circle cx="34" cy="40" r="7"/><path d="M12 70l24-20 18 14 14-10 20 16"/>'}
for k,v in icons.items():
    page(f'ig-highlight-{k}',1080,1920,f'''<div class="f sky c" style="justify-content:center"><div style="width:520px;height:520px;border-radius:50%;border:3px solid var(--emas);display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 100 100" width="250" fill="none" stroke="#F5DB9D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">{v}</svg></div><span class="lb" style="font-size:34px;margin-top:70px">{k}</span></div>''')
# banners
def banner(name,w,h,logo_w,tag_fs,pad_b):
    page(name,w,h,f'''<div class="f sky"><div class="stars"></div></div><div class="photo" style="background-image:url({I}resort-night.jpg);background-size:100% auto;background-position:50% 100%;background-repeat:no-repeat;-webkit-mask-image:linear-gradient(90deg,transparent 30%,#000 62%);mask-image:linear-gradient(90deg,transparent 30%,#000 62%)"></div>
<div class="f" style="background:linear-gradient(90deg,rgba(2,15,38,.96) 0%,rgba(2,15,38,.75) 40%,transparent 68%)"></div>
<div class="f" style="justify-content:center;padding-left:{w*0.08:.0f}px;padding-bottom:{pad_b}px"><img src="{L}bakoeria-logo-stacked-gold.svg" style="width:{logo_w}px"><p class="it" style="font-size:{tag_fs}px;margin-top:{tag_fs}px;width:{logo_w}px;display:flex;justify-content:center;white-space:nowrap">Menyelam siang, bermalam di bawah bintang.</p></div>''')
banner('facebook-cover',1640,624,430,26,0)
banner('og-image-website',1200,630,400,24,0)
banner('whatsapp-katalog-cover',1600,900,520,32,0)
page('youtube-banner',2560,1440,f'''<div class="f sky c" style="justify-content:center"><div class="stars"></div><img src="{L}bakoeria-logo-stacked-gold.svg" style="width:620px;position:relative"><p class="it" style="font-size:38px;margin-top:36px;position:relative">Menyelam siang, bermalam di bawah bintang.</p></div>''')
json.dump(jobs,open(root/'social/jobs.json','w'),indent=1)
print(len(jobs),'template')
