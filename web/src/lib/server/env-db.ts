import "server-only";

/**
 * Pengaturan database dari variabel lingkungan, dengan nama yang sama seperti
 * Mambetron: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SOCKET. Nama
 * lain yang sering dipakai juga terbaca, begitu pula satu DATABASE_URL
 * berbentuk mysql://pengguna:sandi@host:3306/nama. Dibaca saat jalan, jadi
 * nilai yang diisi belakangan di hPanel berlaku setelah restart tanpa build.
 */
const baca = (k: string) => (process.env[k] ?? "").trim();

/** Sandi seperti diketik di hPanel: tanpa spasi di ujung dan tanpa sepasang tanda kutip. */
export function rapiSandi(v: string) {
  const s = v.trim();
  return s.match(/^(['"])([\s\S]*)\1$/)?.[2] ?? s;
}

const NAMA = {
  host: ["DB_HOST", "DB_HOSTNAME", "MYSQL_HOST", "DATABASE_HOST"],
  port: ["DB_PORT", "MYSQL_PORT", "DATABASE_PORT"],
  database: ["DB_NAME", "DB_DATABASE", "MYSQL_DATABASE", "DATABASE_NAME"],
  user: ["DB_USER", "DB_USERNAME", "MYSQL_USER", "DATABASE_USER"],
  password: ["DB_PASSWORD", "DB_PASS", "MYSQL_PASSWORD", "DATABASE_PASSWORD"],
} as const;
const pertama = (n: readonly string[]) => n.map(baca).find(Boolean) ?? "";

function dariUrl() {
  const u = baca("DATABASE_URL");
  if (!u) return null;
  try {
    const x = new URL(u);
    if (!x.protocol.startsWith("mysql")) return null;
    return { host: x.hostname, port: x.port, user: decodeURIComponent(x.username), password: decodeURIComponent(x.password), database: decodeURIComponent(x.pathname.replace(/^\//, "")) };
  } catch {
    return null;
  }
}

export function envDb() {
  const u = dariUrl();
  const sandi = NAMA.password.map((k) => rapiSandi(process.env[k] ?? "")).find((v) => v !== "");
  return {
    host: pertama(NAMA.host) || u?.host || "localhost",
    port: Number(pertama(NAMA.port) || u?.port || "3306") || 3306,
    user: pertama(NAMA.user) || u?.user || "",
    password: sandi ?? u?.password ?? "",
    database: pertama(NAMA.database) || u?.database || "",
    socket: baca("DB_SOCKET"),
  };
}

export const dbDiatur = () => {
  const d = envDb();
  return Boolean(d.user && d.database);
};
