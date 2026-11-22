"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { hariIniWit, LABEL_STATUS } from "@/lib/booking";
import { LABEL_PERAN, layarUntuk, type Layar } from "@/lib/peran";
import { useData } from "./data";
import { cx } from "./ui";

export const LABEL_LAYAR: Record<Layar, string> = {
  ringkasan: "Ringkasan",
  kalender: "Kalender",
  pesanan: "Pesanan",
  tamu: "Tamu",
  kamar: "Kamar & tarif",
  laporan: "Laporan",
  keuangan: "Keuangan & aset",
  sdm: "SDM & gaji",
  gudang: "Stok gudang",
  sinkron: "Sinkronisasi OTA",
  website: "Website",
  statistik: "Statistik pengunjung",
  pengguna: "Pengguna & peran",
  pengaturan: "Pengaturan",
};

const GRUP: { judul: string; layar: Layar[] }[] = [
  { judul: "", layar: ["ringkasan"] },
  { judul: "Operasional", layar: ["kalender", "pesanan", "tamu", "kamar", "sinkron"] },
  { judul: "Bisnis", layar: ["laporan", "keuangan", "sdm", "gudang"] },
  { judul: "Resort", layar: ["website", "statistik", "pengguna", "pengaturan"] },
];

export const IKON: Record<Layar, string> = {
  ringkasan: "M4 13h6V4H4zm10 7h6v-9h-6zM4 20h6v-4H4zm10-11h6V4h-6z",
  kalender: "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  pesanan: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  tamu: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8",
  kamar: "M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6",
  laporan: "M4 20V10M10 20V4M16 20v-8M22 20H2",
  keuangan: "M3 7h18v10H3zM7 12h.01M17 12h.01M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  sdm: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  gudang: "M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8",
  sinkron: "M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4",
  website: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9M12 3C9.5 5.5 8.5 8.5 8.5 12s1 6.5 3.5 9",
  statistik: "M3 3v18h18M7 15l4-4 3 3 5-6",
  pengguna: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z",
  pengaturan: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
};

export const Ikon = ({ d, className }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={cx("size-5 shrink-0", className)} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

function Menu({ tutup }: { tutup?: () => void }) {
  const { akun, layar, keLayar } = useData();
  const boleh = layarUntuk(akun.peran);
  return (
    <nav aria-label="Menu dashboard" className="grid gap-5">
      {GRUP.map((g) => {
        const isi = g.layar.filter((l) => boleh.includes(l));
        if (!isi.length) return null;
        return (
          <div key={g.judul || "awal"}>
            {g.judul && <p className="mb-2 px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-panel-redup/80">{g.judul}</p>}
            <ul className="grid gap-1">
              {isi.map((l) => (
                <li key={l}>
                  <button
                    onClick={() => {
                      keLayar(l);
                      tutup?.();
                    }}
                    aria-current={layar === l ? "page" : undefined}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-[15px] font-bold transition",
                      layar === l ? "bg-panel-utama text-white" : "text-panel-tinta hover:bg-panel-lembut",
                    )}
                  >
                    <Ikon d={IKON[l]} className={layar === l ? "text-emas" : "text-panel-redup"} />
                    {LABEL_LAYAR[l]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function HariIni() {
  const { pesanan, bukaPesanan, keLayar } = useData();
  const hari = hariIniWit();
  const aktif = pesanan.filter((p) => !["CANCELLED", "NO_SHOW", "BLOCKED"].includes(p.status));
  const tiba = aktif.filter((p) => p.checkIn === hari);
  const pulang = aktif.filter((p) => p.checkOut === hari);
  const menginap = aktif.filter((p) => p.checkIn <= hari && hari < p.checkOut);
  const daftar = (judul: string, d: typeof aktif) =>
    d.length > 0 && (
      <div className="mt-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-panel-redup">{judul}</p>
        <ul className="mt-1 grid gap-0.5">
          {d.slice(0, 5).map((p) => (
            <li key={p.id}>
              <button
                className="w-full truncate rounded-lg px-2 py-1 text-left text-sm hover:bg-white"
                onClick={() => {
                  keLayar("kalender");
                  bukaPesanan(p.id);
                }}
              >
                <b>{p.guest?.name ?? p.code}</b> <span className="text-panel-redup">· {p.roomName}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  return (
    <div className="rounded-3xl bg-panel-latar p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emas-tua">Hari ini</p>
      <p className="mt-1 text-sm text-panel-tinta">
        {menginap.length} kamar terisi, {tiba.length} tiba, {pulang.length} pulang.
      </p>
      {daftar("Tiba", tiba)}
      {daftar("Pulang", pulang)}
    </div>
  );
}

function Lonceng() {
  const { pesanan, bukaPesanan, keLayar } = useData();
  const [buka, setBuka] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setBuka(false);
    document.addEventListener("mousedown", k);
    return () => document.removeEventListener("mousedown", k);
  }, []);
  const hari = hariIniWit();
  const perlu = useMemo(
    () => pesanan.filter((p) => (p.status === "TENTATIVE" || p.status === "CONFLICT") && p.checkOut >= hari).sort((a, b) => a.checkIn.localeCompare(b.checkIn)),
    [pesanan, hari],
  );
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setBuka(!buka)} aria-label={`Perlu tindakan: ${perlu.length}`} className="relative grid size-11 place-items-center rounded-full bg-panel-latar text-panel-tinta hover:bg-panel-lembut">
        <Ikon d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" />
        {perlu.length > 0 && <span className="angka absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-panel-merah px-1 text-[11px] font-bold text-white">{perlu.length}</span>}
      </button>
      {buka && (
        <div className="absolute right-0 top-13 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-3xl bg-white p-3 shadow-angkat ring-1 ring-panel-garis">
          <p className="px-2 py-1 text-sm font-bold">Perlu tindakan</p>
          {perlu.length === 0 ? (
            <p className="px-2 py-3 text-sm text-panel-redup">Tidak ada tahanan atau bentrok yang menunggu.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {perlu.map((p) => (
                <li key={p.id}>
                  <button
                    className="w-full rounded-2xl px-2 py-2 text-left hover:bg-panel-latar"
                    onClick={() => {
                      setBuka(false);
                      keLayar("kalender");
                      bukaPesanan(p.id);
                    }}
                  >
                    <span className={cx("text-xs font-bold", p.status === "CONFLICT" ? "text-panel-merah" : "text-panel-kuning")}>{LABEL_STATUS[p.status]}</span>
                    <span className="block truncate text-sm font-bold">{p.guest?.name ?? p.code}</span>
                    <span className="block text-xs text-panel-redup">
                      {p.roomName} · {p.checkIn} → {p.checkOut}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function MenuAkun() {
  const { akun } = useData();
  const [buka, setBuka] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setBuka(false);
    document.addEventListener("mousedown", k);
    return () => document.removeEventListener("mousedown", k);
  }, []);
  async function keluar() {
    await fetch("/api/keluar", { method: "POST" });
    window.location.reload();
  }
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setBuka(!buka)} className="flex items-center gap-2 rounded-full bg-panel-latar py-1.5 pl-1.5 pr-3 hover:bg-panel-lembut">
        <span className="grid size-8 place-items-center rounded-full bg-panel-utama text-sm font-bold text-emas">{akun.nama.slice(0, 1).toUpperCase()}</span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-36 truncate text-sm font-bold">{akun.nama}</span>
          <span className="block text-xs text-panel-redup">{LABEL_PERAN[akun.peran]}</span>
        </span>
      </button>
      {buka && (
        <div className="absolute right-0 top-13 z-40 w-60 rounded-3xl bg-white p-2 shadow-angkat ring-1 ring-panel-garis">
          <p className="truncate px-3 pb-2 pt-1 text-xs text-panel-redup">{akun.email}</p>
          <a href="#akun-saya" onClick={() => setBuka(false)} className="block rounded-2xl px-3 py-2 text-sm font-bold hover:bg-panel-latar">Ganti kata sandi</a>
          <a href="/" target="_blank" className="block rounded-2xl px-3 py-2 text-sm font-bold hover:bg-panel-latar">Buka situs publik</a>
          <button onClick={keluar} className="block w-full rounded-2xl px-3 py-2 text-left text-sm font-bold text-panel-merah hover:bg-panel-merah-lembut">Keluar</button>
        </div>
      )}
    </div>
  );
}

export function Rangka({ children, cari }: { children: ReactNode; cari: ReactNode }) {
  const [lembar, setLembar] = useState(false);
  return (
    <div className="min-h-svh bg-panel-latar text-panel-tinta">
      <header className="sticky top-0 z-30 bg-white shadow-panel">
        <div className="mx-auto flex h-[4.5rem] max-w-[100rem] items-center gap-3 px-4 sm:px-6">
          <button className="grid size-11 place-items-center rounded-full bg-panel-latar lg:hidden" onClick={() => setLembar(true)} aria-label="Buka menu">
            <Ikon d="M4 7h16M4 12h16M4 17h16" />
          </button>
          <a href="#ringkasan" className="flex shrink-0 items-center gap-3">
            <img src="/brand/bakoeria-mark-warna.svg" alt="" className="h-9 w-auto" />
            <span className="hidden leading-tight sm:block">
              <span className="block font-display text-lg font-semibold uppercase tracking-[0.08em] text-panel-utama">Bakoeria</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-emas-tua">Dive Resort</span>
            </span>
          </a>
          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
            <div className="hidden min-w-0 max-w-md flex-1 md:block">{cari}</div>
            <Lonceng />
            <MenuAkun />
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[100rem] gap-6 px-4 sm:px-6">
        <aside className="sticky top-[4.5rem] hidden h-[calc(100svh-4.5rem)] w-[17rem] shrink-0 flex-col gap-6 overflow-y-auto py-6 lg:flex">
          <Menu />
          <HariIni />
        </aside>
        <main className="min-w-0 flex-1 py-6 pb-24">{children}</main>
      </div>
      {lembar && (
        <div className="fixed inset-0 z-50 bg-panel-utama/40 lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setLembar(false)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[88svh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-bold">Menu</span>
              <button onClick={() => setLembar(false)} className="grid size-9 place-items-center rounded-full text-xl hover:bg-panel-lembut" aria-label="Tutup menu">×</button>
            </div>
            <div className="mb-5 md:hidden">{cari}</div>
            <Menu tutup={() => setLembar(false)} />
            <div className="mt-6">
              <HariIni />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
