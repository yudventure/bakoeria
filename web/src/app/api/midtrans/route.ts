import { wajib } from "@/lib/server/akses";
import { badan, gagal, ok } from "@/lib/server/rute";
import { GalatMidtrans, konfigMidtrans, kunciSah, simpanMidtrans, statusMidtrans, ujiServerKey, type ModeMidtrans } from "@/lib/server/midtrans";

/** Pengaturan Midtrans di dashboard. Kunci tidak pernah dikirim balik, hanya empat huruf terakhirnya. */
export async function GET() {
  const a = await wajib("pengaturan");
  if (a instanceof Response) return a;
  return ok({ midtrans: await statusMidtrans() });
}

export async function PUT(req: Request) {
  const a = await wajib("pengaturan");
  if (a instanceof Response) return a;
  if (a.peran !== "pemilik" && a.peran !== "developer") return gagal("Hanya pemilik yang bisa mengubah pembayaran online.", 403);
  const o = await badan(req);
  if (o.hapus === true) {
    await simpanMidtrans({ aktif: false, mode: "sandbox", hapus: true });
    return ok({ midtrans: await statusMidtrans() });
  }
  const mode: ModeMidtrans = o.mode === "produksi" ? "produksi" : "sandbox";
  const serverKey = typeof o.serverKey === "string" ? o.serverKey.trim() : "";
  const signatureKey = typeof o.signatureKey === "string" ? o.signatureKey.trim() : "";
  if (serverKey && !kunciSah(serverKey)) return gagal("Server Key tidak terbaca utuh. Salin lagi dari Dashboard Midtrans, Settings, Access Keys.");
  if (signatureKey && !kunciSah(signatureKey)) return gagal("Signature Secret Key tidak terbaca utuh. Salin lagi dari Dashboard Midtrans, Settings, Access Keys.");
  /* Server Key yang baru diisi (atau mode yang diganti) diuji dulu ke Midtrans sebelum disimpan. */
  const lama = await konfigMidtrans();
  const uji = serverKey || (lama && (o.uji === true || lama.produksi !== (mode === "produksi")) ? lama.serverKey : "");
  let diuji: string | undefined;
  if (uji) {
    try {
      await ujiServerKey(uji, mode === "produksi");
      diuji = new Date().toISOString();
    } catch (e) {
      return gagal(e instanceof GalatMidtrans ? e.message : "Server Key belum bisa diuji.");
    }
  }
  await simpanMidtrans({ aktif: o.aktif !== false, mode, serverKey: serverKey || undefined, signatureKey: signatureKey || undefined, diuji });
  return ok({ midtrans: await statusMidtrans() });
}
