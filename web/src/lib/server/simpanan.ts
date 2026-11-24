import "server-only";
import { idTiktok, rapikanKonten, tautanPendekTiktok, type Konten } from "@/lib/konten";
import type { Bahasa } from "@/lib/kamus";
import { rapikanPengaturan, type Pengaturan } from "@/lib/pengaturan";
import { bacaJson, ubahJson } from "./gudang";

/**
 * Isi situs per bahasa di `konten.json`: { en: {...}, id: {...} }. Kontak,
 * tautan media sosial, status tutup, dan saklar seksi sama untuk kedua bahasa; yang
 * tersimpan di salah satu bahasa dipakai bersama. Berkas lama (satu objek
 * tanpa pembagian bahasa) dibaca sebagai versi Indonesia.
 */
type Simpanan = { en?: Partial<Konten>; id?: Partial<Konten> } & Partial<Konten>;
const BERSAMA = ["kontak", "tutup", "seksi"] as const;

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
  const hasil = rapikanKonten(k, bahasa);
  /* Centang "termasuk" berlaku untuk kedua bahasa: bila bahasa ini belum menyimpannya, ambil dari bahasa lain (per urutan). */
  const dari = <T extends { termasuk?: unknown }>(milikku: T[] | undefined, punyaLain: T[] | undefined, i: number) =>
    milikku?.[i]?.termasuk !== undefined ? null : Array.isArray(punyaLain?.[i]?.termasuk) ? (punyaLain![i].termasuk as string[]) : null;
  hasil.paket = hasil.paket.map((g, i) => ({ ...g, termasuk: dari(milik.paket, lain.paket, i) ?? g.termasuk }));
  hasil.aktivitas = hasil.aktivitas.map((a, i) => ({ ...a, termasuk: dari(milik.aktivitas, lain.aktivitas, i) ?? a.termasuk }));
  /* Bahasa yang perahunya belum pernah disimpan memakai harga perahu dari bahasa lain (harga tidak bergantung bahasa). */
  if (milik.perahu === undefined && Array.isArray(lain.perahu)) {
    const hargaLain = rapikanKonten({ perahu: lain.perahu } as Partial<Konten>, bahasa === "en" ? "id" : "en").perahu;
    hasil.perahu = hasil.perahu.map((x, i) => (hargaLain[i] ? { ...x, harga: x.harga.map((h, j) => (hargaLain[i].harga[j] ? { ...h, harga: hargaLain[i].harga[j].harga, sekali: hargaLain[i].harga[j].sekali } : h)) } : x));
  }
  return hasil;
}

/**
 * Tautan pendek TikTok (vt.tiktok.com/…, tiktok.com/t/…) tidak memuat id video, jadi
 * diikuti sekali ke tautan lengkapnya saat disimpan. Bila gagal, tautan dibiarkan.
 */
async function lengkapiTiktok(t: string): Promise<string> {
  if (!tautanPendekTiktok(t)) return t;
  try {
    const r = await fetch(t, { redirect: "follow", signal: AbortSignal.timeout(8000), headers: { "User-Agent": "Mozilla/5.0 (compatible; BakoeriaSite/1.0)" } });
    const id = idTiktok(r.url);
    return id ? r.url.split("?")[0] : t;
  } catch {
    return t;
  }
}

export async function simpanKonten(bahasa: Bahasa, isi: unknown): Promise<Konten> {
  const baru = rapikanKonten(isi as Partial<Konten>, bahasa);
  baru.kontak.aktivitasVideo = await Promise.all(baru.kontak.aktivitasVideo.map(lengkapiTiktok));
  await ubahJson<Simpanan | null>(
    "konten.json",
    null,
    (lama) => {
      const p = pisah(lama);
      const lain = bahasa === "en" ? "id" : "en";
      const sisi = p[lain] ? { ...p[lain] } : undefined;
      if (sisi) for (const kunci of BERSAMA) (sisi as Record<string, unknown>)[kunci] = baru[kunci];
      /* Centang "termasuk" pada kelompok harga selam dan aktivitas berlaku untuk kedua bahasa (dicocokkan per urutan). */
      if (sisi) {
        if (Array.isArray(sisi.paket)) sisi.paket = sisi.paket.map((g, i) => ({ ...g, termasuk: baru.paket[i]?.termasuk ?? g.termasuk ?? [] }));
        if (Array.isArray(sisi.aktivitas)) sisi.aktivitas = sisi.aktivitas.map((a, i) => ({ ...a, termasuk: baru.aktivitas[i]?.termasuk ?? a.termasuk ?? [] }));
        /* Harga perahu (pulang pergi dan sekali jalan) sama untuk kedua bahasa; nama rute tetap milik masing-masing. */
        if (Array.isArray(sisi.perahu)) sisi.perahu = sisi.perahu.map((x, i) => (baru.perahu[i] && Array.isArray(x.harga) ? { ...x, harga: x.harga.map((h, j) => (baru.perahu[i].harga[j] ? { ...h, harga: baru.perahu[i].harga[j].harga, sekali: baru.perahu[i].harga[j].sekali } : h)) } : x));
      }
      return { [bahasa]: baru, ...(sisi ? { [lain]: sisi } : {}) } as Simpanan;
    },
    0o644,
  );
  return baru;
}

export const bacaPengaturan = async (): Promise<Pengaturan> => rapikanPengaturan(await bacaJson<Partial<Pengaturan> | null>("pengaturan.json", null));
export const simpanPengaturan = (p: unknown) => ubahJson("pengaturan.json", null, () => rapikanPengaturan(p as Partial<Pengaturan>)).then(rapikanPengaturan);
