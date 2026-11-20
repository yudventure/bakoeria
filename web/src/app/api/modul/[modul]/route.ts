import { NextResponse } from "next/server";

import { KOLEKSI, rapikanParameter, type Modul, type Rekaman } from "@/lib/modul";
import { aksesModul } from "@/lib/peran";
import { akunMasuk, galat, tidakAda } from "@/lib/server/akses";
import { bacaModul, hapusRekaman, parameterSdm, simpanParameterSdm, simpanRekaman } from "@/lib/server/modul";

/**
 * Data modul keuangan, SDM, dan gudang (berkas JSON di folder data).
 *   GET     semua catatan modul beserta akses akun
 *   POST    { koleksi, id?, data }   tambah atau ubah
 *   PUT     { parameter }            angka acuan gaji (SDM)
 *   DELETE  ?koleksi=&id=
 */
export const dynamic = "force-dynamic";
const modulSah = (m: string): m is Modul => m === "keuangan" || m === "sdm" || m === "gudang";
type Ctx = { params: Promise<{ modul: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const { modul } = await params;
  const akun = await akunMasuk();
  if (!modulSah(modul) || !akun) return tidakAda();
  const akses = aksesModul(akun.peran, modul);
  if (!akses) return tidakAda();
  const isi = await bacaModul(modul);
  const data: Record<string, Rekaman[]> = {};
  const koleksi = KOLEKSI.filter((x) => x.modul === modul);
  for (const k of koleksi) data[k.id] = Array.isArray(isi[k.id]) ? (isi[k.id] as Rekaman[]) : [];
  const tulisKoleksi = koleksi.filter((k) => aksesModul(akun.peran, modul, k.id) === "tulis").map((k) => k.id);
  return NextResponse.json({
    data,
    akses,
    tulisKoleksi,
    ...(modul === "sdm" ? { parameter: await parameterSdm(), bolehUbahParameter: ["developer", "pemilik", "manajer"].includes(akun.peran) } : {}),
  });
}

export async function POST(req: Request, { params }: Ctx) {
  const { modul } = await params;
  const akun = await akunMasuk();
  if (!modulSah(modul) || !akun) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as { koleksi?: unknown; id?: unknown; data?: unknown };
  const koleksi = typeof o.koleksi === "string" ? o.koleksi : "";
  if (aksesModul(akun.peran, modul, koleksi) !== "tulis") return galat("Peran Anda hanya bisa melihat data ini.", 403);
  const id = typeof o.id === "string" && o.id ? o.id : undefined;
  const r = await simpanRekaman(modul, koleksi, (o.data && typeof o.data === "object" ? o.data : {}) as Record<string, unknown>, akun.nama, id);
  if (r.tidakAda) return tidakAda();
  if (r.galat) return galat(r.galat);
  return NextResponse.json({ rekaman: r.rekaman });
}

export async function PUT(req: Request, { params }: Ctx) {
  const { modul } = await params;
  const akun = await akunMasuk();
  if (modul !== "sdm" || !akun || !["developer", "pemilik", "manajer"].includes(akun.peran)) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as { parameter?: unknown };
  return NextResponse.json({ parameter: await simpanParameterSdm(rapikanParameter(o.parameter)) });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { modul } = await params;
  const akun = await akunMasuk();
  if (!modulSah(modul) || !akun) return tidakAda();
  const u = new URL(req.url);
  const koleksi = u.searchParams.get("koleksi") ?? "";
  if (aksesModul(akun.peran, modul, koleksi) !== "tulis" || akun.peran === "staf") return galat("Peran Anda tidak bisa menghapus data ini.", 403);
  const r = await hapusRekaman(modul, koleksi, u.searchParams.get("id") ?? "");
  if (r.tidakAda) return tidakAda();
  if (r.galat) return galat(r.galat, 409);
  return NextResponse.json({ ok: true });
}
