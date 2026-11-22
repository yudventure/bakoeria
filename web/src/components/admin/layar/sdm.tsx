"use client";

import PilihTanggal from "@/components/tanggal";
import { useMemo, useState } from "react";
import { hariIniWit, rupiah, tambahHari } from "@/lib/booking";
import { hitungGaji, LABEL_PARAMETER, STATUS_ABSEN, SUMBER_PARAMETER, type ParameterSdm } from "@/lib/modul";
import { Angka, Bidang, cx, Kartu, Kosong, masukan, Penjelasan, Pil, Tab, Tombol, useToast } from "../ui";
import { Pembungkus, PemilihBulan, TabelModul, useModul } from "./modul";
import { unduhCsv } from "./pesanan";

type T = "gaji" | "absensi" | "pegawai" | "asuransi" | "inventaris" | "acuan";

export default function Sdm() {
  const m = useModul("sdm");
  const toast = useToast();
  const [tab, setTab] = useState<T>("gaji");
  const [bulan, setBulan] = useState(hariIniWit().slice(0, 7));
  const [tgl, setTgl] = useState(hariIniWit());
  const [p, setP] = useState<ParameterSdm | null>(null);
  const gaji = useMemo(() => hitungGaji(m.data.pegawai ?? [], m.data.absensi ?? [], bulan, m.parameter), [m.data, bulan, m.parameter]);
  const total = gaji.reduce((a, g) => ({ biaya: a.biaya + g.biaya, diterima: a.diterima + g.diterima, iuran: a.iuran + g.iuranPerusahaan }), { biaya: 0, diterima: 0, iuran: 0 });
  const aktif = (m.data.pegawai ?? []).filter((x) => x.aktif !== "Nonaktif");
  const bolehAbsen = m.tulisKoleksi.includes("absensi");

  async function absen(pegawai: string, status: string) {
    const ada = (m.data.absensi ?? []).find((a) => a.pegawai === pegawai && a.tanggal === tgl);
    const g = await m.simpan("absensi", { tanggal: tgl, pegawai, status, catatan: ada?.catatan ?? "" }, ada?.id);
    if (g) toast(g, "galat");
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">SDM & gaji</h1>
        <p className="mt-1 text-sm text-panel-redup">Pegawai, absensi harian, perkiraan biaya gaji dengan BPJS dan THR, asuransi, dan perlengkapan kerja.</p>
      </div>
      <Tab<T> pilihan={[{ id: "gaji", label: "Biaya gaji" }, { id: "absensi", label: "Absensi" }, { id: "pegawai", label: "Pegawai" }, { id: "asuransi", label: "Asuransi" }, { id: "inventaris", label: "Perlengkapan" }, { id: "acuan", label: "Angka acuan" }]} nilai={tab} ubah={setTab} />
      <Pembungkus m={m}>
        {tab === "gaji" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PemilihBulan bulan={bulan} ubah={setBulan} />
              <Tombol varian="garis" disabled={!gaji.length} onClick={() => unduhCsv(`gaji-${bulan}.csv`, [["Nama", "Jabatan", "Gaji", "Tunjangan", "Iuran perusahaan", "Iuran pekerja", "Cadangan THR", "Alpa", "Potongan alpa", "Diterima", "Biaya penuh"], ...gaji.map((g) => [g.nama, g.jabatan, g.gaji, g.tunjangan, g.iuranPerusahaan, g.iuranPekerja, g.thr, g.alpa, g.potonganAlpa, g.diterima, g.biaya])])}>Unduh CSV</Tombol>
            </div>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              <Angka label="Biaya gaji penuh" nilai={rupiah(total.biaya)} ket={`${gaji.length} pegawai aktif`} />
              <Angka label="Diterima pegawai" nilai={rupiah(total.diterima)} />
              <Angka label="Iuran BPJS perusahaan" nilai={rupiah(total.iuran)} />
            </div>
            <Kartu judul="Rincian per pegawai">
              {gaji.length === 0 ? (
                <Kosong judul="Belum ada pegawai aktif" isi="Tambahkan di tab Pegawai." />
              ) : (
                <div className="-mx-5 overflow-x-auto sm:-mx-6">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead>
                      <tr className="border-b border-panel-garis text-left text-[11px] font-bold uppercase tracking-[0.12em] text-panel-redup">
                        {["Pegawai", "Upah", "BPJS perusahaan", "BPJS pekerja", "THR", "Alpa", "Diterima", "Biaya penuh"].map((h, i) => <th key={h} className={cx("px-3 py-2", i === 0 ? "pl-5 sm:pl-6" : "text-right")}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {gaji.map((g) => (
                        <tr key={g.id} className="border-b border-panel-garis/60 last:border-0">
                          <td className="py-2.5 pl-5 pr-3 sm:pl-6"><b>{g.nama}</b> {g.dibawahUmp && <Pil nada="merah">di bawah UMP</Pil>}<span className="block text-xs text-panel-redup">{g.jabatan}</span></td>
                          {[g.upah, g.iuranPerusahaan, g.iuranPekerja, g.thr].map((v, i) => <td key={i} className="angka px-3 text-right">{rupiah(v)}</td>)}
                          <td className="angka px-3 text-right">{g.alpa ? `${g.alpa} hari (−${rupiah(g.potonganAlpa)})` : "–"}</td>
                          <td className="angka px-3 text-right font-bold">{rupiah(g.diterima)}</td>
                          <td className="angka px-3 pr-5 text-right font-bold">{rupiah(g.biaya)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Kartu>
            <Penjelasan>
              <p>Biaya penuh = gaji + tunjangan + iuran BPJS bagian perusahaan + cadangan THR per bulan. Diterima = upah − potongan alpa − iuran bagian pekerja. PPh 21 tidak dihitung.</p>
              <p>Persentase dan batas upah bisa diubah di tab Angka acuan.</p>
            </Penjelasan>
          </>
        )}
        {tab === "absensi" && (
          <>
            <Kartu
              judul="Absensi harian"
              ket="Ketuk status untuk mencatat. Ketuk lagi status lain untuk mengubahnya."
              aksi={
                <div className="flex items-center gap-2">
                  <button onClick={() => setTgl(tambahHari(tgl, -1))} className="grid size-9 place-items-center rounded-full ring-1 ring-panel-garis" aria-label="Hari sebelumnya">‹</button>
                  <PilihTanggal className="w-44" label="Tanggal absensi" value={tgl} onChange={setTgl} />
                  <button onClick={() => setTgl(tambahHari(tgl, 1))} className="grid size-9 place-items-center rounded-full ring-1 ring-panel-garis" aria-label="Hari berikutnya">›</button>
                </div>
              }
            >
              {aktif.length === 0 ? (
                <Kosong judul="Belum ada pegawai aktif" />
              ) : (
                <ul className="divide-y divide-panel-garis">
                  {aktif.map((x) => {
                    const st = (m.data.absensi ?? []).find((a) => a.pegawai === x.id && a.tanggal === tgl)?.status;
                    return (
                      <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <span><b>{String(x.nama)}</b> <span className="text-sm text-panel-redup">· {String(x.jabatan)}</span></span>
                        <span className="flex flex-wrap gap-1">
                          {STATUS_ABSEN.map((s) => (
                            <button key={s} disabled={!bolehAbsen} onClick={() => absen(x.id, s)} className={cx("rounded-full px-3 py-1 text-xs font-bold ring-1", st === s ? (s === "Alpa" ? "bg-panel-merah text-white ring-panel-merah" : s === "Hadir" ? "bg-panel-hijau text-white ring-panel-hijau" : "bg-panel-utama text-white ring-panel-utama") : "bg-white text-panel-redup ring-panel-garis hover:text-panel-tinta")}>
                              {s}
                            </button>
                          ))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Kartu>
            <TabelModul m={m} koleksiId="absensi" saring={(a) => String(a.tanggal ?? "").startsWith(tgl.slice(0, 7))} ket="Semua catatan bulan yang dipilih." />
          </>
        )}
        {tab === "pegawai" && <TabelModul m={m} koleksiId="pegawai" urut={(a, b) => String(a.nama).localeCompare(String(b.nama))} />}
        {tab === "asuransi" && <TabelModul m={m} koleksiId="asuransi" />}
        {tab === "inventaris" && <TabelModul m={m} koleksiId="inventaris" ket="Seragam, alat kerja, dan alat keselamatan per pegawai." />}
        {tab === "acuan" && (
          <Kartu judul="Angka acuan perhitungan gaji" ket="Persen ditulis sebagai angka persen, misalnya 4 untuk 4%." aksi={m.bolehUbahParameter && <Tombol kecil onClick={async () => { const g = await m.simpanParameter(p ?? m.parameter); toast(g ?? "Angka acuan disimpan", g ? "galat" : "biasa"); }}>Simpan</Tombol>}>
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(LABEL_PARAMETER) as (keyof ParameterSdm)[]).map((k) => (
                <Bidang key={k} label={`${LABEL_PARAMETER[k].label} (${LABEL_PARAMETER[k].satuan})`} ket={LABEL_PARAMETER[k].ket}>
                  <input className={masukan} type="number" step="any" disabled={!m.bolehUbahParameter} value={(p ?? m.parameter)[k]} onChange={(e) => setP({ ...(p ?? m.parameter), [k]: Number(e.target.value) })} />
                </Bidang>
              ))}
            </div>
            <div className="mt-5 text-sm text-panel-redup">
              <p className="font-bold text-panel-tinta">Sumber angka awal</p>
              <ul className="mt-1 list-disc pl-5">
                {SUMBER_PARAMETER.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.teks}</a></li>)}
              </ul>
            </div>
          </Kartu>
        )}
      </Pembungkus>
    </div>
  );
}
