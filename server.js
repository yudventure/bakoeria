// Titik masuk untuk Hostinger bila aplikasi dibangun dari akar repo
// (Root directory "./", Entry file "server.js"). Server Next.js yang
// sebenarnya ada di web/.next/standalone setelah `npm run build`; ia
// berpindah ke foldernya sendiri dan membaca PORT dari lingkungan.
const path = require("node:path");
const fs = require("node:fs");
const server = path.join(__dirname, "web", ".next", "standalone", "server.js");
if (!fs.existsSync(server)) {
  console.error("web/.next/standalone/server.js belum ada. Jalankan `npm run build` di akar repo dulu.");
  process.exit(1);
}
require(server);
