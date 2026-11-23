import path from "node:path";
import { fileURLToPath } from "node:url";

/* Akar proyek dikunci ke folder ini. Tanpa ini, package-lock.json di akar repo
   (dibuat Hostinger saat `npm install`) membuat Next.js mengira akar repo
   adalah akar proyek, dan server.js tertaruh di .next/standalone/web/. */
const akar = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const config = {
  // Build biasa (.next) untuk Hostinger yang membangun dari web/, seperti
  // Mambetron. `standalone` hanya untuk branch deploy dan build dari akar repo
  // (npm run build:standalone), yang menghasilkan server siap jalan tanpa
  // npm install. Lihat DEPLOY.md.
  output: process.env.BAKOERIA_STANDALONE === "1" ? "standalone" : undefined,
  outputFileTracingRoot: akar,
  turbopack: { root: akar },
  poweredByHeader: false,
  /* Basis data IP ke negara untuk statistik pengunjung: dimuat apa adanya dari
     node_modules (berkas datanya dibaca saat jalan), dan ikut dikemas di build standalone. */
  serverExternalPackages: ["geoip-country"],
  outputFileTracingIncludes: { "/api/kunjungan": ["./node_modules/geoip-country/**"] },
  images: { unoptimized: true },
};

export default config;
