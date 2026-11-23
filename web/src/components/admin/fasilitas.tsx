"use client";

import { useEffect, useState } from "react";
import { IKON_FASILITAS, ikonFasilitas, type Fasilitas, type JenisFasilitas, type KatalogFasilitas } from "@/lib/fasilitas";
import { api } from "./api";
import { masukan, Tombol, useToast } from "./ui";

export const IkonGaris = ({ nama, className = "size-5" }: { nama: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ikonFasilitas(nama)} /></svg>
);

/* Satu salinan katalog untuk seluruh dashboard, supaya perubahan di satu tempat langsung terlihat di tempat lain. */
let simpanan: KatalogFasilitas | null = null;
const pendengar = new Set<(k: KatalogFasilitas) => void>();
export function useKatalog(): [KatalogFasilitas | null, (k: KatalogFasilitas) => void] {
  const [k, setK] = useState(simpanan);
  useEffect(() => {
    pendengar.add(setK);
    if (!simpanan) api<{ katalog: KatalogFasilitas }>("/api/fasilitas").then((r) => { simpanan = r.katalog; pendengar.forEach((f) => f(r.katalog)); }).catch(() => undefined);
    return () => { pendengar.delete(setK); };
  }, []);
  return [k, (baru) => { simpanan = baru; pendengar.forEach((f) => f(baru)); }];
}

function PilihIkon({ nilai, ubah }: { nilai: string; ubah: (v: string) => void }) {
  const [buka, setBuka] = useState(false);
  return (
    <div className="relative">
      <button type="button" aria-label={`Ikon: ${IKON_FASILITAS[nilai]?.nama ?? nilai}. Ganti ikon`} aria-expanded={buka} onClick={() => setBuka(!buka)} className="grid size-10 place-items-center rounded-xl bg-white text-panel-utama ring-1 ring-panel-garis hover:ring-panel-utama"><IkonGaris nama={nilai} /></button>
      {buka && (
        <div role="listbox" aria-label="Pilih ikon" className="absolute left-0 top-12 z-30 grid w-[19rem] grid-cols-7 gap-1 rounded-2xl bg-white p-2 shadow-angkat ring-1 ring-panel-garis">
          {Object.entries(IKON_FASILITAS).map(([k, v]) => (
            <button key={k} type="button" role="option" aria-selected={k === nilai} title={v.nama} aria-label={v.nama} onClick={() => { ubah(k); setBuka(false); }} className={`grid aspect-square place-items-center rounded-lg transition ${k === nilai ? "bg-panel-utama text-white" : "text-panel-tinta hover:bg-panel-latar"}`}><IkonGaris nama={k} /></button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Centang fasilitas berikon dari katalog. "Atur daftar" membuka penyunting katalog:
 * tambah fasilitas, ubah label Inggris/Indonesia, pilih ikon, atau hapus.
 */
export default function PilihFasilitas({ jenis, terpilih, ubah, judul }: { jenis: JenisFasilitas; terpilih: string[]; ubah: (kunci: string[]) => void; judul?: string }) {
  const toast = useToast();
  const [katalog, setKatalog] = useKatalog();
  const [atur, setAtur] = useState<Fasilitas[] | null>(null);
  const [sibuk, setSibuk] = useState(false);
  if (!katalog) return <p className="text-sm text-panel-redup">Memuat fasilitas…</p>;
  const daftar = katalog[jenis];

  async function simpanDaftar() {
    if (!atur) return;
    setSibuk(true);
    try {
      const r = await api<{ katalog: KatalogFasilitas }>("/api/fasilitas", { method: "PUT", body: { jenis, daftar: atur.filter((x) => x.en.trim() || x.id.trim()) } });
      setKatalog(r.katalog);
      ubah(terpilih.filter((k) => r.katalog[jenis].some((x) => x.kunci === k)));
      setAtur(null);
      toast("Daftar fasilitas disimpan");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div data-fasilitas={jenis} className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-panel-tinta">{judul ?? "Fasilitas"} <span className="font-normal text-panel-redup">· {terpilih.length} dicentang</span></span>
        {!atur ? (
          <button type="button" className="text-sm font-bold text-panel-utama underline" onClick={() => setAtur(daftar.map((x) => ({ ...x })))}>Atur daftar</button>
        ) : (
          <span className="flex gap-2">
            <Tombol kecil varian="garis" onClick={() => setAtur(null)}>Batal</Tombol>
            <Tombol kecil disabled={sibuk} onClick={simpanDaftar}>{sibuk ? "Menyimpan…" : "Simpan daftar"}</Tombol>
          </span>
        )}
      </div>

      {!atur ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {daftar.map((x) => {
            const on = terpilih.includes(x.kunci);
            return (
              <li key={x.kunci}>
                <label data-centang={x.kunci} className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ring-1 transition ${on ? "bg-panel-hijau-lembut ring-panel-hijau/40" : "bg-white ring-panel-garis hover:ring-panel-utama/40"}`}>
                  <input type="checkbox" className="size-4 shrink-0 accent-[#133250]" checked={on} onChange={(e) => ubah(e.target.checked ? [...terpilih, x.kunci] : terpilih.filter((k) => k !== x.kunci))} />
                  <span className={on ? "text-panel-hijau" : "text-panel-redup"}><IkonGaris nama={x.ikon} /></span>
                  <span className="min-w-0 leading-tight">
                    <span className="block text-sm">{x.id}</span>
                    {x.en !== x.id && <span className="block text-xs text-panel-redup">{x.en}</span>}
                  </span>
                </label>
              </li>
            );
          })}
          {daftar.length === 0 && <li className="text-sm text-panel-redup">Daftar masih kosong. Tekan “Atur daftar” untuk menambah.</li>}
        </ul>
      ) : (
        <div className="grid gap-2 rounded-2xl bg-panel-latar p-3">
          <p className="text-xs text-panel-redup">Daftar ini dipakai bersama{jenis === "kamar" ? " oleh semua kamar: label yang diubah ikut berubah di semua kamar, dan fasilitas yang dihapus dilepas dari semua kamar" : jenis === "selam" ? " oleh semua kelompok harga selam" : " oleh semua trip dan aktivitas"}.</p>
          {atur.map((x, i) => (
            <div key={x.kunci} data-atur={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:grid-cols-[auto_1fr_1fr_auto]">
              <PilihIkon nilai={x.ikon} ubah={(v) => setAtur(atur.map((y, j) => (j === i ? { ...y, ikon: v } : y)))} />
              <input aria-label="Label Indonesia" className={masukan} placeholder="Label Indonesia" value={x.id} onChange={(e) => setAtur(atur.map((y, j) => (j === i ? { ...y, id: e.target.value } : y)))} />
              <input aria-label="Label Inggris" className={`${masukan} col-start-2 sm:col-start-auto`} placeholder="Label Inggris" value={x.en} onChange={(e) => setAtur(atur.map((y, j) => (j === i ? { ...y, en: e.target.value } : y)))} />
              <button type="button" aria-label={`Hapus ${x.id || x.en || "fasilitas"}`} onClick={() => setAtur(atur.filter((_, j) => j !== i))} className="row-start-1 grid size-9 place-items-center rounded-full text-lg text-panel-redup hover:bg-panel-merah/10 hover:text-panel-merah sm:row-start-auto">×</button>
            </div>
          ))}
          <button type="button" className="justify-self-start text-sm font-bold text-panel-utama underline" onClick={() => setAtur([...atur, { kunci: `f-${Date.now().toString(36)}`, ikon: "centang", en: "", id: "" }])}>+ Tambah fasilitas</button>
        </div>
      )}
    </div>
  );
}
