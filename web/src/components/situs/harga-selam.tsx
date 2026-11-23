"use client";

import { useState } from "react";
import type { PaketGrup } from "@/lib/konten";
import { Ikon } from "./ikon";

const IKON: [RegExp, string][] = [
  [/night|malam/i, "tenang"],
  [/snorkel/i, "snorkel"],
  [/kursus|course|pertama|first/i, "sertifikat"],
  [/pulau|island/i, "daun"],
  [/trip|paket|package/i, "perahu"],
  [/dive|selam/i, "selam"],
];
const ikon = (judul: string) => IKON.find(([r]) => r.test(judul))?.[1] ?? "gelembung";
const angka = (h: string) => Number(h.replace(/\D/g, "")) || 0;

/**
 * Program selam sebagai deretan kartu yang membuka (pola dari situs Zanclus):
 * kartu yang ditunjuk kursor atau difokus melebar dan menampilkan daftar harganya,
 * kartu lain menyempit. Kartu pertama terbuka sejak awal. Di layar sempit kartu
 * ditumpuk dan dibuka dengan ketukan.
 */
export default function HargaSelam({ paket, teks }: { paket: PaketGrup[]; teks: { mulai: string; lihat: string; pesan: string } }) {
  const [buka, setBuka] = useState(0);
  const lebar = () => window.matchMedia("(min-width: 1024px) and (hover: hover)").matches;
  return (
    <div className="flex flex-col gap-3 lg:h-[37rem] lg:flex-row" onMouseLeave={() => lebar() && setBuka(0)}>
      {paket.map((g, i) => {
        const terbuka = i === buka;
        const termurah = Math.min(...g.isi.map((x) => angka(x.harga)).filter(Boolean));
        return (
          <article
            key={g.judul + i}
            onMouseEnter={() => lebar() && setBuka(i)}
            onFocus={() => lebar() && setBuka(i)}
            className={`relative flex min-w-0 flex-col overflow-hidden rounded-[1.4rem] ring-1 transition-[flex-grow,background-color,box-shadow] duration-[600ms] ease-[cubic-bezier(.22,1,.36,1)] lg:basis-0 ${terbuka ? "bg-white shadow-[0_24px_60px_rgba(10,36,64,.16)] ring-malam/8 lg:grow-[4.2]" : "bg-white/70 ring-malam/8 lg:grow"}`}
          >
            <button
              type="button"
              aria-expanded={terbuka}
              onClick={() => setBuka(terbuka && !lebar() ? -1 : i)}
              className={`flex w-full items-center gap-4 p-5 text-left lg:flex-col lg:items-start ${terbuka ? "lg:pb-2" : "lg:h-full lg:px-4"}`}
            >
              <span className={`grid size-12 shrink-0 place-items-center rounded-full transition-colors ${terbuka ? "bg-emas-tua text-white" : "bg-busa text-emas-tua"}`}><Ikon nama={ikon(g.judul)} className="size-6" /></span>
              <span className="min-w-0 flex-1 lg:flex-none">
                <span className={`block font-display leading-tight text-malam ${terbuka ? "text-[24px]" : "text-[22px] lg:text-[16.5px]"}`}>{g.judul}</span>
                {!terbuka && Number.isFinite(termurah) && <span className="mt-1 block text-[12.5px] text-malam/55">{teks.mulai} <b className="whitespace-nowrap font-bold text-emas-tua lg:block">Rp {termurah.toLocaleString("id-ID")}</b></span>}
              </span>
              {!terbuka && <span className="shrink-0 text-[12px] font-bold text-emas-tua lg:mt-auto">{teks.lihat} <span aria-hidden="true">→</span></span>}
            </button>
            {/* Panel harga tetap ada di tata letak supaya bisa dianimasikan; saat tertutup tidak bisa difokus atau dibaca. */}
            <div inert={!terbuka} aria-hidden={!terbuka} className={`grid transition-[grid-template-rows,opacity] duration-500 ${terbuka ? "grid-rows-[1fr] opacity-100 delay-150" : "grid-rows-[0fr] opacity-0 lg:hidden"}`}>
              <div className="min-h-0 overflow-hidden lg:overflow-y-auto">
                <div className="px-5 pb-5 lg:min-w-[22rem]">
                  {g.catatan && <p className="text-[13px] leading-relaxed text-malam/55">{g.catatan}</p>}
                  <ul className="mt-3 divide-y divide-malam/8 border-t border-malam/8">
                    {g.isi.map((x, j) => (
                      <li key={x.nama + j} className="flex items-baseline justify-between gap-4 py-2.5">
                        <span className="min-w-0">
                          <span className="block text-[14.5px] text-malam">{x.nama}</span>
                          {x.ket && <span className="block text-[12px] leading-snug text-malam/55">{x.ket}</span>}
                        </span>
                        {x.harga && <b className="angka shrink-0 whitespace-nowrap text-[14.5px] font-bold text-emas-tua">{x.harga}</b>}
                      </li>
                    ))}
                  </ul>
                  <a href="#pesan" className="mt-4 inline-flex items-center gap-3 rounded-full bg-emas-tua py-1.5 pl-5 pr-1.5 text-sm font-bold text-white transition hover:brightness-110">{teks.pesan}<span className="grid size-8 place-items-center rounded-full bg-white/20">→</span></a>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
