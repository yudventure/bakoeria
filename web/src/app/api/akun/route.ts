import { PERAN, rapikanPeran } from "@/lib/peran";
import { wajib } from "@/lib/server/akses";
import { emailSah, hashSandi, publik, rapikanEmail, SANDI_MIN, semuaAkun, ubahAkun } from "@/lib/server/akun";
import { badan, gagal, ok } from "@/lib/server/rute";

/** Daftar akun. Hanya developer dan pemilik (layar Pengguna). */
export async function GET() {
  const a = await wajib("pengguna");
  if (a instanceof Response) return a;
  return ok({ akun: (await semuaAkun()).map(publik), peran: PERAN });
}

export async function POST(req: Request) {
  const a = await wajib("pengguna");
  if (a instanceof Response) return a;
  const o = await badan(req);
  const email = rapikanEmail(o.email);
  const nama = typeof o.nama === "string" ? o.nama.trim().slice(0, 80) : "";
  const sandi = typeof o.sandi === "string" ? o.sandi : "";
  if (!nama) return gagal("Isi nama.");
  if (!emailSah(email)) return gagal("Email tidak sah.");
  if (sandi.length < SANDI_MIN) return gagal(`Kata sandi awal minimal ${SANDI_MIN} karakter.`);
  const peran = rapikanPeran(o.peran);
  if (peran === "developer" && a.peran !== "developer") return gagal("Hanya developer yang bisa membuat akun developer.", 403);
  if ((await semuaAkun()).some((x) => x.email === email)) return gagal("Email itu sudah punya akun.", 409);
  const baru = { email, nama, peran, aktif: true, sandi: await hashSandi(sandi), versi: 1, dibuat: new Date().toISOString() };
  await ubahAkun((d) => [...d, baru]);
  return ok({ akun: publik(baru) }, 201);
}

/** Mengubah nama, peran, status aktif, atau mengatur ulang sandi akun lain. */
export async function PATCH(req: Request) {
  const a = await wajib("pengguna");
  if (a instanceof Response) return a;
  const o = await badan(req);
  const email = rapikanEmail(o.email);
  const target = (await semuaAkun()).find((x) => x.email === email);
  if (!target) return gagal("Akun tidak ditemukan.", 404);
  if (target.peran === "developer" && a.peran !== "developer") return gagal("Akun developer hanya bisa diubah developer.", 403);
  const peran = o.peran !== undefined ? rapikanPeran(o.peran) : target.peran;
  if (peran === "developer" && a.peran !== "developer") return gagal("Hanya developer yang bisa memberi peran developer.", 403);
  const aktif = typeof o.aktif === "boolean" ? o.aktif : target.aktif;
  if (email === a.email && (!aktif || peran !== a.peran)) return gagal("Peran dan status akun sendiri tidak bisa diubah dari sini.");
  let sandi = target.sandi;
  let versi = target.versi;
  if (typeof o.sandi === "string" && o.sandi) {
    if (o.sandi.length < SANDI_MIN) return gagal(`Kata sandi minimal ${SANDI_MIN} karakter.`);
    sandi = await hashSandi(o.sandi);
    versi += 1;
  }
  if (!aktif) versi += target.aktif ? 1 : 0;
  const nama = typeof o.nama === "string" && o.nama.trim() ? o.nama.trim().slice(0, 80) : target.nama;
  await ubahAkun((d) => d.map((x) => (x.email === email ? { ...x, nama, peran, aktif, sandi, versi } : x)));
  return ok({ diubah: true });
}

export async function DELETE(req: Request) {
  const a = await wajib("pengguna");
  if (a instanceof Response) return a;
  const email = rapikanEmail(new URL(req.url).searchParams.get("email"));
  if (email === a.email) return gagal("Akun sendiri tidak bisa dihapus.");
  const target = (await semuaAkun()).find((x) => x.email === email);
  if (!target) return gagal("Akun tidak ditemukan.", 404);
  if (target.peran === "developer" && a.peran !== "developer") return gagal("Akun developer hanya bisa dihapus developer.", 403);
  await ubahAkun((d) => d.filter((x) => x.email !== email));
  return ok({ dihapus: true });
}
