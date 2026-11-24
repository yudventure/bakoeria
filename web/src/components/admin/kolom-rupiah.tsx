"use client";

import { useLayoutEffect, useRef } from "react";
import { angkaRupiah, pecahHarga, susunHarga, titikRibuan } from "@/lib/rupiah-teks";
import { masukan } from "./ui";

/**
 * Kolom harga rupiah: "Rp" sudah tertulis dan titik ribuan muncul sendiri saat
 * mengetik, jadi pengguna cukup mengetik angkanya. Yang dikirim ke `ubah` hanya
 * angkanya ("4000000"); kosong berarti tidak diisi.
 */
export function KolomRupiah({ nilai, ubah, label, placeholder, disabled, autoFocus, className = "", id, "aria-describedby": jelas }: {
  nilai: string | number | null | undefined;
  ubah: (angka: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  /** Diisi Bidang supaya labelnya terhubung ke kolom ini. */
  id?: string;
  "aria-describedby"?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  /* Posisi kursor dihitung dari jumlah angka di kirinya, supaya tidak meloncat ke ujung saat titik bertambah. */
  const kursor = useRef<number | null>(null);
  const d = angkaRupiah(nilai);
  const tampil = titikRibuan(d);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || kursor.current === null || document.activeElement !== el) return;
    let sisa = kursor.current;
    let pos = 0;
    while (pos < tampil.length && sisa > 0) { if (/\d/.test(tampil[pos])) sisa--; pos++; }
    el.setSelectionRange(pos, pos);
    kursor.current = null;
  }, [tampil]);
  return (
    <div className={`relative min-w-0 ${className}`}>
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[15px] text-panel-redup" aria-hidden="true">Rp</span>
      <input
        ref={ref}
        id={id}
        aria-label={label}
        aria-describedby={jelas}
        className={masukan}
        style={{ paddingLeft: "2.6rem" }}
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder ? titikRibuan(angkaRupiah(placeholder)) || placeholder : undefined}
        value={tampil}
        onChange={(e) => {
          const v = e.target.value;
          kursor.current = (v.slice(0, e.target.selectionStart ?? v.length).match(/\d/g) ?? []).length;
          ubah(angkaRupiah(v).slice(0, 13));
        }}
      />
    </div>
  );
}

/**
 * Harga yang disimpan sebagai teks di isi situs ("Rp 4.000.000"). Diisi seperti
 * KolomRupiah; dengan `akhiran`, keterangan di belakang harga ("per orang") diisi di
 * kolom kedua.
 */
export function KolomHargaTeks({ nilai, ubah, label, placeholder, akhiran, className = "" }: { nilai: string; ubah: (teks: string) => void; label?: string; placeholder?: string; akhiran?: string; className?: string }) {
  const h = pecahHarga(nilai);
  const rupiah = <KolomRupiah label={label} nilai={h.angka} placeholder={placeholder} ubah={(a) => ubah(susunHarga(a, h.akhiran))} className={akhiran === undefined ? className : ""} />;
  if (akhiran === undefined) return rupiah;
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 ${className}`}>
      {rupiah}
      <input aria-label={label ? `${label}: keterangan` : "Keterangan harga"} className={masukan} placeholder={akhiran} value={h.akhiran} onChange={(e) => ubah(susunHarga(h.angka, e.target.value))} />
    </div>
  );
}
