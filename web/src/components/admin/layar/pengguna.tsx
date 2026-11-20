"use client";

import { useEffect, useState } from "react";
import { KET_PERAN, LABEL_PERAN, layarUntuk, type Peran } from "@/lib/peran";
import { api } from "../api";
import { useData } from "../data";
import { LABEL_LAYAR } from "../rangka";
import { Bidang, Galat, Kartu, masukan, Memuat, Modal, Penjelasan, Pil, Tombol, useToast } from "../ui";

interface Akun {
  email: string;
  nama: string;
  peran: Peran;
  aktif: boolean;
  dibuat: string;
  terakhirMasuk?: string;
}

export default function Pengguna() {
  const { akun: saya } = useData();
  const toast = useToast();
  const [daftar, setDaftar] = useState<Akun[] | null>(null);
  const [peran, setPeran] = useState<Peran[]>([]);
  const [galat, setGalat] = useState("");
  const [form, setForm] = useState<{ baru: boolean; email: string; nama: string; peran: Peran; sandi: string; aktif: boolean } | null>(null);

  const muat = () => api<{ akun: Akun[]; peran: Peran[] }>("/api/akun").then((r) => { setDaftar(r.akun); setPeran(r.peran); }).catch((e) => setGalat(e.message));
  useEffect(() => {
    muat();
  }, []);

  async function simpan() {
    if (!form) return;
    try {
      if (form.baru) await api("/api/akun", { body: form });
      else await api("/api/akun", { method: "PATCH", body: { email: form.email, nama: form.nama, peran: form.peran, aktif: form.aktif, sandi: form.sandi || undefined } });
      toast(form.baru ? "Akun dibuat. Beri tahu kata sandi awalnya secara langsung." : "Akun diperbarui");
      setForm(null);
      muat();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    }
  }
  async function hapus(a: Akun) {
    if (!window.confirm(`Hapus akun ${a.nama}? Untuk sementara, nonaktifkan saja.`)) return;
    try {
      await api(`/api/akun?email=${encodeURIComponent(a.email)}`, { method: "DELETE" });
      muat();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    }
  }

  if (galat) return <Galat pesan={galat} />;
  if (!daftar) return <Memuat />;
  const pilihan = peran.filter((p) => p !== "developer" || saya.peran === "developer");
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pengguna & peran</h1>
          <p className="mt-1 text-sm text-panel-redup">Satu akun untuk tiap orang. Peran menentukan menu yang terlihat dan apakah angka rupiah tampil.</p>
        </div>
        <Tombol onClick={() => setForm({ baru: true, email: "", nama: "", peran: "resepsionis", sandi: "", aktif: true })}>+ Pengguna</Tombol>
      </div>
      <Kartu className="p-0 sm:p-0">
        <ul className="divide-y divide-panel-garis">
          {daftar.map((a) => (
            <li key={a.email} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="font-bold">{a.nama} {a.email === saya.email && <span className="text-sm font-normal text-panel-redup">(Anda)</span>}</p>
                <p className="truncate text-sm text-panel-redup">{a.email} · {a.terakhirMasuk ? `terakhir masuk ${new Date(a.terakhirMasuk).toLocaleDateString("id-ID", { dateStyle: "medium" })}` : "belum pernah masuk"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Pil nada={a.peran === "developer" || a.peran === "pemilik" ? "biru" : "emas"}>{LABEL_PERAN[a.peran]}</Pil>
                {!a.aktif && <Pil nada="merah">Nonaktif</Pil>}
                {a.email !== saya.email && (a.peran !== "developer" || saya.peran === "developer") && (
                  <>
                    <Tombol kecil varian="garis" onClick={() => setForm({ baru: false, email: a.email, nama: a.nama, peran: a.peran, sandi: "", aktif: a.aktif })}>Ubah</Tombol>
                    <Tombol kecil varian="hantu" onClick={() => hapus(a)}>Hapus</Tombol>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Kartu>
      <Kartu judul="Apa yang bisa dilakukan tiap peran">
        <ul className="grid gap-3 text-sm md:grid-cols-2">
          {peran.map((p) => (
            <li key={p} className="rounded-2xl bg-panel-latar p-4">
              <b>{LABEL_PERAN[p]}</b>
              <p className="mt-1 text-panel-redup">{KET_PERAN[p]}</p>
              <p className="mt-2 text-xs text-panel-redup">Menu: {layarUntuk(p).map((l) => LABEL_LAYAR[l]).join(", ")}</p>
            </li>
          ))}
        </ul>
      </Kartu>
      <Penjelasan>
        <p>Tidak ada email undangan. Buat akun dengan kata sandi awal, lalu sampaikan langsung. Orangnya bisa mengganti sandi sendiri dari menu akun.</p>
        <p>Menonaktifkan akun langsung mengeluarkannya dari semua perangkat.</p>
      </Penjelasan>
      <Modal judul={form?.baru ? "Pengguna baru" : `Ubah ${form?.nama ?? ""}`} buka={!!form} tutup={() => setForm(null)} kaki={<><Tombol varian="garis" onClick={() => setForm(null)}>Batal</Tombol><Tombol onClick={simpan}>Simpan</Tombol></>}>
        {form && (
          <div className="grid gap-4">
            <Bidang label="Nama"><input className={masukan} value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></Bidang>
            <Bidang label="Email"><input className={masukan} type="email" disabled={!form.baru} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Bidang>
            <Bidang label="Peran" ket={KET_PERAN[form.peran]}>
              <select className={masukan} value={form.peran} onChange={(e) => setForm({ ...form, peran: e.target.value as Peran })}>
                {pilihan.map((p) => <option key={p} value={p}>{LABEL_PERAN[p]}</option>)}
              </select>
            </Bidang>
            <Bidang label={form.baru ? "Kata sandi awal" : "Atur ulang kata sandi"} ket={form.baru ? "Minimal 10 karakter." : "Kosongkan bila tidak diganti. Mengganti sandi mengeluarkan semua sesinya."}><input className={masukan} type="text" autoComplete="off" value={form.sandi} onChange={(e) => setForm({ ...form, sandi: e.target.value })} /></Bidang>
            {!form.baru && <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="size-4" checked={form.aktif} onChange={(e) => setForm({ ...form, aktif: e.target.checked })} /> Akun aktif</label>}
          </div>
        )}
      </Modal>
    </div>
  );
}
