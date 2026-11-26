/**
 * Ilustrasi resort untuk kotak kisah di bagian About, gaya garis tipis tanpa latar:
 * dua cottage panggung dengan lampu gantung, pohon kelapa, bukit dan awan, matahari,
 * perahu, dan ombak. Mengikuti contoh dari pemilik. Murni dekorasi.
 */
const TINTA = "#1F3A5A";
const DAUN = "#9DB36A";
const PASIR = "#C9B48C";
const LAUT = "#3E7FB0";
const LEMBUT = "#A9A39A";

function Cottage({ x, y, s = 1, tangga = "kanan" }: { x: number; y: number; s?: number; tangga?: "kanan" | "kiri" }) {
  const w = 100 * s, h = 46 * s;
  const tiang = [0.06, 0.3, 0.55, 0.8, 0.94].map((p) => x + w * p);
  return (
    <g fill="none" stroke={TINTA} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      {/* atap */}
      <path d={`M${x - 10 * s} ${y} L${x + 12 * s} ${y - 22 * s} L${x + w - 12 * s} ${y - 22 * s} L${x + w + 10 * s} ${y} Z`} fill="#FFFFFF" />
      {[0.25, 0.45, 0.65].map((p) => <line key={p} x1={x + 6 * s} y1={y - 22 * s * p} x2={x + w - 6 * s} y2={y - 22 * s * p} strokeWidth="0.9" opacity="0.6" />)}
      {/* dinding */}
      <rect x={x} y={y} width={w} height={h} fill="#FFFFFF" />
      {Array.from({ length: 9 }, (_, i) => x + (w / 10) * (i + 1)).map((lx) => <line key={lx} x1={lx} y1={y + 2} x2={lx} y2={y + h - 2} strokeWidth="0.7" opacity="0.35" />)}
      {/* jendela dan pintu */}
      <rect x={x + 12 * s} y={y + 10 * s} width={16 * s} height={16 * s} fill="#FFFFFF" />
      <line x1={x + 20 * s} y1={y + 10 * s} x2={x + 20 * s} y2={y + 26 * s} />
      <line x1={x + 12 * s} y1={y + 18 * s} x2={x + 28 * s} y2={y + 18 * s} />
      <rect x={x + 40 * s} y={y + 10 * s} width={16 * s} height={h - 10 * s} fill="#FFFFFF" />
      <circle cx={x + 53 * s} cy={y + 28 * s} r="0.9" fill={TINTA} />
      {/* teras berpagar */}
      <rect x={x + 64 * s} y={y + 24 * s} width={30 * s} height={h - 24 * s} fill="#FFFFFF" />
      {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={x + 66 * s + i * 5 * s} y1={y + 24 * s} x2={x + 66 * s + i * 5 * s} y2={y + h} strokeWidth="0.9" />)}
      {/* lantai dan tiang */}
      <line x1={x - 4 * s} y1={y + h} x2={x + w + 4 * s} y2={y + h} strokeWidth="2" />
      {tiang.map((tx) => <line key={tx} x1={tx} y1={y + h} x2={tx} y2={y + h + 16 * s} />)}
      {/* tangga */}
      {tangga === "kanan"
        ? <path d={`M${x + w} ${y + h} l6 0 l0 4 l5 0 l0 4 l5 0 l0 4 l5 0 l0 4`} />
        : <path d={`M${x} ${y + h} l-6 0 l0 4 l-5 0 l0 4 l-5 0 l0 4 l-5 0 l0 4`} />}
    </g>
  );
}

function Kelapa({ x, y, tinggi, condong }: { x: number; y: number; tinggi: number; condong: number }) {
  const px = x + condong, py = y - tinggi;
  const daun = [
    [-34, 4], [-26, -10], [-8, -16], [14, -14], [30, -4], [34, 10], [-20, 14],
  ];
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${x} ${y} Q${x + condong * 0.2} ${y - tinggi * 0.55} ${px} ${py}`} fill="none" stroke={TINTA} strokeWidth="1.6" />
      <path d={`M${x + 3} ${y} Q${x + 3 + condong * 0.2} ${y - tinggi * 0.55} ${px + 2} ${py}`} fill="none" stroke={TINTA} strokeWidth="0.8" opacity="0.5" />
      {daun.map(([dx, dy], i) => (
        <path key={i} d={`M${px} ${py} Q${px + dx * 0.5} ${py + dy * 0.5 - 8} ${px + dx} ${py + dy} Q${px + dx * 0.55} ${py + dy * 0.5 - 2} ${px} ${py}`} fill={DAUN} fillOpacity="0.35" stroke={DAUN} strokeWidth="1.3" />
      ))}
      <circle cx={px - 2} cy={py + 3} r="2.2" fill="none" stroke={TINTA} strokeWidth="1" />
      <circle cx={px + 2} cy={py + 4} r="2.2" fill="none" stroke={TINTA} strokeWidth="1" />
    </g>
  );
}

export default function IlustrasiResort({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 260" className={className} role="img" aria-hidden="true" fill="none">
      {/* matahari */}
      <g stroke={LEMBUT} strokeWidth="1.3" strokeLinecap="round">
        <circle cx="330" cy="40" r="13" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const r = (a * Math.PI) / 180;
          return <line key={a} x1={330 + Math.cos(r) * 19} y1={40 + Math.sin(r) * 19} x2={330 + Math.cos(r) * 24} y2={40 + Math.sin(r) * 24} />;
        })}
      </g>
      {/* burung */}
      <g stroke={TINTA} strokeWidth="1.2" strokeLinecap="round" opacity="0.7">
        <path d="M82 40 q5 -4 9 0 q5 -4 9 0" />
        <path d="M108 30 q4 -3 7 0 q4 -3 7 0" />
      </g>
      {/* bukit */}
      <path d="M0 132 C40 120 70 96 108 92 C140 88 160 110 196 100 C232 90 250 64 290 66 C330 68 350 98 420 104" stroke={LEMBUT} strokeWidth="1.3" />
      {/* awan */}
      <g stroke={LEMBUT} strokeWidth="1.2" fill="#FFFFFF">
        <path d="M0 150 q6 -14 20 -10 q6 -14 22 -8 q14 -4 18 10 q12 2 10 12 L0 154 Z" />
        <path d="M196 132 q6 -12 18 -8 q8 -10 20 -4 q12 0 12 10 L196 132 Z" />
        <path d="M352 128 q6 -12 18 -8 q8 -10 22 -4 q14 0 14 12 q10 2 14 8 L352 136 Z" />
      </g>
      {/* lampu gantung antar cottage */}
      <path d="M172 150 Q206 166 242 154" stroke={TINTA} strokeWidth="0.9" />
      {[180, 190, 200, 210, 220, 230].map((x, i) => <circle key={x} cx={x} cy={155 + [1.5, 4.5, 6, 6, 4.5, 2][i]} r="2" fill="#FFFFFF" stroke={PASIR} strokeWidth="1.2" />)}
      {/* cottage */}
      <Cottage x={82} y={132} />
      <Cottage x={248} y={142} s={0.86} tangga="kiri" />
      {/* pohon kelapa */}
      <Kelapa x={58} y={204} tinggi={130} condong={10} />
      <Kelapa x={376} y={204} tinggi={112} condong={-14} />
      {/* tunas di pantai */}
      <g stroke={DAUN} strokeWidth="1.3" strokeLinecap="round">
        {[16, 30, 44].map((x) => <path key={x} d={`M${x} 204 v-12 M${x} 196 q-6 -6 -10 -2 M${x} 194 q6 -6 10 -2`} />)}
      </g>
      {/* garis pantai */}
      <path d="M0 204 L420 204" stroke={PASIR} strokeWidth="1.6" />
      {[[30, 214], [120, 212], [210, 214], [300, 212], [380, 214]].map(([x, y]) => <line key={x} x1={x} y1={y} x2={x + 14} y2={y} stroke={PASIR} strokeWidth="1" opacity="0.7" />)}
      {/* laut */}
      <g stroke={LAUT} strokeLinecap="round">
        <path d="M0 224 q16 -5 32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0" strokeWidth="1.6" />
        <path d="M30 240 q14 -4 28 0 t28 0 t28 0 M150 242 q14 -4 28 0 t28 0 M250 240 q14 -4 28 0 t28 0" strokeWidth="1.1" opacity="0.55" />
      </g>
      {/* perahu */}
      <g stroke={TINTA} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M150 214 Q200 224 248 210 L240 222 Q200 232 158 224 Z" fill="#FFFFFF" />
        <line x1="166" y1="217" x2="166" y2="204" />
        <path d="M166 204 l-4 3" />
      </g>
      {/* ombak menggulung di kanan */}
      <path d="M352 252 C372 252 392 244 404 228 C412 216 404 206 394 210 C386 214 390 226 400 226" stroke={LAUT} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
