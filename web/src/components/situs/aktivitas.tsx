"use client";

import { useRef, useState } from "react";
import VideoLatar from "./video";
import { atribut, type Gambar } from "@/lib/foto";
import type { SumberVideo } from "@/lib/konten";

export interface KartuAktivitas { judul: string; isi: string; video: SumberVideo | null; foto: Gambar; posisi?: string; /** Yang termasuk, sudah diterjemahkan: ikon dan label. */ termasuk?: { d: string; label: string }[] }

/** Isi satu kartu: video polos (YouTube/TikTok) bila ada, selain itu foto, dengan judul di bawah. */
function IsiKartu({ k, i }: { k: KartuAktivitas; i: number }) {
  return (
    <>
      {k.video ? (
        <VideoLatar video={k.video} poster={k.foto} sizes="(min-width: 1024px) 33vw, 70vw" judul={k.judul} tegak className="rounded-none" />
      ) : (
        <img {...atribut(k.foto, "(min-width: 1024px) 33vw, 70vw")} alt="" loading="lazy" className={`absolute inset-0 size-full object-cover ${k.posisi ?? ""}`} />
      )}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,36,64,0)_45%,rgba(10,36,64,.78))]" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-white">
        <span className="angka block text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">0{i + 1}</span>
        <span className="block font-display text-[19px] leading-tight">{k.judul}</span>
      </span>
    </>
  );
}

/**
 * Karosel untuk ponsel: kartu aktif penuh di tengah, kartu kiri dan kanan lebih kecil
 * dan sedikit tertutup tepi yang kabur. Geser ke kiri/kanan atau ketuk kartu samping
 * untuk berpindah; urutan cincinnya sama dengan layar lebar (kiri, tengah, kanan).
 */
function KaroselPonsel({ kartu, urut, aktif, setAktif }: { kartu: KartuAktivitas[]; urut: number[]; aktif: number; setAktif: (i: number) => void }) {
  const mulai = useRef<number | null>(null);
  const n = urut.length;
  const p = Math.max(0, urut.indexOf(aktif));
  const geser = (arah: number) => setAktif(urut[(p + arah + n) % n]);
  return (
    <div className="muncul lg:hidden">
      <div
        className="relative -mx-5 h-[min(112vw,31rem)] touch-pan-y overflow-hidden"
        onPointerDown={(e) => { mulai.current = e.clientX; }}
        onPointerUp={(e) => {
          if (mulai.current == null) return;
          const dx = e.clientX - mulai.current;
          mulai.current = null;
          if (Math.abs(dx) > 40) geser(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => { mulai.current = null; }}
      >
        {urut.map((i, pos) => {
          const k = kartu[i];
          /* Posisi relatif terhadap kartu aktif dalam cincin: -1 kiri, 0 tengah, 1 kanan. */
          let r = pos - p;
          if (r > n / 2) r -= n;
          if (r < -n / 2) r += n;
          const tengah = r === 0;
          return (
            <button
              key={k.judul + i}
              type="button"
              data-karosel={r}
              aria-label={k.judul}
              aria-current={tengah ? "true" : undefined}
              tabIndex={tengah ? 0 : -1}
              onClick={() => !tengah && setAktif(i)}
              style={{ transform: `translateX(calc(-50% + ${r * 80}%)) scale(${tengah ? 1 : 0.8})`, zIndex: tengah ? 2 : 1 }}
              className={`absolute left-1/2 top-0 aspect-[9/16] h-full overflow-hidden rounded-[1.4rem] bg-malam text-left transition-[transform,opacity,filter] duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${tengah ? "shadow-[0_24px_60px_rgba(10,36,64,.28)]" : "opacity-80 brightness-90"}`}
            >
              <IsiKartu k={k} i={i} />
            </button>
          );
        })}
        {/* Tepi kiri dan kanan kabur dan memudar ke warna latar. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-[3] w-[16%] bg-[linear-gradient(90deg,#F6F4EF,rgba(246,244,239,0))] backdrop-blur-[3px] [mask-image:linear-gradient(90deg,#000_30%,transparent)]" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-[3] w-[16%] bg-[linear-gradient(270deg,#F6F4EF,rgba(246,244,239,0))] backdrop-blur-[3px] [mask-image:linear-gradient(270deg,#000_30%,transparent)]" />
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {urut.map((i) => (
          <button key={i} type="button" aria-label={kartu[i].judul} onClick={() => setAktif(i)} className={`h-2 rounded-full transition-all ${i === aktif ? "w-6 bg-emas-tua" : "w-2 bg-malam/20"}`} />
        ))}
      </div>
    </div>
  );
}

/**
 * Tiga kartu tegak 9:16 untuk aktivitas lain (pola dari situs Mambetron): kartu
 * tengah tinggi dan dua di sisinya lebih pendek; kartu yang ditunjuk kursor
 * menjadi yang tinggi, dan teks di sebelahnya ikut menyorot aktivitas itu.
 * Tiap kartu memutar video YouTube atau TikTok polos bila tautannya diisi, selain itu foto.
 * Di ponsel kartu menjadi karosel (lihat KaroselPonsel).
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
                  {aktif === i && (k.termasuk?.length ?? 0) > 0 && (
                    <span data-termasuk className="mt-2.5 flex flex-wrap gap-1.5">
                      {k.termasuk!.map((x) => (
                        <span key={x.label} className="flex items-center gap-1.5 rounded-full bg-busa/70 py-1 pl-2 pr-3 text-[12px] text-malam/80">
                          <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-emas-tua" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={x.d} /></svg>
                          {x.label}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <KaroselPonsel kartu={kartu} urut={urut} aktif={aktif} setAktif={setAktif} />
      <ul onMouseLeave={() => lebar() && setAktif(0)} className="muncul hidden items-center gap-3 lg:flex lg:aspect-[25/16]">
        {urut.map((i) => {
          const k = kartu[i];
          const besar = i === aktif;
          return (
            <li
              key={k.judul + i}
              onMouseEnter={() => lebar() && setAktif(i)}
              className={`relative aspect-[9/16] min-w-0 overflow-hidden rounded-[1.4rem] bg-malam transition-all duration-500 ease-out ${besar ? "h-full shadow-[0_24px_60px_rgba(10,36,64,.25)]" : "h-[78%] opacity-90"}`}
            >
              <IsiKartu k={k} i={i} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
