"use client";

import { useEffect, useState } from "react";
import { jumlahMalam, LABEL_CHANNEL, LABEL_STATUS, rupiah, sisaTagihan, STATUS, tglPendek, type Status } from "@/lib/booking";
import { bolehCatat, lihatRupiah } from "@/lib/peran";
import { api } from "../api";
import { useData } from "../data";
import { WARNA_STATUS } from "../gaya";
import type { Pesanan } from "../tipe";
import { Galat, Kartu, Kosong, masukan, Memuat, Pil, Tombol } from "../ui";

export function unduhCsv(nama: string, baris: (string | number | null)[][]) {
  const isi = baris.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + isi], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DaftarPesanan({ cariAwal }: { cariAwal: string }) {
  const { akun, bukaPesanan, bukaForm, pesanan: semua } = useData();
  const [q, setQ] = useState(cariAwal);
  const [status, setStatus] = useState<Status | "">("");
  const [hasil, setHasil] = useState<Pesanan[] | null>(null);
  const [galat, setGalat] = useState("");
  const rp = lihatRupiah(akun.peran);

  useEffect(() => setQ(cariAwal), [cariAwal]);
  useEffect(() => {
    const t = setTimeout(() => {
      const u = new URLSearchParams();
      if (q.trim()) u.set("q", q.trim());
      if (status) u.set("status", status);
      api<{ pesanan: Pesanan[] }>(`/api/pesanan?${u}`)
        .then((r) => {
          setHasil(r.pesanan);
          setGalat("");
        })
        .catch((e) => setGalat(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [q, status, semua]);

  function ekspor() {
    if (!hasil) return;
    unduhCsv(`pesanan-bakoeria-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Kode", "Tamu", "Telepon", "Email", "Kamar", "Check-in", "Check-out", "Malam", "Tamu", "Selam", "Sumber", "Status", ...(rp ? ["Total", "Dibayar", "Sisa", "Komisi"] : []), "Catatan"],
      ...hasil.map((p) => {
        const t = sisaTagihan(p.totalAmount, p.payments);
        return [p.code, p.guest?.name ?? "", p.guest?.phone ?? "", p.guest?.email ?? "", p.roomName, p.checkIn, p.checkOut, jumlahMalam(p.checkIn, p.checkOut), p.pax, p.dives, LABEL_CHANNEL[p.channel], LABEL_STATUS[p.status], ...(rp ? [p.totalAmount, t.dibayar, t.sisa, p.otaCommissionEst] : []), p.notes ?? ""];
      }),
    ]);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Pesanan</h1>
        <div className="flex gap-2">
          <Tombol varian="garis" onClick={ekspor} disabled={!hasil?.length}>Unduh CSV</Tombol>
          {bolehCatat(akun.peran) && <Tombol onClick={() => bukaForm(null)}>+ Pesanan</Tombol>}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <input className={masukan} placeholder="Cari nama tamu, telepon, kode, atau catatan" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari pesanan" />
        <select className={masukan} value={status} onChange={(e) => setStatus(e.target.value as Status | "")} aria-label="Saring status">
          <option value="">Semua status</option>
          {STATUS.map((s) => <option key={s} value={s}>{LABEL_STATUS[s]}</option>)}
        </select>
      </div>
      {galat ? (
        <Galat pesan={galat} />
      ) : !hasil ? (
        <Memuat />
      ) : hasil.length === 0 ? (
        <Kosong judul="Tidak ada pesanan yang cocok" isi="Ubah kata pencarian atau saringan status." />
      ) : (
        <Kartu className="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-panel-garis text-left text-[11px] font-bold uppercase tracking-[0.12em] text-panel-redup">
                  <th className="px-5 py-3">Tamu</th>
                  <th className="px-3 py-3">Kamar</th>
                  <th className="px-3 py-3">Tanggal</th>
                  <th className="px-3 py-3">Sumber</th>
                  <th className="px-3 py-3">Status</th>
                  {rp && <th className="px-5 py-3 text-right">Total / sisa</th>}
                </tr>
              </thead>
              <tbody>
                {hasil.map((p) => {
                  const t = sisaTagihan(p.totalAmount, p.payments);
                  return (
                    <tr key={p.id} onClick={() => bukaPesanan(p.id)} className="cursor-pointer border-b border-panel-garis/70 last:border-0 hover:bg-panel-latar">
                      <td className="px-5 py-3">
                        <button className="text-left font-bold hover:underline" onClick={() => bukaPesanan(p.id)}>{p.guest?.name ?? (p.status === "BLOCKED" ? "Kamar ditutup" : "Tanpa nama")}</button>
                        <span className="angka block text-xs text-panel-redup">{p.code}</span>
                      </td>
                      <td className="px-3 py-3">{p.roomName}</td>
                      <td className="angka px-3 py-3 whitespace-nowrap">{tglPendek(p.checkIn)} – {tglPendek(p.checkOut)} {p.checkOut.slice(0, 4)}<span className="block text-xs text-panel-redup">{jumlahMalam(p.checkIn, p.checkOut)} malam</span></td>
                      <td className="px-3 py-3">{LABEL_CHANNEL[p.channel]}</td>
                      <td className="px-3 py-3"><Pil nada={WARNA_STATUS[p.status].pil}>{LABEL_STATUS[p.status]}</Pil></td>
                      {rp && (
                        <td className="angka px-5 py-3 text-right whitespace-nowrap">
                          {rupiah(p.totalAmount)}
                          {t.sisa != null && t.sisa > 0 && <span className="block text-xs font-bold text-panel-kuning">sisa {rupiah(t.sisa)}</span>}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Kartu>
      )}
      <p className="text-xs text-panel-redup">Menampilkan sampai 200 pesanan terbaru yang cocok.</p>
    </div>
  );
}
