/**
 * Kisah nama Bakoeria (permintaan pemilik, November 2026): nama nenek pemilik tanah resort,
 * yang di pulau ini menemukan hidayah dan jalan kebenaran; pemilik dulu sering diajak
 * berkebun di tanah ini dan mengabadikan namanya. Teks About lama diganti sekali di isi
 * tersimpan, hanya bila masih sama dengan teks bawaan lama.
 */
export const VERSI_KISAH = "kisah-bakoeria-2026-11-26";

export const TENTANG_BARU = {
  id: {
    introJudul: "Tempat menenangkan pikiran",
    introIsi: "Empat cottage di antara laut jernih dan hutan yang masih alami, tempat beristirahat dari pekerjaan dan ramainya kota.",
    pernyataan: "Sebuah nama yang kami jaga, di antara *laut jernih*, *hutan yang alami*, dan *ketenangan* yang memulihkan",
    kisahJudul: "Kisah di balik nama Bakoeria",
    kisahIsi: [
      "Bakoeria adalah nama nenek dari pemilik tanah tempat resort ini berdiri. Di pulau inilah beliau menemukan hidayahnya dan memilih jalan kebenaran yang ia jalani seumur hidup.",
      "Semasa kecil, pemilik resort sering diajak sang nenek berkebun di tanah ini. Kenangan itu kini ia abadikan: nama sang nenek menjadi nama resort yang berdiri di antara laut jernih yang terjaga dan hutan yang masih alami.",
      "Bakoeria memadukan alam dan kenyamanan modern dalam satu konsep. Untuk permulaan ada empat cottage, dua dengan kasur double dan dua dengan dua kasur single.",
      "Pemilik ingin tempat ini menjadi ruang untuk menenangkan dan mendetoks pikiran, jauh dari pekerjaan sehari-hari dan ramainya kota.",
    ].join("\n\n"),
  },
  en: {
    introJudul: "A place to clear your mind",
    introIsi: "Four cottages between clear water and untouched forest, a place to rest from work and the noise of the city.",
    pernyataan: "A name we keep, between *clear water*, *untouched forest*, and a *quiet* that restores",
    kisahJudul: "The story behind the name",
    kisahIsi: [
      "Bakoeria was the name of the grandmother of the owner of the land where the resort stands. It was on this island that she found her faith and chose the path of truth she followed for the rest of her life.",
      "As a child, the resort's owner often joined her to tend her garden on this land. That memory lives on: her name is now the name of the resort, standing between protected clear water and forest that is still untouched.",
      "Bakoeria brings nature and modern comfort together in one place. To begin with there are four cottages, two with a double bed and two with twin single beds.",
      "The owner wants this to be a place to calm and detox the mind, far from daily work and the noise of the city.",
    ].join("\n\n"),
  },
} as const;

/** Teks About bawaan lama (termasuk versi sebelum kayu besi), diganti bila belum diubah pemilik. */
export const TENTANG_LAMA: Record<"id" | "en", Partial<Record<"introJudul" | "introIsi" | "pernyataan", string[]>>> = {
  id: {
    introJudul: ["Tempat laut menjadi rumah"],
    introIsi: [
      "Bakoeria Dive Resort adalah resor selam butik yang tenang dan personal. Siang hari Anda ada di bawah air bersama pemandu yang mengenal lokasinya. Malam hari Anda pulang ke cottage kayu besi, dengan lampu gantung hangat dan pasir di bawah kaki.",
      "Bakoeria Dive Resort adalah resor selam butik yang tenang dan personal. Siang hari Anda ada di bawah air bersama pemandu yang mengenal lokasinya. Malam hari Anda pulang ke cottage kayu jati, dengan lampu gantung hangat dan pasir di bawah kaki.",
    ],
    pernyataan: ["Kami merancang tempat menyelam dan beristirahat, di mana *laut*, *kayu besi*, dan *kehangatan tim* berjalan dalam keseimbangan", "Kami merancang tempat menyelam dan beristirahat, di mana *laut*, *kayu jati*, dan *kehangatan tim* berjalan dalam keseimbangan"],
  },
  en: {
    introJudul: ["Where the sea feels like home"],
    introIsi: [
      "Bakoeria Dive Resort is a small, quiet dive resort. By day you are underwater with guides who know these sites well. By night you come home to an ironwood cottage, with warm hanging lights and sand under your feet.",
      "Bakoeria Dive Resort is a small, quiet dive resort. By day you are underwater with guides who know these sites well. By night you come home to a teak cottage, with warm hanging lights and sand under your feet.",
    ],
    pernyataan: ["We built a place to dive and to rest, where *the sea*, *ironwood*, and *a warm team* are in balance", "We built a place to dive and to rest, where *the sea*, *teak wood*, and *a warm team* are in balance"],
  },
};
