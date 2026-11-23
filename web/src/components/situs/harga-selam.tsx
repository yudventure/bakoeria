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
/* Foto latar kartu yang belum terbuka. Sementara memakai foto resort yang ada; ganti dengan foto selam bila tersedia. */
const FOTO = ["/img/resort-night.jpg", "/img/palms.jpg", "/img/cottage-right.jpg", "/img/lights-path.jpg", "/img/cottage-left.jpg", "/img/resort-night.jpg"];
const POSISI = ["object-[20%_60%]", "object-center", "object-[60%_50%]", "object-center", "object-[35%_50%]", "object-[80%_70%]"];
const angka = (h: string) => Number(h.replace(/\D/g, "")) || 0;

/**
 * Program selam sebagai deretan kartu yang membuka (pola dari situs Zanclus):
 * kartu yang ditunjuk kursor atau difokus melebar dan menampilkan daftar harganya,
 * kartu lain menyempit. Kartu pertama terbuka sejak awal. Di layar sempit kartu
 * ditumpuk dan dibuka dengan ketukan.
 */
export default function HargaSelam({ paket, teks, tautan = "#pesan" }: { paket: PaketGrup[]; /** Tujuan tombol pesan: "#pesan", WhatsApp, atau "". */ tautan?: string; teks: { mulai: string; lihat: string; pesan: string } }) {
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
            {/* Foto latar yang digelapkan; memudar saat kartu terbuka. */}
            <span aria-hidden="true" className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${terbuka ? "opacity-0" : "opacity-100"}`}>
              <img src={FOTO[i % FOTO.length]} alt="" loading="lazy" className={`size-full object-cover ${POSISI[i % POSISI.length]}`} />
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,36,64,.30),rgba(10,36,64,.55))]" />
            </span>
            <button
              type="button"
              aria-expanded={terbuka}
              onClick={() => setBuka(terbuka && !lebar() ? -1 : i)}
              className={`relative flex w-full items-center gap-4 p-5 text-left lg:flex-col ${terbuka ? "lg:items-start lg:pb-2" : "lg:h-full lg:items-center lg:justify-center lg:px-4 lg:text-center"}`}
            >
              <span className={`grid size-12 shrink-0 place-items-center rounded-full transition-colors ${terbuka ? "bg-emas-tua text-white" : "bg-white/15 text-white ring-1 ring-white/40 backdrop-blur-sm"}`}><Ikon nama={ikon(g.judul)} className="size-6" /></span>
              <span className="min-w-0 flex-1 lg:flex-none">
                <span className={`block font-display leading-tight ${terbuka ? "text-[24px] text-malam" : "text-[22px] text-white [text-shadow:0_1px_10px_rgba(10,36,64,.7)] lg:text-[17px]"}`}>{g.judul}</span>
                {!terbuka && Number.isFinite(termurah) && <span className="mt-1 block text-[12.5px] text-white/75">{teks.mulai} <b className="whitespace-nowrap font-bold text-white lg:block">Rp {termurah.toLocaleString("id-ID")}</b></span>}
              </span>
              {!terbuka && <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold text-white ring-1 ring-white/35 lg:mt-2">{teks.lihat} <span aria-hidden="true">→</span></span>}
            </button>
            {/* Panel harga tetap ada di tata letak supaya bisa dianimasikan; saat tertutup tidak bisa difokus atau dibaca. */}
            <div inert={!terbuka} data-panel aria-hidden={!terbuka} className={`relative grid transition-[grid-template-rows,opacity] duration-500 ${terbuka ? "grid-rows-[1fr] opacity-100 delay-150" : "grid-rows-[0fr] opacity-0 lg:hidden"}`}>
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
                  {tautan && <a href={tautan} {...(tautan.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="mt-4 inline-flex items-center gap-3 rounded-full bg-emas-tua py-1.5 pl-5 pr-1.5 text-sm font-bold text-white transition hover:brightness-110">{teks.pesan}<span className="grid size-8 place-items-center rounded-full bg-white/20">→</span></a>}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
