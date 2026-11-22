"use client";

import { useEffect, useRef, useState } from "react";

export interface FotoGaleri { src: string; alt: string; kelas: string; bentuk: string; posisi?: string }

/**
 * Galeri mosaik: tiap foto punya ukuran dan bentuk sendiri (lengkung, kapsul, bulat).
 * Foto bisa diklik untuk diperbesar; panah kiri/kanan berpindah foto, Esc menutup.
 */
export default function Galeri({ foto, teks, children }: { foto: FotoGaleri[]; teks: { buka: string; tutup: string; sebelum: string; sesudah: string }; children?: React.ReactNode }) {
  const [buka, setBuka] = useState<number | null>(null);
  const kotak = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = kotak.current;
    if (!d) return;
    if (buka != null && !d.open) d.showModal();
    if (buka == null && d.open) d.close();
  }, [buka]);
  const geser = (n: number) => setBuka((i) => (i == null ? i : (i + n + foto.length) % foto.length));
  const f = buka != null ? foto[buka] : null;

  return (
    <>
      <div className="grid grid-cols-6 gap-3 sm:gap-4 lg:grid-cols-12 lg:grid-rows-[repeat(6,5.4rem)]">
        {foto.map((x, i) => (
          <button
            key={x.src}
            type="button"
            onClick={() => setBuka(i)}
            aria-label={`${teks.buka}: ${x.alt}`}
            style={{ "--tunda": i } as React.CSSProperties}
            className={`muncul-foto group relative overflow-hidden outline-none ring-emas-tua ring-offset-2 ring-offset-[#F6F4EF] focus-visible:ring-2 ${x.bentuk} ${x.kelas}`}
          >
            <img src={x.src} alt={x.alt} loading="lazy" className={`size-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.07] ${x.posisi ?? ""}`} />
            <span aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-white/85 text-malam opacity-0 shadow transition group-hover:opacity-100 group-focus-visible:opacity-100">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M15 4h5v5M9 20H4v-5M20 4l-6 6M4 20l6-6" /></svg>
            </span>
          </button>
        ))}
        {children}
      </div>

      <dialog
        ref={kotak}
        onClose={() => setBuka(null)}
        onClick={(e) => e.target === e.currentTarget && setBuka(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") geser(-1);
          if (e.key === "ArrowRight") geser(1);
        }}
        className="m-auto max-h-[92svh] max-w-[min(94vw,72rem)] overflow-visible bg-transparent p-0 backdrop:bg-[rgba(10,36,64,.86)] backdrop:backdrop-blur-sm"
      >
        {f && (
          <figure className="relative">
            <img src={f.src} alt={f.alt} className="max-h-[80svh] w-auto max-w-full rounded-[1.4rem] object-contain shadow-2xl" />
            <figcaption className="mt-3 flex items-center justify-between gap-4 text-sm text-white/85">
              <span>{f.alt}</span>
              <span className="angka shrink-0">{buka! + 1} / {foto.length}</span>
            </figcaption>
            <button type="button" onClick={() => setBuka(null)} aria-label={teks.tutup} className="absolute -top-3 -right-3 grid size-10 place-items-center rounded-full bg-white text-xl text-malam shadow-lg">×</button>
            <button type="button" onClick={() => geser(-1)} aria-label={teks.sebelum} className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl text-malam shadow-lg">‹</button>
            <button type="button" onClick={() => geser(1)} aria-label={teks.sesudah} className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl text-malam shadow-lg">›</button>
          </figure>
        )}
      </dialog>
    </>
  );
}
