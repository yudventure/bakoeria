import { KOORDINAT } from "@/lib/konten";

/**
 * Peta rute bergambar (pola dari situs Fantasea): pesawat ke Sorong, lalu dua jalur:
 * A speedboat privat langsung ke resort, B feri ke Waisai dan perahu resort. Letak tiga titiknya dihitung dari koordinat sebenarnya;
 * bentuk daratannya ilustrasi, tidak berskala.
 */
const BATAS = { barat: 130.5, timur: 131.4, utara: -0.3, selatan: -0.93 };
const xy = (lat: number, lon: number): [number, number] => [
  Math.round(((lon - BATAS.barat) / (BATAS.timur - BATAS.barat)) * 800),
  Math.round(((BATAS.utara - lat) / (BATAS.utara - BATAS.selatan)) * 560),
];
const SORONG = xy(-0.89, 131.26);
const WAISAI = xy(-0.432, 130.822);
const RESORT = xy(KOORDINAT.lat, KOORDINAT.lon);

export default function PetaRute({ teks, id }: { teks: { judul: string; ket: string; selat: string; feri: string; perahu: string; speedboat: string }; id: string }) {
  const [sx, sy] = SORONG, [wx, wy] = WAISAI, [rx, ry] = RESORT;
  const pin = (x: number, y: number, n: string) => (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 15 C-34-23-27-49 0-49 C27-49 34-23 0 15Z" fill="#0F6490" stroke="#FFFFFF" strokeWidth="4" />
      <circle cy="-23" r="14" fill="#FFFFFF" />
      <text y="-18" textAnchor="middle" fontSize="16" fontWeight="700" fill="#133250">{n}</text>
    </g>
  );
  const tengah = [(sx + wx) / 2, (sy + wy) / 2];
  return (
    <figure className="m-0 overflow-hidden rounded-[1.4rem] bg-white ring-1 ring-malam/8">
      <svg viewBox="0 0 800 560" role="img" aria-labelledby={`${id}-j ${id}-k`} className="block h-auto w-full" style={{ fontFamily: "var(--font-sans)" }}>
        <title id={`${id}-j`}>{teks.judul}</title>
        <desc id={`${id}-k`}>{teks.ket}</desc>
        <defs><linearGradient id={`${id}-laut`} x2="0" y2="1"><stop stopColor="#EAF6F7" /><stop offset="1" stopColor="#BFE6EC" /></linearGradient></defs>
        <rect width="800" height="560" fill={`url(#${id}-laut)`} />
        {/* Waigeo di utara, daratan Papua di tenggara, pulau-pulau kecil di antaranya */}
        <path d="M0 0H800V54Q690 78 560 70T380 96T230 84T96 104L0 96Z" fill="#E9DFCD" stroke="#FFFFFF" strokeWidth="3" />
        <path d="M0 0H800V30Q660 50 520 42T330 62T150 54L0 66Z" fill="#F7F3EC" />
        <path d="M470 560Q540 505 640 492T800 420V560Z" fill="#E9DFCD" stroke="#FFFFFF" strokeWidth="3" />
        <g fill="#F7F3EC" stroke="#FFFFFF" strokeWidth="2"><ellipse cx="78" cy="196" rx="60" ry="26" /><ellipse cx="150" cy="430" rx="110" ry="30" /><ellipse cx="330" cy="505" rx="90" ry="26" /><ellipse cx="420" cy="205" rx="26" ry="10" /><ellipse cx="560" cy="250" rx="20" ry="8" /></g>
        <g fill="none" stroke="#FFFFFF" strokeWidth="3" opacity=".8"><path d="M250 250q12-9 24 0t24 0M520 340q12-9 24 0t24 0M110 320q12-9 24 0t24 0M640 300q12-9 24 0t24 0M380 400q12-9 24 0t24 0" /></g>
        <text x="28" y="34" fontSize="19" fill="#6B5840">Waigeo</text>
        <text x="300" y="300" fontSize="19" fontStyle="italic" fill="#12406B" opacity=".7">{teks.selat}</text>
        {/* Jalur A: speedboat privat langsung Sorong ke resort */}
        <path d={`M${sx} ${sy}C${sx - 200} ${sy + 10} ${rx + 150} ${ry + 250} ${rx} ${ry}`} fill="none" stroke="#188B9A" strokeWidth="5" strokeLinecap="round" />
        <g transform={`translate(${Math.round((sx + rx) / 2 - 40)} ${Math.round((sy + ry) / 2 + 92)}) rotate(-28)`}><path d="M-22 4H20L28-4H-14Z" fill="#188B9A" stroke="#FFFFFF" strokeWidth="2" /><path d="M-30 12q10-6 20 0t20 0" stroke="#FFFFFF" strokeWidth="3" fill="none" /></g>
        <text x={Math.round((sx + rx) / 2 - 150)} y={Math.round((sy + ry) / 2 + 140)} fontSize="14" fontWeight="700" fill="#0F6490">{teks.speedboat}</text>
        {/* Jalur B: feri Sorong ke Waisai */}
        <path d={`M${sx} ${sy}C${sx - 130} ${sy - 40} ${wx + 190} ${wy + 170} ${wx} ${wy}`} fill="none" stroke="#133250" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" />
        <g transform={`translate(${tengah[0] - 6} ${tengah[1] + 20})`}><path d="M-24-3H26L16 12H-15Z" fill="#133250" stroke="#FFFFFF" strokeWidth="2" /><path d="M-15-5L-9-19H11L18-5Z" fill="#FFFFFF" stroke="#0F6490" strokeWidth="2" /></g>
        <text x={tengah[0] + 34} y={tengah[1] + 30} fontSize="14" fontWeight="700" fill="#133250">{teks.feri}</text>
        {/* Perahu Waisai ke resort */}
        <path d={`M${wx} ${wy}Q${(wx + rx) / 2} ${wy + 70} ${rx} ${ry}`} fill="none" stroke="#133250" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" />
        <text x={(wx + rx) / 2 - 20} y={wy + 66} fontSize="14" fontWeight="700" fill="#133250">{teks.perahu}</text>
        {/* Jalur udara masuk ke Sorong */}
        <path d={`M770 80C780 200 760 340 ${sx + 20} ${sy - 30}`} fill="none" stroke="#6B5840" strokeWidth="2.5" strokeDasharray="5 10" strokeLinecap="round" opacity=".6" />
        <g transform="translate(762 240) rotate(8)"><path d="M0 38C-5 35-6 23-6 11L-32-4V-11L-6-4V-22L-17-29V-35L-3-31L0-36L3-31L17-35V-29L6-22V-4L32-11V-4L6 11C6 23 5 35 0 38Z" fill="#133250" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" /></g>
        {pin(sx, sy, "1")}{pin(wx, wy, "2")}
        {/* Penanda resort dengan lambang */}
        <g transform={`translate(${rx} ${ry})`}>
          <path d="M-10 -2L0 12L10 -2" fill="#FFFFFF" />
          <rect x="-46" y="-92" width="92" height="92" rx="20" fill="#FFFFFF" stroke="#BFE6EC" strokeWidth="2" />
          <image href="/brand/bakoeria-mark-warna.svg" x="-36" y="-82" width="72" height="72" preserveAspectRatio="xMidYMid meet" />
          <circle cy="12" r="5" fill="#0F6490" stroke="#FFFFFF" strokeWidth="2" />
        </g>
        <text x={rx - 54} y={ry - 40} textAnchor="end" fontSize="17" fontWeight="700" letterSpacing="1.5" fill="#133250">BAKOERIA</text>
        <text x={wx + 22} y={wy - 22} fontSize="20" fontWeight="700" letterSpacing="2" fill="#133250">WAISAI</text>
        <text x={sx + 24} y={sy + 2} fontSize="20" fontWeight="700" letterSpacing="2" fill="#133250">SORONG</text>
      </svg>
      <figcaption className="px-5 py-3 text-xs text-malam/60">{teks.ket} · <span className="angka">{KOORDINAT.lat}, {KOORDINAT.lon}</span></figcaption>
    </figure>
  );
}
