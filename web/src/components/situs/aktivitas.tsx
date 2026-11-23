"use client";

import { useState } from "react";
import VideoLatar from "./video";

export interface KartuAktivitas { judul: string; isi: string; video: string; foto: string; posisi?: string }

/**
 * Tiga kartu tegak 9:16 untuk aktivitas lain (pola dari situs Mambetron): kartu
 * tengah tinggi dan dua di sisinya lebih pendek; kartu yang ditunjuk kursor
 * menjadi yang tinggi, dan teks di sebelahnya ikut menyorot aktivitas itu.
 * Tiap kartu memutar video YouTube polos bila tautannya diisi, selain itu foto.
 * Di ponsel kartu menjadi deretan yang digeser.
 */
export default function Aktivitas({ kartu, judul, isi, tanda }: { kartu: KartuAktivitas[]; judul: string; isi: string; tanda: React.ReactNode }) {
  const [aktif, setAktif] = useState(0);
  const lebar = () => window.matchMedia("(min-width: 1024px) and (hover: hover)").matches;
  /* Yang pertama di tengah, kedua di kiri, ketiga di kanan. */
  const urut = kartu.length >= 3 ? [1, 0, 2] : kartu.map((_, i) => i);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-12">
      <div className="muncul">
        <h2 className="font-display text-[clamp(30px,4vw,44px)] font-normal leading-[1.05]">{judul}</h2>
        <div className="mt-3">{tanda}</div>
        {isi && <p className="mt-4 max-w-md text-[15px] leading-relaxed text-malam/65">{isi}</p>}
        <ol className="mt-6 grid gap-2">
          {kartu.map((k, i) => (
            <li key={k.judul + i}>
              <button
                type="button"
                onMouseEnter={() => lebar() && setAktif(i)}
                onFocus={() => setAktif(i)}
                onClick={() => setAktif(i)}
                aria-pressed={aktif === i}
                className={`flex w-full items-start gap-4 rounded-[1.2rem] p-4 text-left transition ${aktif === i ? "bg-white shadow-[0_10px_30px_rgba(10,36,64,.08)] ring-1 ring-malam/8" : "hover:bg-white/60"}`}
              >
                <span className={`angka grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors ${aktif === i ? "bg-emas-tua text-white" : "bg-busa text-emas-tua"}`}>{i + 1}</span>
                <span className="min-w-0">
                  <span className="block font-display text-[21px] leading-tight text-malam">{k.judul}</span>
                  <span className={`mt-1 block text-[13.5px] leading-relaxed text-malam/65 ${aktif === i ? "" : "lg:line-clamp-1"}`}>{k.isi}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <ul
        onMouseLeave={() => lebar() && setAktif(0)}
        className="muncul -mx-5 flex snap-x snap-mandatory items-center gap-3 overflow-x-auto px-5 py-2 [scrollbar-width:none] lg:mx-0 lg:aspect-[25/16] lg:snap-none lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {urut.map((i, pos) => {
          const k = kartu[i];
          const besar = i === aktif;
          return (
            <li
              key={k.judul + i}
              onMouseEnter={() => lebar() && setAktif(i)}
              /* Di ponsel berurutan 1, 2, 3; di layar lebar yang pertama di tengah. */
              style={{ "--o": i, "--ol": pos } as React.CSSProperties}
              className={`order-[var(--o)] lg:order-[var(--ol)] relative aspect-[9/16] w-[min(62vw,16rem)] shrink-0 snap-center overflow-hidden rounded-[1.4rem] bg-malam transition-all duration-500 ease-out lg:w-auto lg:min-w-0 lg:shrink ${besar ? "lg:h-full lg:shadow-[0_24px_60px_rgba(10,36,64,.25)]" : "lg:h-[78%] lg:opacity-90"}`}
            >
              {k.video ? (
                <VideoLatar id={k.video} poster={k.foto} judul={k.judul} tegak className="rounded-none" />
              ) : (
                <img src={k.foto} alt="" loading="lazy" className={`absolute inset-0 size-full object-cover ${k.posisi ?? ""}`} />
              )}
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,36,64,0)_45%,rgba(10,36,64,.78))]" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-white">
                <span className="angka block text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">0{i + 1}</span>
                <span className="block font-display text-[19px] leading-tight">{k.judul}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
