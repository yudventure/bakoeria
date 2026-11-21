/**
 * Isi situs publik. Bawaan di sini; yang diubah dari tab Website disimpan di
 * `konten.json` di folder data dan langsung tayang tanpa build ulang.
 */
export interface Program {
  judul: string;
  isi: string;
  meta: string;
  harga: string;
}
export interface Jadwal {
  jam: string;
  judul: string;
  isi: string;
}
export interface Tanya {
  t: string;
  j: string;
}
export interface Sorotan {
  /** Kosong berarti dihitung otomatis (jumlah cottage atau jumlah program). */
  nilai: string;
  label: string;
}
export interface Keunggulan {
  ikon: string;
  judul: string;
  isi: string;
}
export interface Konten {
  tagline: string;
  introJudul: string;
  introIsi: string;
  programCatatan: string;
  program: Program[];
  cottageJudul: string;
  cottageIsi: string;
  cottageFitur: string[];
  jadwal: Jadwal[];
  galeriJudul: string;
  tanya: Tanya[];
  pesanIsi: string;
  kontak: { whatsapp: string; email: string; instagram: string; alamat: string };
  pengumuman: string;
  tutup: boolean;
  /** Tiga angka di kanan hero. */
  sorotan: Sorotan[];
  /** Kalimat besar di bagian Tentang. Kata di antara *bintang* diberi warna emas. */
  pernyataan: string;
  keunggulanJudul: string;
  keunggulan: Keunggulan[];
}

export const IKON_KEUNGGULAN = ["selam", "rumah", "tenang", "orang", "perahu", "lampu", "daun", "bintang"] as const;

export const KONTEN_BAWAAN: Konten = {
  tagline: "Menyelam siang, bermalam di bawah bintang.",
  introJudul: "Tempat laut menjadi rumah",
  introIsi:
    "Bakoeria Dive Resort adalah resor selam butik yang tenang dan personal. Siang hari Anda ada di bawah air bersama pemandu yang mengenal lokasinya. Malam hari Anda pulang ke cottage kayu jati, dengan lampu gantung hangat dan pasir di bawah kaki.",
  programCatatan: "Jadwal dan tarif disesuaikan dengan kondisi laut dan kemampuan tamu.",
  program: [
    { judul: "Fun Dive", isi: "Untuk penyelam bersertifikat. Briefing singkat, dua penyelaman per hari, dipandu dive master yang memahami titik selam setempat.", meta: "Bersertifikat · 2 selam per hari", harga: "" },
    { judul: "Kursus Open Water", isi: "Belajar menyelam dari awal dengan kelompok kecil, tempo yang tenang, dan perhatian penuh pada keselamatan.", meta: "Pemula · kelompok kecil", harga: "" },
    { judul: "Discover Scuba", isi: "Rasakan menyelam pertama Anda di perairan dangkal, tanpa perlu sertifikat, ditemani instruktur satu per satu.", meta: "Tanpa sertifikat · setengah hari", harga: "" },
    { judul: "Snorkeling", isi: "Untuk keluarga dan tamu yang menunggu di permukaan. Peralatan tersedia dan pemandu ikut di air.", meta: "Semua usia · peralatan tersedia", harga: "" },
  ],
  cottageJudul: "Cottage kayu jati",
  cottageIsi: "Rumah panggung berdinding kayu jati dengan teras menghadap taman kelapa. Dibangun dari bahan lokal, dirancang untuk angin laut mengalir.",
  cottageFitur: ["Teras pribadi dengan kursi dan lampu hangat", "Tempat tidur dengan kelambu dan kamar mandi dalam", "Area bilas dan penyimpanan peralatan selam", "Beberapa langkah ke pantai dan dermaga"],
  jadwal: [
    { jam: "06.30", judul: "Sarapan", isi: "Kopi, buah, dan sarapan hangat di teras makan." },
    { jam: "07.30", judul: "Briefing selam", isi: "Rencana penyelaman dan pemeriksaan peralatan di dermaga." },
    { jam: "08.30", judul: "Selam pagi", isi: "Berangkat dengan perahu, kembali untuk istirahat di permukaan." },
    { jam: "13.00", judul: "Makan siang", isi: "Hammock, bilas, dan waktu untuk mencatat logbook." },
    { jam: "15.00", judul: "Selam sore atau snorkeling", isi: "Cahaya rendah yang membuat warna karang paling hidup." },
    { jam: "19.00", judul: "Makan malam", isi: "Di bawah lampu gantung, dengan langit penuh bintang." },
  ],
  galeriJudul: "Cahaya hangat di tengah gelap",
  tanya: [
    { t: "Apakah saya perlu sertifikat selam?", j: "Tidak untuk Discover Scuba dan snorkeling. Fun dive memerlukan sertifikat dasar seperti Open Water. Jika belum punya, Anda bisa mengambil kursus di sini." },
    { t: "Apa yang perlu saya bawa?", j: "Pakaian ringan, tabir surya ramah karang, handuk, dan logbook jika ada. Peralatan selam dapat disewa di resor." },
    { t: "Bagaimana cara memesan?", j: "Pilih tanggal di formulir pemesanan. Permintaan Anda langsung masuk ke tim kami, dan kami membalas lewat WhatsApp atau email dengan konfirmasi dan cara pembayaran." },
  ],
  pesanIsi: "Pilih tanggal dan cottage. Kami membalas dengan konfirmasi dan cara pembayaran.",
  kontak: { whatsapp: "+62 800 0000 0000", email: "halo@bakoeria.example", instagram: "@bakoeria", alamat: "" },
  pengumuman: "",
  tutup: false,
  sorotan: [
    { nilai: "", label: "cottage kayu jati" },
    { nilai: "", label: "program selam" },
    { nilai: "2", label: "selam per hari" },
  ],
  pernyataan: "Kami merancang tempat menyelam dan beristirahat, di mana *laut*, *kayu jati*, dan *kehangatan tim* berjalan dalam keseimbangan",
  keunggulanJudul: "Kenapa memilih Bakoeria",
  keunggulan: [
    { ikon: "selam", judul: "Pemandu yang mengenal laut", isi: "Dive master yang hafal titik selam, arus, dan musimnya." },
    { ikon: "rumah", judul: "Cottage kayu jati", isi: "Rumah panggung dari bahan lokal, dirancang untuk angin laut." },
    { ikon: "tenang", judul: "Tenang dan pribadi", isi: "Sedikit cottage, kelompok selam kecil, malam yang sunyi." },
    { ikon: "orang", judul: "Untuk semua tingkat", isi: "Dari selam pertama sampai penyelam berpengalaman." },
  ],
};

/** Gabungkan isi tersimpan dengan bawaan, supaya kolom baru tidak pernah kosong. */
export function rapikanKonten(o: Partial<Konten> | null | undefined): Konten {
  const b = KONTEN_BAWAAN;
  const s = (v: unknown, d: string) => (typeof v === "string" ? v.slice(0, 4000) : d);
  const arr = <T,>(v: unknown, d: T[], f: (x: Record<string, unknown>) => T) => (Array.isArray(v) ? v.slice(0, 30).map((x) => f((x ?? {}) as Record<string, unknown>)) : d);
  const k = (o ?? {}) as Record<string, unknown>;
  const kontak = (k.kontak ?? {}) as Record<string, unknown>;
  return {
    tagline: s(k.tagline, b.tagline),
    introJudul: s(k.introJudul, b.introJudul),
    introIsi: s(k.introIsi, b.introIsi),
    programCatatan: s(k.programCatatan, b.programCatatan),
    program: arr(k.program, b.program, (x) => ({ judul: s(x.judul, ""), isi: s(x.isi, ""), meta: s(x.meta, ""), harga: s(x.harga, "") })),
    cottageJudul: s(k.cottageJudul, b.cottageJudul),
    cottageIsi: s(k.cottageIsi, b.cottageIsi),
    cottageFitur: Array.isArray(k.cottageFitur) ? k.cottageFitur.filter((x) => typeof x === "string").slice(0, 20) : b.cottageFitur,
    jadwal: arr(k.jadwal, b.jadwal, (x) => ({ jam: s(x.jam, ""), judul: s(x.judul, ""), isi: s(x.isi, "") })),
    galeriJudul: s(k.galeriJudul, b.galeriJudul),
    tanya: arr(k.tanya, b.tanya, (x) => ({ t: s(x.t, ""), j: s(x.j, "") })),
    pesanIsi: s(k.pesanIsi, b.pesanIsi),
    kontak: { whatsapp: s(kontak.whatsapp, b.kontak.whatsapp), email: s(kontak.email, b.kontak.email), instagram: s(kontak.instagram, b.kontak.instagram), alamat: s(kontak.alamat, b.kontak.alamat) },
    pengumuman: s(k.pengumuman, b.pengumuman),
    tutup: typeof k.tutup === "boolean" ? k.tutup : b.tutup,
    sorotan: arr(k.sorotan, b.sorotan, (x) => ({ nilai: s(x.nilai, "").slice(0, 12), label: s(x.label, "").slice(0, 40) })).slice(0, 3),
    pernyataan: s(k.pernyataan, b.pernyataan),
    keunggulanJudul: s(k.keunggulanJudul, b.keunggulanJudul),
    keunggulan: arr(k.keunggulan, b.keunggulan, (x) => ({ ikon: (IKON_KEUNGGULAN as readonly string[]).includes(String(x.ikon)) ? String(x.ikon) : "bintang", judul: s(x.judul, ""), isi: s(x.isi, "") })).slice(0, 6),
  };
}

/** Nomor WhatsApp menjadi angka saja untuk tautan wa.me (0812… menjadi 62812…). */
export const nomorWa = (s: string) => {
  const d = s.replace(/\D/g, "");
  return d.startsWith("0") ? "62" + d.slice(1) : d;
};
