/**
 * Ilustrasi resort untuk kotak kisah di bagian About: cottage panggung berdinding kayu
 * besi dan beratap merah bata seperti di foto resort, pohon kelapa, pulau karst Raja
 * Ampat di kejauhan, laut jernih, dan pasir. Warna dari palet merek. Murni dekorasi.
 */
export default function IlustrasiResort({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id="il-langit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7E7CF" />
          <stop offset="0.55" stopColor="#F3EFE6" />
          <stop offset="1" stopColor="#D7EEF0" />
        </linearGradient>
        <linearGradient id="il-laut" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7CC3CF" />
          <stop offset="0.5" stopColor="#3E97B3" />
          <stop offset="1" stopColor="#0F6490" />
        </linearGradient>
        <linearGradient id="il-pasir" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2E6CF" />
          <stop offset="1" stopColor="#E2CFAA" />
        </linearGradient>
        <clipPath id="il-bingkai"><rect width="400" height="300" rx="28" /></clipPath>
      </defs>
      <g clipPath="url(#il-bingkai)">
        <rect width="400" height="300" fill="url(#il-langit)" />
        {/* Matahari pagi */}
        <circle cx="300" cy="78" r="30" fill="#F4C98A" opacity="0.85" />
        <circle cx="300" cy="78" r="44" fill="#F4C98A" opacity="0.18" />
        {/* Burung */}
        <path d="M92 66 q6 -6 12 0 q6 -6 12 0" fill="none" stroke="#133250" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
        <path d="M122 50 q4 -4 8 0 q4 -4 8 0" fill="none" stroke="#133250" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
        {/* Pulau karst Raja Ampat di kejauhan */}
        <path d="M0 158 C18 150 26 128 40 126 C52 124 56 142 70 146 C82 150 90 132 104 134 C118 136 120 156 140 158 Z" fill="#5E8C7A" opacity="0.55" />
        <path d="M224 160 C236 140 248 118 262 116 C276 114 280 136 292 140 C304 144 312 128 326 130 C342 132 344 152 364 160 Z" fill="#4D7C6C" opacity="0.6" />
        <path d="M330 160 C340 148 350 136 364 136 C378 136 386 150 400 152 L400 162 Z" fill="#5E8C7A" opacity="0.45" />
        {/* Laut */}
        <rect y="156" width="400" height="144" fill="url(#il-laut)" />
        <path d="M0 176 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2" />
        <path d="M-20 198 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="2" />
        {/* Pantai pasir */}
        <path d="M0 226 C70 206 150 214 220 222 C290 230 340 222 400 214 L400 300 L0 300 Z" fill="url(#il-pasir)" />
        <path d="M0 226 C70 206 150 214 220 222 C290 230 340 222 400 214" fill="none" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="3" />
        {/* Pohon kelapa kiri */}
        <path d="M70 262 C74 220 82 180 96 146" fill="none" stroke="#6B4A2E" strokeWidth="6" strokeLinecap="round" />
        <g fill="#2F6B4F">
          <path d="M96 146 C80 128 60 126 44 134 C62 132 78 138 96 150 Z" />
          <path d="M96 146 C88 122 92 104 104 92 C100 110 102 128 98 148 Z" />
          <path d="M96 146 C114 128 136 128 150 140 C132 136 114 140 98 150 Z" />
          <path d="M96 146 C108 154 116 170 116 186 C108 170 100 160 94 150 Z" />
          <path d="M96 146 C82 152 70 168 66 182 C76 168 86 158 98 150 Z" />
        </g>
        {/* Cottage panggung */}
        <g>
          <ellipse cx="236" cy="262" rx="104" ry="8" fill="#133250" opacity="0.12" />
          {/* tiang beton */}
          {[166, 196, 226, 256, 286, 302].map((x) => <rect key={x} x={x - 6} y="236" width="12" height="24" rx="2" fill="#E9E4DA" stroke="#C9C0B0" strokeWidth="1" />)}
          {/* lantai */}
          <rect x="150" y="228" width="168" height="10" rx="2" fill="#5A3A22" />
          {/* dinding kayu */}
          <rect x="166" y="170" width="136" height="60" fill="#7A4B2C" />
          {[178, 190, 202, 214, 226, 238, 250, 262, 274, 286].map((x) => <line key={x} x1={x} y1="172" x2={x} y2="228" stroke="#5E3820" strokeWidth="1.2" opacity="0.7" />)}
          {/* jendela menyala */}
          <rect x="178" y="184" width="22" height="22" rx="2" fill="#F6C46B" />
          <line x1="189" y1="184" x2="189" y2="206" stroke="#7A4B2C" strokeWidth="2" />
          <rect x="268" y="184" width="22" height="22" rx="2" fill="#F6C46B" />
          <line x1="279" y1="184" x2="279" y2="206" stroke="#7A4B2C" strokeWidth="2" />
          {/* pintu */}
          <rect x="222" y="186" width="26" height="42" rx="2" fill="#4A2C18" />
          <circle cx="243" cy="208" r="1.6" fill="#F6C46B" />
          {/* teras dan pagar */}
          <rect x="150" y="214" width="16" height="16" fill="none" />
          <line x1="150" y1="214" x2="318" y2="214" stroke="#5A3A22" strokeWidth="2.5" />
          {[154, 162, 306, 314].map((x) => <line key={x} x1={x} y1="214" x2={x} y2="228" stroke="#5A3A22" strokeWidth="2" />)}
          {/* tangga */}
          <path d="M224 238 L246 238 L250 262 L220 262 Z" fill="#6B4A2E" />
          {[244, 250, 256].map((y) => <line key={y} x1="221" y1={y} x2="249" y2={y} stroke="#4A2C18" strokeWidth="1.5" />)}
          {/* atap merah bata */}
          <path d="M140 174 L234 120 L328 174 Z" fill="#8E3B2E" />
          <path d="M140 174 L234 120 L328 174" fill="none" stroke="#6E2B22" strokeWidth="3" strokeLinejoin="round" />
          <path d="M168 160 L234 128 L300 160" fill="none" stroke="#A9503F" strokeWidth="2" opacity="0.7" />
          {/* lampu gantung */}
          <path d="M150 178 Q190 190 230 180 Q270 190 318 178" fill="none" stroke="#3B2A1E" strokeWidth="1" />
          {[166, 186, 206, 226, 246, 266, 286, 306].map((x, i) => <circle key={x} cx={x} cy={180 + (i % 2 ? 5 : 3)} r="2.4" fill="#FFD98A" />)}
        </g>
        {/* Pohon kelapa kanan */}
        <path d="M360 270 C356 232 350 200 336 172" fill="none" stroke="#6B4A2E" strokeWidth="5" strokeLinecap="round" />
        <g fill="#3A7A5A">
          <path d="M336 172 C324 156 306 152 292 158 C308 158 322 164 336 176 Z" />
          <path d="M336 172 C334 152 342 138 354 130 C348 146 346 160 338 176 Z" />
          <path d="M336 172 C352 160 372 162 384 172 C368 168 352 170 338 178 Z" />
          <path d="M336 172 C344 184 346 198 344 210 C340 196 336 186 332 176 Z" />
        </g>
        {/* Perahu kecil di laut */}
        <path d="M40 186 L84 186 L78 194 L46 194 Z" fill="#F3EFE6" />
        <path d="M46 186 L52 180 L70 180 L74 186" fill="#0F6490" />
      </g>
    </svg>
  );
}
