import "server-only";
import { cariLabel, KATALOG_BAWAAN, rapikanKatalog, type JenisFasilitas, type KatalogFasilitas } from "@/lib/fasilitas";
import { databaseReady, jalankan, kueri } from "@/lib/db";
import { bacaJson, ubahJson } from "./gudang";

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
];
let migrasi: Promise<void> | undefined;
export function pastikanFasilitasTamu(): Promise<void> {
  migrasi ??= (async () => {
    for (const m of MIGRASI) await jalankanMigrasi(m);
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
export async function simpanKatalog(jenis: JenisFasilitas, daftar: unknown): Promise<KatalogFasilitas> {
  const lama = await bacaKatalog();
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
