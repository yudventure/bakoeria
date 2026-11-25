import { seragamkanHarga } from "./rupiah-teks";
import { GRUP_SELAM_EN, GRUP_SELAM_ID } from "./harga-selam";
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
/** Satu kelompok daftar harga selam (misalnya Fun dive), dengan baris nama, keterangan, dan harga. */
export interface PaketGrup {
  judul: string;
  catatan: string;
  /** `untuk`: siapa yang ditawari baris ini di formulir pesan (lihat lib/selam.ts); kosong = ditebak. */
  isi: { nama: string; ket: string; harga: string; untuk?: string }[];
  /** Kunci fasilitas selam yang termasuk (katalog "selam"); sama untuk kedua bahasa. */
  termasuk?: string[];
}
export interface Konten {
  tagline: string;
  /** Awalan baris kata berganti di hero, misalnya "Here for". */
  heroAwalan: string;
  /** Kata atau frasa yang bergantian di hero. */
  heroKata: string[];
  introJudul: string;
  introIsi: string;
  programCatatan: string;
  program: Program[];
  /** Rincian harga dan paket dive trip. */
  paketJudul: string;
  paketCatatan: string;
  paket: PaketGrup[];
  /** Cara menuju resort: langkah pertama (terbang ke Sorong), lalu dua jalur alternatif A dan B. */
  caraJudul: string;
  caraIsi: string;
  cara: { judul: string; isi: string; /** Waktu tempuh, misalnya "± 2 jam". */ waktu: string }[];
  /** Waktu tempuh di peta untuk feri Sorong ke Waisai dan perahu Waisai ke resort. */
  caraWaktuFeri: string;
  caraWaktuPerahu: string;
  caraCatatan: string;
  /** Perahu antar-jemput yang bisa dipilih tamu (bayar terpisah), tampil sebagai kartu di bagian Cara menuju ke sini. */
  perahuJudul: string;
  perahuIsi: string;
  perahu: { judul: string; mesin: string; /** Muatan, misalnya "Maksimal 12 orang". */ muat: string; isi: string; harga: { rute: string; /** Harga pulang pergi. */ harga: string; /** Harga sekali jalan; kosong berarti tidak ditawarkan. */ sekali: string }[] }[];
  /** Aktivitas lain di luar selam (tiga yang pertama tampil bersama video). */
  aktivitasJudul: string;
  aktivitasIsi: string;
  aktivitas: { judul: string; isi: string; /** Kunci fasilitas trip yang termasuk (katalog "trip"); sama untuk kedua bahasa. */ termasuk?: string[] }[];
  cottageJudul: string;
  cottageIsi: string;
  cottageFitur: string[];
  jadwal: Jadwal[];
  galeriJudul: string;
  tanya: Tanya[];
  pesanIsi: string;
  kontak: { whatsapp: string; email: string; instagram: string; alamat: string; /** Titik resort di peta, "lintang, bujur" (disalin dari Google Maps). */ peta: string; facebook: string; tiktok: string; youtube: string; /** Tautan video YouTube untuk bagian Menginap (diputar otomatis, berulang, tanpa suara). */ video: string; /** Tautan video YouTube (sebaiknya tegak/Shorts) untuk tiga aktivitas pertama. */ aktivitasVideo: string[] };
  /** Paragraf pendek di kolom pertama footer. */
  footerTentang: string;
  pengumuman: string;
  tutup: boolean;
  /** Tiga angka di kanan hero. */
  sorotan: Sorotan[];
  /** Kalimat besar di bagian Tentang. Kata di antara *bintang* diberi warna emas. */
  pernyataan: string;
  keunggulanJudul: string;
  keunggulan: Keunggulan[];
  /** Saklar tiap seksi halaman depan (berlaku untuk kedua bahasa). false = seksi disembunyikan. */
  seksi: Record<SeksiId, boolean>;
}

/** Seksi halaman depan yang bisa dimatikan dari menu Website. Pembuka (hero) selalu tampil. */
export const SEKSI = [
  { id: "tentang", label: "Tentang kami", ket: "Kalimat besar, tiga foto, dan paragraf pembuka." },
  { id: "keunggulan", label: "Keunggulan", ket: "Panel foto pohon kelapa dengan kartu keunggulan." },
  { id: "menginap", label: "Menginap", ket: "Video, sorotan cottage, dan galeri kamar." },
  { id: "menyelam", label: "Program selam", ket: "Kartu dive program dengan daftar harga." },
  { id: "aktivitas", label: "Aktivitas lain", ket: "Bird watching, kayaking, island trip: video dan galeri." },
  { id: "sehari", label: "Sehari di Bakoeria", ket: "Jadwal harian." },
  { id: "lokasi", label: "Cara menuju ke sini", ket: "Peta rute dan dua jalur alternatif." },
  { id: "tanya", label: "Tanya jawab", ket: "Daftar pertanyaan yang sering diajukan." },
  { id: "pesan", label: "Pemesanan", ket: "Formulir pesan. Bila dimatikan, tombol pesan mengarah ke WhatsApp." },
] as const;
export type SeksiId = (typeof SEKSI)[number]["id"];
export const SEKSI_AKTIF = Object.fromEntries(SEKSI.map((x) => [x.id, true])) as Record<SeksiId, boolean>;

export const IKON_KEUNGGULAN = ["selam", "rumah", "tenang", "orang", "perahu", "lampu", "daun", "bintang"] as const;

export const KONTEN_BAWAAN: Konten = {
  tagline: "Menyelam siang, bermalam di bawah bintang.",
  heroAwalan: "Datang untuk",
  heroKata: ["menyelam di karang", "cottage kayu besi", "kelompok kecil", "malam berbintang"],
  introJudul: "Tempat laut menjadi rumah",
  introIsi:
    "Bakoeria Dive Resort adalah resor selam butik yang tenang dan personal. Siang hari Anda ada di bawah air bersama pemandu yang mengenal lokasinya. Malam hari Anda pulang ke cottage kayu besi, dengan lampu gantung hangat dan pasir di bawah kaki.",
  programCatatan: "Jadwal dan tarif disesuaikan dengan kondisi laut dan kemampuan tamu.",
  program: [
    { judul: "Fun Dive", isi: "Untuk penyelam bersertifikat. Briefing singkat, dua penyelaman per hari, dipandu dive master yang memahami titik selam setempat.", meta: "Bersertifikat · 2 selam per hari", harga: "Rp 2.100.000 per penyelam" },
    { judul: "Kursus Open Water", isi: "Belajar menyelam dari awal dengan kelompok kecil, tempo yang tenang, dan perhatian penuh pada keselamatan.", meta: "Pemula · kelompok kecil", harga: "Rp 7.500.000 per orang" },
    { judul: "Discover Scuba", isi: "Rasakan menyelam pertama Anda di perairan dangkal, tanpa perlu sertifikat, ditemani instruktur satu per satu.", meta: "Tanpa sertifikat · setengah hari", harga: "Rp 1.200.000 per orang" },
    { judul: "Snorkeling", isi: "Untuk keluarga dan tamu yang menunggu di permukaan. Peralatan tersedia dan pemandu ikut di air.", meta: "Semua usia · peralatan tersedia", harga: "" },
  ],
  caraJudul: "Cara menuju ke sini",
  caraIsi: "Bakoeria berada di ujung timur Pulau Gam, Raja Ampat, di seberang Waisai. Terbang ke Sorong, lalu pilih satu dari dua jalur: speedboat privat langsung ke resort, atau feri ke Waisai dan lanjut dengan perahu kami.",
  cara: [{"judul": "Terbang ke Sorong", "isi": "Tiba di Bandara Domine Eduard Osok (SOQ). Dari sini ada dua pilihan jalur ke resort.", "waktu": ""}, {"judul": "Speedboat privat langsung dari Sorong", "isi": "Layanan antar jemput privat kami. Tim menjemput Anda di Sorong dan speedboat membawa Anda langsung ke resort, tanpa pindah kapal.", "waktu": "± 1,5 jam"}, {"judul": "Feri ke Waisai, lalu perahu resort", "isi": "Naik feri Sorong ke Waisai melintasi Selat Dampier, lalu tim kami menjemput di pelabuhan Waisai untuk perjalanan perahu ke resort.", "waktu": "± 2,5 jam"}],
  caraWaktuFeri: "± 2 jam",
  caraWaktuPerahu: "± 30 menit",
  caraCatatan: "Jadwal feri dan waktu perjalanan bisa berubah mengikuti cuaca dan operasional setempat. Speedboat privat perlu dipesan lebih dulu. Konfirmasikan rencana Anda dengan tim kami sebelum berangkat.",
  perahuJudul: "Perahu antar-jemput",
  perahuIsi: "Antar-jemput tidak termasuk harga kamar. Harga per perahu, pulang pergi atau sekali jalan. Kabari jam tiba Anda dan kami siapkan perahunya.",
  perahu: [
    { judul: "Longboat", mesin: "1 mesin 15 PK", muat: "Maksimal 5 orang", isi: "Longboat kayu kecil yang tenang, untuk menjemput di Waisai saat laut teduh.", harga: [{ rute: "Waisai", harga: "Rp 2.000.000", sekali: "" }] },
    { judul: "Speedboat", mesin: "2 mesin 150 PK", muat: "Maksimal 12 orang", isi: "Lebih cepat dan stabil. Menjemput di Waisai, atau langsung dari Sorong sekitar 1,5 jam.", harga: [{ rute: "Waisai", harga: "Rp 4.000.000", sekali: "" }, { rute: "Sorong", harga: "Rp 8.000.000", sekali: "" }] },
  ],
  aktivitasJudul: "Aktivitas lain",
  aktivitasIsi: "Hari di luar air juga bagian dari menginap. Tim kami mengaturnya mengikuti pasang surut, cuaca, dan rencana selam Anda.",
  aktivitas: [{"judul": "Mengamati burung", "isi": "Berjalan sebelum matahari terbit bersama pemandu lokal untuk mencari cenderawasih dan burung hutan lainnya."}, {"judul": "Kayak ke sungai di belakang resort", "isi": "Mendayung pelan menyusuri sungai di belakang resort, di antara pepohonan, dengan tempo Anda sendiri."}, {"judul": "Island trip", "isi": "Sehari naik perahu ke pulau-pulau di sekitar resort: laguna karst Piaynemo, Batanta, Kali Biru, dan tempat lain sesuai cuaca. Naik ke puncak pandang, berenang di air jernih, lalu makan siang di pantai yang sepi."}],
  paketJudul: "Harga dan paket dive trip",
  paketCatatan: "Harga dalam Rupiah dan bisa berubah. Semua harga diving belum termasuk perahu selam. Jadwal selam menyesuaikan cuaca dan kondisi laut.",
  paket: [
    ...GRUP_SELAM_ID,
    {
      "judul": "Trip snorkeling",
      "catatan": "Per perahu. Pemandu snorkeling Rp 200.000 per trip.",
      "isi": [
        {
          "nama": "Manta Point",
          "ket": "Sampai 6 orang",
          "harga": "Rp 2.000.000"
        },
        {
          "nama": "Dermaga Pulau Arborek",
          "ket": "Sampai 6 orang",
          "harga": "Rp 1.600.000"
        },
        {
          "nama": "Pulau Friwen atau Mioskun",
          "ket": "Sampai 6 orang",
          "harga": "Rp 1.200.000"
        },
        {
          "nama": "Dermaga Sawandarek",
          "ket": "Sampai 6 orang",
          "harga": "Rp 1.000.000"
        },
        {
          "nama": "Pasir Timbul",
          "ket": "Sampai 4 orang",
          "harga": "Rp 500.000"
        }
      ]
    },
    {
      "judul": "Trip pulau",
      "catatan": "Per perahu, sampai 6 orang.",
      "isi": [
        {
          "nama": "Piaynemo",
          "ket": "Snorkeling dan titik pandang, termasuk lunch box",
          "harga": "Rp 7.000.000"
        },
        {
          "nama": "Snorkeling dan air terjun Batanta",
          "ket": "Termasuk lunch box",
          "harga": "Rp 7.000.000"
        },
        {
          "nama": "Celah Kabuy dan celah Citrus",
          "ket": "Termasuk lunch box",
          "harga": "Rp 7.000.000"
        },
        {
          "nama": "Mengamati burung",
          "ket": "Belum termasuk tiket masuk Rp 250.000 per orang",
          "harga": "Rp 1.800.000"
        },
        {
          "nama": "Trip memancing, 3 sampai 4 jam",
          "ket": "Di sekitar resort",
          "harga": "Rp 1.500.000"
        }
      ]
    }
  ],
  cottageJudul: "Cottage kayu besi",
  cottageIsi: "Rumah panggung berdinding kayu besi berkualitas dengan teras menghadap taman kelapa. Dibangun dari bahan lokal, dirancang untuk angin laut mengalir.",
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
    { t: "Bagaimana cara memesan?", j: "Pilih tanggal, jumlah tamu, dan cottage di formulir pemesanan, lalu isi nama dan nomor WhatsApp. Cottage langsung kami tahan untuk Anda, dan tim kami membalas lewat WhatsApp atau email dengan konfirmasi dan cara membayar uang muka. Mau bertanya dulu? Tekan tombol WhatsApp di bagian kontak." },
    { t: "Apakah harga kamar sudah termasuk makan?", j: "Ya. Harga per malam sudah termasuk makan tiga kali sehari, dan tamu yang menginap bebas memakai kayak dan alat snorkel. Yang dibayar terpisah adalah selam dan trip pulau, antar-jemput dari Sorong, serta retribusi wisata Raja Ampat yang dibayar ke pemerintah daerah." },
    { t: "Bagaimana dengan anak-anak?", j: "Anak di bawah 5 tahun gratis dan tidur bersama orang tua. Anak 5 tahun ke atas membayar 50% dari harga kamar per malam dan mendapat extra bed. Harga anak langsung terhitung di formulir pemesanan." },
    { t: "Bagaimana cara sampai ke Bakoeria?", j: "Terbang ke Sorong. Dari Sorong ada dua pilihan: speedboat privat kami langsung ke resort sekitar 1,5 jam, atau kapal cepat umum ke Waisai sekitar 2 jam lalu dijemput perahu resort. Kabari jam mendarat Anda dan kami atur penjemputannya. Rutenya ada di bagian Cara menuju ke sini." },
    { t: "Retribusi wisata itu apa, dan berapa?", j: "Kabupaten Raja Ampat memungut retribusi wisata dari setiap pengunjung menurut Peraturan Bupati Nomor 34 Tahun 2025: wisatawan mancanegara Rp 1.000.000 per orang dan WNI Rp 300.000, anak di bawah 12 tahun gratis. Daftar dan bayar online di sipari-rajaampat.id sebelum tiba, lalu simpan e-tiket QR di ponsel. Retribusi dibayar langsung ke pemerintah daerah, bukan ke resort." },
    { t: "Apakah saya perlu sertifikat selam?", j: "Tidak untuk Discover Scuba dan snorkeling. Fun dive memerlukan sertifikat dasar seperti Open Water. Jika belum punya, Anda bisa mengambil kursus di sini bersama pemandu kami." },
    { t: "Ada kegiatan untuk yang tidak menyelam?", j: "Ada. Kayak dan alat snorkel gratis untuk tamu yang menginap, dan terumbu di depan resort bisa dinikmati langsung dari pantai. Kami juga mengatur pengamatan burung cenderawasih pagi hari dan island trip ke Piaynemo, Batanta, Kali Biru, dan pulau lainnya." },
    { t: "Bagaimana kalau cuaca buruk?", j: "Keselamatan lebih dulu. Selam, trip pulau, dan antar-jemput laut ditunda bila gelombang terlalu tinggi, dan kami mencarikan jadwal pengganti selama Anda menginap." },
    { t: "Kapan waktu terbaik datang?", j: "Oktober sampai April laut umumnya paling tenang dan air paling jernih. Desember sampai Maret peluang bertemu manta paling tinggi. Juni sampai Agustus angin tenggara membuat gelombang lebih tinggi sehingga trip laut lebih sering ditunda, tapi suasananya lebih sepi." },
    { t: "Apa yang perlu saya bawa?", j: "Pakaian ringan, tabir surya ramah karang, obat pribadi, dan logbook bila ada. Bawa juga uang tunai secukupnya dari Sorong atau Waisai: di kampung tidak ada ATM dan pembayaran nontunai belum tentu bisa. Peralatan selam bisa disewa di resort." },
  ],
  pesanIsi: "Pilih tanggal dan cottage. Kami membalas dengan konfirmasi dan cara pembayaran.",
  kontak: { whatsapp: "+62 800 0000 0000", email: "halo@bakoeria.example", instagram: "", alamat: "", peta: "", facebook: "", tiktok: "", youtube: "", video: "", aktivitasVideo: ["", "", ""] },
  footerTentang: "Resor selam butik dengan cottage kayu besi di tepi pantai. Menyelam siang bersama pemandu yang mengenal lautnya, bermalam di bawah langit penuh bintang.",
  pengumuman: "",
  tutup: false,
  sorotan: [
    { nilai: "", label: "cottage kayu besi" },
    { nilai: "", label: "program selam" },
    { nilai: "2", label: "selam per hari" },
  ],
  pernyataan: "Kami merancang tempat menyelam dan beristirahat, di mana *laut*, *kayu besi*, dan *kehangatan tim* berjalan dalam keseimbangan",
  keunggulanJudul: "Kenapa memilih Bakoeria",
  keunggulan: [
    { ikon: "selam", judul: "Pemandu yang mengenal laut", isi: "Dive master yang hafal titik selam, arus, dan musimnya." },
    { ikon: "rumah", judul: "Cottage kayu besi", isi: "Rumah panggung dari bahan lokal, dirancang untuk angin laut." },
    { ikon: "tenang", judul: "Tenang dan pribadi", isi: "Sedikit cottage, kelompok selam kecil, malam yang sunyi." },
    { ikon: "orang", judul: "Untuk semua tingkat", isi: "Dari selam pertama sampai penyelam berpengalaman." },
  ],
  seksi: SEKSI_AKTIF,
};

/** Isi bawaan bahasa Inggris (bahasa bawaan situs). Kontak sama dengan versi Indonesia. */
export const KONTEN_BAWAAN_EN: Konten = {
  ...KONTEN_BAWAAN,
  tagline: "Dive by day, sleep under the stars.",
  heroAwalan: "Here for",
  heroKata: ["reef dives", "ironwood cottages", "small groups", "starry nights"],
  introJudul: "Where the sea feels like home",
  introIsi:
    "Bakoeria Dive Resort is a small, quiet dive resort. By day you are underwater with guides who know these sites well. By night you come home to an ironwood cottage, with warm hanging lights and sand under your feet.",
  programCatatan: "Schedules and prices follow sea conditions and each guest's experience.",
  program: [
    { judul: "Fun Dive", isi: "For certified divers. A short briefing and two dives a day, led by a dive master who knows the local sites.", meta: "Certified · 2 dives a day", harga: "Rp 2.100.000 per diver" },
    { judul: "Open Water Course", isi: "Learn to dive from the start in a small group, at a calm pace, with full attention on safety.", meta: "Beginners · small groups", harga: "Rp 7.500.000 per person" },
    { judul: "Discover Scuba", isi: "Try your first dive in shallow water, no certificate needed, one to one with an instructor.", meta: "No certificate · half day", harga: "Rp 1.200.000 per person" },
    { judul: "Snorkelling", isi: "For families and anyone staying on the surface. Gear provided and a guide in the water with you.", meta: "All ages · gear provided", harga: "" },
  ],
  caraJudul: "How to get here",
  caraIsi: "Bakoeria is on the eastern tip of Gam Island, Raja Ampat, across the water from Waisai. Fly to Sorong, then choose one of two routes: a private speedboat straight to the resort, or the ferry to Waisai and our boat from there.",
  cara: [{"judul": "Fly to Sorong", "isi": "Arrive at Domine Eduard Osok Airport (SOQ). From here there are two ways to reach the resort.", "waktu": ""}, {"judul": "Private speedboat direct from Sorong", "isi": "Our private transfer service. The team meets you in Sorong and the speedboat takes you straight to the resort, with no change of boat.", "waktu": "± 1.5 hours"}, {"judul": "Ferry to Waisai, then the resort boat", "isi": "Take the Sorong to Waisai ferry across the Dampier Strait, then our team meets you at Waisai harbour for the boat ride to the resort.", "waktu": "± 2.5 hours"}],
  caraWaktuFeri: "± 2 hours",
  caraWaktuPerahu: "± 30 min",
  caraCatatan: "Ferry schedules and travel times change with weather and local operations. The private speedboat must be booked in advance. Confirm your plans with our team before travelling.",
  perahuJudul: "Boat transfers",
  perahuIsi: "Transfers are not included in the room rate. Prices are per boat, return or one way. Send us your arrival time and we get the boat ready.",
  perahu: [
    { judul: "Longboat", mesin: "One 15 HP engine", muat: "Up to 5 people", isi: "A small, quiet wooden longboat for pick-ups in Waisai when the sea is calm.", harga: [{ rute: "Waisai", harga: "Rp 2.000.000", sekali: "" }] },
    { judul: "Speedboat", mesin: "Twin 150 HP engines", muat: "Up to 12 people", isi: "Faster and more stable. Picks you up in Waisai, or straight from Sorong in about 1.5 hours.", harga: [{ rute: "Waisai", harga: "Rp 4.000.000", sekali: "" }, { rute: "Sorong", harga: "Rp 8.000.000", sekali: "" }] },
  ],
  aktivitasJudul: "Other activities",
  aktivitasIsi: "Days out of the water are part of the stay. Our team arranges these around the tides, the weather, and your dive plan.",
  aktivitas: [{"judul": "Bird watching", "isi": "Walk out before sunrise with a local guide to look for birds of paradise and other forest birds."}, {"judul": "Kayaking the river behind the resort", "isi": "Paddle quietly up the river at the back of the resort, through the trees, at your own pace."}, {"judul": "Island trips", "isi": "A day by boat to the islands around the resort: the karst lagoons of Piaynemo, Batanta, Kali Biru, and more, depending on the weather. Climb to a viewpoint, swim in clear water, and have lunch on a quiet beach."}],
  paketJudul: "Prices and dive trip packages",
  paketCatatan: "Prices in Indonesian Rupiah and may change. All dive prices exclude the dive boat. Dive plans follow the weather and sea conditions.",
  paket: [
    ...GRUP_SELAM_EN,
    {
      "judul": "Snorkelling trips",
      "catatan": "Per boat. Snorkelling guide Rp 200.000 per trip.",
      "isi": [
        {
          "nama": "Manta Point",
          "ket": "Up to 6 people",
          "harga": "Rp 2.000.000"
        },
        {
          "nama": "Arborek Island jetty",
          "ket": "Up to 6 people",
          "harga": "Rp 1.600.000"
        },
        {
          "nama": "Friwen or Mioskun Island",
          "ket": "Up to 6 people",
          "harga": "Rp 1.200.000"
        },
        {
          "nama": "Sawandarek jetty",
          "ket": "Up to 6 people",
          "harga": "Rp 1.000.000"
        },
        {
          "nama": "Sand bank",
          "ket": "Up to 4 people",
          "harga": "Rp 500.000"
        }
      ]
    },
    {
      "judul": "Island trips",
      "catatan": "Per boat, up to 6 people.",
      "isi": [
        {
          "nama": "Piaynemo",
          "ket": "Snorkelling and viewpoint, lunch box included",
          "harga": "Rp 7.000.000"
        },
        {
          "nama": "Batanta snorkelling and waterfall",
          "ket": "Lunch box included",
          "harga": "Rp 7.000.000"
        },
        {
          "nama": "Kabuy passage and Citrus passage",
          "ket": "Lunch box included",
          "harga": "Rp 7.000.000"
        },
        {
          "nama": "Bird watching",
          "ket": "Entrance fee Rp 250.000 per person not included",
          "harga": "Rp 1.800.000"
        },
        {
          "nama": "Fishing trip, 3 to 4 hours",
          "ket": "Near the resort",
          "harga": "Rp 1.500.000"
        }
      ]
    }
  ],
  cottageJudul: "Ironwood cottages",
  cottageIsi: "Stilt houses with walls of quality ironwood and a terrace facing the coconut garden. Built from local materials and designed to let the sea breeze through.",
  cottageFitur: ["Private terrace with chairs and warm lights", "Bed with mosquito net and en-suite bathroom", "Rinse area and storage for dive gear", "A few steps to the beach and jetty"],
  jadwal: [
    { jam: "06.30", judul: "Breakfast", isi: "Coffee, fruit, and a warm breakfast on the dining terrace." },
    { jam: "07.30", judul: "Dive briefing", isi: "Dive plan and gear check at the jetty." },
    { jam: "08.30", judul: "Morning dive", isi: "Out by boat, back for a surface interval." },
    { jam: "13.00", judul: "Lunch", isi: "Hammocks, a rinse, and time for your logbook." },
    { jam: "15.00", judul: "Afternoon dive or snorkel", isi: "Low light that brings out the reef's colours." },
    { jam: "19.00", judul: "Dinner", isi: "Under the hanging lights, with a sky full of stars." },
  ],
  galeriJudul: "Warm light in the dark",
  tanya: [
    { t: "How do I book?", j: "Choose your dates, guests, and cottage in the booking form, then add your name and WhatsApp number. We hold the cottage for you straight away, and our team replies on WhatsApp or by email with a confirmation and how to pay the deposit. Want to ask first? Tap the WhatsApp button in the contact section." },
    { t: "Are meals included in the room rate?", j: "Yes. The nightly rate includes three meals a day, and staying guests can use our kayaks and snorkel gear for free. Paid separately are diving and island trips, transfers from Sorong, and the Raja Ampat tourism levy, which goes to the local government." },
    { t: "What about children?", j: "Children under 5 stay free and sleep with their parents. Children 5 and over pay 50% of the room rate per night and get an extra bed. The booking form adds this for you." },
    { t: "How do I get to Bakoeria?", j: "Fly to Sorong. From there you have two options: our private speedboat straight to the resort in about 1.5 hours, or the public fast ferry to Waisai in about 2 hours, where our boat picks you up. Send us your landing time and we arrange the transfer. The route is in the How to get here section." },
    { t: "What is the tourism levy, and how much is it?", j: "Raja Ampat Regency charges every visitor a tourism levy under Regent Regulation 34 of 2025: Rp 1,000,000 per person for foreign visitors and Rp 300,000 for Indonesian citizens, free for children under 12. Register and pay online at sipari-rajaampat.id before you arrive, then keep the QR e-ticket on your phone. The levy is paid to the local government, not to the resort." },
    { t: "Do I need a dive certificate?", j: "Not for Discover Scuba or snorkelling. Fun dives need a basic certificate such as Open Water. If you don't have one yet, you can take the course here with our guides." },
    { t: "Is there anything to do if I don't dive?", j: "Plenty. Kayaks and snorkel gear are free for staying guests, and the reef in front of the resort is right off the beach. We also arrange early-morning bird of paradise walks and island trips to Piaynemo, Batanta, Kali Biru, and more." },
    { t: "What if the weather turns?", j: "Safety comes first. Dives, island trips, and sea transfers are postponed when the swell is too high, and we find another slot during your stay." },
    { t: "When is the best time to come?", j: "From October to April the sea is usually calmest and the water clearest. December to March gives the best chance of seeing manta rays. From June to August the southeast wind brings bigger waves, so sea trips are postponed more often, but it is quieter." },
    { t: "What should I bring?", j: "Light clothing, reef-safe sunscreen, personal medicine, and your logbook if you have one. Also bring enough cash from Sorong or Waisai: there are no ATMs in the villages and card payment may not work. Dive gear can be rented at the resort." },
  ],
  pesanIsi: "Choose your dates and cottage. We'll reply with a confirmation and payment details.",
  pernyataan: "We built a place to dive and to rest, where *the sea*, *ironwood*, and *a warm team* are in balance",
  keunggulanJudul: "Why Bakoeria",
  keunggulan: [
    { ikon: "selam", judul: "Guides who know the sea", isi: "Dive masters who know every site, current, and season." },
    { ikon: "rumah", judul: "Ironwood cottages", isi: "Stilt houses of local materials, built for the sea breeze." },
    { ikon: "tenang", judul: "Quiet and private", isi: "Few cottages, small dive groups, and silent nights." },
    { ikon: "orang", judul: "For every level", isi: "From a first dive to seasoned divers." },
  ],
  footerTentang: "A small dive resort with ironwood cottages by the beach. Dive by day with guides who know the sea, and sleep under a sky full of stars.",
  sorotan: [
    { nilai: "", label: "ironwood cottages" },
    { nilai: "", label: "dive programmes" },
    { nilai: "2", label: "dives a day" },
  ],
  seksi: SEKSI_AKTIF,
};

export const bawaanKonten = (b: "en" | "id") => (b === "en" ? KONTEN_BAWAAN_EN : KONTEN_BAWAAN);

/** Hanya tautan http(s) yang diterima untuk peta dan media sosial. */
const tautan = (v: unknown) => (typeof v === "string" && /^https?:\/\/\S+$/i.test(v.trim()) ? v.trim().slice(0, 300) : "");

const FAQ_LAMA = ["Apakah saya perlu sertifikat selam?|Apa yang perlu saya bawa?|Bagaimana cara memesan?", "Do I need a dive certificate?|What should I bring?|How do I book?"];
const kunciFasilitas = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 40)))].slice(0, 30) : []);

/** Gabungkan isi tersimpan dengan bawaan, supaya kolom baru tidak pernah kosong. */
export function rapikanKonten(o: Partial<Konten> | null | undefined, bahasa: "en" | "id" = "id"): Konten {
  const b = bawaanKonten(bahasa);
  const s = (v: unknown, d: string) => (typeof v === "string" ? v.slice(0, 4000) : d);
  const arr = <T,>(v: unknown, d: T[], f: (x: Record<string, unknown>) => T) => (Array.isArray(v) ? v.slice(0, 30).map((x) => f((x ?? {}) as Record<string, unknown>)) : d);
  const k = (o ?? {}) as Record<string, unknown>;
  const kontak = (k.kontak ?? {}) as Record<string, unknown>;
  return {
    tagline: s(k.tagline, b.tagline),
    heroAwalan: s(k.heroAwalan, b.heroAwalan).slice(0, 40),
    heroKata: Array.isArray(k.heroKata) ? k.heroKata.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim().slice(0, 40)).slice(0, 8) : b.heroKata,
    introJudul: s(k.introJudul, b.introJudul),
    introIsi: s(k.introIsi, b.introIsi),
    programCatatan: s(k.programCatatan, b.programCatatan),
    program: arr(k.program, b.program, (x) => ({ judul: s(x.judul, ""), isi: s(x.isi, ""), meta: s(x.meta, ""), harga: seragamkanHarga(s(x.harga, "")) })),
    caraJudul: s(k.caraJudul, b.caraJudul),
    caraIsi: s(k.caraIsi, b.caraIsi),
    /* Jalur A (speedboat privat) 1,5 jam menurut pemilik; perkiraan awal "± 2 jam" yang mungkin sudah tersimpan ikut dibetulkan. */
    cara: arr(k.cara, b.cara, (x) => ({ judul: s(x.judul, "").slice(0, 80), isi: s(x.isi, "").slice(0, 400), waktu: s(x.waktu, "").slice(0, 40) })).map((x, i) => (i === 1 && (x.waktu === "± 2 jam" || x.waktu === "± 2 hours") ? { ...x, waktu: b.cara[1]?.waktu ?? x.waktu } : x)).filter((x) => x.judul.trim() !== "").slice(0, 4),
    caraCatatan: s(k.caraCatatan, b.caraCatatan),
    perahuJudul: s(k.perahuJudul, b.perahuJudul).slice(0, 80),
    perahuIsi: s(k.perahuIsi, b.perahuIsi).replace("Harga per perahu, pulang pergi. ", "Harga per perahu, pulang pergi atau sekali jalan. ").replace("Prices are per boat, return trip. ", "Prices are per boat, return or one way. ").slice(0, 400),
    perahu: arr(k.perahu, b.perahu, (x) => ({
      judul: s(x.judul, "").slice(0, 60),
      mesin: s(x.mesin, "").slice(0, 60),
      /* Muatan ditambahkan kemudian: perahu tersimpan tanpa muatan mengambil muatan bawaan perahu yang namanya sama. */
      muat: s(x.muat, b.perahu.find((d) => d.judul.toLowerCase() === String(x.judul ?? "").trim().toLowerCase())?.muat ?? "").slice(0, 60),
      isi: s(x.isi, "").slice(0, 300),
      harga: (Array.isArray(x.harga) ? x.harga : []).slice(0, 6).map((y) => { const r = (y ?? {}) as Record<string, unknown>; /* Harga sekali jalan ditambahkan kemudian; "pulang pergi" kini tertulis di kartu, jadi dibuang dari nama rute lama. */ return { rute: s(r.rute, "").replace(/,\s*(pulang pergi|return)\s*$/i, "").slice(0, 80), harga: seragamkanHarga(s(r.harga, "")).slice(0, 40), sekali: seragamkanHarga(s(r.sekali, "")).slice(0, 40) }; }).filter((y) => y.rute.trim() || y.harga.trim() || y.sekali.trim()),
    })).filter((x) => x.judul.trim() !== "").slice(0, 4),
    caraWaktuFeri: s(k.caraWaktuFeri, b.caraWaktuFeri).slice(0, 40),
    caraWaktuPerahu: s(k.caraWaktuPerahu, b.caraWaktuPerahu).slice(0, 40),
    aktivitasJudul: s(k.aktivitasJudul, b.aktivitasJudul),
    aktivitasIsi: s(k.aktivitasIsi, b.aktivitasIsi),
    /* Aktivitas ketiga diganti pemilik: camping menjadi trip ke Piaynemo dan Wayag. Isian camping yang sudah tersimpan ikut diganti. */
    aktivitas: arr(k.aktivitas, b.aktivitas, (x) => ({ judul: s(x.judul, "").slice(0, 80), isi: s(x.isi, "").slice(0, 400), termasuk: kunciFasilitas(x.termasuk) })).map((x) => (["camping", "island trips to piaynemo and wayag", "trip ke piaynemo dan wayag"].includes(x.judul.trim().toLowerCase()) ? { ...b.aktivitas[2] } : x)).filter((x) => x.judul.trim() !== "").slice(0, 6),
    paketJudul: s(k.paketJudul, b.paketJudul),
    paketCatatan: s(k.paketCatatan, b.paketCatatan),
    paket: arr(k.paket, b.paket, (x) => ({
      judul: s(x.judul, "").slice(0, 80),
      catatan: s(x.catatan, "").slice(0, 300),
      termasuk: kunciFasilitas(x.termasuk),
      isi: (Array.isArray(x.isi) ? x.isi : []).slice(0, 30).map((y) => {
        const r = (y ?? {}) as Record<string, unknown>;
        return { nama: s(r.nama, "").slice(0, 120), ket: s(r.ket, "").slice(0, 200), harga: seragamkanHarga(s(r.harga, "")).slice(0, 40), untuk: ["sertifikat", "pemula", "kursus", "lain"].includes(String(r.untuk)) ? String(r.untuk) : "" };
      }).filter((y) => y.nama.trim() !== ""),
    })).filter((x) => x.judul.trim() !== "" || x.isi.length > 0),
    cottageJudul: s(k.cottageJudul, b.cottageJudul),
    cottageIsi: s(k.cottageIsi, b.cottageIsi),
    cottageFitur: Array.isArray(k.cottageFitur) ? k.cottageFitur.filter((x) => typeof x === "string").slice(0, 20) : b.cottageFitur,
    jadwal: arr(k.jadwal, b.jadwal, (x) => ({ jam: s(x.jam, ""), judul: s(x.judul, ""), isi: s(x.isi, "") })),
    galeriJudul: s(k.galeriJudul, b.galeriJudul),
    /* FAQ bawaan versi pertama (3 pertanyaan) diganti FAQ lengkap yang disesuaikan dari situs DAMPIER (November 2026). FAQ yang sudah diubah pemilik dibiarkan. */
    tanya: ((t) => (t.length === 3 && FAQ_LAMA.includes(t.map((x) => x.t).join("|")) ? b.tanya : t))(arr(k.tanya, b.tanya, (x) => ({ t: s(x.t, ""), j: s(x.j, "") }))),
    pesanIsi: s(k.pesanIsi, b.pesanIsi),
    kontak: {
      whatsapp: s(kontak.whatsapp, b.kontak.whatsapp),
      email: s(kontak.email, b.kontak.email),
      instagram: s(kontak.instagram, b.kontak.instagram),
      alamat: s(kontak.alamat, b.kontak.alamat),
      peta: rapikanTitik(kontak.peta),
      facebook: tautan(kontak.facebook),
      tiktok: tautan(kontak.tiktok),
      youtube: tautan(kontak.youtube),
      video: tautan(kontak.video),
      aktivitasVideo: [0, 1, 2].map((i) => tautan(Array.isArray(kontak.aktivitasVideo) ? kontak.aktivitasVideo[i] : "")),
    },
    footerTentang: s(k.footerTentang, b.footerTentang),
    pengumuman: s(k.pengumuman, b.pengumuman),
    tutup: typeof k.tutup === "boolean" ? k.tutup : b.tutup,
    sorotan: arr(k.sorotan, b.sorotan, (x) => ({ nilai: s(x.nilai, "").slice(0, 12), label: s(x.label, "").slice(0, 40) })).slice(0, 3),
    pernyataan: s(k.pernyataan, b.pernyataan),
    keunggulanJudul: s(k.keunggulanJudul, b.keunggulanJudul),
    keunggulan: arr(k.keunggulan, b.keunggulan, (x) => ({ ikon: (IKON_KEUNGGULAN as readonly string[]).includes(String(x.ikon)) ? String(x.ikon) : "bintang", judul: s(x.judul, ""), isi: s(x.isi, "") })).slice(0, 6),
    seksi: Object.fromEntries(SEKSI.map(({ id }) => { const v = ((k.seksi ?? {}) as Record<string, unknown>)[id]; return [id, typeof v === "boolean" ? v : true]; })) as Record<SeksiId, boolean>,
  };
}

/** Nomor WhatsApp menjadi angka saja untuk tautan wa.me (0812… menjadi 62812…). */
export const nomorWa = (s: string) => {
  const d = s.replace(/\D/g, "");
  return d.startsWith("0") ? "62" + d.slice(1) : d;
};

/**
 * Nomor telepon untuk dibaca dan dicatat pengunjung: "+62 851-8616-6922".
 * Nomor Indonesia (0… atau 62…) dikelompokkan dengan tanda hubung; nomor lain dibiarkan apa adanya.
 */
export function nomorTampil(s: string): string {
  const d = nomorWa(s);
  if (!d.startsWith("62") || d.length < 10 || d.length > 15) return s.trim();
  const n = d.slice(2);
  /* Kelompok menyesuaikan panjang supaya tidak ada sisa yang terlalu pendek. */
  const pola = ({ 8: [3, 3, 2], 9: [3, 3, 3], 10: [3, 3, 4], 11: [3, 4, 4], 12: [4, 4, 4] } as Record<number, number[]>)[n.length] ?? [4, 4, n.length - 8];
  const a = n.slice(0, pola[0]), b = n.slice(pola[0], pola[0] + pola[1]), c = n.slice(pola[0] + pola[1]);
  return `+62 ${a}-${b}-${c}`;
}

/** Tautan profil Instagram dari "@nama", "nama", atau alamat lengkap. Kosong berarti halaman awal Instagram. */
export const tautanInstagram = (v: string) => {
  const t = v.trim();
  if (!t) return "https://www.instagram.com/";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://instagram.com/${t.replace(/^@/, "")}`;
};

/** Video yang bisa diputar polos: YouTube (termasuk Shorts) atau TikTok. */
export type SumberVideo = { jenis: "youtube" | "tiktok"; id: string };
/** Id video TikTok dari tautan lengkap (…/video/123…, player/v1/123…, embed/v2/123…), atau "". Tautan pendek vt.tiktok.com diubah saat disimpan. */
export function idTiktok(tautan: string): string {
  const m = /tiktok\.com\/(?:@[^/]+\/video|player\/v1|embed(?:\/v2)?|v)\/(\d{8,25})/.exec(tautan.trim());
  return m ? m[1] : "";
}
export const tautanPendekTiktok = (t: string) => /^https?:\/\/(?:vm|vt)\.tiktok\.com\/\w+|^https?:\/\/(?:www\.)?tiktok\.com\/t\/\w+/i.test(t.trim());
export function sumberVideo(tautan: string): SumberVideo | null {
  const y = idYoutube(tautan);
  if (y) return { jenis: "youtube", id: y };
  const t = idTiktok(tautan);
  return t ? { jenis: "tiktok", id: t } : null;
}

/** Id video dari tautan YouTube (watch?v=, youtu.be/, shorts/, embed/, live/), atau "" bila bukan tautan YouTube. */
export function idYoutube(tautan: string): string {
  const m = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(tautan.trim());
  return m ? m[1] : "";
}

/** Titik resort di peta (lintang, bujur), dipakai peta "Cara menuju ke sini" dan tautan Google Maps. */
export const KOORDINAT = { lat: -0.460074, lon: 130.691116 } as const;
export type Titik = { lat: number; lon: number };
export const tautanPeta = (t: Titik = KOORDINAT) => `https://www.google.com/maps/search/?api=1&query=${t.lat},${t.lon}`;

/**
 * Baca titik koordinat dari apa pun yang disalin dari Google Maps:
 *  - angka desimal: "-0.460074, 130.691116" (klik kanan titik di Google Maps, klik angkanya)
 *  - derajat-menit-detik: 0°27'36.3"S 130°41'28.0"E
 *  - tautan panjang yang memuat koordinat (@lat,lon, !3d..!4d.., ?q=lat,lon).
 * Tautan pendek maps.app.goo.gl tidak memuat koordinat, jadi tidak bisa dibaca.
 */
export function bacaTitik(v: unknown): Titik | null {
  if (typeof v !== "string") return null;
  const s = decodeURIComponent(v.replace(/%(?![0-9a-f]{2})/gi, "%25")).trim();
  if (!s) return null;
  const sah = (a: number, b: number): Titik | null =>
    Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180 && !(a === 0 && b === 0) ? { lat: Math.round(a * 1e6) / 1e6, lon: Math.round(b * 1e6) / 1e6 } : null;
  const angka = "(-?\\d{1,3}(?:[.,]\\d+)?)";
  const n = (x: string) => Number(x.replace(",", "."));
  for (const r of [/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, /[?&](?:q|query|ll|destination|center)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/]) {
    const m = r.exec(s);
    if (m) return sah(Number(m[1]), Number(m[2]));
  }
  const dms = /(\d{1,3})\s*°\s*(\d{1,2})\s*['′’]\s*(\d{1,2}(?:[.,]\d+)?)\s*(?:["″”]|'')?\s*([NSUL])[\s,;]+(\d{1,3})\s*°\s*(\d{1,2})\s*['′’]\s*(\d{1,2}(?:[.,]\d+)?)\s*(?:["″”]|'')?\s*([EWTB])/i.exec(s);
  if (dms) {
    const derajat = (d: string, m: string, dt: string, arah: string) => (Number(d) + Number(m) / 60 + n(dt) / 3600) * (/[SWB]/i.test(arah) ? -1 : 1);
    return sah(derajat(dms[1], dms[2], dms[3], dms[4]), derajat(dms[5], dms[6], dms[7], dms[8]));
  }
  const des = new RegExp(`^\\(?\\s*${angka}\\s*[,;\\s]\\s*${angka}\\s*\\)?$`).exec(s.replace(/,\s+/, "; ").replace(/\s*;\s*/, ";"));
  if (des) return sah(n(des[1]), n(des[2]));
  return null;
}
/** Simpanan titik: "lintang, bujur", atau "" bila tidak terbaca (situs lalu memakai KOORDINAT). */
export const rapikanTitik = (v: unknown) => {
  const t = bacaTitik(v);
  return t ? `${t.lat}, ${t.lon}` : "";
};
/** Titik resort yang dipakai situs. */
export const titikResort = (k: Pick<Konten, "kontak">): Titik => bacaTitik(k.kontak.peta) ?? KOORDINAT;
