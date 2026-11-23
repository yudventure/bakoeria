"use client";

import { useMemo, useState } from "react";
import PilihTanggal from "@/components/tanggal";
import { rupiah, tglPendek } from "@/lib/booking";
import { terapkan, type CaraUbah } from "@/lib/tarif";
import { api } from "./api";
import type { Kamar } from "./tipe";
import { Bidang, Kartu, masukan, Modal, Tombol, useToast } from "./ui";

/* ------------------------------------------------------------ bagian bersama */

type Mode = "tetap" | "naikPersen" | "turunPersen" | "naikRupiah" | "turunRupiah";
const LABEL_MODE: Record<Mode, string> = { tetap: "Jadikan", naikPersen: "Naikkan %", turunPersen: "Turunkan %", naikRupiah: "Naikkan Rp", turunRupiah: "Turunkan Rp" };
const keCara = (mode: Mode, angka: string): CaraUbah | null => {
  const n = Number(angka);
  if (angka.trim() === "" || !Number.isFinite(n) || n < 0) return null;
  if (mode === "tetap") return { mode: "tetap", nilai: n };
  if (mode === "naikPersen") return { mode: "persen", nilai: n };
  if (mode === "turunPersen") return { mode: "persen", nilai: -Math.min(95, n) };
  return { mode: "rupiah", nilai: mode === "naikRupiah" ? n : -n };
};

function IsianCara({ mode, angka, ubah, mode2, label = "Harga" }: { mode: Mode; angka: string; ubah: (m: Mode, a: string) => void; mode2?: Mode[]; label?: string }) {
  return (
    <div className="flex gap-2">
      <select aria-label={`${label}: cara mengubah`} className={`${masukan} w-40 shrink-0`} value={mode} onChange={(e) => ubah(e.target.value as Mode, angka)}>
        {(mode2 ?? (Object.keys(LABEL_MODE) as Mode[])).map((m) => <option key={m} value={m}>{LABEL_MODE[m]}</option>)}
      </select>
      <input aria-label={`${label}: ${mode === "tetap" ? "rupiah" : mode.endsWith("Persen") ? "persen" : "rupiah"}`} className={masukan} type="number" min={0} inputMode="numeric" value={angka} placeholder={mode === "tetap" ? "1980000" : mode.endsWith("Persen") ? "20" : "100000"} onChange={(e) => ubah(mode, e.target.value)} />
    </div>
  );
}

/** Pilih kamar dengan tombol cepat: semua, atau per jenis cottage. */
function PilihKamar({ kamar, pilih, ubah }: { kamar: Kamar[]; pilih: string[]; ubah: (ids: string[]) => void }) {
  const tipe = [...new Set(kamar.map((k) => k.roomType ?? "Tanpa jenis"))];
  const cepat = (ids: string[]) => (
    <button type="button" className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${ids.length && ids.every((i) => pilih.includes(i)) && ids.length === pilih.length ? "bg-panel-utama text-white ring-panel-utama" : "ring-panel-garis hover:bg-panel-latar"}`} onClick={() => ubah(ids)}>
      {ids.length === kamar.length ? "Semua kamar" : `${kamar.find((k) => k.id === ids[0])?.roomType ?? "Tanpa jenis"} (${ids.length})`}
    </button>
  );
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {cepat(kamar.map((k) => k.id))}
        {tipe.length > 1 && tipe.map((t) => <span key={t}>{cepat(kamar.filter((k) => (k.roomType ?? "Tanpa jenis") === t).map((k) => k.id))}</span>)}
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {kamar.map((k) => (
          <label key={k.id} className="flex items-center gap-2 rounded-xl bg-panel-latar px-3 py-2 text-sm">
            <input type="checkbox" className="size-4" checked={pilih.includes(k.id)} onChange={(e) => ubah(e.target.checked ? [...pilih, k.id] : pilih.filter((x) => x !== k.id))} />
            {k.name}
          </label>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ harga massal */

export function HargaMassal({ kamar, buka, tutup, selesai }: { kamar: Kamar[]; buka: boolean; tutup: () => void; selesai: () => void }) {
  const toast = useToast();
  const [ids, setIds] = useState<string[]>(kamar.map((k) => k.id));
  const [tarif, setTarif] = useState<{ ubah: boolean; mode: Mode; angka: string }>({ ubah: true, mode: "tetap", angka: "" });
  const [normal, setNormal] = useState<{ ubah: "biar" | "ubah" | "hapus"; mode: Mode; angka: string }>({ ubah: "biar", mode: "tetap", angka: "" });
  const [sibuk, setSibuk] = useState(false);
  const caraTarif = tarif.ubah ? keCara(tarif.mode, tarif.angka) : null;
  const caraNormal = normal.ubah === "ubah" ? keCara(normal.mode, normal.angka) : null;
  const pratinjau = kamar.filter((k) => ids.includes(k.id)).map((k) => {
    const baru = caraTarif ? terapkan(k.baseRate, caraTarif) : k.baseRate;
    const n = normal.ubah === "hapus" ? null : caraNormal ? terapkan(k.normalRate ?? k.baseRate, caraNormal) : k.normalRate;
    return { k, baru, normal: n && n > 0 ? n : null };
  });
  const siap = ids.length > 0 && (caraTarif || caraNormal || normal.ubah === "hapus") && !(tarif.ubah && !caraTarif) && !(normal.ubah === "ubah" && !caraNormal);

  async function simpan() {
    setSibuk(true);
    try {
      await api("/api/kamar", { method: "PATCH", body: { massal: { roomIds: ids, tarif: caraTarif, normal: normal.ubah === "hapus" ? "hapus" : caraNormal } } });
      toast(`Harga ${ids.length} kamar diperbarui`);
      selesai();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Modal judul="Ubah harga massal" lebar="max-w-3xl" buka={buka} tutup={tutup} kaki={<><Tombol varian="garis" onClick={tutup}>Batal</Tombol><Tombol disabled={!siap || sibuk} onClick={simpan}>{sibuk ? "Menyimpan…" : `Terapkan ke ${ids.length} kamar`}</Tombol></>}>
      <div className="grid gap-5">
        <Bidang label="Kamar yang diubah"><PilihKamar kamar={kamar} pilih={ids} ubah={setIds} /></Bidang>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="size-4" checked={tarif.ubah} onChange={(e) => setTarif({ ...tarif, ubah: e.target.checked })} /> Ubah tarif per malam</label>
            {tarif.ubah && <IsianCara label="Tarif per malam" mode={tarif.mode} angka={tarif.angka} ubah={(mode, angka) => setTarif({ ...tarif, mode, angka })} />}
            <p className="text-xs text-panel-redup">Harga yang berlaku dan ditagihkan. Hasil persen dibulatkan ke ribuan.</p>
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-bold">Harga normal (dicoret, tanda promo)</p>
            <select aria-label="Harga normal" className={masukan} value={normal.ubah} onChange={(e) => setNormal({ ...normal, ubah: e.target.value as typeof normal.ubah })}>
              <option value="biar">Tidak diubah</option>
              <option value="ubah">Ubah</option>
              <option value="hapus">Hapus (promo selesai)</option>
            </select>
            {normal.ubah === "ubah" && <IsianCara label="Harga normal" mode={normal.mode} angka={normal.angka} ubah={(mode, angka) => setNormal({ ...normal, mode, angka })} />}
          </div>
        </div>
        {pratinjau.length > 0 && (
          <div className="overflow-x-auto rounded-xl ring-1 ring-panel-garis">
            <table className="w-full text-sm">
              <thead className="bg-panel-latar text-left text-xs text-panel-redup"><tr><th className="px-3 py-2">Kamar</th><th className="px-3 py-2 text-right">Tarif sekarang</th><th className="px-3 py-2 text-right">Tarif baru</th><th className="px-3 py-2 text-right">Harga normal baru</th></tr></thead>
              <tbody>
                {pratinjau.map(({ k, baru, normal: n }) => (
                  <tr key={k.id} data-pratinjau={k.name} className="border-t border-panel-garis">
                    <td className="px-3 py-2 font-bold">{k.name}</td>
                    <td className="angka px-3 py-2 text-right text-panel-redup">{rupiah(k.baseRate)}</td>
                    <td className={`angka px-3 py-2 text-right font-bold ${baru !== k.baseRate ? "text-panel-utama" : ""}`}>{rupiah(baru)}</td>
                    <td className="angka px-3 py-2 text-right">{n && n > baru ? <s className="text-panel-redup">{rupiah(n)}</s> : <span className="text-panel-redup">tanpa promo</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------ musim ramai */

export function MusimMassal({ kamar, buka, tutup, selesai }: { kamar: Kamar[]; buka: boolean; tutup: () => void; selesai: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ label: "Musim ramai", dari: "", sampai: "", mode: "naikPersen" as Mode, angka: "", timpa: false });
  const [ids, setIds] = useState<string[]>(kamar.map((k) => k.id));
  const [sibuk, setSibuk] = useState(false);
  const cara = keCara(f.mode, f.angka);
  const siap = f.dari && f.sampai && f.sampai >= f.dari && cara && ids.length;

  async function simpan() {
    setSibuk(true);
    try {
      await api("/api/kamar", { body: { musimMassal: { label: f.label, dateFrom: f.dari, dateTo: f.sampai, cara, roomIds: ids, timpa: f.timpa } } });
      toast(`${f.label || "Musim"} dipasang ke ${ids.length} kamar`);
      selesai();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Modal judul="Musim ramai dan tarif khusus" lebar="max-w-3xl" buka={buka} tutup={tutup} kaki={<><Tombol varian="garis" onClick={tutup}>Batal</Tombol><Tombol disabled={!siap || sibuk} onClick={simpan}>{sibuk ? "Menyimpan…" : `Pasang ke ${ids.length} kamar`}</Tombol></>}>
      <div className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Bidang label="Nama musim" className="sm:col-span-3" ket="Tampil di formulir pemesanan website, misalnya Musim ramai, Natal & Tahun Baru, Low season.">
            <div className="grid gap-2">
              <input className={masukan} value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} />
              <div className="flex flex-wrap gap-1.5">{["Musim ramai", "Natal & Tahun Baru", "Libur Lebaran", "Low season"].map((x) => <button key={x} type="button" onClick={() => setF({ ...f, label: x, mode: x === "Low season" ? "turunPersen" : f.mode === "turunPersen" ? "naikPersen" : f.mode })} className="rounded-full px-2.5 py-1 text-xs ring-1 ring-panel-garis hover:bg-panel-latar">{x}</button>)}</div>
            </div>
          </Bidang>
          <Bidang label="Dari tanggal"><PilihTanggal value={f.dari} onChange={(v) => setF({ ...f, dari: v, sampai: f.sampai && f.sampai < v ? v : f.sampai })} /></Bidang>
          <Bidang label="Sampai tanggal" ket="Termasuk malam ini."><PilihTanggal value={f.sampai} min={f.dari || undefined} onChange={(v) => setF({ ...f, sampai: v })} /></Bidang>
          <Bidang label="Harga per malam" ket="Dihitung dari tarif dasar tiap kamar."><IsianCara label="Harga musim" mode={f.mode} angka={f.angka} ubah={(mode, angka) => setF({ ...f, mode, angka })} /></Bidang>
        </div>
        <Bidang label="Berlaku untuk"><PilihKamar kamar={kamar} pilih={ids} ubah={setIds} /></Bidang>
        {cara && ids.length > 0 && (
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {kamar.filter((k) => ids.includes(k.id)).map((k) => (
              <li key={k.id} data-pratinjau={k.name} className="flex justify-between gap-2 rounded-xl bg-panel-latar px-3 py-2"><span>{k.name}</span><span className="angka"><span className="text-panel-redup">{rupiah(k.baseRate)} →</span> <b>{rupiah(terapkan(k.baseRate, cara))}</b></span></li>
            ))}
          </ul>
        )}
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 size-4" checked={f.timpa} onChange={(e) => setF({ ...f, timpa: e.target.checked })} /><span><b>Timpa</b> tarif musiman lain yang tanggalnya bertabrakan. Tanpa centang ini, penyimpanan dibatalkan bila ada yang bertabrakan.</span></label>
      </div>
    </Modal>
  );
}

/** Ringkasan semua musim yang terpasang, digabung per nama dan rentang tanggal, dengan tombol hapus untuk semua kamar sekaligus. */
export function DaftarMusim({ kamar, ubahBoleh, tambah, selesai }: { kamar: Kamar[]; ubahBoleh: boolean; tambah: () => void; selesai: () => void }) {
  const toast = useToast();
  const grup = useMemo(() => {
    const peta = new Map<string, { label: string; dari: string; sampai: string; tarif: { nama: string; rate: number; dasar: number }[] }>();
    for (const k of kamar) for (const m of k.musim) {
      const kunci = JSON.stringify([m.label ?? "", m.dateFrom, m.dateTo]);
      const g = peta.get(kunci) ?? { label: m.label ?? "", dari: m.dateFrom, sampai: m.dateTo, tarif: [] };
      g.tarif.push({ nama: k.name, rate: m.rate, dasar: k.baseRate });
      peta.set(kunci, g);
    }
    return [...peta.entries()].sort((a, b) => a[1].dari.localeCompare(b[1].dari));
  }, [kamar]);
  async function hapus(kunci: string, label: string) {
    if (!window.confirm(`Hapus ${label || "tarif musiman ini"} dari semua kamar?`)) return;
    try {
      await api(`/api/kamar?musimGrup=${encodeURIComponent(kunci)}`, { method: "DELETE" });
      toast("Musim dihapus");
      selesai();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    }
  }
  const tgl = (s: string) => `${tglPendek(s)} ${s.slice(0, 4)}`;
  return (
    <Kartu judul="Musim ramai & tarif khusus" ket="Menimpa tarif dasar pada malam yang dicakup, untuk pesanan dari dashboard maupun website." aksi={ubahBoleh && <Tombol kecil onClick={tambah}>+ Musim</Tombol>}>
      {grup.length === 0 ? (
        <p className="text-sm text-panel-redup">Belum ada. Tambahkan musim ramai sekali untuk semua kamar, misalnya naik 20% dari 15 Desember sampai 5 Januari.</p>
      ) : (
        <ul className="grid gap-2">
          {grup.map(([kunci, g]) => {
            const min = Math.min(...g.tarif.map((t) => t.rate));
            const maks = Math.max(...g.tarif.map((t) => t.rate));
            const selisih = g.tarif.map((t) => (t.dasar ? Math.round(((t.rate - t.dasar) / t.dasar) * 100) : 0));
            const sama = selisih.every((x) => x === selisih[0]);
            return (
              <li key={kunci} data-musim={g.label} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-panel-latar px-4 py-3">
                <div className="min-w-0">
                  <b className="block text-sm">{g.label || "Tarif musiman"}</b>
                  <span className="angka block text-xs text-panel-redup">{tgl(g.dari)} – {tgl(g.sampai)} · {g.tarif.length} kamar</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="angka text-right text-sm"><b>{min === maks ? rupiah(min) : `${rupiah(min)} – ${rupiah(maks)}`}</b>{sama && selisih[0] !== 0 && <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${selisih[0] > 0 ? "bg-panel-kuning/15 text-panel-kuning" : "bg-panel-hijau-lembut text-panel-hijau"}`}>{selisih[0] > 0 ? "+" : ""}{selisih[0]}%</span>}</span>
                  {ubahBoleh && <Tombol kecil varian="hantu" onClick={() => hapus(kunci, g.label)}>Hapus</Tombol>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Kartu>
  );
}

