"use client";

import { useEffect, useState } from "react";
import { api } from "../api";
import { useData } from "../data";
import { Bidang, Galat, Kartu, Kosong, masukan, Memuat, Modal, Penjelasan, Pil, Tombol, useToast } from "../ui";

interface Sambungan {
  id: string;
  roomId: string;
  roomName: string;
  otaLabel: string | null;
  url: string | null;
  exportToken: string | null;
  isActive: boolean;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  failCount: number;
  terakhir: { createdCount: number; updatedCount: number; cancelledCount: number; eventsSeen: number; startedAt: string } | null;
}

const waktu = (s: string | null) => (s ? new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "belum pernah");

export default function Sinkron() {
  const { kamar, muat: muatKalender } = useData();
  const toast = useToast();
  const [daftar, setDaftar] = useState<Sambungan[] | null>(null);
  const [galat, setGalat] = useState("");
  const [form, setForm] = useState<{ id?: string; roomId: string; otaLabel: string; url: string } | null>(null);
  const [sibuk, setSibuk] = useState<string | null>(null);
  const asal = typeof window !== "undefined" ? window.location.origin : "";

  const muat = () => api<{ sambungan: Sambungan[] }>("/api/sinkron").then((r) => setDaftar(r.sambungan)).catch((e) => setGalat(e.message));
  useEffect(() => {
    muat();
  }, []);

  async function simpan() {
    if (!form) return;
    try {
      if (form.id) await api("/api/sinkron", { method: "PATCH", body: { id: form.id, otaLabel: form.otaLabel, url: form.url } });
      else await api("/api/sinkron", { body: form });
      setForm(null);
      toast("Sambungan disimpan");
      muat();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    }
  }
  async function tarik(id: string) {
    setSibuk(id);
    try {
      const r = await api<{ hasil: { ok: boolean; galat?: string; createdCount: number; updatedCount: number; cancelledCount: number }[] }>("/api/sinkron/jalankan", { body: { id } });
      const h = r.hasil[0];
      toast(h.ok ? `Terbaca: ${h.createdCount} baru, ${h.updatedCount} berubah, ${h.cancelledCount} batal.` : h.galat ?? "Gagal", h.ok ? "biasa" : "galat");
      muat();
      muatKalender();
    } finally {
      setSibuk(null);
    }
  }
  async function hapus(s: Sambungan) {
    if (!window.confirm(`Hapus sambungan ${s.otaLabel} untuk ${s.roomName}? Pesanan yang pernah diimpor tetap ada.`)) return;
    await api(`/api/sinkron?id=${s.id}`, { method: "DELETE" });
    muat();
  }
  async function tokenBaru(s: Sambungan) {
    if (!window.confirm("Buat alamat ekspor baru? Alamat lama langsung berhenti bekerja, jadi tempel alamat baru ke OTA.")) return;
    await api("/api/sinkron", { method: "PATCH", body: { id: s.id, tokenBaru: true } });
    muat();
  }
  async function salin(teks: string) {
    try {
      await navigator.clipboard.writeText(teks);
      toast("Alamat disalin");
    } catch {
      toast("Salin manual: pilih teks alamatnya", "galat");
    }
  }

  if (galat) return <Galat pesan={galat} />;
  if (!daftar) return <Memuat />;
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sinkronisasi OTA</h1>
          <p className="mt-1 max-w-2xl text-sm text-panel-redup">Hubungkan kalender tiap cottage dengan Booking.com, Agoda, Airbnb, atau Traveloka lewat iCal, supaya kamar yang terisi di satu tempat tertutup di tempat lain.</p>
        </div>
        <Tombol disabled={!kamar.length} onClick={() => setForm({ roomId: kamar[0]?.id ?? "", otaLabel: "", url: "" })}>+ Sambungan</Tombol>
      </div>
      {daftar.length === 0 ? (
        <Kosong judul="Belum ada sambungan" isi="Tambahkan satu sambungan per cottage per OTA." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {daftar.map((s) => {
            const status = !s.url ? <Pil>Hanya mengirim</Pil> : s.lastError && (!s.lastSuccessAt || (s.lastErrorAt ?? "") > s.lastSuccessAt) ? <Pil nada="merah">Gagal dibaca</Pil> : s.lastSuccessAt ? <Pil nada="hijau">Tersambung</Pil> : <Pil nada="kuning">Belum dibaca</Pil>;
            const ekspor = `${asal}/api/ical/${s.exportToken}.ics`;
            return (
              <Kartu key={s.id} judul={<span className="flex flex-wrap items-center gap-2">{s.roomName} · {s.otaLabel} {status}</span>} aksi={<><Tombol kecil varian="garis" onClick={() => setForm({ id: s.id, roomId: s.roomId, otaLabel: s.otaLabel ?? "", url: s.url ?? "" })}>Ubah</Tombol><Tombol kecil varian="hantu" onClick={() => hapus(s)}>Hapus</Tombol></>}>
                <div className="grid gap-4 text-sm">
                  <div>
                    <p className="font-bold">Masuk dari {s.otaLabel}</p>
                    {s.url ? (
                      <>
                        <p className="mt-1 break-all text-panel-redup">{s.url}</p>
                        <p className="mt-1 text-panel-redup">Terakhir terbaca: {waktu(s.lastSuccessAt)}{s.terakhir ? ` · ${s.terakhir.eventsSeen} tanggal terisi` : ""}</p>
                        {s.lastError && <p className="mt-1 text-panel-merah">Galat terakhir ({waktu(s.lastErrorAt)}): {s.lastError}</p>}
                        <Tombol kecil className="mt-2" varian="garis" disabled={sibuk === s.id} onClick={() => tarik(s.id)}>{sibuk === s.id ? "Membaca…" : "Sinkronkan sekarang"}</Tombol>
                      </>
                    ) : (
                      <p className="mt-1 text-panel-redup">Belum ada alamat impor. Isi lewat Ubah bila OTA menyediakan alamat iCal.</p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-panel-latar p-3">
                    <p className="font-bold">Kirim ke {s.otaLabel}</p>
                    <p className="mt-1 text-panel-redup">Tempel alamat ini di bagian impor kalender {s.otaLabel}.</p>
                    <p className="mt-2 select-all break-all rounded-xl bg-white px-3 py-2 font-mono text-xs">{ekspor}</p>
                    <div className="mt-2 flex gap-2">
                      <Tombol kecil varian="garis" onClick={() => salin(ekspor)}>Salin</Tombol>
                      <Tombol kecil varian="hantu" onClick={() => tokenBaru(s)}>Buat alamat baru</Tombol>
                    </div>
                  </div>
                </div>
              </Kartu>
            );
          })}
        </div>
      )}
      <Penjelasan>
        <p>Pesanan dari OTA masuk sebagai Terkonfirmasi tanpa harga dan tanpa data tamu, karena iCal hanya membawa tanggal. Lengkapi nama dan harga dari extranet OTA bila perlu.</p>
        <p>Bila OTA mengirim tanggal yang kamarnya sudah terisi, pesanan disimpan sebagai Bentrok dan muncul di lonceng dan Ringkasan. Tidak ada data yang dibuang.</p>
        <p>Alamat ekspor tidak memuat pesanan yang datang dari OTA yang sama, supaya blokir tidak dipantulkan balik. Sambungan dibaca ulang otomatis setiap 15 menit saat dashboard dibuka, atau segera lewat tombol Sinkronkan.</p>
      </Penjelasan>
      <Modal judul={form?.id ? "Ubah sambungan" : "Sambungan baru"} buka={!!form} tutup={() => setForm(null)} kaki={<><Tombol varian="garis" onClick={() => setForm(null)}>Batal</Tombol><Tombol onClick={simpan}>Simpan</Tombol></>}>
        {form && (
          <div className="grid gap-4">
            {!form.id && (
              <Bidang label="Cottage">
                <select className={masukan} value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>
                  {kamar.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </Bidang>
            )}
            <Bidang label="Nama situs"><input className={masukan} value={form.otaLabel} onChange={(e) => setForm({ ...form, otaLabel: e.target.value })} placeholder="Booking.com" list="ota" /></Bidang>
            <datalist id="ota"><option value="Booking.com" /><option value="Agoda" /><option value="Airbnb" /><option value="Traveloka" /></datalist>
            <Bidang label="Alamat iCal dari situs itu" ket="Di extranet OTA biasanya bernama Ekspor kalender atau Sinkronkan kalender. Boleh dikosongkan bila hanya ingin mengirim."><input className={masukan} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></Bidang>
          </div>
        )}
      </Modal>
    </div>
  );
}
