import { db } from "@/lib/db";
import { wajib } from "@/lib/server/akses";
import { tokenBaru } from "@/lib/server/sinkron";
import { badan, gagal, ok, tanpaDb } from "@/lib/server/rute";

export async function GET() {
  const a = await wajib("sinkron");
  if (a instanceof Response) return a;
  const t = tanpaDb();
  if (t) return t;
  const feeds = await db().icalFeed.findMany({
    include: { room: { select: { name: true } }, syncRuns: { orderBy: { startedAt: "desc" }, take: 1 } },
    orderBy: [{ room: { sortOrder: "asc" } }, { otaLabel: "asc" }],
  });
  return ok({
    sambungan: feeds.map((f) => ({
      id: f.id,
      roomId: f.roomId,
      roomName: f.room.name,
      otaLabel: f.otaLabel,
      url: f.url,
      exportToken: f.exportToken,
      isActive: f.isActive,
      lastSuccessAt: f.lastSuccessAt?.toISOString() ?? null,
      lastErrorAt: f.lastErrorAt?.toISOString() ?? null,
      lastError: f.lastError,
      failCount: f.failCount,
      terakhir: f.syncRuns[0] ? { ...f.syncRuns[0], startedAt: f.syncRuns[0].startedAt.toISOString(), finishedAt: f.syncRuns[0].finishedAt?.toISOString() ?? null } : null,
    })),
  });
}

const bacaUrl = (v: unknown) => {
  if (typeof v !== "string" || !v.trim()) return null;
  try {
    const u = new URL(v.trim().replace(/^webcal:/i, "https:"));
    return ["http:", "https:"].includes(u.protocol) ? v.trim() : undefined;
  } catch {
    return undefined;
  }
};

export async function POST(req: Request) {
  const a = await wajib("sinkron");
  if (a instanceof Response) return a;
  const t = tanpaDb();
  if (t) return t;
  const o = await badan(req);
  if (typeof o.roomId !== "string") return gagal("Pilih kamar.");
  const label = typeof o.otaLabel === "string" ? o.otaLabel.trim().slice(0, 40) : "";
  if (!label) return gagal("Isi nama situs, misalnya Booking.com.");
  const url = bacaUrl(o.url);
  if (url === undefined) return gagal("Alamat iCal harus diawali http, https, atau webcal.");
  const f = await db().icalFeed.create({ data: { roomId: o.roomId, otaLabel: label, url, direction: url ? "IMPORT" : "EXPORT", exportToken: tokenBaru() } });
  return ok({ id: f.id }, 201);
}

export async function PATCH(req: Request) {
  const a = await wajib("sinkron");
  if (a instanceof Response) return a;
  const t = tanpaDb();
  if (t) return t;
  const o = await badan(req);
  if (typeof o.id !== "string") return gagal("Sambungan tidak disebut.");
  const data: Record<string, unknown> = {};
  if ("url" in o) {
    const url = bacaUrl(o.url);
    if (url === undefined) return gagal("Alamat iCal harus diawali http, https, atau webcal.");
    data.url = url;
    data.direction = url ? "IMPORT" : "EXPORT";
    data.failCount = 0;
    data.lastError = null;
  }
  if (typeof o.otaLabel === "string" && o.otaLabel.trim()) data.otaLabel = o.otaLabel.trim().slice(0, 40);
  if (typeof o.isActive === "boolean") data.isActive = o.isActive;
  if (o.tokenBaru === true) data.exportToken = tokenBaru();
  await db().icalFeed.update({ where: { id: o.id }, data });
  return ok({ diubah: true });
}

/** Menghapus sambungan. Booking yang pernah diimpornya tetap ada sebagai riwayat. */
export async function DELETE(req: Request) {
  const a = await wajib("sinkron");
  if (a instanceof Response) return a;
  const t = tanpaDb();
  if (t) return t;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return gagal("Sambungan tidak disebut.");
  await db().icalFeed.delete({ where: { id } });
  return ok({ dihapus: true });
}
