/**
 * Katalog fasilitas berikon untuk kamar, program selam, dan trip.
 *
 * Pemilik mencentang fasilitas yang didapat dari daftar ini; daftarnya sendiri
 * bisa ditambah, diubah, dan dihapus di dashboard. Tiap fasilitas punya satu
 * ikon dari IKON_FASILITAS dan label Inggris/Indonesia. Kamar menyimpan label
 * (kolom features_en/features_id), program selam dan trip menyimpan kuncinya.
 */

/** Ikon garis 24×24 (stroke), dipakai dashboard dan situs. */
export const IKON_FASILITAS: Record<string, { nama: string; d: string }> = {
  centang: { nama: "Centang", d: "M5 12.5l4.5 4.5L19 7.5" },
  kasur: { nama: "Kasur besar", d: "M3 18V7M3 13h18v5M21 18v-7a3 3 0 0 0-3-3h-7v5M7 10.5a1.5 1.5 0 1 0 0-.01" },
  kasur2: { nama: "Dua kasur", d: "M2 18V9M2 14h9v4M11 18v-4a2 2 0 0 0-2-2H5M13 18V9M13 14h9v4M22 18v-4a2 2 0 0 0-2-2h-4" },
  ac: { nama: "AC", d: "M3 8h18M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4H3zM7 16v2M12 16v3M17 16v2" },
  kipas: { nama: "Kipas", d: "M12 12a2 2 0 1 0 0-.01M12 10c0-4 1-7 4-7s2 5-4 7M14 12c4 0 7 1 7 4s-5 2-7-4M12 14c0 4-1 7-4 7s-2-5 4-7M10 12c-4 0-7-1-7-4s5-2 7 4" },
  shower: { nama: "Shower", d: "M8 4h6a4 4 0 0 1 4 4v1M12 9h12M14 13v1M18 13v1M22 13v1M15 17v1M19 17v1M4 4v16" },
  toilet: { nama: "Toilet", d: "M7 3h5v7H7zM5 10h14a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6zM9 16l-1 5h8l-1-5" },
  lemari: { nama: "Lemari", d: "M5 3h14v17H5zM12 3v17M10 11v2M14 11v2M7 20v1.5M17 20v1.5" },
  sofa: { nama: "Sofa", d: "M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M3 12a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v6H3zM6 18v2M18 18v2" },
  kursi: { nama: "Teras / kursi", d: "M6 4v10h12M6 14l-1 6M18 14l1 6M6 9h12M18 4v10" },
  rumah: { nama: "Rumah / cottage", d: "M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6" },
  makan: { nama: "Makan", d: "M5 3v8a2 2 0 0 0 4 0V3M7 3v18M17 3c-2 2-3 4-3 7 0 2 1 3 3 3zM17 13v8" },
  kopi: { nama: "Minuman", d: "M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 2v3M12 2v3" },
  air: { nama: "Air minum", d: "M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z" },
  api: { nama: "Api / BBQ", d: "M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-8z" },
  handuk: { nama: "Handuk", d: "M6 3h12v14H6zM6 7h12M9 17v4h6v-4" },
  baju: { nama: "Laundry", d: "M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3c-1 2-2 3-4 3S9 5 8 3z" },
  wifi: { nama: "Wi-Fi", d: "M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01" },
  listrik: { nama: "Listrik", d: "M13 2 4 14h7l-1 8 9-12h-7z" },
  tv: { nama: "TV", d: "M3 6h18v11H3zM8 21h8M12 17v4" },
  kunci: { nama: "Kunci / brankas", d: "M8 14a4 4 0 1 1 3.5-6M11 10h10M17 10v3M20 10v2" },
  perahu: { nama: "Perahu", d: "M3 15h18l-2.5 4.5h-13zM6 15V9h9l3 6M10 9V5M10 5h3" },
  pesawat: { nama: "Pesawat / jemput", d: "M2 16l20-6-2-3-7 2-5-5-2 1 3 6-5 2-2-2-1 1z" },
  selam: { nama: "Masker selam", d: "M3 9h18v5a3 3 0 0 1-3 3h-3l-3-2-3 2H6a3 3 0 0 1-3-3zM21 11h1v6a3 3 0 0 1-3 3" },
  tabung: { nama: "Tabung", d: "M9 7h6v13a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2zM10 7V5h4v2M12 5V2M10 3h4" },
  snorkel: { nama: "Snorkel", d: "M17 3v13a5 5 0 0 1-5 5H9M3 9h10v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  sirip: { nama: "Fin", d: "M8 3h4l1 9 4 7a2 2 0 0 1-2 3H8a2 2 0 0 1-2-2l1-8z" },
  ikan: { nama: "Ikan", d: "M3 12c3-4 7-5 11-5 3 0 5 2 7 5-2 3-4 5-7 5-4 0-8-1-11-5zM3 12l-1 4M3 12 2 8M16 11h.01" },
  kamera: { nama: "Kamera", d: "M3 8h4l2-3h6l2 3h4v11H3zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" },
  orang: { nama: "Pemandu", d: "M12 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM5 21a7 7 0 0 1 14 0" },
  grup: { nama: "Grup kecil", d: "M9 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 5.6M18 20a6 6 0 0 0-3-5.2" },
  sertifikat: { nama: "Sertifikat", d: "M12 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM9 12l-2 9 5-3 5 3-2-9" },
  perisai: { nama: "Asuransi / aman", d: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5" },
  p3k: { nama: "P3K", d: "M4 7h16v13H4zM9 7V4h6v3M12 10v7M8.5 13.5h7" },
  jam: { nama: "Waktu", d: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2" },
  pin: { nama: "Lokasi", d: "M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12zM12 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" },
  tiket: { nama: "Tiket", d: "M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM14 7v10" },
  bensin: { nama: "Bahan bakar", d: "M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M3 21h13M7 7h5v4H7zM15 9h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3" },
  pulau: { nama: "Pulau", d: "M3 19c3-2 6-2 9 0s6 2 9 0M8 17c0-3 1-7 4-10M12 7c-2-1-5-1-7 1M12 7c2-2 5-2 7 0M12 7c0-2 1-4 3-4" },
  gunung: { nama: "Puncak pandang", d: "M3 20l6-10 4 6 3-4 5 8z" },
  burung: { nama: "Burung", d: "M3 13c3 0 5-2 6-5 2 2 3 4 3 6 2-3 5-4 9-4-2 4-6 7-11 7-3 0-6-1-7-4z" },
  kayak: { nama: "Kayak", d: "M3 16c4 2 14 2 18 0-4-2-14-2-18 0zM5 5l14 14M4 6l2-2M18 20l2-2" },
  teropong: { nama: "Teropong", d: "M7 14a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM17 14a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM5 15l2-10h3l1 9M19 15l-2-10h-3l-1 9M10.5 14h3" },
  daun: { nama: "Alam", d: "M5 19c0-9 6-14 15-14 0 9-5 15-14 15M5 19l7-7" },
  matahari: { nama: "Matahari", d: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" },
  bulan: { nama: "Malam", d: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" },
  bintang: { nama: "Bintang", d: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" },
};
export const ikonFasilitas = (nama: string) => (IKON_FASILITAS[nama] ?? IKON_FASILITAS.centang).d;

export type JenisFasilitas = "kamar" | "selam" | "trip";
export const JENIS_FASILITAS: JenisFasilitas[] = ["kamar", "selam", "trip"];
export const adaJenisFasilitas = (v: unknown): v is JenisFasilitas => v === "kamar" || v === "selam" || v === "trip";
export interface Fasilitas { kunci: string; ikon: string; en: string; id: string }
export type KatalogFasilitas = Record<JenisFasilitas, Fasilitas[]>;

const f = (kunci: string, ikon: string, en: string, id: string): Fasilitas => ({ kunci, ikon, en, id });
/** Isi awal. Label kamar sama persis dengan fasilitas kamar yang sudah tersimpan, jadi centangnya langsung terbaca. */
export const KATALOG_BAWAAN: KatalogFasilitas = {
  kamar: [
    f("kasur-besar", "kasur", "One large bed (180 × 200 cm)", "1 kasur besar (180 × 200 cm)"),
    f("kasur-single", "kasur2", "Two single beds (120 × 200 cm each)", "2 kasur single (masing-masing 120 × 200 cm)"),
    f("ac", "ac", "Air conditioning", "AC"),
    f("kamar-mandi", "shower", "Private bathroom with shower", "Kamar mandi dalam dengan shower"),
    f("toilet", "toilet", "American-style seated toilet", "Toilet duduk American style"),
    f("lemari", "lemari", "Extra-large wardrobe", "Lemari pakaian yang sangat luas"),
    f("sofa", "sofa", "Sofa", "Sofa"),
    f("cottage", "rumah", "Your own cottage, like a house", "Satu cottage untuk sendiri, seperti rumah"),
    f("makan", "makan", "Three meals a day included", "Sudah termasuk makan 3 kali sehari"),
    f("kayak", "kayak", "Free use of kayaks", "Gratis pakai kayak"),
    f("snorkel", "snorkel", "Free snorkeling gear", "Gratis alat snorkel"),
    f("transfer", "perahu", "Boat transfer", "Antar-jemput perahu"),
    f("listrik", "listrik", "Electricity from 6 pm to 6 am", "Listrik dari jam 18.00 sampai 06.00"),
    f("wifi", "wifi", "Starlink Wi-Fi", "Wi-Fi Starlink"),
    f("teras", "kursi", "Private terrace", "Teras pribadi"),
    f("handuk", "handuk", "Towels", "Handuk"),
    f("air-minum", "air", "Drinking water", "Air minum"),
  ],
  selam: [
    f("alat", "selam", "Full dive equipment", "Peralatan selam lengkap"),
    f("tabung", "tabung", "Tank and weights", "Tabung dan pemberat"),
    f("pemandu", "orang", "Dive guide", "Pemandu selam"),
    f("perahu", "perahu", "Boat to the dive sites", "Perahu ke lokasi selam"),
    f("makan", "makan", "Lunch", "Makan siang"),
    f("minum", "kopi", "Drinks and snacks", "Minuman dan camilan"),
    f("handuk", "handuk", "Towel", "Handuk"),
    f("sertifikat", "sertifikat", "Certification card", "Kartu sertifikat"),
    f("asuransi", "perisai", "Dive insurance", "Asuransi selam"),
  ],
  trip: [
    f("perahu", "perahu", "Boat and captain", "Perahu dan kapten"),
    f("pemandu", "orang", "Local guide", "Pemandu lokal"),
    f("makan", "makan", "Lunch", "Makan siang"),
    f("air", "air", "Drinking water", "Air minum"),
    f("snorkel", "snorkel", "Snorkel gear", "Alat snorkel"),
    f("tiket", "tiket", "Entrance fees", "Tiket masuk dan retribusi"),
    f("bensin", "bensin", "Fuel", "Bahan bakar"),
  ],
};

export function rapikanKatalog(o: unknown): KatalogFasilitas {
  const k = (o ?? {}) as Record<string, unknown>;
  const hasil = {} as KatalogFasilitas;
  for (const j of JENIS_FASILITAS) {
    const v = k[j];
    if (!Array.isArray(v)) { hasil[j] = KATALOG_BAWAAN[j]; continue; }
    const daftar: Fasilitas[] = [];
    for (const x of v.slice(0, 60)) {
      const r = (x ?? {}) as Record<string, unknown>;
      const t = (a: unknown, n: number) => (typeof a === "string" ? a.trim().slice(0, n) : "");
      const en = t(r.en, 80), id = t(r.id, 80);
      const kunci = t(r.kunci, 40).toLowerCase().replace(/[^a-z0-9-]/g, "") || `f-${daftar.length + 1}`;
      if ((en || id) && !daftar.some((d) => d.kunci === kunci)) daftar.push({ kunci, ikon: IKON_FASILITAS[t(r.ikon, 20)] ? t(r.ikon, 20) : "centang", en: en || id, id: id || en });
    }
    hasil[j] = daftar;
  }
  return hasil;
}

/** Cari fasilitas katalog untuk satu label kamar (cocok dengan label Inggris atau Indonesia). */
export const cariLabel = (katalog: Fasilitas[], label: string) => {
  const l = label.trim().toLowerCase();
  return katalog.find((x) => x.en.toLowerCase() === l || x.id.toLowerCase() === l);
};
