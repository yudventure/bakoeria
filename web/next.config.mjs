import path from "node:path";
import { fileURLToPath } from "node:url";

/* Akar proyek dikunci ke folder ini. Tanpa ini, package-lock.json di akar repo
   (dibuat Hostinger saat `npm install`) membuat Next.js mengira akar repo
   adalah akar proyek, dan server.js tertaruh di .next/standalone/web/. */
const akar = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const config = {
  // Hostinger menjalankan satu proses Node. `standalone` menghasilkan
  // server.js beserta node_modules yang benar-benar dipakai, sehingga server
  // tidak perlu `npm install` maupun build. Lihat DEPLOY.md.
  output: "standalone",
  outputFileTracingRoot: akar,
  turbopack: { root: akar },
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default config;
