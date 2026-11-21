"use client";

import { useEffect, useState } from "react";

/**
 * Menu kaca berbentuk pil dengan logo di tengah. Di atas foto hero ia
 * transparan dengan teks terang; setelah digulir ia menjadi putih buram.
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
  const kiri = [
    ["#tentang", "Tentang"],
    ["#menginap", "Menginap"],
    ["#menyelam", "Menyelam"],
  ];
  const kanan = [
    ["#sehari", "Sehari"],
    ["#tanya", "Tanya jawab"],
  ];
  const terang = solid || buka;
  const tautan = `text-[13px] tracking-wide transition hover:opacity-70 ${terang ? "text-malam" : "text-white"}`;
  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-5">
      <div className={`mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border px-3 py-2 backdrop-blur-xl transition sm:px-5 ${terang ? "border-malam/10 bg-white/85 shadow-[0_8px_30px_rgba(4,28,62,.08)]" : "border-white/30 bg-white/10"}`}>
        <nav aria-label="Utama kiri" className="hidden flex-1 items-center gap-7 lg:flex">
          {kiri.map(([h, l]) => <a key={h} href={h} className={tautan}>{l}</a>)}
        </nav>
        <a href="#atas" aria-label="Bakoeria Dive Resort, ke atas" className={`grid size-11 shrink-0 place-items-center rounded-full border ${terang ? "border-malam/15" : "border-white/50"}`}>
          <img src={terang ? "/brand/bakoeria-mark-navy.svg" : "/brand/bakoeria-mark-ivory.svg"} alt="" className="h-6 w-auto" />
        </a>
        <span className={`mr-auto font-display text-lg tracking-[0.08em] lg:hidden ${terang ? "text-malam" : "text-white"}`}>BAKOERIA</span>
        <nav aria-label="Utama kanan" className="hidden flex-1 items-center justify-end gap-7 lg:flex">
          {kanan.map(([h, l]) => <a key={h} href={h} className={tautan}>{l}</a>)}
          <a href="#pesan" className="rounded-full bg-gading px-5 py-2.5 text-[13px] font-bold text-malam shadow-sm transition hover:bg-white">Pesan sekarang</a>
        </nav>
        <button className={`grid size-11 place-items-center rounded-full lg:hidden ${terang ? "text-malam" : "text-white"}`} aria-expanded={buka} aria-controls="menu-ponsel" aria-label={buka ? "Tutup menu" : "Buka menu"} onClick={() => setBuka(!buka)}>
          <span className="block h-px w-5 bg-current shadow-[0_5px_0_currentColor,0_-5px_0_currentColor]" />
        </button>
      </div>
      {buka && (
        <nav id="menu-ponsel" aria-label="Menu" className="mx-auto mt-2 grid max-w-6xl gap-1 rounded-3xl border border-malam/10 bg-white/95 p-3 shadow-[0_8px_30px_rgba(4,28,62,.12)] backdrop-blur-xl lg:hidden">
          {[...kiri, ...kanan].map(([h, l]) => (
            <a key={h} href={h} onClick={() => setBuka(false)} className="rounded-2xl px-4 py-3 text-malam hover:bg-gading">{l}</a>
          ))}
          <a href="#pesan" onClick={() => setBuka(false)} className="mt-1 rounded-full bg-emas-tua px-4 py-3 text-center font-bold text-white">Pesan sekarang</a>
        </nav>
      )}
    </header>
  );
}
