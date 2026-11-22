/**
 * Membuat gambar pratinjau tautan (Open Graph) 1200x630 untuk WhatsApp,
 * Facebook, dan lainnya: public/img/og-en.jpg dan public/img/og-id.jpg.
 * Logo memakai SVG hasil vektorisasi di public/brand, bukan gambar ulang.
 * WhatsApp hanya menampilkan gambar yang kecil, jadi keluaran JPEG < 300 KB.
 *   node scripts/og.cjs   (butuh Playwright + Chromium)
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const pub = path.join(__dirname, "..", "public");
const b64 = (f) => fs.readFileSync(path.join(pub, f)).toString("base64");
const TEKS = { en: "Dive by day, sleep under the stars.", id: "Menyelam siang, bermalam di bawah bintang." };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const [bahasa, teks] of Object.entries(TEKS)) {
    await p.setContent(`<!doctype html><html><head><style>
      @font-face { font-family: Spectral; font-style: italic; src: url(data:font/woff2;base64,${b64("fonts/spectral-latin-400-italic.woff2")}); }
      @font-face { font-family: Albert; font-weight: 600; src: url(data:font/woff2;base64,${b64("fonts/albert-sans-latin-600-normal.woff2")}); }
      * { margin: 0; box-sizing: border-box; }
      body { width: 1200px; height: 630px; overflow: hidden; background: #FFFFFF; position: relative; }
      .foto { position: absolute; inset: 0 0 0 520px; background: url(data:image/jpeg;base64,${b64("img/resort-night.jpg")}) center 62% / cover;
        -webkit-mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,.6) 20%, #000 42%); }
      .gelap { position: absolute; inset: 0; background: linear-gradient(90deg, #FFFFFF 0%, rgba(255,255,255,.97) 44%, rgba(255,255,255,0) 60%); }
      .isi { position: absolute; left: 50px; top: 0; bottom: 0; width: 540px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
      .isi img { width: 330px; }
      .tag { margin-top: 18px; font: italic 26px/1.3 Spectral, serif; color: #133250; }
      .garis { margin-top: 22px; font: 600 15px Albert, sans-serif; letter-spacing: .32em; color: #0F6490; text-transform: uppercase; }
    </style></head><body>
      <div class="foto"></div><div class="gelap"></div>
      <div class="isi">
        <img src="data:image/svg+xml;base64,${b64("brand/bakoeria-logo-stacked-warna.svg")}">
        <p class="tag">${teks}</p>
        <p class="garis">Raja Ampat · Indonesia</p>
      </div>
    </body></html>`);
    await p.waitForTimeout(300);
    const out = path.join(pub, "img", `og-${bahasa}.jpg`);
    await p.screenshot({ path: out, type: "jpeg", quality: 84 });
    console.log(out, Math.round(fs.statSync(out).size / 1024) + " KB");
  }
  await b.close();
})();
