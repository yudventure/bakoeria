import { KOORDINAT } from "@/lib/konten";

/**
 * Peta rute bergambar (pola dari situs Fantasea): pesawat mendarat di Sorong, lalu
 * dua jalur ke resort. A: speedboat privat langsung. B: feri ke Waisai, lalu perahu
 * resort. Garis pantainya asli (public/img/peta-pantai.svg, dari OpenStreetMap dan
 * GSHHG) dan semua titik ditaruh menurut koordinatnya; hanya lengkung jalurnya yang perkiraan.
 */
/* Kerangka sama dengan public/img/peta-pantai.svg: 1 satuan = 0,001 derajat (sekitar 111 m). */
const xy = (lat: number, lon: number): [number, number] => [Math.round((lon - 130.18) * 1000), Math.round((0.06 - lat) * 1000)];
const SORONG = xy(-0.878, 131.248);   // pelabuhan Sorong
const BANDARA = xy(-0.894, 131.287);  // Bandara Domine Eduard Osok
const WAISAI = xy(-0.432, 130.822);   // pelabuhan Waisai
const RESORT = xy(KOORDINAT.lat, KOORDINAT.lon);
/* Bagian peta yang ditampilkan: dari Teluk Kabui dan Waisai di utara sampai Sorong di tenggara. */
const KOTAK = { x: 345, y: 215, l: 915, t: 895 };

export interface TeksPeta { judul: string; ket: string; selat: string; feri: string; perahu: string; speedboat: string; bandara: string }

/** Titik pada kurva Bezier kubik, untuk menaruh ikon dan label tepat di jalurnya. */
const kubik = (p: number[][], t: number) => [0, 1].map((i) => (1 - t) ** 3 * p[0][i] + 3 * (1 - t) ** 2 * t * p[1][i] + 3 * (1 - t) * t ** 2 * p[2][i] + t ** 3 * p[3][i]);

/* Dua kapal dengan gaya gambar yang sama, beda jenis: feri bertingkat dengan cerobong, speedboat ramping dengan kaca depan. */
const Feri = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r="27" fill="#FFFFFF" stroke="#133250" strokeWidth="2" />
    <path d="M-17 3H17L12 12H-12Z" fill="#133250" />
    <path d="M-12 3V-4H9V3M-7-4V-10H4V-4" fill="#FFFFFF" stroke="#133250" strokeWidth="2" strokeLinejoin="round" />
    <path d="M5-10V-15" stroke="#133250" strokeWidth="3" strokeLinecap="round" />
    <path d="M-8-0.5h2M-3-0.5h2M2-0.5h2" stroke="#133250" strokeWidth="2" strokeLinecap="round" />
    <path d="M-16 17q4-3 8 0t8 0 8 0 8 0" fill="none" stroke="#133250" strokeWidth="2" strokeLinecap="round" />
  </g>
);
const Speedboat = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r="27" fill="#FFFFFF" stroke="#188B9A" strokeWidth="2" />
    <path d="M-18 2H19L9 11H-14Z" fill="#188B9A" />
    <path d="M-6 2L-1-6H7L11 2" fill="#FFFFFF" stroke="#188B9A" strokeWidth="2" strokeLinejoin="round" />
    <path d="M-17 2L-19-3H-12" fill="none" stroke="#188B9A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M-16 17q4-3 8 0t8 0 8 0 8 0" fill="none" stroke="#188B9A" strokeWidth="2" strokeLinecap="round" />
  </g>
);
const Label = ({ x, y, teks, warna, jangkar = "start" }: { x: number; y: number; teks: string; warna: string; jangkar?: "start" | "end" | "middle" }) => (
  <text x={x} y={y} textAnchor={jangkar} fontSize="14" fontWeight="700" fill={warna} stroke="#FFFFFF" strokeWidth="4" paintOrder="stroke" strokeLinejoin="round">{teks}</text>
);

export default function PetaRute({ teks, id }: { teks: TeksPeta; id: string }) {
  const [sx, sy] = SORONG, [wx, wy] = WAISAI, [rx, ry] = RESORT, [bx, by] = BANDARA;
  const jalurA = [[sx, sy], [sx - 230, sy - 20], [rx + 200, ry + 210], [rx + 6, ry + 4]];
  const jalurB = [[sx, sy], [sx - 90, sy - 150], [wx + 130, wy + 150], [wx, wy + 6]];
  const d = (p: number[][]) => `M${p[0]}C${p[1]} ${p[2]} ${p[3]}`;
  const a = kubik(jalurA, 0.52), b = kubik(jalurB, 0.5);
  const pin = (x: number, y: number, n: string) => (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 C-30-34-24-58 0-58 C24-58 30-34 0 0Z" fill="#0F6490" stroke="#FFFFFF" strokeWidth="4" />
      <circle cy="-34" r="13" fill="#FFFFFF" />
      <text y="-28.5" textAnchor="middle" fontSize="16" fontWeight="700" fill="#133250">{n}</text>
    </g>
  );
  return (
    <figure className="m-0 flex h-full flex-col overflow-hidden rounded-[1.4rem] bg-white ring-1 ring-malam/8">
      <svg viewBox={`${KOTAK.x} ${KOTAK.y} ${KOTAK.l} ${KOTAK.t}`} preserveAspectRatio="xMidYMid slice" role="img" aria-labelledby={`${id}-j ${id}-k`} className="block min-h-0 w-full flex-1" style={{ fontFamily: "var(--font-sans)" }}>
        <title id={`${id}-j`}>{teks.judul}</title>
        <desc id={`${id}-k`}>{teks.ket}</desc>
        <defs><linearGradient id={`${id}-laut`} x2="0" y2="1"><stop stopColor="#E3F3F5" /><stop offset="1" stopColor="#BFE6EC" /></linearGradient></defs>
        <rect x="0" y="0" width="1270" height="1110" fill={`url(#${id}-laut)`} />
        {/* Garis pantai asli (OpenStreetMap dan GSHHG) */}
        <image href="/img/peta-pantai.svg" x="0" y="0" width="1270" height="1110" />
        <g fontSize="17" fill="#6B5840" fontStyle="italic" opacity=".85">
          <text x="800" y="330">Waigeo</text>
          <text x={rx - 150} y={ry + 12}>Gam</text>
          <text x="520" y="930">Batanta</text>
          <text x="1150" y="1040">Papua</text>
        </g>
        <text x="720" y="700" fontSize="19" fontStyle="italic" fill="#12406B" opacity=".6">{teks.selat}</text>

        {/* Bandara Sorong: landasan pacu, dan jalur pesawat yang mendarat */}
        <path d={`M1225 250C1250 480 1240 760 ${bx + 16} ${by - 14}`} fill="none" stroke="#6B5840" strokeWidth="2.5" strokeDasharray="5 10" strokeLinecap="round" opacity=".6" />
        <g transform="translate(1238 520) rotate(3)"><path d="M0 38C-5 35-6 23-6 11L-32-4V-11L-6-4V-22L-17-29V-35L-3-31L0-36L3-31L17-35V-29L6-22V-4L32-11V-4L6 11C6 23 5 35 0 38Z" fill="#133250" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" /></g>
        <g transform={`translate(${bx + 8} ${by + 4}) rotate(-8)`}>
          <rect x="-46" y="-11" width="92" height="22" rx="4" fill="#D8CBB4" stroke="#FFFFFF" strokeWidth="3" />
          <rect x="-42" y="-7.5" width="84" height="15" rx="2" fill="#5F6675" />
          <path d="M-28 0H28" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="7 5" />
          <path d="M-37-5V5M-33-5V5M33-5V5M37-5V5" stroke="#FFFFFF" strokeWidth="1.8" />
        </g>
        <Label x={bx + 50} y={by + 40} teks={teks.bandara} warna="#6B5840" jangkar="end" />

        {/* Jalur B: feri Sorong ke Waisai, lalu perahu resort */}
        <path d={d(jalurB)} fill="none" stroke="#133250" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" />
        <path d={`M${wx} ${wy + 6}Q${(wx + rx) / 2 + 10} ${wy + 62} ${rx + 6} ${ry + 4}`} fill="none" stroke="#133250" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" />
        <Feri x={b[0]} y={b[1]} />
        <Label x={b[0] + 38} y={b[1] + 5} teks={teks.feri} warna="#133250" />
        <Label x={(wx + rx) / 2 + 14} y={wy + 84} teks={teks.perahu} warna="#133250" jangkar="middle" />

        {/* Jalur A: speedboat privat langsung Sorong ke resort */}
        <path d={d(jalurA)} fill="none" stroke="#188B9A" strokeWidth="5" strokeLinecap="round" />
        <Speedboat x={a[0]} y={a[1]} />
        <Label x={a[0] - 38} y={a[1] + 5} teks={teks.speedboat} warna="#0F6490" jangkar="end" />

        {pin(sx, sy, "1")}{pin(wx, wy, "2")}
        <text x={wx + 4} y={wy - 68} textAnchor="middle" fontSize="19" fontWeight="700" letterSpacing="2" fill="#133250" stroke="#F1E9DA" strokeWidth="5" paintOrder="stroke">WAISAI</text>
        <text x={sx - 24} y={sy - 30} textAnchor="end" fontSize="19" fontWeight="700" letterSpacing="2" fill="#133250" stroke="#FFFFFF" strokeWidth="5" paintOrder="stroke">SORONG</text>
        {/* Penanda resort dengan lambang, tepat di titik koordinatnya */}
        <g transform={`translate(${rx} ${ry})`}>
          <path d="M-10 -16L0 -2L10 -16" fill="#FFFFFF" />
          <rect x="-44" y="-102" width="88" height="88" rx="20" fill="#FFFFFF" stroke="#BFE6EC" strokeWidth="2" />
          <image href="/brand/bakoeria-mark-warna.svg" x="-35" y="-93" width="70" height="70" preserveAspectRatio="xMidYMid meet" />
          <circle r="6" fill="#0F6490" stroke="#FFFFFF" strokeWidth="2.5" />
        </g>
        <text x={rx - 52} y={ry - 52} textAnchor="end" fontSize="17" fontWeight="700" letterSpacing="1.5" fill="#133250" stroke="#F1E9DA" strokeWidth="5" paintOrder="stroke">BAKOERIA</text>
      </svg>
      <figcaption className="px-5 py-3 text-xs text-malam/60">{teks.ket} · <span className="angka">{KOORDINAT.lat}, {KOORDINAT.lon}</span> · © OpenStreetMap contributors, GSHHG</figcaption>
    </figure>
  );
}
