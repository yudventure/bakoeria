"use client";

import { useEffect, useState } from "react";

/**
 * Judul hero yang hidup: huruf "bakoeria" naik satu per satu saat halaman
 * dibuka, lalu baris kata yang bergantian. Hurufnya terlihat di keadaan
 * dasar; animasinya hanya CSS satu kali, jadi tanpa animasi pun judul tetap
 * tampil. Pergantian kata berhenti bila pengguna meminta gerak dikurangi,
 * karena ia bergerak sendiri tanpa diminta.
 */
export function JudulHero({ awalan, kata }: { awalan: string; kata: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (kata.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => document.visibilityState === "visible" && setI((x) => (x + 1) % kata.length), 2600);
    return () => clearInterval(t);
  }, [kata.length]);
  return (
    <div data-hero-teks>
      <div className="flex items-start gap-4">
        <h1 aria-label="bakoeria" className="font-display text-[clamp(64px,13.5vw,190px)] font-normal leading-[0.86] tracking-[-0.035em] text-white">
          {"bakoeria".split("").map((h, n) => (
            <span key={n} aria-hidden="true" className="inline-block overflow-hidden pb-[0.06em] align-bottom">
              <span className="huruf-naik inline-block" style={{ "--n": n } as React.CSSProperties}>{h}</span>
            </span>
          ))}
        </h1>
        <span className="muncul-lambat mt-[2vw] hidden text-[13px] tracking-[0.18em] text-white [text-shadow:0_1px_10px_rgba(10,36,64,.7)] sm:block" style={{ "--tunda-ms": "900ms" } as React.CSSProperties}>dive resort</span>
      </div>
      {kata.length > 0 && (
        <p className="muncul-lambat mt-5 flex flex-wrap items-baseline gap-x-3 font-display text-[clamp(22px,2.6vw,34px)] italic leading-tight text-white [text-shadow:0_1px_14px_rgba(10,36,64,.6)]" style={{ "--tunda-ms": "1050ms" } as React.CSSProperties}>
          {awalan && <span className="text-white/80">{awalan}</span>}
          <span className="sr-only">{kata.join(", ")}</span>
          <span aria-hidden="true" className="relative inline-block h-[1.25em] overflow-hidden align-bottom text-emas-muda">
            <span className="flex flex-col transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]" style={{ transform: `translateY(-${i * 1.25}em)` }}>
              {kata.map((k, n) => (
                <span key={n} className={`block h-[1.25em] whitespace-nowrap transition-opacity duration-700 ${n === i ? "opacity-100" : "opacity-0"}`}>{k}</span>
              ))}
            </span>
          </span>
        </p>
      )}
    </div>
  );
}

/**
 * Efek scroll untuk seluruh beranda, satu pengendali dengan requestAnimationFrame:
 * - [data-hero-foto]  foto hero membesar dan turun sedikit saat hero digulir keluar
 * - [data-hero-teks]  judul naik dan memudar
 * - [data-parallax]   bergerak vertikal dengan faktor itu relatif terhadap layar
 * - [data-geser]      bergeser mendatar dengan faktor itu
 * - [data-kemajuan]   garis kemajuan baca (skala horizontal)
 * Hanya transform dan opacity, jadi tidak memicu tata letak ulang. Efek ini
 * digerakkan oleh scroll pengguna sendiri dan berhenti begitu tangannya
 * berhenti, jadi tetap berjalan walau sistem meminta gerak dikurangi.
 */
export function Gerak() {
  useEffect(() => {
    const q = <T extends HTMLElement>(s: string) => [...document.querySelectorAll<T>(s)];
    const heroFoto = q("[data-hero-foto]");
    const heroTeks = q("[data-hero-teks]");
    const parallax = q("[data-parallax]");
    const geser = q("[data-geser]");
    const kemajuan = q("[data-kemajuan]");
    let jalan = false;
    const hitung = () => {
      jalan = false;
      const y = window.scrollY;
      const tinggi = window.innerHeight;
      const hero = Math.min(1, Math.max(0, y / (tinggi * 0.9)));
      for (const el of heroFoto) el.style.transform = `translate3d(0, ${hero * 12}%, 0) scale(${1.04 + hero * 0.1})`;
      for (const el of heroTeks) {
        el.style.transform = `translate3d(0, ${-hero * 90}px, 0)`;
        el.style.opacity = String(1 - hero * 1.1);
      }
      for (const el of parallax) {
        const r = el.parentElement!.getBoundingClientRect();
        if (r.bottom < -tinggi || r.top > tinggi * 2) continue;
        const pusat = (r.top + r.height / 2 - tinggi / 2) / tinggi;
        el.style.transform = `translate3d(0, ${pusat * Number(el.dataset.parallax) * 100}px, 0) scale(1.15)`;
      }
      for (const el of geser) {
        // Hanya dihitung saat dekat layar, dan dibatasi agar tidak pernah melebar ke luar halaman.
        const r = el.getBoundingClientRect();
        if (r.bottom < -tinggi || r.top > tinggi * 2) continue;
        const pusat = Math.max(-1, Math.min(1, (r.top + r.height / 2 - tinggi / 2) / tinggi));
        el.style.transform = `translate3d(${pusat * Number(el.dataset.geser) * 60}px, 0, 0)`;
      }
      const total = document.documentElement.scrollHeight - tinggi;
      for (const el of kemajuan) el.style.transform = `scaleX(${total > 0 ? y / total : 0})`;
    };
    const minta = () => {
      if (!jalan) {
        jalan = true;
        requestAnimationFrame(hitung);
      }
    };
    hitung();
    window.addEventListener("scroll", minta, { passive: true });
    window.addEventListener("resize", minta);
    return () => {
      window.removeEventListener("scroll", minta);
      window.removeEventListener("resize", minta);
    };
  }, []);
  return null;
}
