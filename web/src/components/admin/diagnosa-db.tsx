"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { Kartu, Memuat, Pil, Tombol } from "./ui";

interface Diagnosa {
  status: "ok" | "tidak-diisi" | "gagal";
  host: string;
  port: number;
  database: string;
  user: string;
  sandiPanjang: number;
  socket: string;
  cara: string;
  variabelTerbaca: string[];
  soketDitemukan: string[];
  galat: string;
  arti: string;
}

/** Diagnosis koneksi database untuk developer dan pemilik, seperti di Mambetron. Tidak pernah menampilkan sandi. */
export default function DiagnosaDb() {
  const [d, setD] = useState<Diagnosa | null>(null);
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const muat = () => {
    setSibuk(true);
    api<{ diagnosa: Diagnosa }>("/api/diagnosa-db")
      .then((r) => setD(r.diagnosa))
      .catch((e) => setGalat(e.message))
      .finally(() => setSibuk(false));
  };
  useEffect(muat, []);
  if (galat) return null;
  if (!d) return <Memuat teks="Memeriksa database…" />;
  const baris = (k: string, v: React.ReactNode) => (
    <div className="flex flex-wrap justify-between gap-2 border-b border-panel-garis/70 py-2 last:border-0">
      <dt className="text-panel-redup">{k}</dt>
      <dd className="break-all font-mono text-[13px]">{v}</dd>
    </div>
  );
  return (
    <Kartu
      judul={<span className="flex items-center gap-2">Koneksi database <Pil nada={d.status === "ok" ? "hijau" : d.status === "tidak-diisi" ? "kuning" : "merah"}>{d.status === "ok" ? "Terhubung" : d.status === "tidak-diisi" ? "Belum diatur" : "Gagal"}</Pil></span>}
      ket="Nilai dari variabel environment di panel Node.js Hostinger. Sandi tidak pernah ditampilkan."
      aksi={<Tombol kecil varian="garis" disabled={sibuk} onClick={muat}>{sibuk ? "Memeriksa…" : "Periksa lagi"}</Tombol>}
    >
      {d.arti && <p className="mb-4 rounded-2xl bg-panel-kuning-lembut px-4 py-3 text-sm text-panel-kuning"><b>Kemungkinan penyebab:</b> {d.arti}</p>}
      {d.galat && <pre className="mb-4 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-panel-merah-lembut px-4 py-3 text-xs text-panel-merah">{d.galat.split(" | ").join("\n")}</pre>}
      <dl className="text-sm">
        {baris("DB_HOST", d.host)}
        {baris("DB_PORT", d.port)}
        {baris("DB_NAME", d.database || <span className="text-panel-merah">kosong</span>)}
        {baris("DB_USER", d.user || <span className="text-panel-merah">kosong</span>)}
        {baris("DB_PASSWORD", d.sandiPanjang ? `terisi, ${d.sandiPanjang} karakter` : <span className="text-panel-merah">kosong</span>)}
        {d.socket && baris("DB_SOCKET", d.socket)}
        {baris("Cara terhubung", d.cara || "–")}
        {baris("Soket MySQL di server", d.soketDitemukan.length ? d.soketDitemukan.join(", ") : "tidak ditemukan")}
        {baris("Variabel yang terbaca", d.variabelTerbaca.length ? d.variabelTerbaca.join(", ") : "tidak ada")}
      </dl>
    </Kartu>
  );
}
