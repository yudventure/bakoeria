import { idBaru, jalankan, kueri, type Nilai } from "@/lib/db";
import { wajib } from "@/lib/server/akses";
import { tokenBaru } from "@/lib/server/sinkron";
import { badan, gagal, ok, tanpaDb } from "@/lib/server/rute";

const iso = (v: unknown) => (v == null ? null : String(v).replace(" ", "T") + "Z");

export async function GET() {
  const a = await wajib("sinkron");
  if (a instanceof Response) return a;
  const t = tanpaDb();
  if (t) return t;
  const feeds = await kueri(
    `SELECT f.*, r.name AS room_name,
       (SELECT JSON_OBJECT('createdCount', s.created_count, 'updatedCount', s.updated_count, 'cancelledCount', s.cancelled_count, 'eventsSeen', s.events_seen, 'startedAt', s.started_at)
          FROM sync_runs s WHERE s.feed_id = f.id ORDER BY s.started_at DESC LIMIT 1) AS terakhir
     FROM ical_feeds f JOIN rooms r ON r.id = f.room_id ORDER BY r.sort_order, r.name, f.ota_label`,
  );
  return ok({
    sambungan: feeds.map((f) => {
      let terakhir: Record<string, unknown> | null = null;
      try {
        terakhir = f.terakhir ? (typeof f.terakhir === "string" ? JSON.parse(f.terakhir) : (f.terakhir as Record<string, unknown>)) : null;
      } catch {
        terakhir = null;
      }
      return {
        id: String(f.id),
        roomId: String(f.room_id),
        roomName: String(f.room_name),
        otaLabel: (f.ota_label as string) ?? null,
        url: (f.url as string) ?? null,
        exportToken: (f.export_token as string) ?? null,
        isActive: Boolean(f.is_active),
        lastSuccessAt: iso(f.last_success_at),
        lastErrorAt: iso(f.last_error_at),
        lastError: (f.last_error as string) ?? null,
        failCount: Number(f.fail_count),
        terakhir: terakhir ? { ...terakhir, startedAt: iso(terakhir.startedAt) } : null,
      };
    }),
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
  const id = idBaru();
  await jalankan("INSERT INTO ical_feeds (id, room_id, ota_label, url, direction, export_token) VALUES (?, ?, ?, ?, ?, ?)", [id, o.roomId, label, url, url ? "IMPORT" : "EXPORT", tokenBaru()]);
  return ok({ id }, 201);
}

export async function PATCH(req: Request) {
  const a = await wajib("sinkron");
  if (a instanceof Response) return a;
  const t = tanpaDb();
  if (t) return t;
  const o = await badan(req);
  if (typeof o.id !== "string") return gagal("Sambungan tidak disebut.");
  const set: string[] = [];
  const nilai: Nilai[] = [];
  if ("url" in o) {
    const url = bacaUrl(o.url);
    if (url === undefined) return gagal("Alamat iCal harus diawali http, https, atau webcal.");
    set.push("url = ?", "direction = ?", "fail_count = 0", "last_error = NULL");
    nilai.push(url, url ? "IMPORT" : "EXPORT");
  }
  if (typeof o.otaLabel === "string" && o.otaLabel.trim()) (set.push("ota_label = ?"), nilai.push(o.otaLabel.trim().slice(0, 40)));
  if (typeof o.isActive === "boolean") (set.push("is_active = ?"), nilai.push(o.isActive));
  if (o.tokenBaru === true) (set.push("export_token = ?"), nilai.push(tokenBaru()));
  if (set.length) await jalankan(`UPDATE ical_feeds SET ${set.join(", ")} WHERE id = ?`, [...nilai, o.id]);
  return ok({ diubah: true });
}

/** Menghapus sambungan. Pesanan yang pernah diimpornya tetap ada sebagai riwayat. */
export async function DELETE(req: Request) {
  const a = await wajib("sinkron");
  if (a instanceof Response) return a;
  const t = tanpaDb();
  if (t) return t;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return gagal("Sambungan tidak disebut.");
  await jalankan("DELETE FROM ical_feeds WHERE id = ?", [id]);
  return ok({ dihapus: true });
}
