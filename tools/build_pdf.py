"""Membuat brand/Bakoeria-Brand-Guidelines.pdf (A4 mendatar). Jalankan lalu: node tools/render_pdf.js"""
import json, pathlib, io, re
from PIL import Image
root=pathlib.Path(__file__).resolve().parent.parent; tmp=pathlib.Path('/tmp/fx/pdf'); tmp.mkdir(parents=True,exist_ok=True)
def jpg(src,w=1600,q=82,crop=None,tag=''):
    im=Image.open(root/src).convert('RGB')
    if crop: im=im.crop(crop)
    im.thumbnail((w,w*3)); p=tmp/(pathlib.Path(src).stem+tag+'.jpg'); im.save(p,'JPEG',quality=q,optimize=True); return str(p)
L=str(root/'brand/logo')+'/'
cols=json.load(open(root/'brand/tokens/colors.json')); fm=json.load(open(root/'research/font-match.json'))
ct=[[c.strip() for c in l.strip('|').split('|')] for l in open(root/'research/contrast-table.md').read().splitlines()[2:] if l.strip()]
pages=[]; n=[0]
def page(body,cls='',title=''):
    n[0]+=1
    foot='' if 'cover' in cls else f'<div class="pf"><span>Bakoeria Dive Resort · Panduan Identitas Merek</span><span>{n[0]:02d}</span></div>'
    pages.append(f'<section class="pg {cls}">{body}{foot}</section>')
def head(eye,h,lead=''): return f'<span class="eye">{eye}</span><h2>{h}</h2>'+(f'<p class="lead">{lead}</p>' if lead else '')
def ftab(rows,k,extra=''): return '<table><tr><th>#</th><th>Font dan bobot</th><th>Skor</th><th></th></tr>'+''.join(f'<tr><td>{i+1}</td><td>{x[1]}</td><td>{x[0]:.3f}</td><td><div class="bar"><i style="width:{x[0]*100:.0f}%"></i></div></td></tr>' for i,x in enumerate(rows[:k]))+extra+'</table>'

page(f'''<div class="stars"></div><div class="cv"><img src="{L}bakoeria-logo-stacked-terbalik.svg" style="width:118mm"><p class="it" style="font-size:17pt;margin-top:12mm">Menyelam siang, bermalam di bawah bintang.</p></div>
<div class="cvf"><span>Panduan Identitas Merek</span><span>Versi 1.0 · November 2026</span></div>''','cover sky')

page(head('Esensi merek','Tempat laut menjadi rumah','Bakoeria Dive Resort adalah resor selam butik yang tenang dan personal: cottage kayu jati, lampu gantung hangat, pasir di bawah kaki, dan langit penuh bintang.')+'''
<div class="g3" style="margin-top:9mm"><div class="box"><h3>Posisi</h3><p>Resor selam butik. Premium dalam rasa, bukan dalam gaya mewah yang berjarak.</p></div><div class="box"><h3>Janji</h3><p>Laut yang bagus siang hari, tempat pulang yang hangat malam hari, dan tim yang mengenal nama tamunya.</p></div><div class="box"><h3>Tamu</h3><p>Penyelam bersertifikat dan pemula, pasangan, serta kelompok kecil yang mencari pulau yang belum ramai.</p></div></div>
<div class="g2" style="margin-top:6mm"><div class="box"><h3>Kepribadian</h3><ul><li><b>Hangat</b>, seperti cahaya lampu teras.</li><li><b>Tenang</b>, tidak berteriak dan tidak penuh promo.</li><li><b>Membumi</b>: kayu, pasir, dan daun palem.</li><li><b>Tepercaya</b> dalam hal keselamatan selam.</li></ul></div><div class="box"><h3>Tagline</h3><p class="it" style="font-size:17pt;color:#EAF6F7">Menyelam siang, bermalam di bawah bintang.</p><p style="margin-top:4mm">Cadangan: "Tempat laut menjadi rumah."</p></div></div>''')

page(head('Logo · akurasi','Divektorisasi dari logo asli','Lambang ditelusuri langsung dari foto. Nama dipasang dengan font yang paling cocok, dengan ukuran dan jarak yang diukur dari aslinya.')+f'''
<div class="row" style="margin-top:7mm;gap:8mm;align-items:stretch"><div style="flex:1.5"><img src="{jpg('research/logo-accuracy.png',1500,88)}" style="width:100%;border:.3mm solid rgba(216,199,168,.3)"><div class="cap">Kiri: logo pada foto asli · Kanan: hasil vektor</div></div>
<div style="flex:1"><table><tr><th>Ukuran pada logo asli</th><th>Nilai</th></tr><tr><td>Lebar lambang</td><td>360 px</td></tr><tr><td>Lebar nama</td><td>572 px</td></tr><tr><td>Tinggi huruf nama</td><td>68 px</td></tr><tr><td>Jarak antarhuruf nama</td><td>0,065 em</td></tr><tr><td>Tinggi huruf sublabel</td><td>28 px</td></tr><tr><td>Jarak antarhuruf sublabel</td><td>0,284 em</td></tr><tr><td>Garis pengapit</td><td>70 × 3,6 px</td></tr><tr><td>Lambang ke nama</td><td>39 px</td></tr><tr><td>Nama ke sublabel</td><td>24 px</td></tr></table></div></div>
<p class="note">Batasan: sumbernya foto, bukan file vektor. Lambang hanya selebar 360 px di foto, dan font adalah yang paling mirip, belum tentu font aslinya. Jika file logo asli tersedia, pakai itu sebagai master.</p>''')

pl=lambda cls,f,cap,w: f'<div class="plate {cls}"><img src="{L}{f}.svg" style="width:{w}mm"><small>{cap}</small></div>'
page(head('Logo · varian','Susunan dan warna')+f'''<div class="g2" style="margin-top:7mm">{pl('pn','bakoeria-logo-stacked-gold','Utama · bertumpuk',62)}{pl('pn','bakoeria-logo-horizontal-gold','Horizontal · header dan kop surat',92)}</div>
<div class="g4" style="margin-top:5mm">{pl('pn','bakoeria-mark-gold','Lambang',38)}{pl('pi','bakoeria-logo-stacked-navy','Navy di gading',42)}{pl('pg','bakoeria-logo-stacked-navy','Navy di emas',42)}{pl('pt','bakoeria-logo-stacked-navy','Emas rata · ukiran, bordir',42)}</div>''')

page(head('Logo · aturan','Cara memakai logo')+f'''<div class="g2" style="margin-top:7mm"><div class="box" style="display:flex;flex-direction:column;align-items:center;gap:5mm"><div style="padding:9mm;outline:.3mm dashed #D8C7A8;position:relative"><img src="{L}bakoeria-logo-horizontal-terbalik.svg" style="width:92mm;display:block"><span style="position:absolute;top:1.5mm;left:50%;color:#D8C7A8;font-size:9pt">x</span><span style="position:absolute;left:3mm;top:45%;color:#D8C7A8;font-size:9pt">x</span></div><p style="align-self:flex-start"><b>Ruang aman.</b> Kosongkan area di semua sisi sebesar tinggi huruf "B" pada nama (x).</p></div>
<div class="box"><h3>Ukuran minimum</h3><ul><li>Logo lengkap: 32 mm cetak, 140 px layar.</li><li>Lambang saja: 10 mm cetak, 24 px layar.</li></ul><h3 style="margin-top:6mm">Latar</h3><ul><li>Emas hanya di atas navy atau Kayu Jati.</li><li>Di latar terang, pakai varian navy.</li><li>Di atas foto, pilih area langit atau bidang gelap yang tenang.</li></ul><h3 style="margin-top:6mm">Jangan</h3><ul><li>Meregangkan atau memutar.</li><li>Mengganti font nama.</li><li>Memberi bayangan atau garis tepi.</li><li>Menaruh logo emas di latar terang.</li></ul></div></div>''')

page(head('Tipografi · riset','Font dicocokkan huruf demi huruf','Tiap huruf logo asli dipotong dari foto dan dibandingkan bentuknya dengan sekitar 60 keluarga Google Fonts. Skor 1,0 berarti identik.')+f'''
<div class="g2" style="margin-top:7mm"><div class="box"><h3>Nama "BAKOERIA"</h3>{ftab(fm['nama'],6,'<tr><td>·</td><td>cinzel-700</td><td>0.747</td><td><div class="bar"><i style="width:75%"></i></div></td></tr>')}</div><div class="box"><h3>Sublabel "DIVE RESORT"</h3>{ftab(fm['sublabel'],7)}</div></div>
<p class="note">Cinzel sekilas tampak cocok karena bergaya huruf Romawi, tetapi kontras tebal-tipisnya terlalu tajam dan proporsinya terlalu lebar.</p>''')

page(head('Tipografi · sistem','Spectral dan Lato')+'''<div class="g2" style="margin-top:6mm"><div class="box"><span class="eye">Judul · Spectral Medium</span><div class="big">Tempat laut<br>menjadi rumah</div><p class="it" style="font-size:15pt;margin-top:3mm">Italic untuk tagline dan kutipan.</p><p style="margin-top:4mm">Serif gaya buku lama dengan kontras sedang: hangat dan elegan. Cadangan: Spectral, Georgia.</p></div>
<div class="box"><span class="eye">Label dan teks · Lato</span><div style="font-weight:700;font-size:17pt;letter-spacing:.28em;color:#D8C7A8">CEK KETERSEDIAAN</div><p style="font-size:12pt;color:#F7F3EC;margin-top:4mm">Lato Light untuk paragraf. Briefing selam pukul 07.30 di dermaga, peralatan sudah kami siapkan.</p><p style="margin-top:4mm">Sans humanis yang ramah dan terbaca di ukuran kecil. Cadangan: Helvetica Neue, Arial.</p></div></div>
<table style="margin-top:6mm"><tr><th>Gaya</th><th>Font</th><th>Ukuran web</th><th>Jarak huruf</th></tr><tr><td>Judul besar</td><td>Spectral 500, kapital</td><td>30 sampai 50 px</td><td>0,07 em</td></tr><tr><td>Subjudul</td><td>Spectral 500</td><td>20 sampai 23 px</td><td>0,05 em</td></tr><tr><td>Tagline, kutipan</td><td>Spectral Italic 400</td><td>20 sampai 27 px</td><td>0</td></tr><tr><td>Label, tombol, menu</td><td>Lato 700, kapital</td><td>11 sampai 13 px</td><td>0,22 sampai 0,28 em</td></tr><tr><td>Paragraf</td><td>Lato 300</td><td>16 sampai 17 px, baris 1,7</td><td>0</td></tr></table>''')

sw=''.join(f'<div class="sw"><div style="height:17mm;background:{v["hex"]}"></div><div class="m"><b>{v["name"]}</b><span>{v["hex"]}</span><em>{v["role"]}</em></div></div>' for v in cols.values())
page(head('Warna · palet','Malam, lentera, dan jati','Diambil dari warna dominan foto resor: sepertiga navy langit malam, sepertiga cokelat kayu, sisanya rentang emas lampu. Karang ditambahkan untuk materi selam siang.')+f'<div class="g5" style="margin-top:6mm">{sw}</div><p class="note">Gradasi emas logo: #FFFFFF ke #D7EEF0 ke #8FD0D8, sudut 160°. Proporsi pemakaian: navy 60%, jati dan pasir 20%, emas 15%, aksen 5%.</p>')

half=(len(ct)+1)//2
tb=lambda rows:'<table><tr><th>Teks</th><th>Latar</th><th>Rasio</th><th>Hasil</th></tr>'+''.join(f'<tr><td>{a}</td><td>{b}</td><td>{c}</td><td class="{"bad" if "Gagal" in d else "ok"}">{d}</td></tr>' for a,b,c,d in rows)+'</table>'
page(head('Warna · kontras','Keterbacaan teks (WCAG 2.2)')+f'<div class="g2" style="margin-top:6mm"><div>{tb(ct[:half])}</div><div>{tb(ct[half:])}</div></div><div class="g3" style="margin-top:6mm"><div class="box"><p>Emas atau gading di atas navy selalu lolos AAA.</p></div><div class="box"><p><b>Emas di atas gading gagal.</b> Di latar terang, teks selalu navy.</p></div><div class="box"><p>Karang hanya untuk judul besar, ikon, atau bidang warna.</p></div></div>')

page(head('Gaya dan suara','Cahaya hangat di tengah gelap')+'''<div class="g3" style="margin-top:6mm"><div class="box"><h3>Foto</h3><ul><li>Jam biru dan malam dengan lampu hangat.</li><li>Siang: air jernih dan cahaya alami.</li><li>Tanpa filter tebal.</li></ul></div><div class="box"><h3>Grafis</h3><ul><li>Garis emas tipis.</li><li>Pembatas: garis, lambang, garis.</li><li>Sudut siku, tanpa bayangan pada desain datar.</li></ul></div><div class="box"><h3>Suara</h3><ul><li>Hangat, tenang, jelas.</li><li>Seperti pemandu selam yang ramah.</li><li>Tanpa huruf kapital berteriak atau tanda seru beruntun.</li></ul></div></div>
<div class="g2" style="margin-top:6mm"><div class="box" style="border-left:1mm solid #A9C46A"><span class="eye" style="color:#A9C46A">Ya</span><p>Briefing selam pukul 07.30 di dermaga. Bawa handuk dan air minum, peralatan sudah kami siapkan.</p></div><div class="box" style="border-left:1mm solid #E58C7A"><span class="eye" style="color:#E58C7A">Tidak</span><p>PROMO GILA-GILAAN!!! Booking sekarang sebelum kehabisan, diskon super hemat!</p></div></div>''')

def full(src,eye,h,cap,crop=None,w=1800): page(head(eye,h)+f'<div class="fig"><img src="{jpg(src,w,82,crop)}"></div><div class="cap">{cap}</div>','imgp')
import shutil
shutil.copy('/tmp/fx/site_d.png',root/'research/website-desktop.png') if pathlib.Path('/tmp/fx/site_d.png').exists() else None
if (root/'research/website-desktop.png').exists():
    page(head('Website','Situs satu halaman')+f'<div class="row" style="gap:6mm;margin-top:5mm;align-items:flex-start"><img src="{jpg("research/website-desktop.png",1300,80,(0,0,1440,1120),"-a")}" style="flex:1;min-width:0;width:50%;border:.3mm solid rgba(216,199,168,.3)"><img src="{jpg("research/website-desktop.png",1300,80,(0,1760,1440,2880),"-b")}" style="flex:1;min-width:0;width:50%;border:.3mm solid rgba(216,199,168,.3)"></div><div class="cap">website/index.html · hero, program selam, cottage, ritme harian, galeri, tanya jawab, formulir pesan lewat WhatsApp</div>')
S='social/export/'
def strip(files,h): return '<div class="row" style="gap:4mm;margin-top:5mm;justify-content:center">'+''.join(f'<img src="{jpg(S+f+".png",520,80)}" style="height:{h}mm;border:.3mm solid rgba(216,199,168,.3)">' for f in files)+'</div>'
page(head('Sosial media','Feed dan carousel')+strip(['ig-feed-01-tagline','ig-feed-02-foto','ig-feed-03-program','ig-feed-04-ulasan','ig-carousel-01-sampul','ig-carousel-02-tips'],50)+strip(['ig-carousel-03-tips','ig-carousel-04-tips','ig-carousel-05-tips','ig-carousel-06-tips','ig-square-01-pengumuman'],50)+'<div class="cap">Feed 4:5 (1080 × 1350) dan persegi (1080 × 1080)</div>')
page(head('Sosial media','Story, highlight, dan sampul')+strip(['ig-story-01-foto','ig-story-02-jadwal','ig-story-03-tanya','ig-highlight-menyelam','ig-highlight-cottage','ig-highlight-lokasi','ig-highlight-tarif'],58)+strip(['facebook-cover','whatsapp-katalog-cover'],42)+'<div class="cap">Story dan sampul highlight (1080 × 1920) · cover Facebook · cover katalog WhatsApp</div>')
for f,t in [('00-brand-board','Brand board'),('01-kartu-nama','Kartu nama'),('02-kop-surat-amplop','Kop surat dan amplop'),('03-papan-nama','Papan nama gerbang'),('04-kunci-dan-kamar','Kunci, kartu sambutan, gantungan pintu'),('05-seragam-dan-tas','Seragam dan tas'),('06-website-digital','Website di desktop dan ponsel'),('07-instagram','Instagram'),('08-perlengkapan-selam','Logbook, stiker tabung, bendera perahu')]:
    n[0]+=1; pages.append(f'<section class="pg bleed"><img src="{jpg("mockups/export/"+f+".png",2000,84)}"></section>')
page(head('Paket file','Isi dan catatan')+'''<table style="margin-top:6mm"><tr><th>Folder</th><th>Isi</th></tr><tr><td>brand/logo/</td><td>20 SVG (4 susunan × 5 warna) dan PNG transparan</td></tr><tr><td>brand/favicon/</td><td>Ikon situs, ikon aplikasi, avatar 1080 px</td></tr><tr><td>brand/tokens/</td><td>Warna dan font sebagai CSS, JSON, dan konfigurasi Tailwind</td></tr><tr><td>website/</td><td>Situs satu halaman siap unggah</td></tr><tr><td>social/export/</td><td>24 PNG, dengan sumber HTML di social/src/</td></tr><tr><td>mockups/export/</td><td>9 mockup 2400 × 1600 px</td></tr><tr><td>research/, tools/</td><td>Data pencocokan font, tabel kontras, skrip pembuat aset</td></tr></table>
<div class="g2" style="margin-top:7mm"><div class="box"><h3>Masih contoh</h3><p>Teks program, jadwal, fasilitas, ulasan, nomor WhatsApp, email, dan akun Instagram perlu diganti dengan data asli.</p></div><div class="box"><h3>Foto</h3><p>Semua gambar adalah potongan dari satu foto sumber. Ganti dengan foto asli resor dan bawah laut sebelum peluncuran.</p></div></div>''')

css='''@import url(%s);
@page{size:297mm 210mm;margin:0}
*{box-sizing:border-box;margin:0}
body{font-family:'Albert Sans',sans-serif;font-weight:300;font-size:10.5pt;line-height:1.55;color:#F7F3EC;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{width:297mm;height:210mm;padding:19mm 20mm 20mm;background:#0A2440;position:relative;overflow:hidden;page-break-after:always;break-after:page}
.pg:nth-child(even){background:#061A30}
.sky{background:linear-gradient(180deg,#061A30,#0A2440 55%,#0F4F7B)!important}
.stars{position:absolute;inset:0;background-image:radial-gradient(.5mm .5mm at 12%% 14%%,rgba(247,243,236,.8) 50%%,transparent 51%%),radial-gradient(.4mm .4mm at 27%% 34%%,rgba(247,243,236,.5) 50%%,transparent 51%%),radial-gradient(.5mm .5mm at 41%% 9%%,rgba(247,243,236,.7) 50%%,transparent 51%%),radial-gradient(.4mm .4mm at 62%% 20%%,rgba(247,243,236,.5) 50%%,transparent 51%%),radial-gradient(.5mm .5mm at 76%% 12%%,rgba(247,243,236,.8) 50%%,transparent 51%%),radial-gradient(.4mm .4mm at 88%% 30%%,rgba(247,243,236,.5) 50%%,transparent 51%%),radial-gradient(.4mm .4mm at 8%% 62%%,rgba(247,243,236,.4) 50%%,transparent 51%%),radial-gradient(.4mm .4mm at 93%% 70%%,rgba(247,243,236,.4) 50%%,transparent 51%%)}
.cv{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.cvf,.pf{position:absolute;left:20mm;right:20mm;bottom:10mm;display:flex;justify-content:space-between;font-weight:700;font-size:7pt;letter-spacing:.26em;text-transform:uppercase;color:#D8C7A8}
.pf{padding-top:3mm;border-top:.2mm solid rgba(216,199,168,.3)}
.pf.ov{border:0;color:#F7F3EC;text-shadow:0 0 2mm #000;bottom:7mm}
.bleed{padding:0}.bleed img{width:100%%;height:100%%;object-fit:cover;display:block}
h2{font-family:'Spectral',serif;font-weight:500;font-size:25pt;letter-spacing:.07em;text-transform:uppercase;line-height:1.15;color:#D7EEF0}
h3{font-family:'Spectral',serif;font-weight:500;font-size:14pt;color:#EAF6F7;margin-bottom:2mm}
.eye{display:block;font-weight:700;font-size:7.5pt;letter-spacing:.28em;text-transform:uppercase;color:#D8C7A8;margin-bottom:3mm}
.lead{font-size:12pt;color:#E9DFCD;margin-top:3mm;max-width:200mm}
.it{font-family:'Spectral',serif;font-style:italic;color:#E9DFCD}
.big{font-family:'Spectral',serif;font-weight:500;font-size:27pt;letter-spacing:.07em;text-transform:uppercase;line-height:1.1;color:#D7EEF0}
.note{font-size:9pt;color:rgba(230,213,179,.75);margin-top:5mm;max-width:220mm}
.cap{font-weight:700;font-size:7pt;letter-spacing:.22em;text-transform:uppercase;color:#E9DFCD;margin-top:3mm}
.row{display:flex}
.g2,.g3,.g4,.g5{display:grid;gap:5mm}.g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:repeat(3,1fr)}.g4{grid-template-columns:repeat(4,1fr)}.g5{grid-template-columns:repeat(5,1fr);gap:4mm}
.box{border:.2mm solid rgba(216,199,168,.32);padding:5mm 6mm}
.box p,.box li{color:#E9DFCD}.box ul{padding-left:4.5mm}.box b{color:#F7F3EC;font-weight:700}
.plate{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4mm;height:62mm}
.g4 .plate{height:58mm}
.plate small{font-weight:700;font-size:6.5pt;letter-spacing:.2em;text-transform:uppercase;opacity:.8}
.pn{background:#12406B}.pi{background:#F7F3EC;color:#0A2440}.pg_{}.pg.x{}.plate.pg{}
.plate.pi small{color:#0A2440}.pt{background:#422D1B}
table{border-collapse:collapse;width:100%%;font-size:9.5pt}
th{text-align:left;font-weight:700;font-size:6.8pt;letter-spacing:.2em;text-transform:uppercase;color:#D8C7A8;padding:2mm 3mm 2mm 0;border-bottom:.2mm solid rgba(216,199,168,.4)}
td{padding:1.9mm 3mm 1.9mm 0;border-bottom:.15mm solid rgba(216,199,168,.16);color:#E9DFCD}
.bar{width:30mm;height:1.4mm;background:rgba(216,199,168,.16)}.bar i{display:block;height:100%%;background:#D8C7A8}
.ok{color:#A9C46A}.bad{color:#E58C7A;font-weight:700}
.sw{border:.2mm solid rgba(216,199,168,.3)}.sw .m{padding:2.5mm 3mm}.sw b{display:block;font-family:'Spectral',serif;font-weight:500;font-size:11.5pt;color:#F7F3EC}.sw span{display:block;font-size:8pt;letter-spacing:.06em;color:#D8C7A8}.sw em{display:block;font-style:normal;font-size:7.6pt;line-height:1.35;color:#E9DFCD;margin-top:1mm}
'''.replace('%s',str(root/'assets/fonts.css')).replace('%%','%')
css=css.replace('.pg_{}.pg.x{}.plate.pg{}','.plate.pg{width:auto;height:58mm;padding:0;background:#D8C7A8!important;color:#061A30;page-break-after:auto;break-after:auto}')
(tmp/'guidelines.html').write_text(f'<!doctype html><meta charset="utf-8"><title>Bakoeria Dive Resort — Panduan Identitas Merek</title><style>{css}</style><body>{"".join(pages)}</body>')
print(n[0],'halaman')
