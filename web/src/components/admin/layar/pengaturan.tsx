"use client";

import { useEffect, useState } from "react";
import { LABEL_CHANNEL, type Channel } from "@/lib/booking";
import type { Pengaturan as TPengaturan } from "@/lib/pengaturan";
import { api } from "../api";
import { useData } from "../data";
import { Bidang, Galat, Kartu, masukan, Memuat, Pil, Tombol, useToast } from "../ui";
import DataDemo from "../data-demo";
import DiagnosaDb from "../diagnosa-db";

interface Status {
  database: boolean;
  sessionSecret: boolean;
  penyiapanKunci: boolean;
  email: boolean;
  folderData: boolean;
}

export default function Pengaturan() {
  const { akun } = useData();
  const toast = useToast();
  const [p, setP] = useState<TPengaturan | null>(null);
  const [st, setSt] = useState<Status | null>(null);
  const [galat, setGalat] = useState("");
  const boleh = akun.peran === "developer" || akun.peran === "pemilik";
  useEffect(() => {
    api<{ pengaturan: TPengaturan; status: Status }>("/api/pengaturan").then((r) => { setP(r.pengaturan); setSt(r.status); }).catch((e) => setGalat(e.message));
  }, []);
  if (galat) return <Galat pesan={galat} />;
  if (!p || !st) return <Memuat />;

  async function simpan() {
    try {
      const r = await api<{ pengaturan: TPengaturan }>("/api/pengaturan", { method: "PUT", body: { pengaturan: p } });
      setP(r.pengaturan);
      toast("Pengaturan disimpan");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    }
  }
  const baris = (ok: boolean, nama: string, ket: string) => (
    <li className="flex items-start justify-between gap-4 py-3">
      <span><b className="font-mono text-sm">{nama}</b><span className="block text-sm text-panel-redup">{ket}</span></span>
      <Pil nada={ok ? "hijau" : "kuning"}>{ok ? "Terisi" : "Belum"}</Pil>
    </li>
  );
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        {boleh && <Tombol onClick={simpan}>Simpan</Tombol>}
      </div>
      <Kartu judul="Resort">
        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang label="Nama resort"><input className={masukan} disabled={!boleh} value={p.namaResort} onChange={(e) => setP({ ...p, namaResort: e.target.value })} /></Bidang>
          <Bidang label="Email pemberitahuan pesanan" ket="Pesanan dari website dikirim ke sini. Kosong berarti ke alamat pengirim (SMTP_USER)."><input className={masukan} disabled={!boleh} type="email" value={p.emailNotifikasi} onChange={(e) => setP({ ...p, emailNotifikasi: e.target.value })} /></Bidang>
          <Bidang label="Lama tahanan dari website (jam)" ket="Tahanan yang tidak dikonfirmasi batal sendiri setelah ini."><input className={masukan} disabled={!boleh} type="number" min={1} max={168} value={p.jamTahanan} onChange={(e) => setP({ ...p, jamTahanan: Number(e.target.value) })} /></Bidang>
          <Bidang label="Uang muka yang diminta (%)"><input className={masukan} disabled={!boleh} type="number" min={0} max={100} value={p.persenDp} onChange={(e) => setP({ ...p, persenDp: Number(e.target.value) })} /></Bidang>
          <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2"><input type="checkbox" className="size-4" disabled={!boleh} checked={p.terimaPesananWeb} onChange={(e) => setP({ ...p, terimaPesananWeb: e.target.checked })} /> Terima pemesanan langsung dari website</label>
        </div>
      </Kartu>
      <Kartu judul="Perkiraan komisi per sumber" ket="Dipakai bila komisi pesanan dikosongkan. Persen dari total.">
        <div className="grid gap-4 sm:grid-cols-3">
          {(["BOOKING_COM", "AGODA", "TRAVELOKA", "AIRBNB", "AGEN"] as Channel[]).map((c) => (
            <Bidang key={c} label={`${LABEL_CHANNEL[c]} (%)`}>
              <input className={masukan} disabled={!boleh} type="number" min={0} max={50} step="0.5" value={Math.round((p.komisi[c] ?? 0) * 1000) / 10} onChange={(e) => setP({ ...p, komisi: { ...p.komisi, [c]: Number(e.target.value) / 100 } })} />
            </Bidang>
          ))}
        </div>
      </Kartu>
      {boleh && <DiagnosaDb />}
      {boleh && <DataDemo />}
      <Kartu judul="Kesiapan server" ket="Variabel di panel Node.js Hostinger. Nilainya tidak pernah ditampilkan.">
        <ul className="divide-y divide-panel-garis">
          {baris(st.database, "DB_NAME, DB_USER, DB_PASSWORD", "Database MySQL dari hPanel untuk kalender, pesanan, tamu, dan laporan.")}
          {baris(st.penyiapanKunci, "PENYIAPAN_KUNCI", "Hanya untuk membuat akun pertama.")}
          {baris(st.sessionSecret, "SESSION_SECRET", "Opsional. Tanpa ini rahasia sesi dibuat sekali dan disimpan di folder data.")}
          {baris(st.email, "SMTP_HOST, SMTP_USER, SMTP_PASS", "Opsional. Email pemberitahuan pesanan website, misalnya lewat email Hostinger.")}
          {baris(st.folderData, "BAKOERIA_DATA_DIR", "Opsional. Tanpa ini data akun dan isi website disimpan di ~/.bakoeria-data.")}
        </ul>
      </Kartu>
    </div>
  );
}
