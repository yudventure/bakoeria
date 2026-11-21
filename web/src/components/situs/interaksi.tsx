"use client";

import { useEffect, useState } from "react";

/**
 * Menu atas: logo di kiri, menu dan tombol pesan di kanan. Di atas foto hero
 * ia transparan dengan teks terang; setelah digulir ia menjadi putih.
 * Juga memasang animasi muncul yang aman: elemen yang sudah terlihat saat
 * halaman dibuka tidak pernah disembunyikan, dan semuanya dipaksa tampil
 * setelah 2,5 detik.
 */
export function Nav() {
  const [solid, setSolid] = useState(false);
  const [buka, setBuka] = useState(false);
  useEffect(() => {
    const f = () => setSolid(window.scrollY > 120);
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
    ["#tentang", "Tentang"],
    ["#menginap", "Menginap"],
    ["#menyelam", "Menyelam"],
    ["#sehari", "Sehari"],
    ["#tanya", "Tanya jawab"],
  ];
  const terang = solid || buka;
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition ${terang ? "bg-white/90 shadow-[0_6px_24px_rgba(4,28,62,.08)] backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <a href="#atas" aria-label="Bakoeria Dive Resort, ke atas" className="shrink-0">
          <img src={terang ? "/brand/bakoeria-logo-horizontal-navy.svg" : "/brand/bakoeria-logo-horizontal-ivory.svg"} alt="Bakoeria Dive Resort" className="h-9 w-auto sm:h-10" />
        </a>
        <nav aria-label="Utama" className="hidden items-center gap-8 lg:flex">
          {menu.map(([h, l]) => (
            <a key={h} href={h} className={`text-[14px] tracking-wide transition hover:opacity-70 ${terang ? "text-malam" : "text-white"}`}>{l}</a>
          ))}
          <a href="#pesan" className={`rounded-full px-5 py-2.5 text-[14px] font-bold transition ${terang ? "bg-emas-tua text-white hover:brightness-110" : "bg-gading text-malam hover:bg-white"}`}>Pesan sekarang</a>
        </nav>
        <button className={`grid size-11 place-items-center rounded-full lg:hidden ${terang ? "text-malam" : "text-white"}`} aria-expanded={buka} aria-controls="menu-ponsel" aria-label={buka ? "Tutup menu" : "Buka menu"} onClick={() => setBuka(!buka)}>
          <span className="block h-px w-5 bg-current shadow-[0_5px_0_currentColor,0_-5px_0_currentColor]" />
        </button>
      </div>
      {buka && (
        <nav id="menu-ponsel" aria-label="Menu" className="grid gap-1 border-t border-malam/10 bg-white px-5 pb-5 pt-2 lg:hidden">
          {menu.map(([h, l]) => (
            <a key={h} href={h} onClick={() => setBuka(false)} className="rounded-2xl px-3 py-3 text-malam hover:bg-[#F6F4EF]">{l}</a>
          ))}
          <a href="#pesan" onClick={() => setBuka(false)} className="mt-2 rounded-full bg-emas-tua px-4 py-3 text-center font-bold text-white">Pesan sekarang</a>
        </nav>
      )}
    </header>
  );
}
