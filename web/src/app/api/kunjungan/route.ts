import { NextResponse } from "next/server";

import { bolehLayar } from "@/lib/peran";
import { akunMasuk, tidakAda } from "@/lib/server/akses";
import { bacaStatistik, catatKunjungan, negaraDari, robot } from "@/lib/server/kunjungan";

/**
 * Kunjungan website publik.
 *   POST  { jalur }               dicatat oleh website (beacon), tanpa sesi. Dilewati
 *                                 bila Do Not Track/GPC menyala, pengunjungnya robot,
 *                                 atau yang membuka sedang masuk ke dashboard.
 *   GET   ?rentang=7|30|90&hari=  statistik, untuk yang boleh membuka menu Statistik.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dilewati = () => new NextResponse(null, { status: 204 });
const hitungan = new Map<string, { n: number; sampai: number }>();
function terlaluSering(ip: string) {
  const kini = Date.now();
  const x = hitungan.get(ip);
  if (!x || x.sampai < kini) {
    hitungan.set(ip, { n: 1, sampai: kini + 60_000 });
    if (hitungan.size > 5000) for (const [k, v] of hitungan) if (v.sampai < kini) hitungan.delete(k);
    return false;
  }
  return ++x.n > 60;
}

export async function POST(req: Request) {
  const h = req.headers;
  if (h.get("dnt") === "1" || h.get("sec-gpc") === "1") return dilewati();
  const ua = h.get("user-agent") ?? "";
  if (robot(ua)) return dilewati();
  const ip = ((h.get("x-forwarded-for") ?? "").split(",")[0] || h.get("x-real-ip") || "lokal").trim();
  if (terlaluSering(ip)) return dilewati();
  const o = (await req.json().catch(() => ({}))) as { jalur?: unknown };
  const jalur = typeof o.jalur === "string" && o.jalur.startsWith("/") ? o.jalur.split(/[?#]/)[0].slice(0, 80) : "/";
  if (jalur.startsWith("/kelola") || jalur.startsWith("/api")) return dilewati();
  if (await akunMasuk()) return dilewati();
  await catatKunjungan({
    jalur,
    ip,
    ua,
    bahasa: jalur === "/id" || jalur.startsWith("/id/") ? "id" : "en",
    negara: await negaraDari({
      negaraHeader: h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country") ?? h.get("cloudfront-viewer-country") ?? h.get("x-country-code") ?? h.get("x-hcdn-country") ?? "",
      ip,
      bahasa: h.get("accept-language") ?? "",
    }),
  });
  return dilewati();
}

export async function GET(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !bolehLayar(akun.peran, "statistik")) return tidakAda();
  const q = new URL(req.url).searchParams;
  const rentang = q.get("rentang") === "30" ? 30 : q.get("rentang") === "90" ? 90 : 7;
  return NextResponse.json({ statistik: await bacaStatistik(rentang, q.get("hari") ?? undefined) });
}
