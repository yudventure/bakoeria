"use client";

import { useEffect, useMemo, useState } from "react";
import { hariIniWit, rupiah } from "@/lib/booking";
import { hitungAset, hitungGaji, KATEGORI_KELUAR, PARAMETER_AWAL, type ParameterSdm, type Rekaman } from "@/lib/modul";
import { bolehLayar } from "@/lib/peran";
import { api } from "../api";
import { useData } from "../data";
import type { Kamar, Pesanan } from "../tipe";
import { Angka, Kartu, Penjelasan, Tab } from "../ui";
import { statBulan } from "./laporan";
import { Pembungkus, PemilihBulan, TabelModul, useModul } from "./modul";

export default function Keuangan() {
  const { akun } = useData();
  const m = useModul("keuangan");
  const [tab, setTab] = useState<"ringkasan" | "transaksi" | "aset">("ringkasan");
  const [bulan, setBulan] = useState(hariIniWit().slice(0, 7));
  const [kal, setKal] = useState<{ kamar: Kamar[]; pesanan: Pesanan[] } | null>(null);
  const [sdm, setSdm] = useState<{ pegawai: Rekaman[]; absensi: Rekaman[]; parameter: ParameterSdm } | null>(null);

  useEffect(() => {
    const awal = bulan + "-01";
    const d = new Date(awal + "T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + 1);
    if (bolehLayar(akun.peran, "kalender")) api<{ kamar: Kamar[]; pesanan: Pesanan[] }>(`/api/kalender?dari=${awal}&sampai=${d.toISOString().slice(0, 10)}`).then(setKal).catch(() => setKal(null));
  }, [bulan, akun.peran]);
  useEffect(() => {
    if (bolehLayar(akun.peran, "sdm"))
      api<{ data: Record<string, Rekaman[]>; parameter: ParameterSdm }>("/api/modul/sdm").then((o) => setSdm({ pegawai: o.data.pegawai ?? [], absensi: o.data.absensi ?? [], parameter: o.parameter ?? PARAMETER_AWAL })).catch(() => setSdm(null));
  }, [akun.peran]);

  const r = useMemo(() => {
    const tr = (m.data.transaksi ?? []).filter((t) => String(t.tanggal ?? "").startsWith(bulan));
    const masuk = tr.filter((t) => t.jenis === "Pemasukan").reduce((n, t) => n + Number(t.jumlah ?? 0), 0);
    const keluar = tr.filter((t) => t.jenis === "Pengeluaran").reduce((n, t) => n + Number(t.jumlah ?? 0), 0);
    const perKategori = new Map<string, number>();
    for (const t of tr.filter((t) => t.jenis === "Pengeluaran")) perKategori.set(String(t.kategori), (perKategori.get(String(t.kategori)) ?? 0) + Number(t.jumlah ?? 0));
    const akhir = bulan + "-28";
    const aset = (m.data.aset ?? []).map((a) => ({ a, h: hitungAset(a, akhir) }));
    const susut = aset.filter((x) => x.h.berjalan).reduce((n, x) => n + x.h.perBulan, 0);
    const nilaiBuku = aset.reduce((n, x) => n + x.h.nilaiBuku, 0);
    const kamar = kal ? statBulan(bulan, kal.kamar, kal.pesanan) : null;
    const gaji = sdm ? hitungGaji(sdm.pegawai, sdm.absensi, bulan, sdm.parameter) : [];
    const biayaGaji = gaji.reduce((n, g) => n + g.biaya, 0);
    const gajiTercatat = perKategori.get("Gaji dan upah") ?? 0;
    const pendapatanKamar = kamar ? kamar.bersih : 0;
    return { masuk, keluar, perKategori: [...perKategori.entries()].sort((a, b) => b[1] - a[1]), susut, nilaiBuku, kamar, biayaGaji, gajiTercatat, laba: pendapatanKamar + masuk - keluar - susut };
  }, [m.data, bulan, kal, sdm]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Keuangan & aset</h1>
          <p className="mt-1 text-sm text-panel-redup">Pendapatan kamar dibaca dari kalender. Pemasukan lain dan pengeluaran dicatat di sini.</p>
        </div>
        {tab === "ringkasan" && <PemilihBulan bulan={bulan} ubah={setBulan} />}
      </div>
      <Tab pilihan={[{ id: "ringkasan", label: "Ringkasan" }, { id: "transaksi", label: "Catatan keuangan" }, { id: "aset", label: "Aset" }]} nilai={tab} ubah={setTab} />
      <Pembungkus m={m}>
        {tab === "ringkasan" && (
          <>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <Angka label="Pendapatan kamar bersih" nilai={r.kamar ? rupiah(r.kamar.bersih) : "–"} ket={r.kamar ? `kotor ${rupiah(r.kamar.kotor)}, komisi ${rupiah(r.kamar.komisi)}` : "kalender tidak terbaca"} />
              <Angka label="Pemasukan lain" nilai={rupiah(r.masuk)} />
              <Angka label="Pengeluaran" nilai={rupiah(r.keluar)} />
              <Angka label="Perkiraan laba" nilai={rupiah(r.laba)} nada={r.laba < 0 ? "merah" : "hijau"} ket={`setelah penyusutan ${rupiah(r.susut)}`} />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <Kartu judul="Pengeluaran per kategori">
                {r.perKategori.length === 0 ? (
                  <p className="text-sm text-panel-redup">Belum ada pengeluaran tercatat bulan ini.</p>
                ) : (
                  <ul className="grid gap-3">
                    {r.perKategori.map(([k, v]) => (
                      <li key={k}>
                        <div className="flex justify-between gap-3 text-sm"><b>{k}</b><span className="angka">{rupiah(v)}</span></div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-panel-latar"><i className="block h-full rounded-full bg-panel-utama" style={{ width: `${(v / r.keluar) * 100}%` }} /></div>
                      </li>
                    ))}
                  </ul>
                )}
              </Kartu>
              <Kartu judul="Gaji dan aset">
                <dl className="grid gap-3 text-sm">
                  {sdm && (
                    <>
                      <div className="flex justify-between gap-3"><dt>Perkiraan biaya gaji penuh</dt><dd className="angka font-bold">{rupiah(r.biayaGaji)}</dd></div>
                      <div className="flex justify-between gap-3"><dt>Gaji yang sudah dicatat sebagai pengeluaran</dt><dd className="angka font-bold">{rupiah(r.gajiTercatat)}</dd></div>
                      {r.biayaGaji > 0 && r.gajiTercatat < r.biayaGaji * 0.5 && <p className="rounded-xl bg-panel-kuning-lembut px-3 py-2 text-panel-kuning">Gaji bulan ini tampaknya belum dicatat sebagai pengeluaran.</p>}
                    </>
                  )}
                  <div className="flex justify-between gap-3"><dt>Penyusutan bulan ini</dt><dd className="angka font-bold">{rupiah(r.susut)}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Nilai buku semua aset</dt><dd className="angka font-bold">{rupiah(r.nilaiBuku)}</dd></div>
                </dl>
              </Kartu>
            </div>
            <Penjelasan>
              <p>Pendapatan kamar bersih adalah pendapatan kotor dari kalender dikurangi perkiraan komisi OTA, dibagi rata per malam. Hanya pesanan terkonfirmasi, menginap, dan selesai yang dihitung.</p>
              <p>Perkiraan laba = pendapatan kamar bersih + pemasukan lain − pengeluaran − penyusutan. Ini perkiraan manajemen, bukan laporan pajak.</p>
            </Penjelasan>
          </>
        )}
        {tab === "transaksi" && <TabelModul m={m} koleksiId="transaksi" ket={`Kategori pengeluaran: ${KATEGORI_KELUAR.slice(0, 4).join(", ")}, dan lainnya.`} />}
        {tab === "aset" && <TabelModul m={m} koleksiId="aset" ket="Penyusutan garis lurus dihitung dari harga, umur manfaat, dan nilai sisa." />}
      </Pembungkus>
    </div>
  );
}
