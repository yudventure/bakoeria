/** Mencetak skema MySQL untuk diimpor lewat phpMyAdmin: npm run db:sql */
import { SKEMA } from "../src/lib/server/skema";
console.log("-- Skema database Bakoeria Dive Resort (MySQL/MariaDB).\n-- Aplikasi membuat tabel ini sendiri saat pertama terhubung. Berkas ini hanya\n-- cadangan bila ingin membuatnya lewat phpMyAdmin (menu Import).\n");
console.log(SKEMA.map((s) => s.replace(/\n {2}/g, "\n").trim() + ";").join("\n\n"));
