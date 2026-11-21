import "server-only";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import mysql from "mysql2/promise";

import { dbDiatur, envDb } from "@/lib/server/env-db";
import { SKEMA } from "@/lib/server/skema";

/**
 * Satu-satunya tempat koneksi database dibuat. MySQL bawaan Hostinger
 * (hPanel → Databases → MySQL), dengan cara koneksi yang sama seperti
 * Mambetron:
 *
 * Host lokal dicoba lewat soket MySQL lebih dulu, lalu 127.0.0.1, lalu nama
 * host itu sendiri. Node bisa membaca "localhost" sebagai ::1 (IPv6) padahal
 * MySQL di hosting bersama hanya mendengar di IPv4 atau soket.
 *
 * Tabel dibuat sendiri pada kueri pertama setelah server menyala. Tanpa
 * DB_NAME dan DB_USER aplikasi tetap menyala: situs publik dan halaman masuk
 * jalan, dan dashboard mengatakan di layar bahwa database belum diatur.
 */
type Simpan = { pool?: mysql.Pool; kunci?: string; siap?: Promise<void>; cari?: Promise<mysql.Pool>; cara?: string; galat?: string; galatPada?: string };
const g = globalThis as unknown as { __bakoeriaDb?: Simpan };
const S: Simpan = (g.__bakoeriaDb ??= {});

export const databaseReady = dbDiatur;
export const caraTerhubung = () => S.cara ?? "";

const SOKET = ["/var/lib/mysql/mysql.sock", "/run/mysqld/mysqld.sock", "/var/run/mysqld/mysqld.sock", "/tmp/mysql.sock"];
function soketAda() {
  const asli = new Set<string>();
  return SOKET.filter((p) => {
    try {
      const r = fs.realpathSync(p);
      if (asli.has(r) || !fs.statSync(r).isSocket()) return false;
      asli.add(r);
      return true;
    } catch {
      return false;
    }
  });
}

type Env = ReturnType<typeof envDb>;
type Cara = { label: string; opsi: { host?: string; port?: number; socketPath?: string } };
function caraHubung(e: Env): Cara[] {
  if (e.socket) return [{ label: `soket ${e.socket}`, opsi: { socketPath: e.socket } }];
  if (!["localhost", "127.0.0.1", "::1"].includes(e.host)) return [{ label: `${e.host}:${e.port}`, opsi: { host: e.host, port: e.port } }];
  return [
    ...soketAda().map((p) => ({ label: `soket ${p}`, opsi: { socketPath: p } })),
    { label: `127.0.0.1:${e.port}`, opsi: { host: "127.0.0.1", port: e.port } },
    ...(e.host === "127.0.0.1" ? [] : [{ label: `${e.host}:${e.port}`, opsi: { host: e.host, port: e.port } }]),
  ];
}

async function pilihCara(e: Env): Promise<Cara> {
  const gagal: string[] = [];
  for (const c of caraHubung(e)) {
    try {
      const k = await mysql.createConnection({ user: e.user, password: e.password, database: e.database, connectTimeout: 8000, ...c.opsi });
      await k.end();
      return c;
    } catch (x) {
      gagal.push(`${c.label} menjawab ${(x as Error).message}`);
    }
  }
  throw new Error(gagal.join(" | "));
}

async function ambilPool(): Promise<mysql.Pool> {
  if (!dbDiatur()) throw new Error("Database belum diatur. Isi DB_NAME, DB_USER, dan DB_PASSWORD di panel Node.js Hostinger.");
  const e = envDb();
  const kunci = `${e.host}|${e.port}|${e.socket}|${e.user}|${e.database}|${e.password.length}`;
  if (S.pool && S.kunci === kunci) return S.pool;
  S.cari ??= pilihCara(e)
    .then((c) => {
      const pool = mysql.createPool({
        user: e.user,
        password: e.password,
        database: e.database,
        ...c.opsi,
        connectionLimit: 5,
        maxIdle: 2,
        idleTimeout: 60000,
        enableKeepAlive: true,
        dateStrings: true,
        charset: "utf8mb4",
        connectTimeout: 10000,
        decimalNumbers: true,
        timezone: "Z",
      });
      pool.pool.on("connection", (k) => {
        k.query("SET time_zone = '+00:00'");
      });
      S.pool = pool;
      S.kunci = kunci;
      S.siap = undefined;
      S.cara = c.label;
      return pool;
    })
    .catch((x) => {
      catatGalat(x);
      throw x;
    })
    .finally(() => {
      S.cari = undefined;
    });
  return S.cari;
}

/** Galat terakhir untuk diagnosis di dashboard. Pesan MySQL tidak pernah memuat sandi. */
function catatGalat(x: unknown) {
  S.galat = (x instanceof Error ? x.message : String(x)).slice(0, 2000);
  S.galatPada = new Date().toISOString();
}

/** Pool yang tabelnya sudah dipastikan ada. */
async function pool(): Promise<mysql.Pool> {
  const p = await ambilPool();
  S.siap ??= (async () => {
    for (const sql of SKEMA) await p.query(sql);
  })()
    .then(() => {
      S.galat = undefined;
    })
    .catch((e) => {
      S.siap = undefined;
      catatGalat(new Error(`Terhubung lewat ${S.cara}, tetapi tabel tidak bisa dibuat: ${e instanceof Error ? e.message : e}`));
      throw e;
    });
  await S.siap;
  return p;
}

/**
 * Diagnosis koneksi untuk dashboard: nilai yang terbaca (tanpa sandi), cara
 * koneksi yang berhasil atau jawaban server untuk tiap alamat yang dicoba,
 * dan arti jawaban itu dalam bahasa sehari-hari.
 */
export async function diagnosaDb() {
  const e = envDb();
  const terbaca = Object.keys(process.env).filter((k) => /^(DB_|MYSQL_|DATABASE_)/.test(k) && (process.env[k] ?? "").trim() !== "").sort();
  const hasil = await cekDb();
  const galat = hasil === "ok" ? "" : S.galat ?? "";
  return {
    status: hasil,
    host: e.host,
    port: e.port,
    database: e.database,
    user: e.user,
    sandiPanjang: e.password.length,
    socket: e.socket,
    cara: S.cara ?? "",
    variabelTerbaca: terbaca,
    soketDitemukan: soketAda(),
    galat,
    arti: artiGalat(galat, e.user, e.database),
  };
}

function artiGalat(g: string, user: string, database: string): string {
  if (!g) return "";
  if (/Access denied for user .* to database/i.test(g))
    return `Sandi diterima, tetapi pengguna "${user}" tidak punya izin ke database "${database}". Di hPanel (Databases, MySQL Databases), pastikan pengguna itu terhubung ke database tersebut dengan semua hak akses.`;
  if (/Access denied for user/i.test(g))
    return `MySQL menolak pengguna "${user}" dengan sandi itu: sandinya tidak cocok, atau pengguna dengan nama itu belum ada. Di hPanel (Databases, MySQL Databases), cocokkan nama pengguna lalu ganti sandinya. Pakai huruf dan angka saja (tanpa # $ ' " \\ atau spasi), salin persis ke DB_PASSWORD, lalu restart aplikasi.`;
  if (/Unknown database/i.test(g)) return `Database "${database}" tidak ditemukan. Salin nama database lengkap (dengan awalan u…_) dari hPanel ke DB_NAME.`;
  if (/ECONNREFUSED|ENOENT/i.test(g)) return "Tidak ada server MySQL yang menjawab di alamat itu. Di Hostinger biarkan DB_HOST=localhost; bila tetap gagal, isi DB_HOST dengan host MySQL yang tertera di hPanel.";
  if (/ETIMEDOUT|timeout/i.test(g)) return "Server MySQL tidak menjawab dalam waktu yang wajar. Periksa DB_HOST, atau coba lagi beberapa saat.";
  if (/ENOTFOUND|EAI_AGAIN/i.test(g)) return "Nama host database tidak dikenal. Periksa ejaan DB_HOST, atau pakai localhost.";
  if (/tabel tidak bisa dibuat/i.test(g)) return "Koneksi berhasil, tetapi pengguna database tidak punya izin membuat tabel. Di hPanel, pastikan pengguna itu terhubung ke database dengan semua hak akses.";
  return "Lihat pesan server di atas.";
}

export type Nilai = string | number | boolean | null | Date | Buffer | Nilai[];
export type Baris = Record<string, unknown>;
type Pelaksana = Pick<mysql.Pool, "query"> | mysql.PoolConnection;

/** Menjalankan kueri dan mengembalikan baris (SELECT) atau ringkasan (INSERT/UPDATE). */
export async function kueri<T = Baris>(sql: string, nilai: Nilai[] = [], lewat?: Pelaksana): Promise<T[]> {
  const [hasil] = await (lewat ?? (await pool())).query(sql, nilai);
  return (Array.isArray(hasil) ? hasil : []) as T[];
}

export async function jalankan(sql: string, nilai: Nilai[] = [], lewat?: Pelaksana): Promise<mysql.ResultSetHeader> {
  const [hasil] = await (lewat ?? (await pool())).query(sql, nilai);
  return hasil as mysql.ResultSetHeader;
}

/** Satu transaksi. Kembali menggulung bila fungsi melempar. */
export async function transaksi<T>(kerja: (k: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const k = await (await pool()).getConnection();
  try {
    /* READ COMMITTED: tiap pernyataan melihat data terbaru yang sudah disimpan,
       bukan potret dari awal transaksi. Dipadukan dengan kunci baris kamar,
       inilah yang membuat pemeriksaan bentrok melihat penyimpanan yang baru
       saja selesai di transaksi lain. */
    await k.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    await k.beginTransaction();
    const hasil = await kerja(k);
    await k.commit();
    return hasil;
  } catch (e) {
    await k.rollback().catch(() => {});
    throw e;
  } finally {
    k.release();
  }
}

/** Id acak 24 karakter, aman di URL. */
export const idBaru = () => randomBytes(12).toString("hex");

/** Untuk pemeriksaan kesehatan: apakah database bisa dijangkau. */
export async function cekDb(): Promise<"ok" | "tidak-diisi" | "gagal"> {
  if (!dbDiatur()) return "tidak-diisi";
  try {
    await kueri("SELECT 1");
    return "ok";
  } catch (e) {
    console.error("[db]", e instanceof Error ? e.message : e);
    return "gagal";
  }
}
