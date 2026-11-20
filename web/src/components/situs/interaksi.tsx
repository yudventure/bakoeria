"use client";

import { useEffect, useState } from "react";

/** Navigasi publik: latar solid setelah digulir, menu ponsel, dan animasi muncul. */
export function Nav() {
  const [solid, setSolid] = useState(false);
  const [buka, setBuka] = useState(false);
  useEffect(() => {
    const f = () => setSolid(window.scrollY > 40);
    f();
    window.addEventListener("scroll", f, { passive: true });
    /* Animasi muncul hanya untuk elemen di bawah layar saat halaman dibuka. Yang
       sudah terlihat tidak pernah disembunyikan, dan semuanya dipaksa tampil
       setelah 2,5 detik, supaya isi tidak pernah hilang bila pengamat gulir
       tidak berjalan (perayap, pratinjau tautan, cetak). */
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
  const tautan = [
    ["#menyelam", "Menyelam"],
    ["#cottage", "Cottage"],
    ["#sehari", "Sehari di Bakoeria"],
    ["#galeri", "Galeri"],
    ["#tanya", "Tanya jawab"],
  ];
  return (
    <header className={`fixed inset-x-0 top-0 z-40 border-b transition ${solid || buka ? "border-emas/25 bg-malam-dalam/95 backdrop-blur" : "border-transparent"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <a href="#atas" aria-label="Bakoeria Dive Resort, ke atas"><img src="/brand/bakoeria-logo-horizontal-gold.svg" alt="Bakoeria Dive Resort" className="h-9 w-auto" /></a>
        <button className="grid size-11 place-items-center lg:hidden" aria-expanded={buka} aria-controls="menu-situs" aria-label={buka ? "Tutup menu" : "Buka menu"} onClick={() => setBuka(!buka)}>
          <span className="block h-px w-6 bg-emas shadow-[0_6px_0_var(--color-emas),0_-6px_0_var(--color-emas)]" />
        </button>
        <nav id="menu-situs" aria-label="Utama" className={`${buka ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col gap-5 border-b border-emas/25 bg-malam-dalam px-5 py-8 lg:static lg:flex lg:flex-row lg:items-center lg:gap-8 lg:border-0 lg:bg-transparent lg:p-0`}>
          {tautan.map(([h, l]) => (
            <a key={h} href={h} onClick={() => setBuka(false)} className="text-xs font-bold uppercase tracking-[0.2em] text-gading hover:text-emas-muda">{l}</a>
          ))}
          <a href="#pesan" onClick={() => setBuka(false)} className="emas-gradasi self-start px-5 py-2.5 text-xs font-bold uppercase tracking-[0.22em] text-malam-dalam">Pesan</a>
        </nav>
      </div>
    </header>
  );
}
