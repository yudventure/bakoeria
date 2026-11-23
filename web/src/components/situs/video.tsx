"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Video latar dari YouTube: 16:9, diputar otomatis, berulang, tanpa suara, dan
 * tampil polos tanpa tombol, judul, atau logo.
 *
 * Caranya: pemutar disematkan tanpa kontrol dan dibuat sedikit lebih besar dari
 * bingkainya sehingga judul (atas) dan logo (kanan bawah) terpotong; lapisan
 * bening di atasnya mencegah kursor memunculkan antarmuka pemutar; dan video
 * baru ditampilkan setelah pemutar mengabari bahwa ia benar-benar memutar, jadi
 * layar judul awal tidak terlihat. Bila video tidak pernah berputar (dihapus,
 * dilarang disematkan, diblokir jaringan) atau pengunjung memilih "kurangi
 * gerakan", yang tampil tetap fotonya; layar galat YouTube tidak pernah muncul.
 *
 * Pemutar baru dimuat saat bingkai mendekati layar, dari youtube-nocookie.com.
 */
export default function VideoLatar({ id, poster, judul }: { id: string; poster: string; judul: string }) {
  const bingkai = useRef<HTMLDivElement>(null);
  const pemutar = useRef<HTMLIFrameElement>(null);
  const [muat, setMuat] = useState(false);
  const [jalan, setJalan] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = bingkai.current;
    if (!el || !("IntersectionObserver" in window)) return setMuat(true);
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && (setMuat(true), io.disconnect()), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Pemutar mengabari keadaannya lewat postMessage; angka 1 berarti sedang memutar. */
  useEffect(() => {
    if (!muat) return;
    let tunda: ReturnType<typeof setTimeout> | undefined;
    const tampil = () => { tunda ??= setTimeout(() => setJalan(true), 2600); };
    const dengar = (e: MessageEvent) => {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname)) return;
      try {
        const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (d?.info?.playerState === 1 || d?.info === 1) tampil();
      } catch { /* bukan pesan pemutar */ }
    };
    window.addEventListener("message", dengar);
    const minta = () => pemutar.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
    const ulang = setInterval(minta, 500);
    return () => { window.removeEventListener("message", dengar); clearInterval(ulang); clearTimeout(tunda); };
  }, [muat]);

  const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&playsinline=1&rel=0&enablejsapi=1`;
  return (
    <div ref={bingkai} className="muncul relative aspect-video w-full overflow-hidden rounded-[1.4rem] bg-malam" role="img" aria-label={judul}>
      <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />
      {muat && (
        <iframe
          ref={pemutar}
          src={src}
          title={judul}
          tabIndex={-1}
          aria-hidden="true"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          /* Lebih besar 200 x 112,5 px dari bingkai dan dipusatkan: judul dan logo jatuh di luar bingkai. */
          className={`pointer-events-none absolute left-1/2 top-1/2 h-[calc(100%+112.5px)] w-[calc(100%+200px)] max-w-none -translate-x-1/2 -translate-y-1/2 border-0 transition-opacity duration-1000 ${jalan ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {/* Lapisan bening: kursor dan sentuhan tidak pernah sampai ke pemutar. */}
      <div className="absolute inset-0" aria-hidden="true" />
    </div>
  );
}
