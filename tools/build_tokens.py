"""Palet, token, dan tabel kontras brand Bakoeria v2.
Warna inti diukur dari logo (tools/logo-trace.json dan k-means piksel nama/sublabel);
warna pendukung diturunkan dari situ untuk latar dan teks yang terbaca.
  python3 tools/build_tokens.py"""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
C = {
  'navy-samudra': ('Navy Samudra', '#133250', 'Nama di logo, judul, teks utama', 'diukur: huruf BAKOERIA'),
  'laut-dalam':   ('Laut Dalam',   '#0A2440', 'Latar gelap, footer, foto malam', 'navy samudra digelapkan'),
  'biru-ombak':   ('Biru Ombak',   '#0F6490', 'Ombak, tautan, tombol utama', 'diukur: ombak atas'),
  'toska-karang': ('Toska Karang', '#188B9A', 'Ujung gradasi ombak, aksen', 'diukur: ombak bawah'),
  'busa-toska':   ('Busa Toska',   '#D7EEF0', 'Latar lembut, sorotan, label status', 'toska karang dicerahkan'),
  'pasir-pantai': ('Pasir Pantai', '#947C5F', 'Palem, rumah, ukiran, sublabel', 'diukur: lapisan pasir'),
  'pasir-tua':    ('Pasir Tua',    '#6B5840', 'Teks bernuansa pasir di latar terang', 'pasir pantai digelapkan untuk kontras'),
  'pasir-muda':   ('Pasir Muda',   '#E9DFCD', 'Latar hangat, garis pemisah', 'pasir pantai dicerahkan'),
  'kerang':       ('Kerang',       '#F7F3EC', 'Latar halaman dan cetak', 'putih hangat'),
  'putih-garam':  ('Putih Garam',  '#FFFFFF', 'Latar logo utama, teks di atas gelap', 'latar logo asli'),
}
GRAD = 'linear-gradient(135deg,#0F4F7B 0%,#0F6490 45%,#188B9A 100%)'

def lum(h):
    r, g, b = (int(h[i:i+2], 16)/255 for i in (1, 3, 5))
    f = lambda c: c/12.92 if c <= .03928 else ((c+.055)/1.055)**2.4
    return .2126*f(r)+.7152*f(g)+.0722*f(b)
def rasio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True); return (la+.05)/(lb+.05)
def hasil(r): return 'AAA' if r >= 7 else 'AA' if r >= 4.5 else 'AA teks besar' if r >= 3 else 'Gagal'

tok = root/'brand/tokens'; tok.mkdir(parents=True, exist_ok=True)
json.dump({k: {'name': n, 'hex': h, 'role': r, 'sumber': s} for k, (n, h, r, s) in C.items()} | {'gradasi-ombak': {'name': 'Gradasi Ombak', 'css': GRAD}}, open(tok/'colors.json', 'w'), indent=2, ensure_ascii=False)
css = ':root{\n' + ''.join(f'  --{k}: {h};\n' for k, (n, h, r, s) in C.items()) + f'''  --gradasi-ombak: {GRAD};
  --font-display: 'Spectral',Georgia,'Times New Roman',serif;
  --font-body: 'Albert Sans','Helvetica Neue',Arial,sans-serif;
  --tracking-display: .12em; --tracking-label: .3em;
  --radius-sm: 6px; --radius-md: 14px; --radius-lg: 28px;
}}\n'''
(tok/'brand.css').write_text('/* Token brand Bakoeria v2 (logo ombak, penyelam, dan pasir). */\n' + css)
(tok/'tailwind.config.js').write_text('/** Token brand Bakoeria v2 untuk Tailwind 3 (Tailwind 4: salin ke @theme). */\nmodule.exports = { theme: { extend: {\n  colors: {\n' + ''.join(f"    '{k}': '{h}',\n" for k, (n, h, r, s) in C.items()) + "  },\n  fontFamily: { display: ['Spectral', 'Georgia', 'serif'], sans: ['Albert Sans', 'Helvetica Neue', 'Arial', 'sans-serif'] },\n  backgroundImage: { 'gradasi-ombak': '" + GRAD + "' },\n} } };\n")
PAS = [('navy-samudra', 'putih-garam'), ('navy-samudra', 'kerang'), ('navy-samudra', 'busa-toska'), ('biru-ombak', 'putih-garam'), ('biru-ombak', 'kerang'),
       ('toska-karang', 'putih-garam'), ('pasir-pantai', 'putih-garam'), ('pasir-tua', 'putih-garam'), ('pasir-tua', 'kerang'),
       ('putih-garam', 'laut-dalam'), ('putih-garam', 'navy-samudra'), ('putih-garam', 'biru-ombak'), ('putih-garam', 'toska-karang'),
       ('busa-toska', 'laut-dalam'), ('pasir-muda', 'laut-dalam'), ('pasir-pantai', 'laut-dalam')]
rows = ['| Teks / elemen | Latar | Rasio | Hasil WCAG 2.2 |', '|---|---|---|---|']
for a, b in PAS:
    r = rasio(C[a][1], C[b][1]); rows.append(f'| {C[a][0]} | {C[b][0]} | {r:.2f}:1 | {hasil(r)} |')
(root/'research/contrast-table.md').write_text('\n'.join(rows)+'\n')
print('\n'.join(rows))
