"use client";

import { useEffect, useState } from "react";
import { KAMUS, awalanBahasa, type Bahasa } from "@/lib/kamus";

/**
 * Menu atas: logo di kiri, menu dan tombol ganti bahasa di kanan, di atas foto hero
 * dengan latar terang halaman. Menempel di atas saat digulir.
 * Juga memasang animasi muncul yang aman: elemen yang sudah terlihat saat
 * halaman dibuka tidak pernah disembunyikan, dan semuanya dipaksa tampil
 * setelah 2,5 detik.
 */
export function Nav({ bahasa }: { bahasa: Bahasa }) {
  const t = KAMUS[bahasa];
  const [solid, setSolid] = useState(false);
  const [buka, setBuka] = useState(false);
  useEffect(() => {
    const f = () => setSolid(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    const semua = [...document.querySelectorAll<HTMLElement>(".muncul")];
    const bawah = semua.filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    semua.filter((el) => !bawah.includes(el)).forEach((el) => el.classList.add("tampil"));
    document.documentElement.classList.add("js");
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("tampil"), io.unobserve(e.target))), { threshold: 0.12 });
    bawah.forEach((el) => io.observe(el));
    const aman = setTimeout(() => semua.forEach((el) => el.classList.add("tampil")), 2500);
    return () => {
      window.removeEventListener("scroll", f);
      io.disconnect();
      clearTimeout(aman);
    };
  }, []);
  const menu = [
    ["#tentang", t.menu.tentang],
    ["#menginap", t.menu.menginap],
    ["#menyelam", t.menu.menyelam],
    ["#sehari", t.menu.sehari],
    ["#tanya", t.menu.tanya],
  ];
  return (
    <header className={`sticky top-0 z-40 bg-[#F6F4EF]/95 backdrop-blur-xl transition ${solid || buka ? "shadow-[0_6px_24px_rgba(4,28,62,.08)]" : ""}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <a href="#atas" aria-label="Bakoeria Dive Resort, ke atas" className="shrink-0">
          <img src="/brand/bakoeria-logo-horizontal-navy.svg" alt="Bakoeria Dive Resort" className="h-9 w-auto sm:h-10" />
        </a>
        <nav aria-label="Utama" className="hidden items-center gap-8 lg:flex">
          {menu.map(([h, l]) => (
            <a key={h} href={h} className="text-[14px] tracking-wide text-malam transition hover:text-emas-tua">{l}</a>
          ))}
          <GantiBahasa bahasa={bahasa} />
        </nav>
        <div className="ml-auto lg:hidden">
          <GantiBahasa bahasa={bahasa} />
        </div>
        <button className="grid size-11 place-items-center rounded-full text-malam lg:hidden" aria-expanded={buka} aria-controls="menu-ponsel" aria-label={buka ? t.tutupMenu : t.bukaMenu} onClick={() => setBuka(!buka)}>
          <span className="block h-px w-5 bg-current shadow-[0_5px_0_currentColor,0_-5px_0_currentColor]" />
        </button>
      </div>
      {buka && (
        <nav id="menu-ponsel" aria-label="Menu" className="grid gap-1 border-t border-malam/10 bg-[#F6F4EF] px-5 pb-5 pt-2 lg:hidden">
          {menu.map(([h, l]) => (
            <a key={h} href={h} onClick={() => setBuka(false)} className="rounded-2xl px-3 py-3 text-malam hover:bg-white">{l}</a>
          ))}
          <a href="#pesan" onClick={() => setBuka(false)} className="mt-2 rounded-full bg-emas-tua px-4 py-3 text-center font-bold text-white">{t.cekKetersediaan}</a>
        </nav>
      )}
    </header>
  );
}

/**
 * Tombol ganti bahasa: EN (alamat /) dan ID (alamat /id). Bagian halaman yang
 * sedang dibuka (#tentang dan seterusnya) ikut dibawa ke bahasa lain.
 */
function GantiBahasa({ bahasa }: { bahasa: Bahasa }) {
  const pilihan: [Bahasa, string, string][] = [
    ["en", "EN", "English"],
    ["id", "ID", "Bahasa Indonesia"],
  ];
  return (
    <div role="group" aria-label={KAMUS[bahasa].gantiBahasa} className="flex items-center rounded-full bg-white p-1 ring-1 ring-malam/10">
      {pilihan.map(([b, kode, nama]) => (
        <a
          key={b}
          href={awalanBahasa(b)}
          hrefLang={b}
          lang={b}
          title={nama}
          aria-current={b === bahasa ? "page" : undefined}
          onClick={(e) => {
            if (b === bahasa) return e.preventDefault();
            e.currentTarget.href = awalanBahasa(b) + window.location.hash;
          }}
          className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold tracking-wide transition ${b === bahasa ? "bg-malam text-white" : "text-malam/60 hover:text-malam"}`}
        >
          {kode}
        </a>
      ))}
    </div>
  );
}
