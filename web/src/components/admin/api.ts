"use client";

/** Panggilan API dashboard. Melempar Error berisi pesan dari server, siap ditampilkan. */
export class GalatApi extends Error {
  constructor(message: string, public status: number, public data: Record<string, unknown>) {
    super(message);
  }
}

export async function api<T = Record<string, unknown>>(jalur: string, opsi: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch(jalur, {
    method: opsi.method ?? (opsi.body ? "POST" : "GET"),
    headers: opsi.body ? { "Content-Type": "application/json" } : undefined,
    body: opsi.body ? JSON.stringify(opsi.body) : undefined,
    cache: "no-store",
  });
  const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (r.status === 401 && typeof window !== "undefined") {
    window.location.reload();
  }
  if (!r.ok) throw new GalatApi(typeof data.galat === "string" ? data.galat : `Permintaan gagal (${r.status}).`, r.status, data);
  return data as T;
}
