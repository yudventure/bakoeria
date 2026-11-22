"use client";

import PilihTanggal from "@/components/tanggal";
import { useCallback, useEffect, useMemo, useState } from "react";
import { rupiah } from "@/lib/booking";
import { koleksiDari, PARAMETER_AWAL, type Bidang as TBidang, type Modul, type ParameterSdm, type Rekaman } from "@/lib/modul";
import { api } from "../api";
import { Bidang, Galat, Kartu, Kosong, masukan, Memuat, Modal, Tombol, useToast } from "../ui";

export interface DataModul {
  siap: boolean;
  galat: string;
  data: Record<string, Rekaman[]>;
  akses: "tulis" | "baca";
  tulisKoleksi: string[];
  parameter: ParameterSdm;
  bolehUbahParameter: boolean;
  muat: () => Promise<void>;
  simpan: (koleksi: string, data: Record<string, unknown>, id?: string) => Promise<string | null>;
  hapus: (koleksi: string, id: string) => Promise<string | null>;
  simpanParameter: (p: ParameterSdm) => Promise<string | null>;
}

export function useModul(modul: Modul): DataModul {
  const [s, setS] = useState({ siap: false, galat: "", data: {} as Record<string, Rekaman[]>, akses: "baca" as "tulis" | "baca", tulisKoleksi: [] as string[], parameter: PARAMETER_AWAL, bolehUbahParameter: false });
  const muat = useCallback(async () => {
    try {
      const o = await api<{ data: Record<string, Rekaman[]>; akses: "tulis" | "baca"; tulisKoleksi: string[]; parameter?: ParameterSdm; bolehUbahParameter?: boolean }>(`/api/modul/${modul}`);
      setS({ siap: true, galat: "", data: o.data, akses: o.akses, tulisKoleksi: o.tulisKoleksi, parameter: o.parameter ?? PARAMETER_AWAL, bolehUbahParameter: Boolean(o.bolehUbahParameter) });
    } catch (e) {
      setS((x) => ({ ...x, siap: true, galat: e instanceof Error ? e.message : "Gagal memuat." }));
    }
  }, [modul]);
  useEffect(() => {
    muat();
  }, [muat]);
  const kirim = async (f: () => Promise<unknown>) => {
    try {
      await f();
      await muat();
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Gagal.";
    }
  };
  return {
    ...s,
    muat,
    simpan: (koleksi, data, id) => kirim(() => api(`/api/modul/${modul}`, { body: { koleksi, data, id } })),
    hapus: (koleksi, id) => kirim(() => api(`/api/modul/${modul}?koleksi=${koleksi}&id=${id}`, { method: "DELETE" })),
    simpanParameter: (p) => kirim(() => api(`/api/modul/${modul}`, { method: "PUT", body: { parameter: p } })),
  };
}

export const namaRekaman = (r: Rekaman) => String(r.nama ?? r.barang ?? r.uraian ?? r.id);

function tampilNilai(b: TBidang, v: unknown, rujukan: Record<string, Rekaman[]>) {
  if (v === undefined || v === "") return "–";
  if (b.tipe === "angka") return b.satuan === "Rp" ? rupiah(Number(v)) : `${Number(v).toLocaleString("id-ID")}${b.satuan ? " " + b.satuan : ""}`;
  if (b.tipe === "rujuk") {
    const r = (rujukan[b.ke!] ?? []).find((x) => x.id === v);
    return r ? namaRekaman(r) : "(terhapus)";
  }
  return String(v);
}

export function FormRekaman({ koleksiId, awal, rujukan, tutup, simpan, hapus }: { koleksiId: string; awal: Rekaman | null; rujukan: Record<string, Rekaman[]>; tutup: () => void; simpan: (d: Record<string, unknown>) => Promise<string | null>; hapus?: () => Promise<string | null> }) {
  const k = koleksiDari(koleksiId)!;
  const [nilai, setNilai] = useState<Record<string, string | number>>(() => {
    const o: Record<string, string | number> = {};
    for (const b of k.bidang) o[b.k] = (awal?.[b.k] as string | number | undefined) ?? b.awal ?? (b.tipe === "tanggal" ? new Date().toISOString().slice(0, 10) : "");
    return o;
  });
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  async function kirim() {
    setSibuk(true);
    const g = await simpan(nilai);
    setSibuk(false);
    if (g) setGalat(g);
    else tutup();
  }
  return (
    <Modal
      judul={awal ? `Ubah ${k.satuanJamak}` : `Tambah ${k.satuanJamak}`}
      buka
      tutup={tutup}
      kaki={
        <>
          {hapus && (
            <Tombol varian="hantu" className="mr-auto text-panel-merah" onClick={async () => { if (!window.confirm("Hapus catatan ini?")) return; const g = await hapus(); if (g) setGalat(g); else tutup(); }}>
              Hapus
            </Tombol>
          )}
          <Tombol varian="garis" onClick={tutup}>Batal</Tombol>
          <Tombol disabled={sibuk} onClick={kirim}>{sibuk ? "Menyimpan…" : "Simpan"}</Tombol>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {k.bidang.map((b) => (
          <Bidang key={b.k} label={`${b.label}${b.wajib ? "" : " (opsional)"}`} ket={b.ket} className={b.tipe === "catatan" ? "sm:col-span-2" : ""}>
            {b.tipe === "pilih" ? (
              <select className={masukan} value={String(nilai[b.k] ?? "")} onChange={(e) => setNilai({ ...nilai, [b.k]: e.target.value })}>
                <option value="">Pilih…</option>
                {b.opsi!.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : b.tipe === "rujuk" ? (
              <select className={masukan} value={String(nilai[b.k] ?? "")} onChange={(e) => setNilai({ ...nilai, [b.k]: e.target.value })}>
                <option value="">{b.wajib ? "Pilih…" : "Tidak ada"}</option>
                {(rujukan[b.ke!] ?? []).map((x) => <option key={x.id} value={x.id}>{namaRekaman(x)}</option>)}
              </select>
            ) : b.tipe === "catatan" ? (
              <textarea className={masukan} rows={3} value={String(nilai[b.k] ?? "")} onChange={(e) => setNilai({ ...nilai, [b.k]: e.target.value })} />
            ) : b.tipe === "tanggal" ? (
              <PilihTanggal value={String(nilai[b.k] ?? "")} bolehKosong={!b.wajib} onChange={(v) => setNilai({ ...nilai, [b.k]: v })} />
            ) : (
              <input className={masukan} type={b.tipe === "angka" ? "number" : "text"} min={b.tipe === "angka" && !b.negatif ? 0 : undefined} value={String(nilai[b.k] ?? "")} onChange={(e) => setNilai({ ...nilai, [b.k]: e.target.value })} />
            )}
          </Bidang>
        ))}
      </div>
      {galat && <p role="alert" className="mt-4 rounded-xl bg-panel-merah-lembut px-4 py-3 text-sm font-bold text-panel-merah">{galat}</p>}
    </Modal>
  );
}

/** Tabel satu koleksi dengan tambah, ubah, dan hapus. */
export function TabelModul({ m, koleksiId, saring, urut, ket }: { m: DataModul; koleksiId: string; saring?: (r: Rekaman) => boolean; urut?: (a: Rekaman, b: Rekaman) => number; ket?: string }) {
  const k = koleksiDari(koleksiId)!;
  const [form, setForm] = useState<{ r: Rekaman | null } | null>(null);
  const [cari, setCari] = useState("");
  const toast = useToast();
  const boleh = m.tulisKoleksi.includes(koleksiId);
  const baris = useMemo(() => {
    let l = (m.data[koleksiId] ?? []).filter((r) => !saring || saring(r));
    if (cari.trim()) l = l.filter((r) => JSON.stringify(r).toLowerCase().includes(cari.trim().toLowerCase()));
    return [...l].sort(urut ?? ((a, b) => String(b.tanggal ?? b.dibuat ?? "").localeCompare(String(a.tanggal ?? a.dibuat ?? ""))));
  }, [m.data, koleksiId, saring, urut, cari]);
  const bidang = k.kolom.map((c) => k.bidang.find((b) => b.k === c)!);
  return (
    <Kartu judul={k.judul} ket={ket} aksi={boleh && <Tombol kecil onClick={() => setForm({ r: null })}>+ Tambah</Tombol>}>
      {(m.data[koleksiId] ?? []).length > 6 && <input className={masukan + " mb-4"} placeholder="Cari" value={cari} onChange={(e) => setCari(e.target.value)} aria-label={`Cari ${k.satuanJamak}`} />}
      {baris.length === 0 ? (
        <Kosong judul={`Belum ada ${k.satuanJamak}`} isi={boleh ? "Tambahkan yang pertama dengan tombol di atas." : undefined} />
      ) : (
        <div className="-mx-5 overflow-x-auto sm:-mx-6">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-panel-garis text-left text-[11px] font-bold uppercase tracking-[0.12em] text-panel-redup">
                {bidang.map((b) => <th key={b.k} className={"px-3 py-2 first:pl-5 sm:first:pl-6 " + (b.tipe === "angka" ? "text-right" : "")}>{b.label}</th>)}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {baris.map((r) => (
                <tr key={r.id} className="border-b border-panel-garis/60 last:border-0 hover:bg-panel-latar">
                  {bidang.map((b) => (
                    <td key={b.k} className={"px-3 py-2.5 first:pl-5 first:font-bold sm:first:pl-6 " + (b.tipe === "angka" ? "angka text-right whitespace-nowrap" : "")}>{tampilNilai(b, r[b.k], m.data)}</td>
                  ))}
                  <td className="pr-4 text-right">{boleh && <button onClick={() => setForm({ r })} className="text-sm font-bold text-panel-utama underline">Ubah</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {form && (
        <FormRekaman
          koleksiId={koleksiId}
          awal={form.r}
          rujukan={m.data}
          tutup={() => setForm(null)}
          simpan={async (d) => {
            const g = await m.simpan(koleksiId, d, form.r?.id);
            if (!g) toast("Tersimpan");
            return g;
          }}
          hapus={form.r ? () => m.hapus(koleksiId, form.r!.id) : undefined}
        />
      )}
    </Kartu>
  );
}

export function Pembungkus({ m, children }: { m: DataModul; children: React.ReactNode }) {
  if (!m.siap) return <Memuat />;
  if (m.galat) return <Galat pesan={m.galat} ulang={m.muat} />;
  return <>{children}</>;
}

export const geserBulan = (b: string, n: number) => {
  const d = new Date(b + "-01T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
};
export function PemilihBulan({ bulan, ubah }: { bulan: string; ubah: (b: string) => void }) {
  const nama = new Date(bulan + "-01T00:00:00Z").toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => ubah(geserBulan(bulan, -1))} className="grid size-9 place-items-center rounded-full bg-white ring-1 ring-panel-garis hover:bg-panel-lembut" aria-label="Bulan sebelumnya">‹</button>
      <span className="min-w-36 text-center font-bold">{nama}</span>
      <button onClick={() => ubah(geserBulan(bulan, 1))} className="grid size-9 place-items-center rounded-full bg-white ring-1 ring-panel-garis hover:bg-panel-lembut" aria-label="Bulan berikutnya">›</button>
    </div>
  );
}
