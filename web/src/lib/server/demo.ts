import "server-only";

import { idBaru, kueri, transaksi } from "@/lib/db";
import type { Modul } from "@/lib/modul";
import { bacaJson, ubahJson } from "./gudang";
import { hapusRekaman, simpanRekaman } from "./modul";

/**
 * Data demo untuk mencoba situs dan dashboard sebelum data asli siap:
 * 4 kamar dengan spesifikasi, tamu, pesanan, pembayaran, serta contoh catatan
 * keuangan, SDM, dan gudang.
 *
 * Semua id yang dibuat dicatat di `demo.json`, jadi "Hapus data demo" hanya
 * menghapus yang dibuat di sini. Kamarnya tidak ikut dihapus: keempat cottage
 * itu kamar Bakoeria yang sebenarnya, dan tanpa kamar bagian Menginap di situs
 * kosong. Yang dihapus hanya tamu, pesanan, dan catatan contoh.
 */
const BERKAS = "demo.json";
const OLEH = "Data demo";

interface Catatan {
  /** Diisi saat data demo dihapus, supaya tidak terpasang otomatis lagi. */
  dihapus?: string;
  dibuat: string;
  /** Versi data kamar demo; 2 = Cottage Double dan Single dengan harga promo. */
  versi?: number;
  kamar: string[];
  tamu: string[];
  modul: { m: Modul; koleksi: string; id: string }[];
}

export async function statusDemo(): Promise<{ aktif: boolean; dibuat?: string; kamar: number }> {
  const c = await bacaJson<Catatan | null>(BERKAS, null);
  return c && !c.dihapus ? { aktif: true, dibuat: c.dibuat, kamar: c.kamar.length } : { aktif: false, kamar: 0 };
}

/** Tanggal di zona Papua (WIT), digeser n hari dari hari ini. */
const tgl = (n: number) => new Date(Date.now() + 9 * 3600000 + n * 86400000).toISOString().slice(0, 10);

/**
 * Kamar Bakoeria yang sebenarnya: dua jenis cottage dengan isi yang sama, beda di kasurnya.
 * Harga normal Rp 1.980.000 per malam, harga promo yang berlaku Rp 1.450.000.
 * Jumlah unit per jenis (2 dan 2) masih perkiraan; ubah di menu Kamar & tarif.
 */
const HARGA_NORMAL = 1980000;
const HARGA_PROMO = 1450000;
const FASILITAS_EN = ["Air conditioning", "Private bathroom with shower", "American-style seated toilet", "Extra-large wardrobe", "Sofa", "Your own cottage, like a house", "Three meals a day included", "Free use of kayaks", "Free snorkeling gear", "Boat transfer"];
const FASILITAS_ID = ["AC", "Kamar mandi dalam dengan shower", "Toilet duduk American style", "Lemari pakaian yang sangat luas", "Sofa", "Satu cottage untuk sendiri, seperti rumah", "Sudah termasuk makan 3 kali sehari", "Gratis pakai kayak", "Gratis alat snorkel", "Antar-jemput perahu"];
export const KAMAR_DEMO = [
  {
    name: "Cottage Double 1", roomType: "Cottage Double", capAdult: 2, capChild: 2, baseRate: HARGA_PROMO, normalRate: HARGA_NORMAL, sizeM2: null,
    descEn: "A whole cottage to yourself, with one large bed.",
    descId: "Satu cottage untuk sendiri, dengan satu kasur besar.",
    featuresEn: ["One large bed (180 × 200 cm)", ...FASILITAS_EN],
    featuresId: ["1 kasur besar (180 × 200 cm)", ...FASILITAS_ID],
  },
  {
    name: "Cottage Double 2", roomType: "Cottage Double", capAdult: 2, capChild: 2, baseRate: HARGA_PROMO, normalRate: HARGA_NORMAL, sizeM2: null,
    descEn: "A whole cottage to yourself, with one large bed.",
    descId: "Satu cottage untuk sendiri, dengan satu kasur besar.",
    featuresEn: ["One large bed (180 × 200 cm)", ...FASILITAS_EN],
    featuresId: ["1 kasur besar (180 × 200 cm)", ...FASILITAS_ID],
  },
  {
    name: "Cottage Single 1", roomType: "Cottage Single", capAdult: 2, capChild: 2, baseRate: HARGA_PROMO, normalRate: HARGA_NORMAL, sizeM2: null,
    descEn: "A whole cottage to yourself, with two single beds.",
    descId: "Satu cottage untuk sendiri, dengan dua kasur single.",
    featuresEn: ["Two single beds (120 × 200 cm each)", ...FASILITAS_EN],
    featuresId: ["2 kasur single (masing-masing 120 × 200 cm)", ...FASILITAS_ID],
  },
  {
    name: "Cottage Single 2", roomType: "Cottage Single", capAdult: 2, capChild: 2, baseRate: HARGA_PROMO, normalRate: HARGA_NORMAL, sizeM2: null,
    descEn: "A whole cottage to yourself, with two single beds.",
    descId: "Satu cottage untuk sendiri, dengan dua kasur single.",
    featuresEn: ["Two single beds (120 × 200 cm each)", ...FASILITAS_EN],
    featuresId: ["2 kasur single (masing-masing 120 × 200 cm)", ...FASILITAS_ID],
  },
];

const TAMU = [
  ["Rina Kartika", "Jakarta", "Open Water"], ["Daniel Weber", "Germany", "Advanced Open Water"], ["Sari Mahendra", "Bali", "Open Water"],
  ["Tom Becker", "Netherlands", "Rescue Diver"], ["Ayu Lestari", "Surabaya", "Belum bersertifikat"], ["Marco Rossi", "Italy", "Advanced Open Water"],
  ["Kenji Sato", "Japan", "Divemaster"], ["Dewi Anggraini", "Makassar", "Open Water"], ["Chloé Martin", "France", "Advanced Open Water"],
] as const;

/* [kamar, mulai, selesai, status, channel] relatif terhadap hari ini; tidak ada yang bertabrakan. */
const RENCANA: [number, number, number, string, string][] = [
  [0, -2, 3, "CHECKED_IN", "WHATSAPP"],
  [1, 0, 4, "CONFIRMED", "BOOKING_COM"],
  [2, 2, 5, "CONFIRMED", "WEBSITE"],
  [3, 5, 9, "TENTATIVE", "WEBSITE"],
  [0, 6, 10, "CONFIRMED", "AGODA"],
  [1, -10, -6, "CHECKED_OUT", "WHATSAPP"],
  [2, -20, -14, "CHECKED_OUT", "AGEN"],
  [3, 12, 16, "CONFIRMED", "AIRBNB"],
  [3, -6, -2, "CHECKED_OUT", "TRAVELOKA"],
];
const KOMISI: Record<string, number> = { BOOKING_COM: 0.15, AGODA: 0.15, AIRBNB: 0.03, AGEN: 0.1 };

export class DemoError extends Error {}

export async function isiDemo(): Promise<{ kamar: number; pesanan: number; catatan: number }> {
  if ((await statusDemo()).aktif) throw new DemoError("Data demo sudah terpasang. Hapus dulu bila ingin memasang ulang.");
  const ada = Number((await kueri<{ n: number }>("SELECT COUNT(*) AS n FROM rooms"))[0]?.n ?? 0);
  if (ada > 0) throw new DemoError("Sudah ada kamar asli. Data demo hanya dipasang di database yang masih kosong, supaya tidak tercampur.");

  const catat: Catatan = { dibuat: new Date().toISOString(), versi: 2, kamar: [], tamu: [], modul: [] };
  let pesanan = 0;
  await transaksi(async (k) => {
    for (const [i, r] of KAMAR_DEMO.entries()) {
      const id = idBaru();
      catat.kamar.push(id);
      await k.query(
        "INSERT INTO rooms (id, name, room_type, cap_adult, cap_child, base_rate, normal_rate, is_active, sort_order, size_m2, desc_en, desc_id, features_en, features_id) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)",
        [id, r.name, r.roomType, r.capAdult, r.capChild, r.baseRate, r.normalRate, i + 1, r.sizeM2, r.descEn, r.descId, r.featuresEn.join("\n"), r.featuresId.join("\n")],
      );
    }
    for (const [i, [ki, a, b, status, channel]] of RENCANA.entries()) {
      const g = idBaru();
      catat.tamu.push(g);
      const [nama, asal, sert] = TAMU[i];
      await k.query("INSERT INTO guests (id, name, phone, email, origin, dive_cert) VALUES (?, ?, ?, ?, ?, ?)", [g, `${nama} (demo)`, `+62 812 0000 ${1000 + i}`, `tamu${i + 1}@contoh.test`, asal, sert]);
      const total = KAMAR_DEMO[ki].baseRate * (b - a);
      const bk = idBaru();
      await k.query(
        "INSERT INTO bookings (id, code, room_id, guest_id, check_in, check_out, channel, status, source, pax, dives, total_amount, ota_commission_est, created_by, hold_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 2, ?, ?, ?, ?, ?)",
        [bk, `BK-DEMO${i}`, catat.kamar[ki], g, tgl(a), tgl(b), channel, status, channel === "WEBSITE" ? "WEBSITE" : "MANUAL", status === "TENTATIVE" ? null : 4, total, KOMISI[channel] ? Math.round(total * KOMISI[channel]) : null, OLEH, status === "TENTATIVE" ? new Date(Date.now() + 20 * 3600000) : null],
      );
      pesanan++;
      if (status !== "TENTATIVE")
        await k.query("INSERT INTO payments (id, booking_id, amount, kind, method, paid_at, recorded_by) VALUES (?, ?, ?, ?, 'TRANSFER', ?, ?)", [idBaru(), bk, Math.round(total * (status === "CHECKED_OUT" ? 1 : 0.3)), status === "CHECKED_OUT" ? "BALANCE" : "DEPOSIT", tgl(a - 5), OLEH]);
    }
    await k.query("INSERT INTO bookings (id, code, room_id, check_in, check_out, channel, status, notes, created_by) VALUES (?, 'BK-DEMOBL', ?, ?, ?, 'BLOCK', 'BLOCKED', 'Perbaikan atap (demo)', ?)", [idBaru(), catat.kamar[2], tgl(8), tgl(11), OLEH]);
    pesanan++;
  });

  /* Catatan modul lewat jalur biasa, jadi ikut diperiksa skemanya. */
  const rek = async (m: Modul, koleksi: string, isi: Record<string, unknown>) => {
    const r = await simpanRekaman(m, koleksi, isi, OLEH);
    if (!r.rekaman) throw new Error(`demo ${koleksi}: ${r.galat}`);
    catat.modul.push({ m, koleksi, id: r.rekaman.id });
    return r.rekaman.id;
  };
  try {
    for (const [h, jenis, kategori, uraian, jumlah] of [
      [-25, "Pengeluaran", "Gaji dan upah", "Gaji staf bulan lalu", 18500000],
      [-20, "Pengeluaran", "Listrik dan BBM", "Solar genset dan perahu", 6200000],
      [-18, "Pemasukan", "Dive dan aktivitas", "Paket 10 dive, tamu walk-in", 7500000],
      [-15, "Pengeluaran", "Makanan dan minuman", "Belanja dapur mingguan, Sorong", 3400000],
      [-12, "Pemasukan", "Makan dan minum", "Makan malam tamu luar", 1250000],
      [-9, "Pengeluaran", "Perawatan dan perbaikan", "Servis kompresor tabung", 2800000],
      [-6, "Pengeluaran", "Komisi OTA dan agen", "Komisi agen Sorong", 1400000],
      [-3, "Pemasukan", "Sewa dan transfer", "Antar jemput speedboat Waisai", 2000000],
      [-1, "Pengeluaran", "Pajak dan retribusi", "Kartu jasa lingkungan Raja Ampat", 1000000],
    ] as const) await rek("keuangan", "transaksi", { tanggal: tgl(h), jenis, kategori, uraian, jumlah, catatan: "Contoh" });
    for (const a of [
      { nama: "Speedboat 2 x 40 PK", kategori: "Perahu dan mesin", tanggal: tgl(-400), harga: 185000000, umur: 8, sisa: 35000000, kondisi: "Baik", lokasi: "Dermaga" },
      { nama: "Kompresor tabung selam", kategori: "Peralatan selam", tanggal: tgl(-300), harga: 95000000, umur: 6, sisa: 10000000, kondisi: "Perlu perbaikan", lokasi: "Dive center" },
      { nama: "12 set BCD dan regulator", kategori: "Peralatan selam", tanggal: tgl(-250), harga: 108000000, umur: 5, sisa: 12000000, kondisi: "Baik", lokasi: "Dive center" },
      { nama: "Genset 20 kVA", kategori: "Elektronik", tanggal: tgl(-500), harga: 78000000, umur: 10, sisa: 8000000, kondisi: "Baik", lokasi: "Rumah mesin" },
    ]) await rek("keuangan", "aset", a);

    const pegawai: string[] = [];
    for (const p of [
      { nama: "Yosias Mambrasar", jabatan: "Manajer resort", status: "Tetap", gaji: 7500000, tunjangan: 1000000 },
      { nama: "Maria Wanma", jabatan: "Resepsionis", status: "Tetap", gaji: 4200000, tunjangan: 300000 },
      { nama: "Hendrik Sauyai", jabatan: "Dive master", status: "Kontrak", gaji: 5500000, tunjangan: 500000 },
      { nama: "Agus Rumbewas", jabatan: "Kapten speedboat", status: "Tetap", gaji: 4800000, tunjangan: 400000 },
      { nama: "Lena Dimara", jabatan: "Housekeeping", status: "Harian", gaji: 3200000, tunjangan: 0 },
    ]) pegawai.push(await rek("sdm", "pegawai", { ...p, aktif: "Aktif", mulai: tgl(-365), ikutBpjs: p.status === "Harian" ? "Tidak" : "Ya", hp: "+62 813 0000 0000" }));
    for (let h = -3; h <= 0; h++)
      for (const [i, id] of pegawai.entries()) await rek("sdm", "absensi", { tanggal: tgl(h), pegawai: id, status: h === -1 && i === 4 ? "Sakit" : h === -2 && i === 2 ? "Cuti" : "Hadir" });
    for (const id of pegawai.slice(0, 4)) await rek("sdm", "asuransi", { pegawai: id, jenis: "BPJS Kesehatan", status: "Aktif" });
    await rek("sdm", "inventaris", { barang: "Seragam staf", kategori: "Seragam", punya: 10, butuh: 15, harga: 150000, kondisi: "Baik" });
    await rek("sdm", "inventaris", { barang: "Pelampung kru", kategori: "Alat keselamatan (APD)", punya: 6, butuh: 8, harga: 350000, kondisi: "Perlu diganti" });

    for (const [nama, kategori, satuan, minimum, harga, pakaiMalam, stok] of [
      ["Tisu toilet", "Tisu dan kertas", "roll", 40, 6000, 1, 30],
      ["Sabun mandi", "Amenitis kamar", "pcs", 30, 4500, 1, 120],
      ["Sampo sachet", "Amenitis kamar", "sachet", 50, 1500, 2, 200],
      ["Handuk mandi", "Linen dan handuk", "lembar", 20, 85000, 0, 32],
      ["Air minum galon", "Dapur dan minuman", "botol", 10, 25000, 0.5, 8],
      ["Obat nyamuk bakar", "Perlengkapan kamar", "dus", 5, 18000, 0, 12],
    ] as const) {
      const b = await rek("gudang", "barang", { nama, kategori, satuan, minimum, harga, pakaiMalam });
      await rek("gudang", "mutasi", { tanggal: tgl(-14), barang: b, jenis: "Masuk", jumlah: stok + 10, harga });
      await rek("gudang", "mutasi", { tanggal: tgl(-2), barang: b, jenis: "Keluar", jumlah: 10 });
    }
  } finally {
    await ubahJson<Catatan | null>(BERKAS, null, () => catat);
  }
  return { kamar: catat.kamar.length, pesanan, catatan: catat.modul.length };
}

export async function hapusDemo(): Promise<{ dihapus: number; tertinggal: string[] }> {
  const c = await bacaJson<Catatan | null>(BERKAS, null);
  if (!c || c.dihapus) throw new DemoError("Tidak ada data demo yang terpasang.");
  const tertinggal: string[] = [];
  await transaksi(async (k) => {
    await k.query("DELETE FROM bookings WHERE created_by = ?", [OLEH]);
    if (c.tamu.length) await k.query("DELETE FROM guests WHERE id IN (?) AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.guest_id = guests.id)", [c.tamu]);
  });
  /* Kamar dibiarkan dan tidak lagi dianggap demo; tandanya disimpan supaya tidak dipasang ulang otomatis. */
  await ubahJson<{ dipasang?: string } | null>(KAMAR_RESORT_BERKAS, null, (l) => l ?? { dipasang: new Date().toISOString() });
  /* Anak lebih dulu (absensi, mutasi), baru induknya (pegawai, barang). */
  let dihapus = 0;
  for (const x of [...c.modul].reverse()) {
    const r = await hapusRekaman(x.m, x.koleksi, x.id);
    if (r.ok) dihapus++;
  }
  await ubahJson<Catatan | null>(BERKAS, null, () => ({ dibuat: c.dibuat, dihapus: new Date().toISOString(), kamar: [], tamu: [], modul: [] }));
  return { dihapus, tertinggal };
}

/**
 * Memasang data demo sendiri saat database masih kosong (belum ada kamar) dan
 * data demo belum pernah dihapus. Dipanggil dari halaman depan, jadi situs
 * baru langsung tampil berisi. Matikan dengan BAKOERIA_DEMO=0.
 */
/**
 * Kamar demo versi pertama (nama dan harga karangan) diganti di tempat dengan kamar
 * yang sebenarnya. Id kamar tidak berubah, jadi pesanan yang menempel tetap utuh.
 * Kamar demo yang sudah dihapus pengguna dilewati; tarif musiman contoh dibuang.
 */
async function perbaruiKamarDemo(c: Catatan) {
  await transaksi(async (k) => {
    for (const [i, id] of c.kamar.entries()) {
      const r = KAMAR_DEMO[i];
      if (!r) continue;
      const [[bentrok]] = (await k.query("SELECT COUNT(*) AS n FROM rooms WHERE name = ? AND id <> ?", [r.name, id])) as unknown as [{ n: number }[]];
      if (Number(bentrok.n) > 0) continue;
      await k.query(
        "UPDATE rooms SET name = ?, room_type = ?, cap_adult = ?, cap_child = ?, base_rate = ?, normal_rate = ?, size_m2 = ?, desc_en = ?, desc_id = ?, features_en = ?, features_id = ? WHERE id = ?",
        [r.name, r.roomType, r.capAdult, r.capChild, r.baseRate, r.normalRate, r.sizeM2, r.descEn, r.descId, r.featuresEn.join("\n"), r.featuresId.join("\n"), id],
      );
    }
    if (c.kamar.length) await k.query("DELETE FROM seasonal_rates WHERE room_id IN (?) AND label = 'Musim ramai'", [c.kamar]);
  });
  await ubahJson<Catatan | null>(BERKAS, null, (l) => (l ? { ...l, versi: 2 } : l));
  console.log("[demo] kamar demo diperbarui ke Cottage Double dan Cottage Single");
}

/**
 * Pengaman: bila database tidak punya kamar sama sekali padahal data demo sudah
 * dihapus (versi lama tombol hapus ikut menghapus kamar), keempat cottage
 * Bakoeria dipasang lagi tanpa tamu dan pesanan contoh. Hanya sekali; kalau
 * pemilik sengaja menghapus semua kamar setelah itu, tidak dipasang ulang.
 */
const KAMAR_RESORT_BERKAS = "kamar-resort.json";
async function pastikanKamarResort() {
  const tanda = await bacaJson<{ dipasang?: string } | null>(KAMAR_RESORT_BERKAS, null);
  if (tanda?.dipasang) return;
  const n = Number((await kueri<{ n: number }>("SELECT COUNT(*) AS n FROM rooms"))[0]?.n ?? 0);
  if (n === 0) {
    await transaksi(async (k) => {
      for (const [i, r] of KAMAR_DEMO.entries())
        await k.query(
          "INSERT INTO rooms (id, name, room_type, cap_adult, cap_child, base_rate, normal_rate, is_active, sort_order, size_m2, desc_en, desc_id, features_en, features_id) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)",
          [idBaru(), r.name, r.roomType, r.capAdult, r.capChild, r.baseRate, r.normalRate, i + 1, r.sizeM2, r.descEn, r.descId, r.featuresEn.join("\n"), r.featuresId.join("\n")],
        );
    });
    console.log("[demo] kamar Bakoeria dipasang kembali karena database tidak punya kamar");
  }
  await ubahJson<{ dipasang?: string } | null>(KAMAR_RESORT_BERKAS, null, () => ({ dipasang: new Date().toISOString() }));
}

let otomatis: Promise<void> | undefined;
export function pastikanDemo(): Promise<void> {
  if (process.env.BAKOERIA_DEMO?.trim() === "0") return Promise.resolve();
  otomatis ??= (async () => {
    const c = await bacaJson<Catatan | null>(BERKAS, null);
    if (c) {
      // Data demo versi lama yang masih terpasang: kamar contohnya diperbarui ke kamar yang sebenarnya.
      if (!c.dihapus && (c.versi ?? 1) < 2) await perbaruiKamarDemo(c);
      if (c.dihapus) await pastikanKamarResort();
      return;
    }
    const n = Number((await kueri<{ n: number }>("SELECT COUNT(*) AS n FROM rooms"))[0]?.n ?? 0);
    if (n > 0) return;
    await isiDemo();
    console.log("[demo] data demo dipasang otomatis karena database masih kosong");
  })()
    .catch((e) => console.error("[demo] gagal memasang otomatis", e))
    .finally(() => {
      otomatis = undefined;
    });
  return otomatis;
}
