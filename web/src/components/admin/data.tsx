"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, GalatApi } from "./api";
import type { AkunSaya, Kamar, Pesanan } from "./tipe";
import { bolehLayar, type Layar } from "@/lib/peran";

interface Data {
  akun: AkunSaya;
  kamar: Kamar[];
  pesanan: Pesanan[];
  memuat: boolean;
  galat: string;
  tanpaDb: boolean;
  muat: () => Promise<void>;
  /** Mengganti satu pesanan di daftar tanpa memuat ulang semuanya. */
  ganti: (p: Pesanan) => void;
  buang: (id: string) => void;
  bukaPesanan: (id: string | null) => void;
  pesananTerbuka: string | null;
  bukaForm: (awal?: Partial<Pesanan> | null) => void;
  tutupForm: () => void;
  formAwal: Partial<Pesanan> | null | undefined;
  layar: Layar;
  keLayar: (l: Layar) => void;
}

const K = createContext<Data | null>(null);
export const useData = () => {
  const d = useContext(K);
  if (!d) throw new Error("useData di luar PenyediaData");
  return d;
};

export function PenyediaData({ akun, children, layarAwal }: { akun: AkunSaya; children: ReactNode; layarAwal: Layar }) {
  const [kamar, setKamar] = useState<Kamar[]>([]);
  const [pesanan, setPesanan] = useState<Pesanan[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [tanpaDb, setTanpaDb] = useState(false);
  const [pesananTerbuka, bukaPesanan] = useState<string | null>(null);
  const [formAwal, setFormAwal] = useState<Partial<Pesanan> | null | undefined>(undefined);
  const [layar, setLayar] = useState<Layar>(layarAwal);
  const sedang = useRef(false);

  const muat = useCallback(async () => {
    if (!bolehLayar(akun.peran, "kalender")) {
      setMemuat(false);
      return;
    }
    if (sedang.current) return;
    sedang.current = true;
    try {
      const r = await api<{ kamar: Kamar[]; pesanan: Pesanan[] }>("/api/kalender");
      setKamar(r.kamar);
      setPesanan(r.pesanan);
      setGalat("");
      setTanpaDb(false);
    } catch (e) {
      if (e instanceof GalatApi && e.data.kode === "tanpa-db") setTanpaDb(true);
      setGalat(e instanceof Error ? e.message : "Data tidak bisa dimuat.");
    } finally {
      sedang.current = false;
      setMemuat(false);
    }
  }, [akun.peran]);

  useEffect(() => {
    muat();
    const t = setInterval(() => document.visibilityState === "visible" && muat(), 60000);
    return () => clearInterval(t);
  }, [muat]);

  useEffect(() => {
    const dariHash = () => {
      const h = window.location.hash.slice(1) as Layar;
      if (h && bolehLayar(akun.peran, h)) setLayar(h);
    };
    dariHash();
    window.addEventListener("hashchange", dariHash);
    return () => window.removeEventListener("hashchange", dariHash);
  }, [akun.peran]);

  const keLayar = useCallback((l: Layar) => {
    setLayar(l);
    if (window.location.hash.slice(1) !== l) history.pushState(null, "", "#" + l);
    window.scrollTo({ top: 0 });
  }, []);

  const nilai = useMemo<Data>(
    () => ({
      akun,
      kamar,
      pesanan,
      memuat,
      galat,
      tanpaDb,
      muat,
      ganti: (p) => setPesanan((d) => (d.some((x) => x.id === p.id) ? d.map((x) => (x.id === p.id ? p : x)) : [...d, p])),
      buang: (id) => setPesanan((d) => d.filter((x) => x.id !== id)),
      bukaPesanan,
      pesananTerbuka,
      bukaForm: (awal) => setFormAwal(awal ?? null),
      tutupForm: () => setFormAwal(undefined),
      formAwal,
      layar,
      keLayar,
    }),
    [akun, kamar, pesanan, memuat, galat, tanpaDb, muat, pesananTerbuka, formAwal, layar, keLayar],
  );
  return <K.Provider value={nilai}>{children}</K.Provider>;
}
