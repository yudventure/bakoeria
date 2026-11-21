"use client";

import { useEffect, useState } from "react";
import { bolehLayar, type Layar } from "@/lib/peran";
import { api } from "./api";
import { PenyediaData, useData } from "./data";
import FormPesanan from "./form-pesanan";
import LaciPesanan from "./laci-pesanan";
import { Ikon, Rangka } from "./rangka";
import type { AkunSaya } from "./tipe";
import { Bidang, masukan, Modal, PenyediaToast, Tombol, useToast } from "./ui";
import Gudang from "./layar/gudang";
import DaftarPesanan from "./layar/pesanan";
import Kalender from "./layar/kalender";
import LayarKamar from "./layar/kamar";
import LayarStatistik from "./layar/statistik";
import Keuangan from "./layar/keuangan";
import Laporan from "./layar/laporan";
import Pengaturan from "./layar/pengaturan";
import Pengguna from "./layar/pengguna";
import Ringkasan from "./layar/ringkasan";
import Sdm from "./layar/sdm";
import Sinkron from "./layar/sinkron";
import DaftarTamu from "./layar/tamu";
import Website from "./layar/website";

function GantiSandi() {
  const toast = useToast();
  const [buka, setBuka] = useState(false);
  const [f, setF] = useState({ lama: "", baru: "" });
  useEffect(() => {
    const cek = () => {
      if (window.location.hash === "#akun-saya") {
        setBuka(true);
        history.replaceState(null, "", window.location.pathname + "#ringkasan");
      }
    };
    cek();
    window.addEventListener("hashchange", cek);
    return () => window.removeEventListener("hashchange", cek);
  }, []);
  async function simpan() {
    try {
      await api("/api/saya", { method: "PATCH", body: f });
      toast("Kata sandi diganti. Silakan masuk lagi.");
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    }
  }
  return (
    <Modal judul="Ganti kata sandi" buka={buka} tutup={() => setBuka(false)} lebar="max-w-md" kaki={<><Tombol varian="garis" onClick={() => setBuka(false)}>Batal</Tombol><Tombol onClick={simpan}>Simpan</Tombol></>}>
      <div className="grid gap-4">
        <Bidang label="Kata sandi sekarang"><input className={masukan} type="password" autoComplete="current-password" value={f.lama} onChange={(e) => setF({ ...f, lama: e.target.value })} /></Bidang>
        <Bidang label="Kata sandi baru" ket="Minimal 10 karakter. Semua perangkat lain akan keluar."><input className={masukan} type="password" autoComplete="new-password" value={f.baru} onChange={(e) => setF({ ...f, baru: e.target.value })} /></Bidang>
      </div>
    </Modal>
  );
}

function Isi() {
  const { layar, akun, keLayar } = useData();
  const [cari, setCari] = useState("");

  useEffect(() => {
    // Baca ulang sambungan OTA yang lebih dari 15 menit tidak dibaca, diam-diam.
    if (bolehLayar(akun.peran, "sinkron")) api("/api/sinkron/jalankan", { body: {} }).catch(() => {});
  }, [akun.peran]);

  const kotakCari = bolehLayar(akun.peran, "pesanan") ? (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        keLayar("pesanan");
      }}
      className="relative"
    >
      <Ikon d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" className="absolute left-4 top-1/2 -translate-y-1/2 text-panel-redup" />
      <input
        value={cari}
        onChange={(e) => {
          setCari(e.target.value);
          if (e.target.value && layar !== "pesanan") keLayar("pesanan");
        }}
        placeholder="Cari tamu, kode, atau telepon"
        aria-label="Cari pesanan"
        className="w-full rounded-full bg-panel-latar py-3 pl-11 pr-4 text-sm outline-none ring-panel-utama/20 focus:bg-white focus:ring-2"
      />
    </form>
  ) : null;

  const LAYAR: Record<Layar, React.ReactNode> = {
    ringkasan: <Ringkasan />,
    kalender: <Kalender />,
    pesanan: <DaftarPesanan cariAwal={cari} />,
    tamu: <DaftarTamu />,
    kamar: <LayarKamar />,
    laporan: <Laporan />,
    keuangan: <Keuangan />,
    sdm: <Sdm />,
    gudang: <Gudang />,
    sinkron: <Sinkron />,
    website: <Website />,
    statistik: <LayarStatistik />,
    pengguna: <Pengguna />,
    pengaturan: <Pengaturan />,
  };

  return (
    <Rangka cari={kotakCari}>
      {LAYAR[layar]}
      <LaciPesanan />
      <FormPesanan />
      <GantiSandi />
    </Rangka>
  );
}

export default function Dasbor({ akun }: { akun: AkunSaya }) {
  return (
    <PenyediaToast>
      <PenyediaData akun={akun} layarAwal="ringkasan">
        <Isi />
      </PenyediaData>
    </PenyediaToast>
  );
}
