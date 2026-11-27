import type { PaketGrup } from "./konten";

/**
 * Harga diving mengikuti daftar harga Zanclus Dive Center (zanclusdivecenter.com, dibaca
 * 25 November 2026). Permintaan pemilik: "harga diving ikut harga zanclus saja".
 * Trip snorkeling dan trip pulau milik Bakoeria tidak termasuk di sini.
 * `untuk` menentukan siapa yang ditawari di formulir pesan (lib/selam.ts).
 */
export const VERSI_HARGA_SELAM = "zanclus-2026-11-27";

/** Isi paket Zanclus 2026, sama untuk fun dive dan try scuba. */
export const TERMASUK_PAKET = { id: "Termasuk perahu dan kru, divemaster, alat selam, kopi, teh, air minum, snack dan buah, serta biaya lokasi. Belum termasuk park fee, tip divemaster dan kru, pengeluaran pribadi, dan asuransi.", en: "Includes boat and crew, divemaster, dive gear, coffee, tea, drinking water, snacks and fruit, and the site fee. Excludes the park fee, tips for the divemaster and crew, personal expenses, and insurance." };

export const GRUP_SELAM_ID: PaketGrup[] = [
  {
    judul: "Fun dive",
    catatan: `Per orang per hari, untuk penyelam berlisensi. ${TERMASUK_PAKET.id}`,
    isi: [
      { nama: "Fun dive Central, 2 selam", ket: "Area tengah sekitar Mansuar. Minimal 2 orang berlisensi", harga: "Rp 2.700.000", untuk: "sertifikat" },
      { nama: "Fun dive Central, 3 selam", ket: "Area tengah sekitar Mansuar. Minimal 2 orang berlisensi", harga: "Rp 3.000.000", untuk: "sertifikat" },
      { nama: "Fun dive Waigeo, 2 selam pagi", ket: "Friwen Wall dan Five Rock. Minimal 4 orang berlisensi", harga: "Rp 2.450.000", untuk: "sertifikat" },
      { nama: "Fun dive Piaynemo, 2 selam", ket: "Minimal 4 orang berlisensi", harga: "Rp 4.000.000", untuk: "sertifikat" },
    ],
  },
  {
    judul: "Try scuba, tanpa lisensi",
    catatan: `Per orang per hari, selam pertama bersama pemandu. ${TERMASUK_PAKET.id}`,
    isi: [
      { nama: "Try scuba, 1 selam", ket: "Tanpa lisensi selam", harga: "Rp 1.800.000", untuk: "pemula" },
      { nama: "Try scuba, 2 selam", ket: "Tanpa lisensi selam", harga: "Rp 2.000.000", untuk: "pemula" },
      { nama: "Try scuba, 3 selam", ket: "Tanpa lisensi selam", harga: "Rp 2.500.000", untuk: "pemula" },
    ],
  },
  {
    judul: "Kursus selam",
    catatan: "Per orang. Alat selam dan biaya lisensi termasuk dalam kursus. Belum termasuk perahu selam.",
    isi: [
      { nama: "Kursus Open Water Diver", ket: "3 sampai 4 hari, sampai 18 m, umur 10+, 4 penyelaman di laut, alat dan biaya lisensi", harga: "Rp 7.500.000", untuk: "kursus" },
      { nama: "Kursus Advanced Open Water", ket: "2 sampai 3 hari, sampai 30 m, 5 penyelaman petualangan, perlu lisensi Open Water", harga: "Rp 6.500.000", untuk: "sertifikat" },
      { nama: "Kursus Rescue Diver", ket: "3 hari, skenario penyelamatan di laut, pertolongan pertama, perlu lisensi Advanced dan sertifikat pertolongan pertama", harga: "Rp 7.000.000", untuk: "sertifikat" },
    ],
  },
  {
    judul: "Sewa alat selam",
    catatan: "Per hari. Paket fun dive dan try scuba sudah termasuk alat selam.",
    isi: [
      { nama: "Perlengkapan scuba", ket: "Masker, fin, BCD, regulator, wetsuit", harga: "Rp 600.000", untuk: "lain" },
      { nama: "Tabung dan isi ulang", ket: "Satu tabung penuh (200 bar)", harga: "Rp 100.000", untuk: "lain" },
      { nama: "Dive computer D4i", ket: "Sewa satu hari", harga: "Rp 500.000", untuk: "lain" },
      { nama: "Kamera bawah air TG-5", ket: "Sewa satu hari", harga: "Rp 650.000", untuk: "lain" },
      { nama: "GoPro Hero 11 dan housing", ket: "Sewa satu hari", harga: "Rp 500.000", untuk: "lain" },
    ],
  },
  {
    judul: "Perahu selam",
    catatan: "Per perahu, untuk kursus, dibagi dalam satu grup. 2 selam di area Arborek. Paket fun dive dan try scuba sudah termasuk perahu.",
    isi: [
      { nama: "Perahu selam kecil", ket: "5 sampai 10 penyelam", harga: "Rp 4.000.000", untuk: "lain" },
      { nama: "Perahu selam sedang", ket: "10 sampai 15 penyelam", harga: "Rp 8.000.000", untuk: "lain" },
    ],
  },
];

export const GRUP_SELAM_EN: PaketGrup[] = [
  {
    judul: "Fun dives",
    catatan: `Per person per day, for licensed divers. ${TERMASUK_PAKET.en}`,
    isi: [
      { nama: "Fun dive, Central, 2 dives", ket: "Central area around Mansuar. Minimum 2 licensed divers", harga: "Rp 2.700.000", untuk: "sertifikat" },
      { nama: "Fun dive, Central, 3 dives", ket: "Central area around Mansuar. Minimum 2 licensed divers", harga: "Rp 3.000.000", untuk: "sertifikat" },
      { nama: "Fun dive, Waigeo, 2 morning dives", ket: "Friwen Wall and Five Rock. Minimum 4 licensed divers", harga: "Rp 2.450.000", untuk: "sertifikat" },
      { nama: "Fun dive, Piaynemo, 2 dives", ket: "Minimum 4 licensed divers", harga: "Rp 4.000.000", untuk: "sertifikat" },
    ],
  },
  {
    judul: "Try scuba, no licence",
    catatan: `Per person per day, a first dive with a guide. ${TERMASUK_PAKET.en}`,
    isi: [
      { nama: "Try scuba, 1 dive", ket: "No dive licence needed", harga: "Rp 1.800.000", untuk: "pemula" },
      { nama: "Try scuba, 2 dives", ket: "No dive licence needed", harga: "Rp 2.000.000", untuk: "pemula" },
      { nama: "Try scuba, 3 dives", ket: "No dive licence needed", harga: "Rp 2.500.000", untuk: "pemula" },
    ],
  },
  {
    judul: "Dive courses",
    catatan: "Per person. Dive gear and licence fee are included in courses. Dive boat not included.",
    isi: [
      { nama: "Open Water Diver course", ket: "3 to 4 days, down to 18 m, age 10+, 4 open water dives, gear and licence fee", harga: "Rp 7.500.000", untuk: "kursus" },
      { nama: "Advanced Open Water course", ket: "2 to 3 days, down to 30 m, 5 adventure dives, Open Water licence required", harga: "Rp 6.500.000", untuk: "sertifikat" },
      { nama: "Rescue Diver course", ket: "3 days, rescue scenarios at sea, first aid, Advanced licence and a first aid certificate required", harga: "Rp 7.000.000", untuk: "sertifikat" },
    ],
  },
  {
    judul: "Dive gear rental",
    catatan: "Per day. Fun dive and try scuba packages already include dive gear.",
    isi: [
      { nama: "Scuba equipment", ket: "Mask, fins, BCD, regulator, wetsuit", harga: "Rp 600.000", untuk: "lain" },
      { nama: "Tank and refill", ket: "One full tank (200 bar)", harga: "Rp 100.000", untuk: "lain" },
      { nama: "Dive computer D4i", ket: "One-day rental", harga: "Rp 500.000", untuk: "lain" },
      { nama: "Underwater camera TG-5", ket: "One-day rental", harga: "Rp 650.000", untuk: "lain" },
      { nama: "GoPro Hero 11 and housing", ket: "One-day rental", harga: "Rp 500.000", untuk: "lain" },
    ],
  },
  {
    judul: "Dive boats",
    catatan: "Per boat, for courses, shared by one group. 2 dives in the Arborek area. Fun dive and try scuba packages already include the boat.",
    isi: [
      { nama: "Small dive boat", ket: "5 to 10 divers", harga: "Rp 4.000.000", untuk: "lain" },
      { nama: "Medium dive boat", ket: "10 to 15 divers", harga: "Rp 8.000.000", untuk: "lain" },
    ],
  },
];

/** Kelompok lama yang bukan diving (trip snorkeling, trip pulau) dipertahankan, di belakang kelompok diving baru. */
export const kelompokBukanSelam = (g: { judul: string }) => /snorkel|trip pulau|island trip/i.test(g.judul);

/** Ganti kelompok diving di daftar harga tersimpan dengan harga Zanclus; centang "termasuk" kelompok yang sejenis ikut. */
export function gantiHargaSelam(paket: PaketGrup[], bahasa: "en" | "id"): PaketGrup[] {
  const baru = bahasa === "en" ? GRUP_SELAM_EN : GRUP_SELAM_ID;
  const lama = paket.filter((g) => !kelompokBukanSelam(g));
  const termasuk = (pola: RegExp) => lama.find((g) => pola.test(g.judul))?.termasuk;
  return [
    ...baru.map((g, i) => ({ ...g, isi: g.isi.map((x) => ({ ...x })), termasuk: (i === 0 ? termasuk(/fun dive/i) : i === 2 ? termasuk(/kursus|course/i) : undefined) ?? [] })),
    ...paket.filter(kelompokBukanSelam),
  ];
}

/** Catatan daftar harga lama (menyebut biaya bensin titik jauh), diganti bila belum diubah pemilik. */
export const CATATAN_LAMA: Record<"en" | "id", string> = { id: "Harga dalam Rupiah. Titik selam yang jauh bisa dikenai biaya bensin Rp 300.000 sampai 500.000 bila penyelam kurang dari 3.", en: "Prices in Indonesian Rupiah. Far sites may add a fuel charge of Rp 300.000 to 500.000 with fewer than 3 divers." };
/** Harga kartu Program selam, diisi bila masih kosong (dicocokkan dari judulnya). */
export const HARGA_PROGRAM: { pola: RegExp; id: string; en: string }[] = [
  { pola: /fun dive/i, id: "Mulai Rp 2.450.000 per penyelam", en: "From Rp 2.450.000 per diver" },
  { pola: /open water/i, id: "Rp 7.500.000 per orang", en: "Rp 7.500.000 per person" },
  { pola: /discover|try scuba|try dive/i, id: "Mulai Rp 1.800.000 per orang", en: "From Rp 1.800.000 per person" },
];

/** Sejak 25 November 2026 semua harga diving belum termasuk perahu selam (pemilik). Teks lama diganti di isi tersimpan bila belum diubah. */
export const VERSI_TANPA_PERAHU = "selam-tanpa-perahu-2026-11-25";
export const GANTI_TANPA_PERAHU: [string, string][] = [["Per penyelam, satu hari bersama divemaster. Untuk penyelam bersertifikat.", "Per penyelam, satu hari bersama divemaster. Untuk penyelam bersertifikat. Belum termasuk perahu selam."], ["Per orang. Alat selam dan biaya lisensi termasuk dalam kursus.", "Per orang. Alat selam dan biaya lisensi termasuk dalam kursus. Belum termasuk perahu selam."], ["1 pemandu untuk 4 penyelam, speedboat, makan siang", "1 pemandu untuk 4 penyelam, makan siang"], ["Star Lagoon, speedboat, izin pulau, makan siang", "Star Lagoon, izin pulau, makan siang"], ["Per diver, one day with a divemaster. For certified divers.", "Per diver, one day with a divemaster. For certified divers. Dive boat not included."], ["Per person. Dive gear and licence fee are included in courses.", "Per person. Dive gear and licence fee are included in courses. Dive boat not included."], ["1 guide per 4 divers, speedboat, lunch", "1 guide per 4 divers, lunch"], ["Star Lagoon, speedboat, island permits, lunch", "Star Lagoon, island permits, lunch"], ["Per perahu, 2 selam di area Arborek.", "Per perahu, untuk fun dive dan kursus, dibagi dalam satu grup. 2 selam di area Arborek."], ["Per boat, 2 dives in the Arborek area.", "Per boat, for fun dives and courses, shared by one group. 2 dives in the Arborek area."]];
export const CATATAN_PAKET: Record<"en" | "id", [string, string]> = {
  id: ["Harga dalam Rupiah dan bisa berubah. Jadwal selam menyesuaikan cuaca dan kondisi laut.", "Harga dalam Rupiah dan bisa berubah. Semua harga diving belum termasuk perahu selam. Jadwal selam menyesuaikan cuaca dan kondisi laut."],
  en: ["Prices in Indonesian Rupiah and may change. Dive plans follow the weather and sea conditions.", "Prices in Indonesian Rupiah and may change. All dive prices exclude the dive boat. Dive plans follow the weather and sea conditions."],
};

/** Harga kartu Program selam lama yang diganti harga paket 2026 (bila belum diubah pemilik). */
export const HARGA_PROGRAM_LAMA = ["Rp 2.100.000 per penyelam", "Rp 2.100.000 per diver", "Rp 1.200.000 per orang", "Rp 1.200.000 per person"];
/** Catatan daftar harga sejak paket Zanclus 2026: fun dive dan try scuba sudah termasuk perahu. */
export const CATATAN_PAKET_2026: Record<"en" | "id", string> = {
  id: "Harga dalam Rupiah dan bisa berubah. Paket fun dive dan try scuba sudah termasuk perahu dan kru. Kursus belum termasuk perahu selam. Jadwal selam menyesuaikan cuaca dan kondisi laut.",
  en: "Prices in Indonesian Rupiah and may change. Fun dive and try scuba packages include the boat and crew. Courses exclude the dive boat. Dive plans follow the weather and sea conditions.",
};
