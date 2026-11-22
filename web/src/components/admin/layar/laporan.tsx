"use client";

import { useEffect, useMemo, useState } from "react";
import { BULAN_PANJANG, hariIniWit, jumlahMalam, LABEL_CHANNEL, LABEL_STATUS, malam, MENEMPATI, rupiah, type Channel } from "@/lib/booking";
import { lihatRupiah } from "@/lib/peran";
import { api } from "../api";
import { useData } from "../data";
import { WARNA_CHANNEL } from "../gaya";
import type { Kamar, Pesanan } from "../tipe";
import { Angka, Galat, Kartu, Kosong, Memuat, Penjelasan, Tombol } from "../ui";
import { unduhCsv } from "./pesanan";

const geserBulan = (b: string, n: number) => {
  const d = new Date(b + "-01T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
};
const akhirBulan = (b: string) => geserBulan(b, 1) + "-01";
const namaBulan = (b: string, pendek = false) => (pendek ? BULAN_PANJANG[Number(b.slice(5)) - 1].slice(0, 3) : `${BULAN_PANJANG[Number(b.slice(5)) - 1]} ${b.slice(0, 4)}`);

/** Angka satu bulan. Pendapatan dibagi rata per malam, jadi pesanan lintas bulan terbagi adil. */
export function statBulan(bulan: string, kamar: Kamar[], pesanan: Pesanan[]) {
  const awal = bulan + "-01";
  const akhir = akhirBulan(bulan);
  const hari = jumlahMalam(awal, akhir);
  const aktif = kamar.filter((k) => k.isActive).length;
  const isi = pesanan.filter((p) => MENEMPATI.includes(p.status) && p.status !== "BLOCKED" && p.checkIn < akhir && p.checkOut > awal);
  let malamTerjual = 0;
  let kotor = 0;
  let komisi = 0;
  let tanpaHarga = 0;
  const perSumber = new Map<Channel, { malam: number; uang: number }>();
  const perKamar = new Map<string, number>();
  for (const p of isi) {
    const m = malam(p.checkIn, p.checkOut);
    const di = m.filter((t) => t >= awal && t < akhir).length;
    const bagian = di / m.length;
    malamTerjual += di;
    if (p.totalAmount == null) tanpaHarga++;
    const uang = (p.totalAmount ?? 0) * bagian;
    kotor += uang;
    komisi += (p.otaCommissionEst ?? 0) * bagian;
    const s = perSumber.get(p.channel) ?? { malam: 0, uang: 0 };
    perSumber.set(p.channel, { malam: s.malam + di, uang: s.uang + uang });
    perKamar.set(p.roomId, (perKamar.get(p.roomId) ?? 0) + di);
  }
  const tiba = isi.filter((p) => p.checkIn >= awal && p.checkIn < akhir);
  return {
    awal,
    akhir,
    hari,
    malamTerjual,
    okupansi: aktif ? malamTerjual / (aktif * hari) : 0,
    kotor,
    komisi,
    bersih: kotor - komisi,
    adr: malamTerjual ? kotor / malamTerjual : 0,
    los: tiba.length ? tiba.reduce((n, p) => n + jumlahMalam(p.checkIn, p.checkOut), 0) / tiba.length : 0,
    tiba: tiba.length,
    batal: pesanan.filter((p) => p.status === "CANCELLED" && p.checkIn >= awal && p.checkIn < akhir).length,
    tanpaHarga,
    perSumber: [...perSumber.entries()].sort((a, b) => b[1].uang - a[1].uang || b[1].malam - a[1].malam),
    perKamar,
    isi,
  };
}

function Selisih({ kini, lalu, persen }: { kini: number; lalu: number; persen?: boolean }) {
  if (!lalu && !kini) return null;
  const d = persen ? (kini - lalu) * 100 : lalu ? ((kini - lalu) / lalu) * 100 : 100;
  const naik = d >= 0;
  return <span className={naik ? "text-panel-hijau" : "text-panel-merah"}>{naik ? "▲" : "▼"} {Math.abs(d).toFixed(persen ? 0 : 0)}{persen ? " poin" : "%"} dari bulan lalu</span>;
}

export default function Laporan() {
  const { akun } = useData();
  const rp = lihatRupiah(akun.peran);
  const [bulan, setBulan] = useState(hariIniWit().slice(0, 7));
  const [data, setData] = useState<{ kamar: Kamar[]; pesanan: Pesanan[] } | null>(null);
  const [galat, setGalat] = useState("");
  const dari = geserBulan(bulan, -11) + "-01";
  const sampai = akhirBulan(geserBulan(bulan, 2));

  useEffect(() => {
    setData(null);
    api<{ kamar: Kamar[]; pesanan: Pesanan[] }>(`/api/kalender?dari=${dari}&sampai=${sampai}`)
      .then(setData)
      .catch((e) => setGalat(e.message));
  }, [dari, sampai]);

  const s = useMemo(() => (data ? statBulan(bulan, data.kamar, data.pesanan) : null), [data, bulan]);
  const lalu = useMemo(() => (data ? statBulan(geserBulan(bulan, -1), data.kamar, data.pesanan) : null), [data, bulan]);
  const tren = useMemo(() => (data ? Array.from({ length: 14 }, (_, i) => geserBulan(bulan, i - 11)).map((b) => ({ b, ...statBulan(b, data.kamar, data.pesanan) })) : []), [data, bulan]);

  function ekspor() {
    if (!s) return;
    unduhCsv(`laporan-bakoeria-${bulan}.csv`, [
      ["Kode", "Tamu", "Kamar", "Sumber", "Check-in", "Check-out", "Malam", "Malam di bulan ini", "Status", ...(rp ? ["Total", "Bagian bulan ini", "Komisi bagian bulan ini"] : [])],
      ...s.isi.map((p) => {
        const m = malam(p.checkIn, p.checkOut);
        const di = m.filter((t) => t >= s.awal && t < s.akhir).length;
        return [p.code, p.guest?.name ?? "", p.roomName, LABEL_CHANNEL[p.channel], p.checkIn, p.checkOut, m.length, di, LABEL_STATUS[p.status], ...(rp ? [p.totalAmount, p.totalAmount != null ? Math.round((p.totalAmount * di) / m.length) : "", p.otaCommissionEst != null ? Math.round((p.otaCommissionEst * di) / m.length) : ""] : [])];
      }),
    ]);
  }

  if (galat) return <Galat pesan={galat} />;
  const maksTren = Math.max(1, ...tren.map((t) => (rp ? t.kotor : t.malamTerjual)));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setBulan(geserBulan(bulan, -1))} className="grid size-10 place-items-center rounded-full bg-white ring-1 ring-panel-garis hover:bg-panel-lembut" aria-label="Bulan sebelumnya">‹</button>
          <h1 className="min-w-48 text-center text-2xl font-bold">Laporan {namaBulan(bulan)}</h1>
          <button onClick={() => setBulan(geserBulan(bulan, 1))} className="grid size-10 place-items-center rounded-full bg-white ring-1 ring-panel-garis hover:bg-panel-lembut" aria-label="Bulan berikutnya">›</button>
        </div>
        <Tombol varian="garis" onClick={ekspor} disabled={!s}>Unduh CSV</Tombol>
      </div>
      {!s || !lalu || !data ? (
        <Memuat />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Angka label="Okupansi" nilai={`${Math.round(s.okupansi * 100)}%`} ket={<Selisih kini={s.okupansi} lalu={lalu.okupansi} persen />} />
            {rp ? <Angka label="Pendapatan kotor" nilai={rupiah(s.kotor)} ket={<Selisih kini={s.kotor} lalu={lalu.kotor} />} /> : <Angka label="Malam terjual" nilai={s.malamTerjual} ket={<Selisih kini={s.malamTerjual} lalu={lalu.malamTerjual} />} />}
            {rp ? <Angka label="ADR" nilai={rupiah(s.adr)} ket="rata-rata per malam terjual" /> : <Angka label="Tamu tiba" nilai={s.tiba} />}
            <Angka label="Lama menginap" nilai={`${s.los.toFixed(1)} malam`} ket={`${s.tiba} pesanan tiba, ${s.batal} batal`} />
          </div>
          {rp && (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              <Angka label="Perkiraan komisi OTA" nilai={rupiah(s.komisi)} />
              <Angka label="Pendapatan bersih" nilai={rupiah(s.bersih)} ket="kotor dikurangi komisi" nada="hijau" />
              <Angka label="Malam terjual" nilai={s.malamTerjual} ket={s.tanpaHarga ? `${s.tanpaHarga} pesanan belum berharga, tidak ikut dihitung` : `dari ${s.hari * data.kamar.filter((k) => k.isActive).length} malam tersedia`} />
            </div>
          )}

          <Kartu judul={rp ? "Pendapatan per bulan" : "Malam terjual per bulan"} ket="11 bulan ke belakang dan 2 bulan ke depan. Bulan depan berisi pesanan yang sudah masuk.">
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${tren.length * 60} 210`} className="h-56 min-w-[640px] w-full" role="img" aria-label="Grafik tren bulanan">
                {[0.25, 0.5, 0.75, 1].map((g) => (
                  <line key={g} x1="0" x2={tren.length * 60} y1={170 - g * 150} y2={170 - g * 150} stroke="#e5e2da" strokeWidth="1" />
                ))}
                {tren.map((t, i) => {
                  const v = rp ? t.kotor : t.malamTerjual;
                  const h = (v / maksTren) * 150;
                  const kini = t.b === bulan;
                  const depan = t.b > hariIniWit().slice(0, 7);
                  return (
                    <g key={t.b} onClick={() => setBulan(t.b)} className="cursor-pointer">
                      {v > 0 && <rect x={i * 60 + 14} y={170 - Math.max(h, 3)} width="32" height={Math.max(h, 3)} rx={Math.min(6, Math.max(h, 3) / 2)} fill={kini ? "#188B9A" : depan ? "#C9D3E3" : "#133250"} />}
                      <text x={i * 60 + 30} y="190" textAnchor="middle" fontSize="12" fill="#5F6675" fontWeight={kini ? 700 : 400}>{namaBulan(t.b, true)}</text>
                      <text x={i * 60 + 30} y="205" textAnchor="middle" fontSize="10" fill="#8a909c">{Math.round(t.okupansi * 100)}%</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </Kartu>

          <div className="grid gap-6 xl:grid-cols-2">
            <Kartu judul="Per sumber pesanan">
              {s.perSumber.length === 0 ? (
                <Kosong judul="Belum ada malam terjual bulan ini" />
              ) : (
                <ul className="grid gap-3">
                  {s.perSumber.map(([c, v]) => {
                    const lebar = rp ? (s.kotor ? v.uang / s.kotor : 0) : s.malamTerjual ? v.malam / s.malamTerjual : 0;
                    return (
                      <li key={c}>
                        <div className="flex justify-between gap-3 text-sm"><b>{LABEL_CHANNEL[c]}</b><span className="angka text-panel-redup">{v.malam} malam{rp ? ` · ${rupiah(v.uang)}` : ""}</span></div>
                        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-panel-latar"><i className="block h-full rounded-full" style={{ width: `${lebar * 100}%`, background: WARNA_CHANNEL[c] }} /></div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Kartu>
            <Kartu judul="Okupansi per kamar">
              <ul className="grid gap-3">
                {data.kamar.map((k) => {
                  const m = s.perKamar.get(k.id) ?? 0;
                  return (
                    <li key={k.id}>
                      <div className="flex justify-between gap-3 text-sm"><b>{k.name}</b><span className="angka text-panel-redup">{m}/{s.hari} malam · {Math.round((m / s.hari) * 100)}%</span></div>
                      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-panel-latar"><i className="block h-full rounded-full bg-panel-utama" style={{ width: `${(m / s.hari) * 100}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
            </Kartu>
          </div>
          <Penjelasan>
            <p>Hanya pesanan berstatus Terkonfirmasi, Menginap, dan Selesai yang dihitung. Tahanan dan pesanan batal tidak ikut.</p>
            <p>Pesanan yang melewati pergantian bulan dibagi rata per malam. Contoh: 4 malam senilai Rp4.000.000 yang 1 malamnya jatuh di bulan ini menyumbang Rp1.000.000.</p>
            <p>ADR (average daily rate) adalah pendapatan kotor dibagi malam terjual. Komisi adalah perkiraan yang dicatat di tiap pesanan.</p>
          </Penjelasan>
        </>
      )}
    </div>
  );
}
