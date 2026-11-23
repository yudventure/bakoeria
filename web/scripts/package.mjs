/**
 * Mengubah hasil `next build` menjadi folder yang siap dijalankan Hostinger.
 * Diadaptasi dari Unmehopa Management; alasan tiap langkah ditulis di sana
 * dan diringkas di sini.
 *
 *   node scripts/package.mjs            siapkan .next/standalone
 *   node scripts/package.mjs --archive  juga tulis dist/app.tar.gz dan dist/app.zip
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");
if (!existsSync(join(standalone, "server.js"))) {
  console.error('Tidak ada .next/standalone/server.js. Jalankan `npm run build` dulu, dengan output: "standalone".');
  process.exit(1);
}
const size = (p) => (!existsSync(p) ? 0 : statSync(p).isDirectory() ? readdirSync(p).reduce((n, e) => n + size(join(p, e)), 0) : statSync(p).size);
const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;

/* Satu proses Node tidak punya CDN di depannya, jadi public/ dan .next/static
   harus ada di samping server. Tanpa ini situs tampil tanpa gaya dan foto. */
cpSync(join(root, "public"), join(standalone, "public"), { recursive: true });
cpSync(join(root, ".next", "static"), join(standalone, ".next", "static"), { recursive: true });

/* /version.json: commit mana yang sedang tayang. Dipakai workflow untuk
   menunggu sampai deploy benar-benar mendarat. */
let commit = (process.env.GITHUB_SHA ?? "").trim();
if (!commit) {
  try {
    commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root }).toString().trim();
  } catch {
    commit = "";
  }
}
writeFileSync(join(standalone, "public", "version.json"), JSON.stringify({ commit, short: commit.slice(0, 7), builtAt: new Date().toISOString() }, null, 2) + "\n");

/* Tidak ada next/image (images.unoptimized) dan foto unggahan dikompres di
   browser, jadi biner sharp yang ikut tertelusur tidak pernah dipanggil.
   Dibuang supaya arsip kecil. */
for (const dead of ["@img", "sharp"]) rmSync(join(standalone, "node_modules", dead), { recursive: true, force: true });

/* package.json yang jujur tentang isi folder ini: dependensi runtime dengan
   versi persis, `start` menjalankan server, dan `build` yang tidak membangun
   apa-apa. Formulir Hostinger mewajibkan build command; tanpa script ini
   satu-satunya pilihan adalah `npm run start`, yang menggantung. Daftar
   dependensi tidak boleh kosong: npm install akan menghapus node_modules. */
const asal = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const pinned = Object.fromEntries(
  Object.keys(asal.dependencies ?? {}).map((n) => {
    const meta = join(root, "node_modules", n, "package.json");
    return [n, existsSync(meta) ? JSON.parse(readFileSync(meta, "utf8")).version : asal.dependencies[n]];
  }),
);
writeFileSync(
  join(standalone, "package.json"),
  JSON.stringify(
    {
      name: asal.name,
      version: asal.version,
      private: true,
      scripts: { build: "echo Sudah dibangun di GitHub Actions - tidak ada yang perlu dibangun di sini", start: "node server.js" },
      dependencies: pinned,
    },
    null,
    2,
  ) + "\n",
);
rmSync(join(standalone, ".npmrc"), { force: true });

for (const wajib of ["server.js", ".next/static", "public/brand", "public/version.json"]) {
  if (!existsSync(join(standalone, wajib))) {
    console.error(`Gagal: ${wajib} tidak ada di .next/standalone.`);
    process.exit(1);
  }
}
writeFileSync(join(standalone, "BUILD-INFO.txt"), `Dibuat : ${new Date().toISOString()}\nCommit : ${commit || "tidak diketahui"}\nJalankan dengan: node server.js\nPORT dan HOSTNAME dibaca dari lingkungan.\n`);
console.log(`.next/standalone siap, ${mb(size(standalone))}`);

if (process.argv.includes("--archive")) {
  const dist = join(root, "dist");
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
  execFileSync("tar", ["-czf", join(dist, "app.tar.gz"), "-C", standalone, "."], { stdio: "inherit" });
  try {
    execFileSync("zip", ["-qr", join(dist, "app.zip"), "."], { cwd: standalone, stdio: "inherit" });
  } catch {
    console.warn("zip tidak tersedia; hanya app.tar.gz yang dibuat.");
  }
  console.log(`dist/app.tar.gz, ${mb(size(join(dist, "app.tar.gz")))}`);
}
