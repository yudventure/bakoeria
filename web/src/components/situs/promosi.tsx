"use client";

import { useEffect, useState } from "react";
import { aturIzin, catatAsal, izinIklan, lacakIklan, muatTag, type KonfigIklan } from "@/lib/iklan-klien";

const ACARA = "bakoeria:atur-iklan";
type Teks = { meta: string; google: string; keduanya: string; boleh: string; tidak: string };

/**
 * Bilah persetujuan cookie iklan, pemuat Meta Pixel dan Google Ads setelah Boleh,
 * pencatat asal kunjungan, dan kejadian Contact saat tautan WhatsApp diketuk.
 * Tanpa ID yang diisi di dashboard, tidak ada bilah dan tidak ada tag.
 */
export default function Promosi({ konfig, teks }: { konfig: KonfigIklan; teks: Teks }) {
  const ada = Boolean(konfig.metaPixel || konfig.googleAds);
  const [tampil, setTampil] = useState(false);
  useEffect(() => {
    catatAsal();
    if (!ada) return;
    (window as Window & { __iklan?: KonfigIklan }).__iklan = konfig;
    const izin = izinIklan();
    if (izin === "ya") muatTag();
    if (izin === null) setTampil(true);
    const buka = () => setTampil(true);
    const klik = (e: MouseEvent) => { const a = (e.target as HTMLElement).closest?.("a[href*='wa.me']"); if (a) lacakIklan("Contact"); };
    window.addEventListener(ACARA, buka);
    document.addEventListener("click", klik);
    return () => { window.removeEventListener(ACARA, buka); document.removeEventListener("click", klik); };
  }, [ada, konfig]);
  if (!tampil) return null;
  const pilih = (v: "ya" | "tidak") => { aturIzin(v); setTampil(false); };
  return (
    <div data-izin-iklan role="dialog" aria-live="polite" aria-label={teks.boleh} className="fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-xl flex-col gap-3 rounded-2xl bg-malam p-4 text-[13.5px] leading-relaxed text-white/85 shadow-[0_20px_50px_rgba(10,36,64,.35)] sm:flex-row sm:items-center">
      <p className="min-w-0 flex-1">{konfig.metaPixel && konfig.googleAds ? teks.keduanya : konfig.metaPixel ? teks.meta : teks.google}</p>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={() => pilih("tidak")} className="rounded-full px-4 py-2 font-bold text-white/80 ring-1 ring-white/25 hover:text-white">{teks.tidak}</button>
        <button type="button" onClick={() => pilih("ya")} className="rounded-full bg-white px-4 py-2 font-bold text-malam">{teks.boleh}</button>
      </div>
    </div>
  );
}

/** Tautan di footer untuk menanyakan lagi (dan mencabut izin). */
export function TombolIzinIklan({ label }: { label: string }) {
  return <button type="button" onClick={() => window.dispatchEvent(new Event(ACARA))} className="font-bold hover:text-white">{label}</button>;
}
