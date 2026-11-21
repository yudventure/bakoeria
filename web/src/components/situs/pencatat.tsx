"use client";

import { useEffect } from "react";

/**
 * Mencatat satu kunjungan lewat beacon ke /api/kunjungan. Tanpa cookie dan
 * tanpa data pribadi: hanya jalur halamannya. Do Not Track dan Global Privacy
 * Control dihormati di sini dan di server.
 */
export function PencatatKunjungan() {
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
    try {
      const isi = JSON.stringify({ jalur: window.location.pathname });
      if (!nav.sendBeacon?.("/api/kunjungan", new Blob([isi], { type: "application/json" }))) {
        void fetch("/api/kunjungan", { method: "POST", headers: { "Content-Type": "application/json" }, body: isi, keepalive: true });
      }
    } catch {
      /* Mencatat kunjungan tidak boleh mengganggu halaman. */
    }
  }, []);
  return null;
}
