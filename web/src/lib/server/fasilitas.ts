import "server-only";
import { rapikanKatalog, type JenisFasilitas, type KatalogFasilitas } from "@/lib/fasilitas";
import { databaseReady, jalankan, kueri } from "@/lib/db";
import { bacaJson, ubahJson } from "./gudang";

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
