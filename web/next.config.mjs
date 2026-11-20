/** @type {import("next").NextConfig} */
const config = {
  // Hostinger menjalankan satu proses Node. `standalone` menghasilkan
  // server.js beserta node_modules yang benar-benar dipakai, sehingga server
  // tidak perlu `npm install` maupun build. Lihat DEPLOY.md.
  output: "standalone",
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default config;
