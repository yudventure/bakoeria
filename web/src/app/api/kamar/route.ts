import { tanggalSah } from "@/lib/booking";
import { bacaCara, terapkan } from "@/lib/tarif";
import { wajib } from "@/lib/server/akses";
import { ambilKamar, buatKamar, hapusKamar, hapusMusim, hapusMusimGrup, jumlahPesananKamar, tambahMusimMassal, ubahTarifMassal, kamarDenganNama, MusimTumpangError, tambahMusim, ubahKamar } from "@/lib/server/buku";
import { badan, gagal, ok, tanpaDb } from "@/lib/server/rute";

const UBAH = ["developer", "pemilik", "manajer"];

export async function GET() {
  const a = await wajib("kamar");
  if (a instanceof Response) return a;
  const t = tanpaDb();
  if (t) return t;
  return ok({ kamar: await ambilKamar() });
}

const teks = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
/** Fasilitas: daftar atau teks satu per baris; paling banyak 12, masing-masing 80 huruf. */
const baris = (v: unknown) => (Array.isArray(v) ? v.map(String) : typeof v === "string" ? v.split("\n") : []).map((x) => x.trim().slice(0, 80)).filter(Boolean).slice(0, 12);

function bacaKamar(o: Record<string, unknown>) {
  const name = typeof o.name === "string" ? o.name.trim().slice(0, 60) : "";
  if (!name) return { galat: "Isi nama kamar." };
  const baseRate = Number(o.baseRate);
  if (!Number.isFinite(baseRate) || baseRate < 0) return { galat: "Isi tarif per malam." };
  const int = (v: unknown, d: number) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : d);
  return {
    data: {
      name,
      roomType: typeof o.roomType === "string" ? o.roomType.trim().slice(0, 60) || null : null,
      capAdult: int(o.capAdult, 2),
      capChild: int(o.capChild, 0),
      baseRate,
      isActive: o.isActive !== false,
      inactiveReason: o.isActive === false && typeof o.inactiveReason === "string" ? o.inactiveReason.slice(0, 200) : null,
      sortOrder: int(o.sortOrder, 0),
      sizeM2: o.sizeM2 === "" || o.sizeM2 == null || !Number(o.sizeM2) ? null : Math.min(9999, int(o.sizeM2, 0)),
      descEn: teks(o.descEn, 1200),
      descId: teks(o.descId, 1200),
      featuresEn: baris(o.featuresEn),
      featuresId: baris(o.featuresId),
      normalRate: Number(o.normalRate) > 0 ? Number(o.normalRate) : null,
    },
  };
}

/** Tambah kamar, atau tarif musiman bila badannya `{ musim: {...} }`. */
export async function POST(req: Request) {
  const a = await wajib("kamar");
  if (a instanceof Response) return a;
  if (!UBAH.includes(a.peran)) return gagal("Peran Anda tidak bisa mengubah kamar.", 403);
  const t = tanpaDb();
  if (t) return t;
  const o = await badan(req);
  /* Satu musim (misalnya musim ramai) untuk banyak kamar sekaligus. */
  if (o.musimMassal && typeof o.musimMassal === "object") {
    const m = o.musimMassal as Record<string, unknown>;
    if (!tanggalSah(m.dateFrom) || !tanggalSah(m.dateTo) || m.dateTo < m.dateFrom) return gagal("Isi rentang tanggal yang benar.");
    const cara = bacaCara(m.cara);
    if (!cara) return gagal("Isi harga musim ini.");
    const ids = Array.isArray(m.roomIds) ? m.roomIds.map(String) : [];
    const kamar = (await ambilKamar()).filter((k) => ids.includes(k.id));
    if (!kamar.length) return gagal("Pilih minimal satu kamar.");
    const r = await tambahMusimMassal({
      dateFrom: m.dateFrom,
      dateTo: m.dateTo,
      label: typeof m.label === "string" && m.label.trim() ? m.label.trim().slice(0, 60) : null,
      tarif: kamar.map((k) => ({ roomId: k.id, rate: terapkan(k.baseRate, cara) })),
      timpa: m.timpa === true,
    });
    if (r.bentrok.length) return gagal(`Sudah ada tarif musiman di tanggal itu untuk: ${r.bentrok.join(", ")}. Centang "Timpa" untuk menggantinya.`, 409, { bentrok: r.bentrok });
    return ok({ kamar: await ambilKamar() }, 201);
  }
  if (o.musim && typeof o.musim === "object") {
    const m = o.musim as Record<string, unknown>;
    if (typeof m.roomId !== "string") return gagal("Pilih kamar.");
    if (!tanggalSah(m.dateFrom) || !tanggalSah(m.dateTo) || m.dateTo < m.dateFrom) return gagal("Isi rentang tanggal yang benar.");
    const rate = Number(m.rate);
    if (!Number.isFinite(rate) || rate < 0) return gagal("Isi tarif.");
    try {
      await tambahMusim({ roomId: m.roomId, dateFrom: m.dateFrom, dateTo: m.dateTo, rate, label: typeof m.label === "string" ? m.label.slice(0, 60) : null });
    } catch (e) {
      if (e instanceof MusimTumpangError) return gagal(e.message, 409);
      throw e;
    }
    return ok({ kamar: await ambilKamar() }, 201);
  }
  const r = bacaKamar(o);
  if ("galat" in r) return gagal(r.galat!);
  if (await kamarDenganNama(r.data.name)) return gagal("Nama kamar itu sudah dipakai.", 409);
  await buatKamar(r.data);
  return ok({ kamar: await ambilKamar() }, 201);
}

export async function PATCH(req: Request) {
  const a = await wajib("kamar");
  if (a instanceof Response) return a;
  if (!UBAH.includes(a.peran)) return gagal("Peran Anda tidak bisa mengubah kamar.", 403);
  const t = tanpaDb();
  if (t) return t;
  const o = await badan(req);
  /* Ubah harga banyak kamar sekaligus: { massal: { roomIds, tarif?: cara, normal?: cara | "hapus" } }. */
  if (o.massal && typeof o.massal === "object") {
    const m = o.massal as Record<string, unknown>;
    const ids = Array.isArray(m.roomIds) ? m.roomIds.map(String) : [];
    const tarif = m.tarif == null ? null : bacaCara(m.tarif);
    const normal = m.normal === "hapus" ? "hapus" : m.normal == null ? null : bacaCara(m.normal);
    if (m.tarif != null && !tarif) return gagal("Isi perubahan tarif yang benar.");
    if (m.normal != null && !normal) return gagal("Isi perubahan harga normal yang benar.");
    if (!tarif && !normal) return gagal("Tidak ada harga yang diubah.");
    const kamar = (await ambilKamar()).filter((k) => ids.includes(k.id));
    if (!kamar.length) return gagal("Pilih minimal satu kamar.");
    await ubahTarifMassal(kamar.map((k) => {
      const baseRate = tarif ? terapkan(k.baseRate, tarif) : k.baseRate;
      const n = normal === "hapus" ? null : normal ? terapkan(k.normalRate ?? k.baseRate, normal) : k.normalRate;
      return { id: k.id, baseRate, normalRate: n && n > 0 ? n : null };
    }));
    return ok({ kamar: await ambilKamar() });
  }
  if (typeof o.id !== "string") return gagal("Kamar tidak disebut.");
  const r = bacaKamar(o);
  if ("galat" in r) return gagal(r.galat!);
  const lain = await kamarDenganNama(r.data.name);
  if (lain && lain.id !== o.id) return gagal("Nama kamar itu sudah dipakai.", 409);
  await ubahKamar(o.id, r.data);
  return ok({ kamar: await ambilKamar() });
}

/** Hapus kamar (`?id=`) atau tarif musiman (`?musim=`). Kamar dengan riwayat pesanan tidak bisa dihapus. */
export async function DELETE(req: Request) {
  const a = await wajib("kamar");
  if (a instanceof Response) return a;
  if (!UBAH.includes(a.peran)) return gagal("Peran Anda tidak bisa mengubah kamar.", 403);
  const t = tanpaDb();
  if (t) return t;
  const u = new URL(req.url).searchParams;
  const grup = u.get("musimGrup");
  if (grup) {
    let label = "", dari = "", sampai = "";
    try {
      [label, dari, sampai] = JSON.parse(grup) as [string, string, string];
    } catch {
      return gagal("Musim tidak dikenal.");
    }
    if (!tanggalSah(dari) || !tanggalSah(sampai)) return gagal("Musim tidak dikenal.");
    await hapusMusimGrup(String(label ?? ""), dari, sampai);
    return ok({ kamar: await ambilKamar() });
  }
  const musim = u.get("musim");
  if (musim) {
    await hapusMusim(musim);
    return ok({ kamar: await ambilKamar() });
  }
  const id = u.get("id");
  if (!id) return gagal("Kamar tidak disebut.");
  const n = await jumlahPesananKamar(id);
  if (n) return gagal(`Kamar ini punya ${n} pesanan. Nonaktifkan saja supaya riwayatnya tetap utuh.`, 409);
  await hapusKamar(id);
  return ok({ kamar: await ambilKamar() });
}
