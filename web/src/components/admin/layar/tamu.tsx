"use client";

import { useEffect, useState } from "react";
import { LABEL_STATUS, rupiah, tglPendek, type Status } from "@/lib/booking";
import { nomorWa } from "@/lib/konten";
import { lihatRupiah } from "@/lib/peran";
import { api } from "../api";
import { useData } from "../data";
import { WARNA_STATUS } from "../gaya";
import { Bidang, Galat, Kartu, Kosong, masukan, Memuat, Modal, Pil, Tombol, useToast } from "../ui";
import { unduhCsv } from "./pesanan";

interface Tamu {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  origin: string | null;
  diveCert: string | null;
  notes: string | null;
  bookings: { id: string; code: string; checkIn: string; checkOut: string; status: Status; totalAmount: number | null }[];
}

export default function DaftarTamu() {
  const { akun, bukaPesanan } = useData();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [daftar, setDaftar] = useState<Tamu[] | null>(null);
  const [galat, setGalat] = useState("");
  const [ubah, setUbah] = useState<Tamu | null>(null);
  const rp = lihatRupiah(akun.peran);

  const muat = () =>
    api<{ tamu: Tamu[] }>(`/api/tamu?q=${encodeURIComponent(q)}`)
      .then((r) => setDaftar(r.tamu))
      .catch((e) => setGalat(e.message));
  useEffect(() => {
    const t = setTimeout(muat, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function simpan() {
    if (!ubah) return;
    try {
      await api("/api/tamu", { method: "PATCH", body: ubah });
      toast("Data tamu disimpan");
      setUbah(null);
      muat();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tamu</h1>
          <p className="mt-1 text-sm text-panel-redup">Tamu tercatat otomatis dari setiap pesanan. Tamu yang kembali terlihat dari riwayatnya.</p>
        </div>
        <Tombol varian="garis" disabled={!daftar?.length} onClick={() => daftar && unduhCsv("tamu-bakoeria.csv", [["Nama", "Telepon", "Email", "Asal", "Sertifikat", "Jumlah menginap", "Terakhir"], ...daftar.map((g) => [g.name, g.phone, g.email, g.origin, g.diveCert, g.bookings.length, g.bookings[0]?.checkIn ?? ""])])}>
          Unduh CSV
        </Tombol>
      </div>
      <input className={masukan} placeholder="Cari nama, telepon, atau email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari tamu" />
      {galat ? (
        <Galat pesan={galat} />
      ) : !daftar ? (
        <Memuat />
      ) : daftar.length === 0 ? (
        <Kosong judul="Belum ada tamu" isi="Tamu muncul di sini setelah pesanan pertama dicatat." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {daftar.map((g) => (
            <Kartu key={g.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold">{g.name}</h3>
                  <p className="text-sm text-panel-redup">{[g.origin, g.diveCert].filter(Boolean).join(" · ") || "Belum ada asal dan sertifikat"}</p>
                </div>
                {g.bookings.length > 1 && <Pil nada="emas">Tamu kembali · {g.bookings.length}×</Pil>}
              </div>
              <div className="mt-3 grid gap-0.5 text-sm">
                {g.phone && (
                  <span className="flex justify-between gap-2"><span className="angka select-all">{g.phone}</span><a href={`https://wa.me/${nomorWa(g.phone)}`} target="_blank" rel="noreferrer" className="font-bold text-panel-hijau underline">WhatsApp</a></span>
                )}
                {g.email && <span className="select-all break-all">{g.email}</span>}
              </div>
              {g.notes && <p className="mt-2 rounded-xl bg-panel-latar px-3 py-2 text-sm">{g.notes}</p>}
              <ul className="mt-3 grid gap-1 border-t border-panel-garis pt-3 text-sm">
                {g.bookings.slice(0, 4).map((b) => (
                  <li key={b.id}>
                    <button onClick={() => bukaPesanan(b.id)} className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1 text-left hover:bg-panel-latar">
                      <span className="angka">{tglPendek(b.checkIn)} {b.checkIn.slice(0, 4)}{rp && b.totalAmount ? ` · ${rupiah(b.totalAmount)}` : ""}</span>
                      <Pil nada={WARNA_STATUS[b.status].pil}>{LABEL_STATUS[b.status]}</Pil>
                    </button>
                  </li>
                ))}
              </ul>
              {akun.peran !== "staf" && <button onClick={() => setUbah(g)} className="mt-3 self-start text-sm font-bold text-panel-utama underline">Ubah data tamu</button>}
            </Kartu>
          ))}
        </div>
      )}
      <Modal judul="Ubah data tamu" buka={!!ubah} tutup={() => setUbah(null)} kaki={<><Tombol varian="garis" onClick={() => setUbah(null)}>Batal</Tombol><Tombol onClick={simpan}>Simpan</Tombol></>}>
        {ubah && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="Nama"><input className={masukan} value={ubah.name} onChange={(e) => setUbah({ ...ubah, name: e.target.value })} /></Bidang>
            <Bidang label="Telepon"><input className={masukan} value={ubah.phone ?? ""} onChange={(e) => setUbah({ ...ubah, phone: e.target.value })} /></Bidang>
            <Bidang label="Email"><input className={masukan} value={ubah.email ?? ""} onChange={(e) => setUbah({ ...ubah, email: e.target.value })} /></Bidang>
            <Bidang label="Asal"><input className={masukan} value={ubah.origin ?? ""} onChange={(e) => setUbah({ ...ubah, origin: e.target.value })} /></Bidang>
            <Bidang label="Sertifikat selam"><input className={masukan} value={ubah.diveCert ?? ""} onChange={(e) => setUbah({ ...ubah, diveCert: e.target.value })} /></Bidang>
            <Bidang label="Catatan" className="sm:col-span-2"><textarea rows={3} className={masukan} value={ubah.notes ?? ""} onChange={(e) => setUbah({ ...ubah, notes: e.target.value })} placeholder="Alergi, preferensi kamar, ukuran wetsuit" /></Bidang>
          </div>
        )}
      </Modal>
    </div>
  );
}
