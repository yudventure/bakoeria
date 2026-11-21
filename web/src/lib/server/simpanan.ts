import "server-only";
import { rapikanKonten, type Konten } from "@/lib/konten";
import type { Bahasa } from "@/lib/kamus";
import { rapikanPengaturan, type Pengaturan } from "@/lib/pengaturan";
import { bacaJson, ubahJson } from "./gudang";

/**
 * Isi situs per bahasa di `konten.json`: { en: {...}, id: {...} }. Kontak,
 * tautan media sosial, dan status tutup sama untuk kedua bahasa; yang
 * tersimpan di salah satu bahasa dipakai bersama. Berkas lama (satu objek
 * tanpa pembagian bahasa) dibaca sebagai versi Indonesia.
 */
type Simpanan = { en?: Partial<Konten>; id?: Partial<Konten> } & Partial<Konten>;
const BERSAMA = ["kontak", "tutup"] as const;

function pisah(o: Simpanan | null): { en?: Partial<Konten>; id?: Partial<Konten> } {
  if (!o || typeof o !== "object") return {};
  if ("tagline" in o && !("en" in o) && !("id" in o)) return { id: o };
  return { en: o.en, id: o.id };
}

export async function bacaKonten(bahasa: Bahasa = "en"): Promise<Konten> {
  const { en, id } = pisah(await bacaJson<Simpanan | null>("konten.json", null));
  const milik = (bahasa === "en" ? en : id) ?? {};
  const lain = (bahasa === "en" ? id : en) ?? {};
  const k = { ...milik } as Partial<Konten>;
  for (const kunci of BERSAMA) if (k[kunci] === undefined && lain[kunci] !== undefined) (k as Record<string, unknown>)[kunci] = lain[kunci];
  return rapikanKonten(k, bahasa);
}

export async function simpanKonten(bahasa: Bahasa, isi: unknown): Promise<Konten> {
  const baru = rapikanKonten(isi as Partial<Konten>, bahasa);
  await ubahJson<Simpanan | null>(
    "konten.json",
    null,
    (lama) => {
      const p = pisah(lama);
      const lain = bahasa === "en" ? "id" : "en";
      const sisi = p[lain] ? { ...p[lain] } : undefined;
      if (sisi) for (const kunci of BERSAMA) (sisi as Record<string, unknown>)[kunci] = baru[kunci];
      return { [bahasa]: baru, ...(sisi ? { [lain]: sisi } : {}) } as Simpanan;
    },
    0o644,
  );
  return baru;
}

export const bacaPengaturan = async (): Promise<Pengaturan> => rapikanPengaturan(await bacaJson<Partial<Pengaturan> | null>("pengaturan.json", null));
export const simpanPengaturan = (p: unknown) => ubahJson("pengaturan.json", null, () => rapikanPengaturan(p as Partial<Pengaturan>)).then(rapikanPengaturan);
