import "server-only";
import { cariLabel, KATALOG_BAWAAN, rapikanKatalog, sidikDaftar, type JenisFasilitas, type KatalogFasilitas } from "@/lib/fasilitas";
import { databaseReady, jalankan, kueri } from "@/lib/db";
import { bacaJson, ubahJson } from "./gudang";
import { gantiKayuDalam } from "@/lib/kayu";
import { rapikanTandaBaca, VERSI_TANDA_BACA } from "@/lib/tanda-baca";
import { KALIMAT_DIBUANG, TENTANG_BARU, TENTANG_LAMA, VERSI_KISAH, VERSI_KISAH_2 } from "@/lib/kisah";
import { CATATAN_LAMA, CATATAN_PAKET, CATATAN_PAKET_2026, HARGA_PROGRAM_LAMA, GANTI_TANPA_PERAHU, gantiHargaSelam, HARGA_PROGRAM, VERSI_HARGA_SELAM, VERSI_TANPA_PERAHU } from "@/lib/harga-selam";
import type { PaketGrup } from "@/lib/konten";

/**
 * Sekali jalan (November 2026, permintaan pemilik): tamu menginap boleh memakai kayak
 * dan alat snorkel gratis. Kedua fasilitas ditambahkan ke katalog kamar yang sudah
 * tersimpan dan dicentang di semua kamar. Tanda di "migrasi-fasilitas.json" mencegahnya
 * berjalan lagi, jadi centang yang nanti dilepas pemilik tidak dipasang ulang.
 */
/* Tiap tambahan fasilitas untuk semua kamar dijalankan sekali, ditandai namanya. */
const MIGRASI: { tanda: string; kunci: string[] }[] = [
  { tanda: "kayakSnorkel", kunci: ["kayak", "snorkel"] },
  /* November 2026, permintaan pemilik: antar-jemput perahu juga fasilitas setiap cottage. */
  { tanda: "boatTransfer", kunci: ["transfer"] },
  /* November 2026, permintaan pemilik: listrik hanya menyala pukul 18.00 sampai 06.00. */
  { tanda: "listrikMalam", kunci: ["listrik"] },
  /* November 2026, permintaan pemilik: Wi-Fi Starlink. */
  { tanda: "wifiStarlink", kunci: ["wifi"] },
  /* Wi-Fi Starlink sempat terhapus dari semua kamar oleh dashboard yang masih memegang daftar lama; dipasang lagi sekali. */
  { tanda: "wifiStarlink2", kunci: ["wifi"] },
];
/**
 * Label yang diganti sekali di katalog tersimpan dan di semua kamar, selama labelnya
 * masih label lama (yang sudah diubah pemilik dibiarkan).
 */
const GANTI_LABEL: { tanda: string; kunci: string; lama: { en: string; id: string } }[] = [
  /* November 2026, pemilik: antar-jemput perahu tidak termasuk harga kamar. */
  { tanda: "transferTerpisah", kunci: "transfer", lama: { en: "Boat transfer", id: "Antar-jemput perahu" } },
];
async function gantiLabel(g: (typeof GANTI_LABEL)[number]) {
  const tanda = await bacaJson<Record<string, string> | null>("migrasi-fasilitas.json", null);
  if (tanda?.[g.tanda]) return;
  const baru = KATALOG_BAWAAN.kamar.find((x) => x.kunci === g.kunci)!;
  const tersimpan = await bacaJson<Record<string, unknown> | null>("fasilitas.json", null);
  if (tersimpan && Array.isArray(tersimpan.kamar)) {
    const kat = rapikanKatalog(tersimpan);
    if (kat.kamar.some((x) => x.en === g.lama.en || x.id === g.lama.id))
      await ubahJson("fasilitas.json", null, () => ({ ...kat, kamar: kat.kamar.map((x) => (x.en === g.lama.en || x.id === g.lama.id ? { ...x, en: baru.en, id: baru.id } : x)) }), 0o644);
  }
  if (databaseReady()) {
    const kamar = await kueri<{ id: string; features_en: string | null; features_id: string | null }>("SELECT id, features_en, features_id FROM rooms");
    for (const r of kamar) {
      const en = baris(r.features_en).map((l) => (l === g.lama.en ? baru.en : l));
      const id = baris(r.features_id).map((l) => (l === g.lama.id ? baru.id : l));
      if (en.join("\n") !== baris(r.features_en).join("\n") || id.join("\n") !== baris(r.features_id).join("\n"))
        await jalankan("UPDATE rooms SET features_en = ?, features_id = ? WHERE id = ?", [en.join("\n"), id.join("\n"), r.id]);
    }
  }
  await ubahJson<Record<string, string> | null>("migrasi-fasilitas.json", null, (l) => ({ ...(l ?? {}), [g.tanda]: new Date().toISOString() }), 0o644);
}

let migrasi: Promise<void> | undefined;
export function pastikanFasilitasTamu(): Promise<void> {
  migrasi ??= (async () => {
    for (const m of MIGRASI) await jalankanMigrasi(m);
    for (const g of GANTI_LABEL) await gantiLabel(g);
    await gantiKayuTersimpan();
    await gantiHargaSelamTersimpan();
    await selamTanpaPerahu();
    await perbaruiTentang();
    await buangKalimatKisah();
    await rapikanTandaBacaTersimpan();
  })()
    .catch((e) => console.error("[fasilitas] gagal menambah fasilitas tamu", e))
    .finally(() => { migrasi = undefined; });
  return migrasi;
}

async function jalankanMigrasi(m: { tanda: string; kunci: string[] }) {
  {
    const tanda = await bacaJson<Record<string, string> | null>("migrasi-fasilitas.json", null);
    if (tanda?.[m.tanda]) return;
    const baru = KATALOG_BAWAAN.kamar.filter((x) => m.kunci.includes(x.kunci));
    const tersimpan = await bacaJson<Record<string, unknown> | null>("fasilitas.json", null);
    if (tersimpan && Array.isArray(tersimpan.kamar)) {
      const kat = rapikanKatalog(tersimpan);
      const kurang = baru.filter((b) => !kat.kamar.some((x) => x.kunci === b.kunci || cariLabel([x], b.en) || cariLabel([x], b.id)));
      if (kurang.length) await ubahJson("fasilitas.json", null, () => ({ ...kat, kamar: [...kat.kamar, ...kurang] }), 0o644);
    }
    if (databaseReady()) {
      const kamar = await kueri<{ id: string; features_en: string | null; features_id: string | null }>("SELECT id, features_en, features_id FROM rooms");
      for (const r of kamar) {
        const en = baris(r.features_en), id = baris(r.features_id);
        const tambahEn = baru.map((b) => b.en).filter((l) => !en.some((x) => x.toLowerCase() === l.toLowerCase()));
        const tambahId = baru.map((b) => b.id).filter((l) => !id.some((x) => x.toLowerCase() === l.toLowerCase()));
        if (tambahEn.length || tambahId.length) await jalankan("UPDATE rooms SET features_en = ?, features_id = ? WHERE id = ?", [[...en, ...tambahEn].join("\n"), [...id, ...tambahId].join("\n"), r.id]);
      }
      if (kamar.length === 0) return; // belum ada kamar: dicoba lagi nanti, tanda belum ditulis
    }
    await ubahJson<Record<string, string> | null>("migrasi-fasilitas.json", null, (l) => ({ ...(l ?? {}), [m.tanda]: new Date().toISOString() }), 0o644);
  }
}

export const bacaKatalog = async (): Promise<KatalogFasilitas> => rapikanKatalog(await bacaJson<unknown>("fasilitas.json", null));

const baris = (v: unknown) => String(v ?? "").split("\n").map((x) => x.trim()).filter(Boolean);

/**
 * Simpan satu daftar fasilitas. Untuk kamar, label yang diganti ikut diganti di
 * semua kamar, dan fasilitas yang dihapus dari daftar ikut dilepas dari semua kamar,
 * supaya pemilik cukup mengatur di satu tempat.
 */
export class KatalogBerubahError extends Error {
  constructor(public katalog: KatalogFasilitas) {
    super("Daftar fasilitas baru saja berubah.");
  }
}

export async function simpanKatalog(jenis: JenisFasilitas, daftar: unknown, asal?: string): Promise<KatalogFasilitas> {
  const lama = await bacaKatalog();
  /* Daftar yang dibuka penyunting sudah usang (misalnya tab dashboard lama): tolak, jangan menimpa. */
  if (asal && asal !== sidikDaftar(lama[jenis])) throw new KatalogBerubahError(lama);
  const baru = rapikanKatalog({ ...lama, [jenis]: daftar });
  await ubahJson("fasilitas.json", null, () => baru, 0o644);
  if (jenis === "kamar" && databaseReady()) {
    const ganti = new Map<string, { en: string; id: string } | null>();
    for (const x of lama.kamar) {
      const y = baru.kamar.find((b) => b.kunci === x.kunci);
      if (!y) ganti.set(x.kunci, null);
      else if (y.en !== x.en || y.id !== x.id) ganti.set(x.kunci, { en: y.en, id: y.id });
    }
    if (ganti.size) {
      const kamar = await kueri<{ id: string; features_en: string | null; features_id: string | null }>("SELECT id, features_en, features_id FROM rooms");
      for (const r of kamar) {
        const ubah = (isi: string[], kolom: "en" | "id") => isi.flatMap((l) => {
          const x = lama.kamar.find((k) => k[kolom].toLowerCase() === l.toLowerCase());
          if (!x || !ganti.has(x.kunci)) return [l];
          const g = ganti.get(x.kunci);
          return g ? [g[kolom]] : [];
        });
        const en = ubah(baris(r.features_en), "en"), id = ubah(baris(r.features_id), "id");
        if (en.join("\n") !== baris(r.features_en).join("\n") || id.join("\n") !== baris(r.features_id).join("\n"))
          await jalankan("UPDATE rooms SET features_en = ?, features_id = ? WHERE id = ?", [en.join("\n"), id.join("\n"), r.id]);
      }
    }
  }
  return baru;
}

/** Sekali: sebutan kayu jati / teak di isi situs dan deskripsi kamar yang sudah tersimpan diganti kayu besi. */
async function gantiKayuTersimpan() {
  const tanda = await bacaJson<Record<string, string> | null>("migrasi-fasilitas.json", null);
  /* kayuBesi2: diulang sekali, karena teks lama sempat tersimpan lagi dari tab dashboard yang masih memuat versi sebelumnya. */
  if (tanda?.kayuBesi2) return;
  const konten = await bacaJson<unknown>("konten.json", null);
  if (konten && JSON.stringify(gantiKayuDalam(konten)) !== JSON.stringify(konten)) await ubahJson<unknown>("konten.json", null, (l) => gantiKayuDalam(l), 0o644);
  if (databaseReady()) {
    const kamar = await kueri<{ id: string; desc_en: string | null; desc_id: string | null }>("SELECT id, desc_en, desc_id FROM rooms");
    for (const r of kamar) {
      const en = r.desc_en && gantiKayuDalam(r.desc_en);
      const id = r.desc_id && gantiKayuDalam(r.desc_id);
      if (en !== r.desc_en || id !== r.desc_id) await jalankan("UPDATE rooms SET desc_en = ?, desc_id = ? WHERE id = ?", [en, id, r.id]);
    }
  }
  await ubahJson<Record<string, string> | null>("migrasi-fasilitas.json", null, (l) => ({ ...(l ?? {}), kayuBesi: l?.kayuBesi ?? new Date().toISOString(), kayuBesi2: new Date().toISOString() }), 0o644);
}

/**
 * Sekali: daftar harga diving yang tersimpan diganti harga Zanclus Dive Center (lib/harga-selam.ts).
 * Trip snorkeling dan trip pulau tidak disentuh. Catatan daftar harga lama dan harga kartu Program
 * yang masih kosong ikut diisi.
 */
async function gantiHargaSelamTersimpan() {
  const tanda = await bacaJson<Record<string, string> | null>("migrasi-fasilitas.json", null);
  if (tanda?.[VERSI_HARGA_SELAM]) return;
  const ada = await bacaJson<Record<string, unknown> | null>("konten.json", null);
  if (ada) {
    await ubahJson<Record<string, unknown> | null>("konten.json", null, (l) => {
      if (!l) return l;
      /* Berkas lama satu objek tanpa pembagian bahasa dibaca sebagai versi Indonesia. */
      const lamaSatu = "tagline" in l && !("en" in l) && !("id" in l);
      const ubahSisi = (sisi: Record<string, unknown> | undefined, b: "en" | "id") => {
        if (!sisi || typeof sisi !== "object") return sisi;
        const x = { ...sisi };
        if (Array.isArray(x.paket)) x.paket = gantiHargaSelam(x.paket as PaketGrup[], b);
        if (x.paketCatatan === CATATAN_LAMA[b] || CATATAN_PAKET[b].includes(x.paketCatatan as string)) x.paketCatatan = CATATAN_PAKET_2026[b];
        if (Array.isArray(x.program)) x.program = (x.program as { judul?: string; harga?: string }[]).map((pr) => { const h = HARGA_PROGRAM.find((y) => y.pola.test(String(pr.judul ?? ""))); const kini = String(pr.harga ?? "").trim(); return h && (!kini || HARGA_PROGRAM_LAMA.includes(kini)) ? { ...pr, harga: h[b] } : pr; });
        return x;
      };
      if (lamaSatu) return ubahSisi(l, "id") ?? l;
      return { ...l, ...(l.en ? { en: ubahSisi(l.en as Record<string, unknown>, "en") } : {}), ...(l.id ? { id: ubahSisi(l.id as Record<string, unknown>, "id") } : {}) };
    }, 0o644);
  }
  await ubahJson<Record<string, string> | null>("migrasi-fasilitas.json", null, (l) => ({ ...(l ?? {}), [VERSI_HARGA_SELAM]: new Date().toISOString() }), 0o644);
}

/** Sekali: teks harga diving tersimpan diubah menjadi "belum termasuk perahu selam" (hanya teks bawaan yang belum diubah pemilik). */
async function selamTanpaPerahu() {
  const tanda = await bacaJson<Record<string, string> | null>("migrasi-fasilitas.json", null);
  if (tanda?.[VERSI_TANPA_PERAHU]) return;
  const ganti = (t: string) => GANTI_TANPA_PERAHU.reduce((x, [a, b]) => (x.includes(b) ? x : x.split(a).join(b)), t);
  const ubahSisi = (sisi: Record<string, unknown> | undefined, b: "en" | "id") => {
    if (!sisi || typeof sisi !== "object") return sisi;
    const x = { ...sisi };
    if (Array.isArray(x.paket)) x.paket = (x.paket as PaketGrup[]).map((g) => ({ ...g, catatan: ganti(String(g.catatan ?? "")), isi: Array.isArray(g.isi) ? g.isi.map((y) => ({ ...y, ket: ganti(String(y.ket ?? "")) })) : g.isi }));
    if (x.paketCatatan === CATATAN_PAKET[b][0]) x.paketCatatan = CATATAN_PAKET[b][1];
    return x;
  };
  if (await bacaJson<Record<string, unknown> | null>("konten.json", null)) {
    await ubahJson<Record<string, unknown> | null>("konten.json", null, (l) => {
      if (!l) return l;
      if ("tagline" in l && !("en" in l) && !("id" in l)) return ubahSisi(l, "id") ?? l;
      return { ...l, ...(l.en ? { en: ubahSisi(l.en as Record<string, unknown>, "en") } : {}), ...(l.id ? { id: ubahSisi(l.id as Record<string, unknown>, "id") } : {}) };
    }, 0o644);
  }
  await ubahJson<Record<string, string> | null>("migrasi-fasilitas.json", null, (l) => ({ ...(l ?? {}), [VERSI_TANPA_PERAHU]: new Date().toISOString() }), 0o644);
}

/** Sekali: teks About tersimpan diganti kisah nama Bakoeria, hanya bila masih sama dengan teks bawaan lama. */
async function perbaruiTentang() {
  const tanda = await bacaJson<Record<string, string> | null>("migrasi-fasilitas.json", null);
  if (tanda?.[VERSI_KISAH]) return;
  const ubahSisi = (sisi: Record<string, unknown> | undefined, b: "en" | "id") => {
    if (!sisi || typeof sisi !== "object") return sisi;
    const x = { ...sisi };
    for (const kunci of ["introJudul", "introIsi", "pernyataan"] as const) if (typeof x[kunci] === "string" && (TENTANG_LAMA[b][kunci] ?? []).includes(x[kunci] as string)) x[kunci] = TENTANG_BARU[b][kunci];
    return x;
  };
  if (await bacaJson<Record<string, unknown> | null>("konten.json", null)) {
    await ubahJson<Record<string, unknown> | null>("konten.json", null, (l) => {
      if (!l) return l;
      if ("tagline" in l && !("en" in l) && !("id" in l)) return ubahSisi(l, "id") ?? l;
      return { ...l, ...(l.en ? { en: ubahSisi(l.en as Record<string, unknown>, "en") } : {}), ...(l.id ? { id: ubahSisi(l.id as Record<string, unknown>, "id") } : {}) };
    }, 0o644);
  }
  await ubahJson<Record<string, string> | null>("migrasi-fasilitas.json", null, (l) => ({ ...(l ?? {}), [VERSI_KISAH]: new Date().toISOString() }), 0o644);
}

/** Sekali: kalimat tentang hidayah dibuang dari kisah yang sudah tersimpan (sisa kisahnya tidak diubah). */
async function buangKalimatKisah() {
  const tanda = await bacaJson<Record<string, string> | null>("migrasi-fasilitas.json", null);
  if (tanda?.[VERSI_KISAH_2]) return;
  const ubahSisi = (sisi: Record<string, unknown> | undefined, b: "en" | "id") => (sisi && typeof sisi.kisahIsi === "string" ? { ...sisi, kisahIsi: (sisi.kisahIsi as string).split(KALIMAT_DIBUANG[b]).join("") } : sisi);
  if (await bacaJson<Record<string, unknown> | null>("konten.json", null)) {
    await ubahJson<Record<string, unknown> | null>("konten.json", null, (l) => (!l ? l : { ...l, ...(l.en ? { en: ubahSisi(l.en as Record<string, unknown>, "en") } : {}), ...(l.id ? { id: ubahSisi(l.id as Record<string, unknown>, "id") } : {}) }), 0o644);
  }
  await ubahJson<Record<string, string> | null>("migrasi-fasilitas.json", null, (l) => ({ ...(l ?? {}), [VERSI_KISAH_2]: new Date().toISOString() }), 0o644);
}

/** Sekali: teks bawaan lama yang masih tersimpan ditulis ulang tanpa titik dua dan titik koma yang tidak perlu. */
async function rapikanTandaBacaTersimpan() {
  const tanda = await bacaJson<Record<string, string> | null>("migrasi-fasilitas.json", null);
  if (tanda?.[VERSI_TANDA_BACA]) return;
  const dalam = (v: unknown): unknown => (typeof v === "string" ? rapikanTandaBaca(v) : Array.isArray(v) ? v.map(dalam) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dalam(x)])) : v);
  if (await bacaJson<unknown>("konten.json", null)) await ubahJson<unknown>("konten.json", null, (l) => dalam(l), 0o644);
  await ubahJson<Record<string, string> | null>("migrasi-fasilitas.json", null, (l) => ({ ...(l ?? {}), [VERSI_TANDA_BACA]: new Date().toISOString() }), 0o644);
}
