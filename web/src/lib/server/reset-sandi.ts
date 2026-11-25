import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cariAkun, hashSandi, ubahAkun, type Akun } from "./akun";
import { alamatSaja, emailSiap, kirimEmail, pengirim } from "./email";
import { esc, kepala, kerangka, kotak, paragraf, salam, WARNA } from "./email-kerangka";
import { bacaJson, rahasiaSesi, ubahJson } from "./gudang";
import { asalSitus, kontakEmail } from "./kabar-pesanan";

/**
 * Lupa kata sandi dashboard: kode OTP 6 angka dikirim ke email akun.
 * Kode berlaku 10 menit, gugur setelah 5 kali salah, kode baru paling cepat 60 detik
 * setelah yang sebelumnya. Yang disimpan hanya HMAC kodenya (reset-sandi.json, 0600).
 * Setelah sandi diganti, `versi` akun naik sehingga sesi di perangkat lain keluar.
 */
const BERKAS = "reset-sandi.json";
const BERLAKU_MS = 10 * 60000;
const JEDA_MS = 60000;
const MAKS_COBA = 5;
interface Catatan { hash: string; sampai: number; coba: number; dikirim: number }

const sidik = async (email: string, kode: string) => createHmac("sha256", await rahasiaSesi()).update(`reset:${email}:${kode}`).digest("hex");

export type HasilKirim = { ok: true } | { ok: false; alasan: "email" | "jeda"; tunggu?: number };

/** Kirim kode ke email akun bila akunnya ada dan aktif. Jawaban untuk email tak terdaftar sama dengan yang terdaftar. */
export async function kirimKode(email: string): Promise<HasilKirim> {
  if (!emailSiap()) return { ok: false, alasan: "email" };
  const akun = await cariAkun(email);
  if (!akun || !akun.aktif) return { ok: true };
  const semua = await bacaJson<Record<string, Catatan>>(BERKAS, {});
  const lama = semua[email];
  if (lama && Date.now() - lama.dikirim < JEDA_MS) return { ok: false, alasan: "jeda", tunggu: Math.ceil((JEDA_MS - (Date.now() - lama.dikirim)) / 1000) };
  const kode = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const hash = await sidik(email, kode);
  await ubahJson<Record<string, Catatan>>(BERKAS, {}, (l) => {
    const kini = Date.now();
    const bersih = Object.fromEntries(Object.entries(l).filter(([, c]) => c.sampai > kini));
    return { ...bersih, [email]: { hash, sampai: kini + BERLAKU_MS, coba: 0, dikirim: kini } };
  }, 0o600);
  await kirimEmailKode(akun, kode);
  return { ok: true };
}

export type HasilReset = { ok: true; akun: Akun } | { ok: false; pesan: string };

export async function gantiDenganKode(email: string, kode: string, sandiBaru: string): Promise<HasilReset> {
  const salahUmum = { ok: false as const, pesan: "Kode salah atau sudah tidak berlaku. Minta kode baru." };
  const semua = await bacaJson<Record<string, Catatan>>(BERKAS, {});
  const c = semua[email];
  if (!c || c.sampai < Date.now() || c.coba >= MAKS_COBA) return salahUmum;
  const benar = Buffer.from(c.hash, "hex");
  const dicoba = Buffer.from(await sidik(email, kode.replace(/\D/g, "")), "hex");
  if (benar.length !== dicoba.length || !timingSafeEqual(benar, dicoba)) {
    await ubahJson<Record<string, Catatan>>(BERKAS, {}, (l) => (l[email] ? { ...l, [email]: { ...l[email], coba: l[email].coba + 1 } } : l), 0o600);
    const sisa = MAKS_COBA - c.coba - 1;
    return { ok: false, pesan: sisa > 0 ? `Kode salah. Sisa ${sisa} kali percobaan.` : "Kode salah terlalu sering. Minta kode baru." };
  }
  const akun = await cariAkun(email);
  if (!akun || !akun.aktif) return salahUmum;
  const sandi = await hashSandi(sandiBaru);
  let hasil: Akun | undefined;
  await ubahAkun((d) => d.map((a) => (a.email === email ? (hasil = { ...a, sandi, versi: a.versi + 1, terakhirMasuk: new Date().toISOString() }) : a)));
  await ubahJson<Record<string, Catatan>>(BERKAS, {}, (l) => { const { [email]: _hapus, ...sisa } = l; return sisa; }, 0o600);
  await kirimEmailBerubah(akun).catch(() => undefined);
  return hasil ? { ok: true, akun: hasil } : salahUmum;
}

async function kirimEmailKode(akun: Akun, kode: string) {
  const asal = await asalSitus();
  const kodeBesar = `<p style="margin:6px 0 18px;font:700 34px/1.2 'Courier New', monospace;letter-spacing:.3em;color:${WARNA.malam};">${esc(kode)}</p>`;
  const isi = `${kepala("Reset kata sandi", "Kode reset kata sandi", `Halo ${akun.nama.split(" ")[0]}, ada permintaan reset kata sandi dashboard Bakoeria untuk ${akun.email}.`)}
          ${paragraf("Masukkan kode ini di halaman Masuk:")}
          ${kodeBesar}
          ${kotak("Kode berlaku <b>10 menit</b> dan hanya bisa dipakai sekali. Jangan berikan kode ini kepada siapa pun, termasuk yang mengaku dari tim Bakoeria. Kalau Anda tidak meminta reset, abaikan email ini: kata sandi Anda tidak berubah.", WARNA.kertas)}
          ${salam("Salam,", "Dashboard Bakoeria Dive Resort")}`;
  const teks = `Kode reset kata sandi dashboard Bakoeria: ${kode}\nBerlaku 10 menit. Jangan berikan kode ini kepada siapa pun. Abaikan email ini bila Anda tidak meminta reset.`;
  await kirimEmail(akun.email, `${kode} adalah kode reset kata sandi Bakoeria`, teks, alamatSaja(pengirim()) || undefined, kerangka({ asal, en: false, pratinjau: `Kode reset: ${kode}`, isi, kontak: await kontakEmail(false) }));
}

async function kirimEmailBerubah(akun: Akun) {
  const asal = await asalSitus();
  const waktu = new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jayapura" });
  const isi = `${kepala("Keamanan akun", "Kata sandi berhasil diganti", `Kata sandi dashboard Bakoeria untuk ${akun.email} diganti lewat kode email pada ${waktu} WIT.`)}
          ${kotak("Semua sesi di perangkat lain otomatis keluar. Kalau bukan Anda yang menggantinya, segera minta kode reset baru di halaman Masuk dan hubungi pemilik akun.", "#FFF4D6")}
          ${salam("Salam,", "Dashboard Bakoeria Dive Resort")}`;
  await kirimEmail(akun.email, "Kata sandi dashboard Bakoeria diganti", `Kata sandi dashboard Bakoeria untuk ${akun.email} diganti pada ${waktu} WIT. Bila bukan Anda, segera reset lagi dan hubungi pemilik.`, undefined, kerangka({ asal, en: false, pratinjau: "Kata sandi Anda baru saja diganti", isi, kontak: await kontakEmail(false) }));
}
