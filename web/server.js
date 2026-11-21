// Titik masuk untuk Hostinger yang menjalankan aplikasi dengan `node server.js`
// (Root directory ./web, Entry file server.js), sama seperti Mambetron.
// Menyajikan hasil `npm run build`, sama dengan `npm start`. PORT diatur Hostinger.
const { createServer } = require("node:http");
const next = require("next");

const port = Number.parseInt(process.env.PORT || "3000", 10);
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`Bakoeria Dive Resort berjalan di port ${port}`);
    });
  })
  .catch((e) => {
    console.error("Situs gagal dijalankan. Pastikan npm run build sudah selesai.", e);
    process.exit(1);
  });
