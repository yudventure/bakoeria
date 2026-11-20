"use client";

import { useState } from "react";
import { rupiah, tglPendek } from "@/lib/booking";
import { lihatRupiah } from "@/lib/peran";
import { api } from "../api";
import { useData } from "../data";
import type { Kamar } from "../tipe";
import { Bidang, Kartu, Kosong, masukan, Modal, Pil, Tombol, useToast } from "../ui";

const KOSONG = { id: "", name: "", roomType: "", capAdult: 2, capChild: 0, baseRate: 0, isActive: true, inactiveReason: "", sortOrder: 0 };

export default function LayarKamar() {
  const { akun, kamar, muat } = useData();
  const toast = useToast();
  const ubahBoleh = ["developer", "pemilik", "manajer"].includes(akun.peran);
  const rp = lihatRupiah(akun.peran);
  const [f, setF] = useState<typeof KOSONG | null>(null);
  const [musim, setMusim] = useState<{ roomId: string; dateFrom: string; dateTo: string; rate: string; label: string } | null>(null);

  async function simpan() {
    if (!f) return;
    try {
      await api("/api/kamar", { method: f.id ? "PATCH" : "POST", body: f });
      toast(f.id ? "Kamar diperbarui" : "Kamar ditambahkan");
      setF(null);
      muat();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    }
  }
  async function hapus(k: Kamar) {
    if (!window.confirm(`Hapus ${k.name}?`)) return;
    try {
      await api(`/api/kamar?id=${k.id}`, { method: "DELETE" });
      toast("Kamar dihapus");
      muat();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    }
  }
  async function simpanMusim() {
    if (!musim) return;
    try {
      await api("/api/kamar", { body: { musim: { ...musim, rate: Number(musim.rate) } } });
      toast("Tarif musiman ditambahkan");
      setMusim(null);
      muat();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    }
  }
  async function hapusMusim(id: string) {
    await api(`/api/kamar?musim=${id}`, { method: "DELETE" });
    muat();
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kamar & tarif</h1>
          <p className="mt-1 text-sm text-panel-redup">Tarif dasar dipakai otomatis saat pesanan dicatat. Tarif musiman menimpanya pada tanggal yang dicakup.</p>
        </div>
        {ubahBoleh && <Tombol onClick={() => setF({ ...KOSONG, sortOrder: kamar.length + 1 })}>+ Kamar</Tombol>}
      </div>
      {kamar.length === 0 ? (
        <Kosong judul="Belum ada kamar" isi="Tambahkan cottage pertama untuk mulai mencatat pesanan." aksi={ubahBoleh && <Tombol onClick={() => setF({ ...KOSONG })}>+ Kamar</Tombol>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {kamar.map((k) => (
            <Kartu
              key={k.id}
              judul={<span className="flex items-center gap-2">{k.name} {!k.isActive && <Pil nada="kuning">Nonaktif</Pil>}</span>}
              ket={[k.roomType, `${k.capAdult} dewasa${k.capChild ? ` + ${k.capChild} anak` : ""}`].filter(Boolean).join(" · ")}
              aksi={ubahBoleh && (
                <>
                  <Tombol kecil varian="garis" onClick={() => setF({ ...k, roomType: k.roomType ?? "", inactiveReason: k.inactiveReason ?? "" })}>Ubah</Tombol>
                  <Tombol kecil varian="hantu" onClick={() => hapus(k)}>Hapus</Tombol>
                </>
              )}
            >
              {!k.isActive && k.inactiveReason && <p className="mb-3 text-sm text-panel-kuning">{k.inactiveReason}</p>}
              {rp && (
                <>
                  <p className="text-sm text-panel-redup">Tarif dasar</p>
                  <p className="angka text-2xl font-bold">{rupiah(k.baseRate)} <span className="text-sm font-normal text-panel-redup">/ malam</span></p>
                  <div className="mt-4 border-t border-panel-garis pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">Tarif musiman</p>
                      {ubahBoleh && <button className="text-sm font-bold text-panel-utama underline" onClick={() => setMusim({ roomId: k.id, dateFrom: "", dateTo: "", rate: String(k.baseRate), label: "" })}>+ Tambah</button>}
                    </div>
                    {k.musim.length === 0 ? (
                      <p className="mt-1 text-sm text-panel-redup">Belum ada.</p>
                    ) : (
                      <ul className="mt-2 grid gap-1 text-sm">
                        {k.musim.map((m) => (
                          <li key={m.id} className="flex items-center justify-between gap-2 rounded-xl bg-panel-latar px-3 py-2">
                            <span className="angka">{m.label && <b>{m.label} · </b>}{tglPendek(m.dateFrom)} {m.dateFrom.slice(0, 4)} – {tglPendek(m.dateTo)} {m.dateTo.slice(0, 4)}</span>
                            <span className="flex items-center gap-2"><b className="angka">{rupiah(m.rate)}</b>{ubahBoleh && <button onClick={() => hapusMusim(m.id)} aria-label="Hapus tarif musiman" className="text-panel-redup hover:text-panel-merah">×</button>}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </Kartu>
          ))}
        </div>
      )}

      <Modal judul={f?.id ? `Ubah ${f.name}` : "Kamar baru"} buka={!!f} tutup={() => setF(null)} kaki={<><Tombol varian="garis" onClick={() => setF(null)}>Batal</Tombol><Tombol onClick={simpan}>Simpan</Tombol></>}>
        {f && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="Nama"><input className={masukan} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Cottage 1" /></Bidang>
            <Bidang label="Tipe"><input className={masukan} value={f.roomType ?? ""} onChange={(e) => setF({ ...f, roomType: e.target.value })} placeholder="Cottage pantai" /></Bidang>
            <Bidang label="Dewasa"><input className={masukan} type="number" min={1} value={f.capAdult} onChange={(e) => setF({ ...f, capAdult: Number(e.target.value) })} /></Bidang>
            <Bidang label="Anak"><input className={masukan} type="number" min={0} value={f.capChild} onChange={(e) => setF({ ...f, capChild: Number(e.target.value) })} /></Bidang>
            <Bidang label="Tarif dasar per malam (Rp)"><input className={masukan} type="number" min={0} value={f.baseRate} onChange={(e) => setF({ ...f, baseRate: Number(e.target.value) })} /></Bidang>
            <Bidang label="Urutan"><input className={masukan} type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} /></Bidang>
            <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} className="size-4" /> Aktif dan bisa dipesan</label>
            {!f.isActive && <Bidang label="Alasan nonaktif" className="sm:col-span-2"><input className={masukan} value={f.inactiveReason ?? ""} onChange={(e) => setF({ ...f, inactiveReason: e.target.value })} placeholder="Renovasi sampai Januari" /></Bidang>}
          </div>
        )}
      </Modal>

      <Modal judul="Tarif musiman" buka={!!musim} tutup={() => setMusim(null)} kaki={<><Tombol varian="garis" onClick={() => setMusim(null)}>Batal</Tombol><Tombol onClick={simpanMusim}>Simpan</Tombol></>}>
        {musim && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="Nama musim" className="sm:col-span-2"><input className={masukan} value={musim.label} onChange={(e) => setMusim({ ...musim, label: e.target.value })} placeholder="Musim ramai, Natal, Lebaran" /></Bidang>
            <Bidang label="Dari tanggal"><input className={masukan} type="date" value={musim.dateFrom} onChange={(e) => setMusim({ ...musim, dateFrom: e.target.value })} /></Bidang>
            <Bidang label="Sampai tanggal" ket="Termasuk tanggal ini."><input className={masukan} type="date" value={musim.dateTo} onChange={(e) => setMusim({ ...musim, dateTo: e.target.value })} /></Bidang>
            <Bidang label="Tarif per malam (Rp)" className="sm:col-span-2"><input className={masukan} type="number" min={0} value={musim.rate} onChange={(e) => setMusim({ ...musim, rate: e.target.value })} /></Bidang>
          </div>
        )}
      </Modal>
    </div>
  );
}
