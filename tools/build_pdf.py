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

acc=json.load(open(root/'research/logo-accuracy.json'))
page(f"""<div class="cv" style="background:#FFFFFF"><img src="{L}bakoeria-logo-stacked-warna.svg" style="width:104mm"><p class="it" style="font-size:16pt;margin-top:9mm;color:#133250">Menyelam siang, bermalam di bawah bintang.</p></div>
<div class="cvf" style="color:#0F6490"><span>Panduan Identitas Merek</span><span>Versi 2.0 · November 2026</span></div>""",'cover')

page(head('Esensi merek','Tempat laut menjadi rumah','Bakoeria Dive Resort adalah resor selam butik yang tenang dan personal di Raja Ampat: ombak dan penyelam di satu sisi, rumah panggung dan pohon kelapa di sisi lain, disatukan ukiran khas Papua.')+"""
<div class="g3" style="margin-top:9mm"><div class="box"><h3>Posisi</h3><p>Resor selam butik. Premium dalam rasa, bukan dalam gaya mewah yang berjarak.</p></div><div class="box"><h3>Janji</h3><p>Laut yang bagus siang hari, tempat pulang yang hangat malam hari, dan tim yang mengenal nama tamunya.</p></div><div class="box"><h3>Tamu</h3><p>Penyelam bersertifikat dan pemula, pasangan, serta kelompok kecil yang mencari pulau yang belum ramai.</p></div></div>
<div class="g2" style="margin-top:6mm"><div class="box"><h3>Arti lambang</h3><ul><li><b>Ombak</b> yang melingkar: laut yang melindungi.</li><li><b>Penyelam</b>: kegiatan utama resor.</li><li><b>Rumah panggung dan kelapa</b>: tempat pulang di tepi pantai.</li><li><b>Ukiran</b> di dasar: akar budaya Papua.</li></ul></div><div class="box"><h3>Tagline</h3><p class="it" style="font-size:17pt;color:#EAF6F7">Menyelam siang, bermalam di bawah bintang.</p><p style="margin-top:4mm">Cadangan: "Tempat laut menjadi rumah."</p></div></div>""")

page(head('Logo · akurasi','Divektorisasi dari logo asli','Lambang ditelusuri langsung dari file logo, lapisan demi lapisan warna. Nama dipasang dengan font yang paling cocok, tiap huruf di posisi yang diukur dari aslinya.')+f"""
<div class="row" style="margin-top:6mm;gap:8mm;align-items:stretch"><div style="flex:1.75"><img src="{jpg('research/logo-accuracy.png',1800,90)}" style="width:100%;border:.3mm solid rgba(216,199,168,.3)"><div class="cap">Logo asli · hasil vektor · tumpang keduanya (abu-abu = sama persis)</div></div>
<div style="flex:1"><table><tr><th>Kecocokan bentuk (IoU)</th><th>Nilai</th></tr><tr><td>Lambang</td><td>{acc['lambang']:.3f}</td></tr><tr><td>Logo utuh</td><td>{acc['utuh']:.3f}</td></tr><tr><td>Nama (bentuk font)</td><td>{acc['nama']:.3f}</td></tr><tr><td>Sublabel (bentuk font)</td><td>{acc['sublabel']:.3f}</td></tr></table>
<table style="margin-top:5mm"><tr><th>Lapisan lambang</th><th>Warna</th></tr><tr><td>Ombak</td><td>gradasi #0F4F7B ke #188B9A</td></tr><tr><td>Penyelam</td><td>#0B3257</td></tr><tr><td>Palem, rumah, ukiran</td><td>#947C5F</td></tr><tr><td>Batang kelapa ke ombak</td><td>satu bentuk, gradasi pasir ke toska</td></tr></table></div></div>
<p class="note">Nilai 1,000 berarti identik. Batasan: sumbernya gambar 1080 px, bukan file vektor asli, dan font adalah yang paling mirip dari hasil ukur, belum tentu font aslinya. Jika file vektor asli dari perancang logo tersedia, pakai itu sebagai master.</p>""")

pl=lambda bg,f,cap,w,fg='#F7F3EC': f'<div class="plate" style="background:{bg};color:{fg}"><img src="{L}{f}.svg" style="width:{w}mm"><small>{cap}</small></div>'
page(head('Logo · varian','Susunan dan warna')+f"""<div class="g2" style="margin-top:7mm">{pl('#FFFFFF','bakoeria-logo-stacked-warna','Utama · bertumpuk, di latar putih',46,'#133250')}{pl('#FFFFFF','bakoeria-logo-horizontal-warna','Horizontal · header dan kop surat',92,'#133250')}</div>
<div class="g4" style="margin-top:5mm">{pl('#0A2440','bakoeria-logo-stacked-terbalik','Terbalik · di latar gelap',34)}{pl('#F7F3EC','bakoeria-logo-stacked-navy','Satu warna navy · cetak, stempel',34,'#133250')}{pl('#0F6490','bakoeria-logo-stacked-putih','Putih · di atas warna atau foto',34)}{pl('#FFFFFF','bakoeria-mark-warna','Lambang saja · ikon, avatar',34,'#133250')}</div>""")

page(head('Logo · aturan','Cara memakai logo')+f"""<div class="g2" style="margin-top:7mm"><div class="box" style="display:flex;flex-direction:column;align-items:center;gap:5mm"><div style="padding:9mm;outline:.3mm dashed #D8C7A8;position:relative;background:#FFFFFF"><img src="{L}bakoeria-logo-horizontal-warna.svg" style="width:86mm;display:block"><span style="position:absolute;top:1.5mm;left:50%;color:#0F6490;font-size:9pt">x</span><span style="position:absolute;left:3mm;top:45%;color:#0F6490;font-size:9pt">x</span></div><p style="align-self:flex-start"><b>Ruang aman.</b> Kosongkan area di semua sisi sebesar tinggi huruf "B" pada nama (x).</p></div>
<div class="box"><h3>Ukuran minimum</h3><ul><li>Logo lengkap: 30 mm cetak, 140 px layar.</li><li>Lambang saja: 12 mm cetak, 32 px layar. Di bawah itu detail ukiran menutup.</li></ul><h3 style="margin-top:6mm">Latar</h3><ul><li>Versi warna hanya di latar putih atau sangat terang.</li><li>Di latar gelap pakai versi terbalik; di atas foto pakai putih.</li><li>Di atas foto, pilih bidang yang tenang.</li></ul><h3 style="margin-top:6mm">Jangan</h3><ul><li>Meregangkan, memutar, atau memisah bagian lambang.</li><li>Mengganti warna lapisan atau font nama.</li><li>Memberi bayangan atau garis tepi.</li><li>Menaruh versi warna di latar gelap (penyelamnya hilang).</li></ul></div></div>""")

def ftab(rows,k): return '<table><tr><th>#</th><th>Font dan bobot</th><th>Gabungan</th><th>Siluet</th><th>Kerangka</th><th></th></tr>'+''.join(f'<tr><td>{i+1}</td><td style="white-space:nowrap">{x[1]}</td><td>{x[0]:.3f}</td><td>{x[3][0]:.3f}</td><td>{x[3][1]:.3f}</td><td><div class="bar"><i style="width:{x[0]*100:.0f}%"></i></div></td></tr>' for i,x in enumerate(rows[:k]))+'</table>'
cz=next((x for x in fm['nama'] if x[1].startswith('cinzel')),None)
page(head('Tipografi · riset','Font dicocokkan huruf demi huruf','Tiap huruf logo dipotong dari gambar dan dibandingkan dengan 144 font serif dan 238 font sans dari Google Fonts. Skor gabungan: rata-rata kecocokan siluet dan kecocokan kerangka (yang tidak terpengaruh tebal garis). Skor 1,0 berarti identik.')+f"""
<div class="g2" style="margin-top:6mm"><div class="box"><h3>Nama "BAKOERIA"</h3>{ftab(fm['nama'],5)}</div><div class="box"><h3>Sublabel "DIVE RESORT"</h3>{ftab(fm['sublabel'],5)}</div></div>
<p class="note">Nama di logo bergaya huruf Romawi sehingga Cinzel sekilas tampak cocok, tetapi hasil ukurnya di bawah Spectral{f" (gabungan {cz[0]:.3f})" if cz else ""}: garisnya lebih tebal dan hurufnya lebih lebar dari aslinya. Spectral 500 dan Albert Sans 500 unggul di kedua ukuran.</p>""")

page(head('Tipografi · sistem','Spectral dan Albert Sans')+"""<div class="g2" style="margin-top:6mm"><div class="box"><span class="eye">Judul · Spectral Medium</span><div class="big">Tempat laut<br>menjadi rumah</div><p class="it" style="font-size:15pt;margin-top:3mm">Italic untuk tagline dan kutipan.</p><p style="margin-top:4mm">Serif klasik dengan kontras sedang: tenang dan elegan, serasi dengan nama di logo. Cadangan: Georgia, Times New Roman.</p></div>
<div class="box"><span class="eye">Label dan teks · Albert Sans</span><div style="font-weight:500;font-size:17pt;letter-spacing:.3em;color:#D8C7A8">CEK KETERSEDIAAN</div><p style="font-size:12pt;color:#F7F3EC;margin-top:4mm">Albert Sans untuk paragraf. Briefing selam pukul 07.30 di dermaga, peralatan sudah kami siapkan.</p><p style="margin-top:4mm">Sans geometris yang bersih dan terbaca di ukuran kecil, sama dengan sublabel logo. Cadangan: Helvetica Neue, Arial.</p></div></div>
<table style="margin-top:6mm"><tr><th>Gaya</th><th>Font</th><th>Ukuran web</th><th>Jarak huruf</th></tr><tr><td>Judul besar</td><td>Spectral 500</td><td>34 sampai 58 px</td><td>0 sampai 0,02 em</td></tr><tr><td>Nama merek, judul kapital</td><td>Spectral 500, kapital</td><td>20 sampai 30 px</td><td>0,12 em</td></tr><tr><td>Tagline, kutipan</td><td>Spectral Italic 400</td><td>20 sampai 27 px</td><td>0</td></tr><tr><td>Label, tombol, menu</td><td>Albert Sans 500 sampai 700, kapital</td><td>11 sampai 13 px</td><td>0,2 sampai 0,3 em</td></tr><tr><td>Paragraf</td><td>Albert Sans 400</td><td>15 sampai 17 px, baris 1,65</td><td>0</td></tr></table>""")

sw=''.join(f'<div class="sw"><div style="height:17mm;background:{v["hex"]}"></div><div class="m"><b>{v["name"]}</b><span>{v["hex"]}</span><em>{v["role"]}</em></div></div>' for v in cols.values() if 'hex' in v)
page(head('Warna · palet','Samudra dan pasir','Lima warna inti diukur langsung dari logo: navy nama, biru dan toska ombak, serta pasir palem dan ukiran. Sisanya diturunkan dari situ untuk latar dan teks yang terbaca.')+f'<div class="g5" style="margin-top:6mm">{sw}</div><div style="height:9mm;margin-top:5mm;background:linear-gradient(90deg,#0F4F7B,#0F6490 45%,#188B9A)"></div><p class="note">Gradasi Ombak: #0F4F7B ke #0F6490 ke #188B9A, untuk bidang aksen dan tombol besar. Proporsi pemakaian: putih dan kerang 60%, navy dan biru 25%, pasir 10%, toska 5%.</p>')

half=(len(ct)+1)//2
tb=lambda rows:'<table><tr><th>Teks</th><th>Latar</th><th>Rasio</th><th>Hasil</th></tr>'+''.join(f'<tr><td>{a}</td><td>{b}</td><td>{c}</td><td class="{"bad" if "Gagal" in d or "besar" in d else "ok"}">{d}</td></tr>' for a,b,c,d in rows)+'</table>'
page(head('Warna · kontras','Keterbacaan teks (WCAG 2.2)')+f'<div class="g2" style="margin-top:6mm"><div>{tb(ct[:half])}</div><div>{tb(ct[half:])}</div></div><div class="g3" style="margin-top:6mm"><div class="box"><p>Navy Samudra di atas putih atau kerang selalu lolos AAA: pakai untuk teks utama.</p></div><div class="box"><p><b>Pasir Pantai dan Toska Karang hanya untuk teks besar</b>, ikon, atau bidang warna. Untuk teks kecil bernuansa pasir, pakai Pasir Tua.</p></div><div class="box"><p>Tombol: Biru Ombak dengan teks putih (6,47:1).</p></div></div>')

PT=str(root/'brand/pattern')+'/'
pj=json.load(open(root/'brand/pattern/pola.json'))
besar=lambda bg,f,op,cap,fg: f'<div style="height:52mm;background:{bg};position:relative;overflow:hidden"><img src="{PT}{f}.svg" style="position:absolute;right:-22mm;bottom:-4mm;width:118mm;opacity:{op}"><small style="position:absolute;left:5mm;top:5mm;color:{fg};font-weight:700;font-size:6.5pt;letter-spacing:.2em;text-transform:uppercase">{cap}</small></div>'
page(head('Pola khas','Ukir Ombak','Ukiran di bawah ombak pada lambang kami angkat menjadi pola khas Bakoeria. Motifnya diambil langsung dari logo. Cara pakainya sederhana: cukup satu motif besar yang samar di sudut bidang.')+f"""
<div class="g3" style="margin-top:5mm">{besar('#0A2440','bakoeria-ukiran-putih','.09','Di latar gelap · putih 5 sampai 10%','#D8C7A8')}{besar('#F7F3EC','bakoeria-ukiran-pasir','.22','Di latar terang · pasir 15 sampai 25%','#6B5840')}{besar('#0F6490','bakoeria-ukiran-putih','.16','Di bidang warna · putih 12 sampai 20%','#FFFFFF')}</div>
<div class="row" style="gap:6mm;margin-top:5mm;align-items:stretch">
<div style="flex:1.25;background:#FFFFFF;display:flex;align-items:center;justify-content:space-around;padding:4mm 5mm"><img src="{PT}bakoeria-ukir-ikon-navy.svg" style="width:34mm"><img src="{PT}bakoeria-ukir-cap-navy.svg" style="width:17mm"><img src="{PT}bakoeria-ukir-cap-pasir.svg" style="width:17mm"><img src="{PT}bakoeria-ukir-ikon-navy.svg" style="width:9mm"><img src="{PT}bakoeria-ukir-ikon-navy.svg" style="width:5mm"></div>
<div class="box" style="flex:1"><h3>Versi sederhana (ikon)</h3><p>Lekuknya dihaluskan dan serpihan kecil dibuang supaya terbaca sampai 16 px. Untuk ikon, cap, stiker, butir daftar, dan tanda kecil di samping judul.</p></div>
<div class="box" style="flex:1.2"><h3>Aturan pakai</h3><ul><li><b>Satu per bidang</b>, besar, terpotong di sudut.</li><li>Selalu samar; teks di atasnya harus tetap terbaca.</li><li>Satu warna: putih, pasir, atau navy.</li><li>Jangan diregangkan, dan bukan pengganti logo.</li></ul></div></div>
<p class="note">File: brand/pattern/. Motif besar: bakoeria-ukiran-*. Ikon: bakoeria-ukir-ikon-* dan bakoeria-ukir-cap-*. Turunan untuk kemasan dan kain bila diperlukan: pola ulang (bakoeria-pola-*), pita, dan medali.</p>""")

page(head('Gaya dan suara','Jernih seperti air, hangat seperti pasir')+"""<div class="g3" style="margin-top:6mm"><div class="box"><h3>Foto</h3><ul><li>Siang: air jernih, karang, cahaya alami.</li><li>Senja dan malam: lampu hangat di cottage.</li><li>Tanpa filter tebal.</li></ul></div><div class="box"><h3>Grafis</h3><ul><li>Latar putih atau kerang, banyak ruang kosong.</li><li>Lengkung ombak dan sudut membulat.</li><li>Pembatas: garis, lambang, garis.</li></ul></div><div class="box"><h3>Suara</h3><ul><li>Hangat, tenang, jelas.</li><li>Seperti pemandu selam yang ramah.</li><li>Tanpa huruf kapital berteriak atau tanda seru beruntun.</li></ul></div></div>
<div class="g2" style="margin-top:6mm"><div class="box" style="border-left:1mm solid #A9C46A"><span class="eye" style="color:#A9C46A">Ya</span><p>Briefing selam pukul 07.30 di dermaga. Bawa handuk dan air minum, peralatan sudah kami siapkan.</p></div><div class="box" style="border-left:1mm solid #E58C7A"><span class="eye" style="color:#E58C7A">Tidak</span><p>PROMO GILA-GILAAN!!! Booking sekarang sebelum kehabisan, diskon super hemat!</p></div></div>""")

def full(src,eye,h,cap,crop=None,w=1800): page(head(eye,h)+f'<div class="fig"><img src="{jpg(src,w,82,crop)}"></div><div class="cap">{cap}</div>','imgp')
if (root/'research/website-desktop.png').exists():
    page(head('Website','Website resort dan pemesanan')+f'<div class="row" style="gap:6mm;margin-top:5mm;align-items:flex-start"><img src="{jpg("research/website-desktop.png",1300,80,(0,0,1440,1120),"-a")}" style="flex:1;min-width:0;width:50%;border:.3mm solid rgba(216,199,168,.3)"><img src="{jpg("research/website-desktop.png",1300,80,(0,1560,1440,2680),"-b")}" style="flex:1;min-width:0;width:50%;border:.3mm solid rgba(216,199,168,.3)"></div><div class="cap">Website dua bahasa (Inggris dan Indonesia): hero, tentang, kamar, program selam, jadwal harian, tanya jawab, dan pemesanan</div>')
S='social/export/'
def strip(files,h): return '<div class="row" style="gap:4mm;margin-top:5mm;justify-content:center">'+''.join(f'<img src="{jpg(S+f+".png",520,80)}" style="height:{h}mm;border:.3mm solid rgba(216,199,168,.3)">' for f in files)+'</div>'
page(head('Sosial media','Feed dan carousel')+strip(['ig-feed-01-tagline','ig-feed-02-foto','ig-feed-03-program','ig-feed-04-ulasan','ig-carousel-01-sampul','ig-carousel-02-tips'],50)+strip(['ig-carousel-03-tips','ig-carousel-04-tips','ig-carousel-05-tips','ig-carousel-06-tips','ig-square-01-pengumuman'],50)+'<div class="cap">Feed 4:5 (1080 × 1350) dan persegi (1080 × 1080)</div>')
page(head('Sosial media','Story, highlight, dan sampul')+strip(['ig-story-01-foto','ig-story-02-jadwal','ig-story-03-tanya','ig-highlight-menyelam','ig-highlight-cottage','ig-highlight-lokasi','ig-highlight-tarif'],58)+strip(['facebook-cover','whatsapp-katalog-cover'],42)+'<div class="cap">Story dan sampul highlight (1080 × 1920) · cover Facebook · cover katalog WhatsApp</div>')
for f,t in [('00-brand-board','Brand board'),('01-kartu-nama','Kartu nama'),('02-kop-surat-amplop','Kop surat dan amplop'),('03-papan-nama','Papan nama gerbang'),('04-kunci-dan-kamar','Kunci, kartu sambutan, gantungan pintu'),('05-seragam-dan-tas','Seragam dan tas'),('06-website-digital','Website di desktop dan ponsel'),('07-instagram','Instagram'),('08-perlengkapan-selam','Logbook, stiker tabung, bendera perahu'),('09-pola-khas','Pola khas')]:
    n[0]+=1; pages.append(f'<section class="pg bleed"><img src="{jpg("mockups/export/"+f+".png",2000,84)}"></section>')
page(head('Paket file','Isi dan catatan')+'''<table style="margin-top:6mm"><tr><th>Folder</th><th>Isi</th></tr><tr><td>brand/logo/</td><td>20 SVG (4 susunan × 5 warna: warna, terbalik, navy, putih, hitam) dan PNG transparan</td></tr><tr><td>brand/pattern/</td><td>Pola khas Ukir Ombak: motif besar, ikon dan cap, serta turunan pola ulang, pita, medali</td></tr><tr><td>brand/favicon/</td><td>Ikon situs, ikon aplikasi, avatar 1080 px</td></tr><tr><td>brand/tokens/</td><td>Warna dan font sebagai CSS, JSON, dan konfigurasi Tailwind</td></tr><tr><td>website/</td><td>Situs satu halaman siap unggah</td></tr><tr><td>social/export/</td><td>24 PNG, dengan sumber HTML di social/src/</td></tr><tr><td>mockups/export/</td><td>10 mockup 2400 × 1600 px</td></tr><tr><td>research/, tools/</td><td>Data pencocokan font, tabel kontras, skrip pembuat aset</td></tr></table>
<div class="g2" style="margin-top:7mm"><div class="box"><h3>Masih contoh</h3><p>Teks program, jadwal, fasilitas, ulasan, nomor WhatsApp, email, dan akun Instagram perlu diganti dengan data asli.</p></div><div class="box"><h3>Foto</h3><p>Foto pada contoh adalah potongan dari satu foto resor. Ganti dengan foto asli resor dan bawah laut sebelum peluncuran.</p></div></div>''')

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
.bar{width:18mm;height:1.4mm;background:rgba(216,199,168,.16)}.bar i{display:block;height:100%%;background:#D8C7A8}
.ok{color:#A9C46A}.bad{color:#E58C7A;font-weight:700}
.sw{border:.2mm solid rgba(216,199,168,.3)}.sw .m{padding:2.5mm 3mm}.sw b{display:block;font-family:'Spectral',serif;font-weight:500;font-size:11.5pt;color:#F7F3EC}.sw span{display:block;font-size:8pt;letter-spacing:.06em;color:#D8C7A8}.sw em{display:block;font-style:normal;font-size:7.6pt;line-height:1.35;color:#E9DFCD;margin-top:1mm}
'''.replace('%s',str(root/'assets/fonts.css')).replace('%%','%')
css=css.replace('.pg_{}.pg.x{}.plate.pg{}','.plate.pg{width:auto;height:58mm;padding:0;background:#D8C7A8!important;color:#061A30;page-break-after:auto;break-after:auto}')
(tmp/'guidelines.html').write_text(f'<!doctype html><meta charset="utf-8"><title>Bakoeria Dive Resort — Panduan Identitas Merek</title><style>{css}</style><body>{"".join(pages)}</body>')
print(n[0],'halaman')
