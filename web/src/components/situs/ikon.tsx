/** Ikon garis tipis untuk situs publik. */
const JALUR: Record<string, string> = {
  selam: "M4 9h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4h-1.5l-1.5-2.5h-4L8.5 17H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1zM8 9V7a4 4 0 0 1 8 0v2",
  rumah: "M3 11 12 4l9 7M5 10v10h14V10M9.5 20v-5h5v5M3 20h18",
  tenang: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5zM16 4v3M14.5 5.5h3",
  orang: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M17 11a2.5 2.5 0 1 0 0-5M21 20a5 5 0 0 0-4-4.9",
  perahu: "M3 15h18l-2.5 4h-13zM12 15V4l6 8h-6M3 21c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1",
  lampu: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z",
  daun: "M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19l7-7",
  bintang: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
  sertifikat: "M5 4h14v11H5zM8 8h8M8 11h5M10 15l-1 5 3-1.5 3 1.5-1-5",
  gelembung: "M9 20a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  snorkel: "M3 10h11v3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM17 4v11a4 4 0 0 1-4 4h-2",
  panah: "M5 12h14M13 6l6 6-6 6",
  wa: "M4 20l1.3-4A8 8 0 1 1 8 18.7zM9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z",
  ig: "M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17 7h.01",
  surat: "M3 6h18v12H3zM3 7l9 6 9-6",
};

export function Ikon({ nama, className = "size-6" }: { nama: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={JALUR[nama] ?? JALUR.bintang} />
    </svg>
  );
}

/** Ikon untuk program selam, ditebak dari namanya. */
export function ikonProgram(judul: string, i: number) {
  const j = judul.toLowerCase();
  if (j.includes("snorkel")) return "snorkel";
  if (j.includes("kursus") || j.includes("open water") || j.includes("sertif")) return "sertifikat";
  if (j.includes("discover") || j.includes("pertama")) return "gelembung";
  if (j.includes("fun") || j.includes("selam")) return "selam";
  return ["selam", "sertifikat", "gelembung", "snorkel", "perahu"][i % 5];
}
