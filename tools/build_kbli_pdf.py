"""Bangun PDF riset KBLI Bakoeria: research/kbli/Bakoeria-Riset-KBLI.pdf"""
import base64, pathlib, subprocess, textwrap
R = pathlib.Path(__file__).resolve().parent.parent
def b64(p): return base64.b64encode((R/p).read_bytes()).decode()
fonts = ''.join(f"@font-face{{font-family:'{f}';src:url(data:font/woff2;base64,{b64('assets/fonts/'+n)});font-weight:{w};font-style:{s}}}"
  for f,n,w,s in [('Albert Sans','albert-sans-latin-400-normal.woff2',400,'normal'),('Albert Sans','albert-sans-latin-600-normal.woff2',600,'normal'),
                  ('Albert Sans','albert-sans-latin-700-normal.woff2',700,'normal'),('Spectral','spectral-latin-400-normal.woff2',400,'normal'),('Spectral','spectral-latin-400-italic.woff2',400,'italic')])
logo = b64('brand/logo/bakoeria-logo-horizontal-terbalik.svg')
pola = b64('brand/pattern/bakoeria-pola-halus.svg')

def tabel(baris, kolom=('KBLI 2025','Judul','Cakupan / alasan','KBLI 2020')):
    h = ''.join(f'<th>{k}</th>' for k in kolom)
    b = ''.join('<tr>'+''.join(f'<td>{c}</td>' for c in r)+'</tr>' for r in baris)
    return f'<table><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table>'
K = lambda k, utama=False: f'<span class="kode{" utama" if utama else ""}">{k}</span>'

resort = [(K('55106',1),'Hotel Nonbintang','Kode utama selama resort belum diklasifikasikan bintang. Cottage dengan layanan kamar dan makan 3x sehari.','55120'),
 (K('55101–55105'),'Hotel Bintang Lima s.d. Satu','Dipakai bila kelak memperoleh sertifikat klasifikasi bintang.','55110'),
 (K('55209'),'Akomodasi Jangka Pendek Lainnya','Menurut BPS mencakup bungalow dan <i>pondok/cottage tanpa layanan kebersihan harian</i>. Alternatif bila kamar tidak dibersihkan tiap hari.','—'),
 (K('56101',1),'Restoran','Penyediaan makanan di bangunan tetap; makan 3x sehari, terutama bila melayani tamu luar.','56101'),
 (K('55300',1),'Bumi Perkemahan','Paket camping.','55300')]
dive = [(K('93297',1),'Wisata Tirta','Pengelolaan kegiatan selam; penjualan, penyewaan dan perbaikan peralatan selam; perjalanan wisata selam lokal, nasional, internasional; snorkeling, free diving, sea walker; juga kayaking dan canoeing.','93242 (Wisata Selam) dan kode wisata tirta lain'),
 (K('77210'),'Penyewaan Alat Rekreasi dan Olahraga','Sewa alat selam, snorkel, kayak sebagai usaha tersendiri.','77210'),
 (K('85599'),'Pendidikan Lainnya Swasta <i>(opsional)</i>','Kemungkinan untuk kursus selam bersertifikat (PADI/SSI). BPS tidak menyebut kursus selam secara eksplisit; konfirmasi di OSS.','—')]
travel = [(K('79121',1),'Biro Perjalanan Wisata','Menyusun dan menjual paket wisata sendiri: menginap, selam, antar-jemput, tur.','79121'),
 (K('79110'),'Agen Perjalanan','Hanya menjual paket buatan pihak lain. Gabungan kode lama.','79111 / 79112 / 79119'),
 (K('50113',1),'Angkutan Laut Dalam Negeri untuk Wisata','Antar-jemput privat speedboat dari Sorong dan sewa kapal wisata beserta awak. Subgolongan 5011 menurut BPS mencakup pengoperasian kapal wisata dan penyewaan kapal wisata dengan awaknya.','50113'),
 (K('79921'),'Jasa Pramuwisata <i>(opsional)</i>','Pemandu bird watching dan tur lokal.','79903'),
 (K('79911'),'Jasa Informasi Pariwisata <i>(opsional)</i>','Layanan informasi wisata.','79901')]
lain = [(K('93294'),'Wisata Gua, Pemandian, dan Petualangan Alam','Petualangan alam seperti trekking dan bird watching.','—'),
 (K('93299'),'Hiburan dan Rekreasi Lainnya','Kode cadangan untuk aktivitas yang tidak masuk kode lain.','—')]

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{fonts}
@page{{size:A4;margin:0}}
*{{box-sizing:border-box}} body{{margin:0;font-family:'Albert Sans',sans-serif;color:#133250;font-size:9.6pt;line-height:1.5}}
.hal{{width:210mm;min-height:297mm;padding:18mm 17mm 16mm;position:relative;page-break-after:always}}
.sampul{{background:linear-gradient(150deg,#0A2440 0%,#133250 45%,#0F6490 80%,#188B9A 100%);color:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:22mm 20mm;height:297mm;overflow:hidden}}
.sampul .pola{{position:absolute;inset:0;background:url(data:image/svg+xml;base64,{pola}) repeat;background-size:90mm;opacity:.08}}
.sampul img{{width:68mm;position:relative}}
.label{{letter-spacing:.3em;text-transform:uppercase;font-size:8pt;font-weight:600;color:#D7EEF0}}
h1{{font-family:Spectral,serif;font-weight:400;font-size:38pt;line-height:1.08;margin:6mm 0 5mm;letter-spacing:.01em}}
.sampul p{{font-size:11pt;max-width:140mm;color:#E9DFCD;position:relative}}
.meta{{position:relative;font-size:9pt;color:#D7EEF0;border-top:1px solid rgba(255,255,255,.3);padding-top:5mm;display:flex;gap:14mm}}
.meta b{{display:block;color:#fff;font-weight:600}}
h2{{font-family:Spectral,serif;font-weight:400;font-size:19pt;margin:7mm 0 2mm;color:#133250}}
h2 small{{display:block;font-family:'Albert Sans';font-size:7.5pt;letter-spacing:.3em;text-transform:uppercase;color:#188B9A;font-weight:600;margin-bottom:1mm}}
p.ket{{margin:1mm 0 3mm;color:#3c4f63}}
table{{width:100%;border-collapse:collapse;margin:2mm 0 3mm;page-break-inside:auto}} tr{{page-break-inside:avoid}}
th{{text-align:left;font-size:7.5pt;letter-spacing:.12em;text-transform:uppercase;color:#fff;background:#133250;padding:2.2mm 2.5mm;font-weight:600}}
th:first-child{{border-radius:6px 0 0 0}} th:last-child{{border-radius:0 6px 0 0}}
td{{padding:2.4mm 2.5mm;border-bottom:1px solid #E9DFCD;vertical-align:top}}
td:first-child{{width:25mm}} td:nth-child(2){{width:42mm;font-weight:600}} td:last-child{{width:28mm;color:#6B5840;font-size:8.6pt}}
tbody tr:nth-child(even) td{{background:#F7F3EC}}
.kode{{font-weight:700;font-variant-numeric:tabular-nums;color:#0F6490;white-space:nowrap}}
.kode.utama{{background:#188B9A;color:#fff;padding:.5mm 2mm;border-radius:4px}}
.catatan{{background:#D7EEF0;border-left:3px solid #188B9A;padding:3mm 4mm;border-radius:0 8px 8px 0;margin:3mm 0}}
.paket{{background:linear-gradient(135deg,#0F4F7B,#0F6490 45%,#188B9A);color:#fff;border-radius:14px;padding:6mm 7mm;margin:4mm 0}}
.paket .kodes{{display:flex;flex-wrap:wrap;gap:3mm;margin:3mm 0}}
.paket .kodes span{{background:#fff;color:#133250;font-weight:700;font-size:13pt;padding:1.5mm 4mm;border-radius:8px}}
.paket p{{margin:1mm 0;color:#E9F6F7}}
ol li{{margin-bottom:2mm}}
.kaki{{position:absolute;bottom:9mm;left:17mm;right:17mm;font-size:7.5pt;color:#947C5F;display:flex;justify-content:space-between;border-top:1px solid #E9DFCD;padding-top:2mm}}
.sumber li{{margin-bottom:1.5mm}}
</style></head><body>
<section class="hal sampul"><div class="pola"></div>
<img src="data:image/svg+xml;base64,{logo}">
<div style="position:relative"><div class="label">Riset Perizinan Usaha</div>
<h1>KBLI untuk Resort,<br>Dive Center &amp; Travel</h1>
<p>Rekomendasi Klasifikasi Baku Lapangan Usaha Indonesia (KBLI 2025) untuk pendaftaran NIB di OSS: penginapan, restoran, wisata selam, biro perjalanan, dan antar-jemput speedboat.</p></div>
<div class="meta"><div><b>Dasar</b>KBLI 2025 · Peraturan BPS No. 7/2025</div><div><b>Disusun</b>November 2026</div><div><b>Untuk</b>Bakoeria Dive Resort</div></div>
</section>

<section class="hal">
<h2><small>Ringkasan</small>Paket KBLI yang disarankan</h2>
<p class="ket">KBLI 2025 menggantikan KBLI 2020 (Peraturan BPS No. 2/2020). Seluruh kode di dokumen ini memakai versi 2025, dengan kode 2020 yang setara sebagai pembanding.</p>
<div class="paket"><div class="label" style="color:#fff">Paket minimal</div>
<div class="kodes"><span>55106</span><span>56101</span><span>93297</span><span>79121</span><span>50113</span></div>
<p><b>Tambahan sesuai kebutuhan:</b> 77210 (penyewaan alat untuk umum) · 55300 (camping) · 85599 (kursus selam bersertifikat).</p></div>
<div class="catatan"><b>Tidak ada kode khusus “resort”.</b> Resort didaftarkan sebagai hotel: 55106 Hotel Nonbintang selama belum berklasifikasi bintang, lalu 55101–55105 setelah memiliki sertifikat bintang.</div>
<h2><small>01 · Resort</small>Penginapan dan makan</h2>
{tabel(resort)}
<div class="kaki"><span>Bakoeria Dive Resort · Riset KBLI</span><span>2</span></div>
</section>

<section class="hal">
<h2><small>02 · Dive Center</small>Wisata selam</h2>
{tabel(dive)}
<div class="catatan">Satu kode <b>93297 Wisata Tirta</b> sudah menutup operasional dive center, trip selam, snorkeling, dan kayaking ke sungai.</div>
<h2><small>03 · Travel</small>Biro perjalanan dan transportasi</h2>
{tabel(travel)}
<div class="kaki"><span>Bakoeria Dive Resort · Riset KBLI</span><span>3</span></div>
</section>

<section class="hal">
<h2><small>04 · Aktivitas Lain</small>Opsional</h2>
{tabel(lain)}
<h2><small>05 · Sebelum Mendaftar</small>Yang perlu dicek di OSS</h2>
<ol>
<li><b>Tingkat risiko dan syarat.</b> Hotel, angkutan laut, dan wisata tirta umumnya berisiko menengah-tinggi atau tinggi, sehingga memerlukan Sertifikat Standar atau Izin, bukan hanya NIB. Belum diverifikasi per kode.</li>
<li><b>Kepemilikan asing (PMA).</b> Ada ketentuan khusus untuk angkutan laut dan sebagian usaha pariwisata. Periksa bila ada investor asing.</li>
<li><b>Speedboat.</b> Selain KBLI, kapal memerlukan dokumen kelaiklautan dan perizinan dari Kementerian Perhubungan.</li>
<li><b>Kesesuaian kode.</b> Cocokkan ulang judul dan cakupan tiap kode di oss.go.id saat input, karena tabel konversi 2020 ke 2025 masih dapat diperbarui.</li>
<li><b>Kursus selam.</b> Kecocokan 85599 untuk kursus selam belum dikonfirmasi BPS. Tanyakan ke petugas OSS atau konsultan perizinan.</li>
</ol>
<h2><small>06 · Sumber</small>Rujukan</h2>
<ul class="sumber">
<li>Badan Pusat Statistik, <i>Klasifikasi Baku Lapangan Usaha Indonesia (KBLI) 2025, Volume 2</i>, katalog 1302017, Peraturan BPS No. 7 Tahun 2025. Sumber utama seluruh kutipan cakupan.</li>
<li>Badan Pusat Statistik, <i>Tabel Konversi KBLI 2020 ke KBLI 2025, Volume 2</i> (2026).</li>
<li>OSS (oss.go.id): pencarian dan konversi kode KBLI 55110 dan 93242.</li>
<li>Artikel pendukung: golaw.id, kbli.co.id, legalmp.id, Kompasiana (KBLI homestay).</li>
</ul>
<p class="ket" style="margin-top:6mm;font-size:8pt">Dokumen ini adalah hasil riset, bukan nasihat hukum. Keputusan akhir pemilihan KBLI mengikuti sistem OSS dan arahan instansi berwenang.</p>
<div class="kaki"><span>Bakoeria Dive Resort · Riset KBLI</span><span>4</span></div>
</section>
</body></html>"""
out = R/'research/kbli'; out.mkdir(parents=True, exist_ok=True)
(out/'kbli.html').write_text(html)
js = f"""const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://{out}/kbli.html');await p.evaluate(()=>document.fonts.ready);
await p.pdf({{path:'{out}/Bakoeria-Riset-KBLI.pdf',format:'A4',printBackground:true,preferCSSPageSize:true}});await b.close()}})()"""
subprocess.run(['node','-e',js],check=True)
print('ok', out/'Bakoeria-Riset-KBLI.pdf')
