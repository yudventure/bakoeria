"use client";

import { useRef, useState } from "react";
import { atribut, type Gambar } from "@/lib/foto";

/**
 * Karosel foto di kartu (misalnya perahu antar-jemput: luar, kabin, kursi).
 * Digeser dengan jari atau tetikus (scroll-snap mendatar, tidak ikut bergulir tegak),
 * dengan tombol panah dan titik penanda bila fotonya lebih dari satu.
 * Teksnya string biasa: komponen server tidak boleh mengirim fungsi ke sini.
 */
export default function KaroselFoto({ foto, alt, sizes, teks }: { foto: Gambar[]; alt: string; sizes: string; teks: { sebelum: string; sesudah: string; /** "photo" / "foto" */ foto: string; /** "of" / "dari" */ dari: string } }) {
  const jalur = useRef<HTMLDivElement>(null);
  const [ke, setKe] = useState(0);
  const pergi = (i: number) => {
    const el = jalur.current;
    if (!el) return;
    const n = (i + foto.length) % foto.length;
    el.scrollTo({ left: n * el.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return (
    <div className="group/karosel relative size-full">
      <div
        ref={jalur}
        data-karosel-foto
        onScroll={(e) => setKe(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
        className="flex size-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {foto.map((g, i) => (
          <img key={g.src + i} {...atribut(g, sizes)} alt={foto.length > 1 ? `${alt}, ${teks.foto} ${i + 1} ${teks.dari} ${foto.length}` : alt} loading="lazy" draggable={false} className="size-full shrink-0 snap-center object-cover" />
        ))}
      </div>
      {foto.length > 1 && (
        <>
          <button type="button" aria-label={teks.sebelum} onClick={() => pergi(ke - 1)} className="absolute left-2.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-lg text-malam shadow transition hover:bg-white sm:opacity-0 sm:group-hover/karosel:opacity-100 sm:focus-visible:opacity-100">‹</button>
          <button type="button" aria-label={teks.sesudah} onClick={() => pergi(ke + 1)} className="absolute right-2.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-lg text-malam shadow transition hover:bg-white sm:opacity-0 sm:group-hover/karosel:opacity-100 sm:focus-visible:opacity-100">›</button>
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
            {foto.map((_, i) => <span key={i} className={`h-1.5 rounded-full shadow transition-all ${i === ke ? "w-5 bg-white" : "w-1.5 bg-white/60"}`} />)}
          </div>
        </>
      )}
    </div>
  );
}
