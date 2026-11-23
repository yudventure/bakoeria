"use client";

import { useEffect, useState } from "react";
import PilihTanggal from "@/components/tanggal";
import { hariIniWit, rupiah, tglPendek } from "@/lib/booking";
import { rapikanKode, teksKupon, type Kupon } from "@/lib/tarif";
import { api } from "./api";
import { Bidang, Kartu, masukan, Modal, Pil, Tombol, useToast } from "./ui";

type Isian = { id: string; kode: string; jenis: "PERSEN" | "NOMINAL"; nilai: string; maksPotongan: string; minMalam: string; berlakuSampai: string; tibaDari: string; tibaSampai: string; tipeKamar: string[]; maksPakai: string; aktif: boolean; catatan: string };
const KOSONG: Isian = { id: "", kode: "", jenis: "PERSEN", nilai: "10", maksPotongan: "", minMalam: "1", berlakuSampai: "", tibaDari: "", tibaSampai: "", tipeKamar: [], maksPakai: "", aktif: true, catatan: "" };
const keIsian = (k: Kupon): Isian => ({ id: k.id, kode: k.kode, jenis: k.jenis, nilai: String(k.nilai), maksPotongan: k.maksPotongan?.toString() ?? "", minMalam: String(k.minMalam), berlakuSampai: k.berlakuSampai ?? "", tibaDari: k.tibaDari ?? "", tibaSampai: k.tibaSampai ?? "", tipeKamar: k.tipeKamar, maksPakai: k.maksPakai?.toString() ?? "", aktif: k.aktif, catatan: k.catatan ?? "" });
const tgl = (s: string) => `${tglPendek(s)} ${s.slice(0, 4)}`;

/** Kode acak yang mudah dibaca, misalnya BAKO-7KQ2. */
const kodeAcak = () => "BAKO-" + Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

function status(k: Kupon): { teks: string; nada: "hijau" | "kuning" | "netral" } {
  if (!k.aktif) return { teks: "Nonaktif", nada: "netral" };
  if (k.berlakuSampai && hariIniWit() > k.berlakuSampai) return { teks: "Kedaluwarsa", nada: "kuning" };
  if (k.maksPakai != null && k.terpakai >= k.maksPakai) return { teks: "Kuota habis", nada: "kuning" };
  return { teks: "Aktif", nada: "hijau" };
}

/**
 * Kupon diskon untuk pemesanan dari website. Tamu memasukkan kodenya di formulir
 * pemesanan; potongan dihitung dan diperiksa ulang di server.
 */
export default function KuponDiskon({ tipeKamar }: { tipeKamar: string[] }) {
  const toast = useToast();
  const [daftar, setDaftar] = useState<Kupon[] | null>(null);
  const [galat, setGalat] = useState("");
  const [f, setF] = useState<Isian | null>(null);
  const [sibuk, setSibuk] = useState(false);
  useEffect(() => {
    api<{ kupon: Kupon[] }>("/api/kupon").then((r) => setDaftar(r.kupon)).catch((e) => setGalat(e.message));
  }, []);

  async function simpan() {
    if (!f) return;
    setSibuk(true);
    try {
      const r = await api<{ kupon: Kupon[] }>("/api/kupon", { body: { ...f, kode: rapikanKode(f.kode), id: f.id || undefined } });
      setDaftar(r.kupon);
      toast(f.id ? "Kupon diperbarui" : `Kupon ${rapikanKode(f.kode)} dibuat`);
      setF(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    } finally {
      setSibuk(false);
    }
  }
  async function hapus(k: Kupon) {
    if (!window.confirm(`Hapus kupon ${k.kode}?`)) return;
    try {
      const r = await api<{ kupon: Kupon[]; hasil: string }>(`/api/kupon?id=${k.id}`, { method: "DELETE" });
      setDaftar(r.kupon);
      toast(r.hasil === "dinonaktifkan" ? `${k.kode} sudah dipakai pesanan, jadi dinonaktifkan saja` : "Kupon dihapus");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    }
  }
  async function salin(kode: string) {
    try {
      await navigator.clipboard.writeText(kode);
      toast(`${kode} disalin`);
    } catch {
      /* clipboard tidak tersedia */
    }
  }

  const syarat = (k: Kupon) => [
    k.minMalam > 1 && `min. ${k.minMalam} malam`,
    (k.tibaDari || k.tibaSampai) && `tiba ${k.tibaDari ? tgl(k.tibaDari) : "…"} – ${k.tibaSampai ? tgl(k.tibaSampai) : "…"}`,
    k.tipeKamar.length > 0 && k.tipeKamar.join(", "),
    k.berlakuSampai && `berlaku s.d. ${tgl(k.berlakuSampai)}`,
  ].filter(Boolean).join(" · ");

  return (
    <Kartu judul="Kupon diskon" ket="Kode yang dimasukkan tamu di formulir pemesanan website. Potongan dihitung dari total menginap (kamar + extra bed anak)." aksi={<Tombol kecil onClick={() => setF({ ...KOSONG, kode: kodeAcak() })}>+ Kupon</Tombol>}>
      {galat ? <p className="text-sm text-panel-merah">{galat}</p> : !daftar ? <p className="text-sm text-panel-redup">Memuat…</p> : daftar.length === 0 ? (
        <p className="text-sm text-panel-redup">Belum ada kupon. Buat misalnya EARLYBIRD 10% untuk tiba 3 bulan lagi, atau kode khusus untuk agen dan tamu lama.</p>
      ) : (
        <ul className="grid gap-2">
          {daftar.map((k) => {
            const st = status(k);
            return (
              <li key={k.id} data-kupon={k.kode} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-panel-latar px-4 py-3">
                <div className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <button type="button" title="Salin kode" onClick={() => salin(k.kode)} className="rounded-lg border border-dashed border-panel-utama/40 bg-white px-2 py-0.5 font-mono text-sm font-bold tracking-wider">{k.kode}</button>
                    <b className="text-sm">−{teksKupon(k)}</b>
                    <Pil nada={st.nada}>{st.teks}</Pil>
                  </span>
                  <span className="mt-1 block text-xs text-panel-redup">{syarat(k) || "Tanpa syarat"} · dipakai {k.terpakai}{k.maksPakai != null ? ` dari ${k.maksPakai}` : "×"}{k.catatan ? ` · ${k.catatan}` : ""}</span>
                </div>
                <div className="flex gap-2">
                  <Tombol kecil varian="garis" onClick={() => setF(keIsian(k))}>Ubah</Tombol>
                  <Tombol kecil varian="hantu" onClick={() => hapus(k)}>Hapus</Tombol>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal judul={f?.id ? `Ubah kupon ${f.kode}` : "Kupon baru"} lebar="max-w-2xl" buka={!!f} tutup={() => setF(null)} kaki={<><Tombol varian="garis" onClick={() => setF(null)}>Batal</Tombol><Tombol disabled={sibuk} onClick={simpan}>{sibuk ? "Menyimpan…" : "Simpan"}</Tombol></>}>
        {f && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="Kode" ket="Huruf, angka, tanda - atau _. Huruf kecil otomatis jadi kapital.">
              <div className="flex gap-2">
                <input aria-label="Kode" className={`${masukan} font-mono uppercase tracking-wider`} value={f.kode} onChange={(e) => setF({ ...f, kode: rapikanKode(e.target.value) })} />
                <Tombol kecil varian="garis" onClick={() => setF({ ...f, kode: kodeAcak() })}>Acak</Tombol>
              </div>
            </Bidang>
            <Bidang label="Potongan">
              <div className="flex gap-2">
                <select aria-label="Jenis potongan" className={`${masukan} w-32 shrink-0`} value={f.jenis} onChange={(e) => setF({ ...f, jenis: e.target.value as Isian["jenis"] })}><option value="PERSEN">Persen</option><option value="NOMINAL">Rupiah</option></select>
                <input aria-label="Besar potongan" className={masukan} type="number" min={1} max={f.jenis === "PERSEN" ? 100 : undefined} value={f.nilai} onChange={(e) => setF({ ...f, nilai: e.target.value })} />
              </div>
            </Bidang>
            {f.jenis === "PERSEN" && <Bidang label="Potongan paling besar (Rp)" ket="Opsional."><input className={masukan} type="number" min={0} value={f.maksPotongan} placeholder="Tanpa batas" onChange={(e) => setF({ ...f, maksPotongan: e.target.value })} /></Bidang>}
            <Bidang label="Minimal menginap (malam)"><input className={masukan} type="number" min={1} value={f.minMalam} onChange={(e) => setF({ ...f, minMalam: e.target.value })} /></Bidang>
            <Bidang label="Batas pemakaian" ket="Jumlah pesanan. Pesanan yang batal mengembalikan kuota."><input className={masukan} type="number" min={1} value={f.maksPakai} placeholder="Tanpa batas" onChange={(e) => setF({ ...f, maksPakai: e.target.value })} /></Bidang>
            <Bidang label="Bisa dipakai sampai" ket="Tanggal terakhir kode bisa dimasukkan. Kosong = tidak kedaluwarsa."><PilihTanggal value={f.berlakuSampai} onChange={(v) => setF({ ...f, berlakuSampai: v })} /></Bidang>
            <Bidang label="Untuk tanggal tiba dari" ket="Opsional."><PilihTanggal value={f.tibaDari} onChange={(v) => setF({ ...f, tibaDari: v, tibaSampai: f.tibaSampai && f.tibaSampai < v ? v : f.tibaSampai })} /></Bidang>
            <Bidang label="sampai"><PilihTanggal value={f.tibaSampai} min={f.tibaDari || undefined} onChange={(v) => setF({ ...f, tibaSampai: v })} /></Bidang>
            {tipeKamar.length > 1 && (
              <Bidang label="Hanya untuk jenis cottage" ket="Tidak dicentang = semua jenis." className="sm:col-span-2">
                <div className="flex flex-wrap gap-2">{tipeKamar.map((t) => <label key={t} className="flex items-center gap-2 rounded-xl bg-panel-latar px-3 py-2 text-sm"><input type="checkbox" className="size-4" checked={f.tipeKamar.includes(t)} onChange={(e) => setF({ ...f, tipeKamar: e.target.checked ? [...f.tipeKamar, t] : f.tipeKamar.filter((x) => x !== t) })} />{t}</label>)}</div>
              </Bidang>
            )}
            <Bidang label="Catatan untuk tim" className="sm:col-span-2"><input className={masukan} value={f.catatan} placeholder="Misalnya: untuk agen Raja Ampat Travel" onChange={(e) => setF({ ...f, catatan: e.target.value })} /></Bidang>
            <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2"><input type="checkbox" className="size-4" checked={f.aktif} onChange={(e) => setF({ ...f, aktif: e.target.checked })} /> Aktif</label>
            {Number(f.nilai) > 0 && <p className="rounded-xl bg-panel-hijau-lembut px-3 py-2 text-sm text-panel-hijau sm:col-span-2">Contoh: menginap 3 malam {rupiah(4350000)} menjadi <b>{rupiah(Math.max(0, 4350000 - Math.min(4350000, f.jenis === "PERSEN" ? Math.min(Math.round(4350000 * Number(f.nilai) / 100), Number(f.maksPotongan) || Infinity) : Number(f.nilai))))}</b>.</p>}
          </div>
        )}
      </Modal>
    </Kartu>
  );
}
