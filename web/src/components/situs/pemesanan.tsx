"use client";

import { useState } from "react";
import { hariIniWit, rupiah, tambahHari, tglPanjang } from "@/lib/booking";

interface Opsi {
  id: string;
  nama: string;
  tipe: string | null;
  kapasitas: number;
  tersedia: boolean;
  total: number;
}

const kelasMasukan = "w-full border-0 border-b border-emas/45 bg-transparent px-0 py-2.5 text-[17px] font-light text-gading outline-none [color-scheme:dark] focus:border-emas-muda";
const kelasLabel = "text-[11px] font-bold uppercase tracking-[0.22em] text-emas";

/**
 * Formulir pemesanan langsung: pilih tanggal, lihat cottage yang kosong beserta
 * harganya, lalu kirim. Pesanan masuk ke dashboard sebagai tahanan. Bila
 * pemesanan online belum aktif, formulir beralih ke WhatsApp.
 */
export default function Pemesanan({ wa, aktif }: { wa: string; aktif: boolean }) {
  const hari = hariIniWit();
  const [tgl, setTgl] = useState({ masuk: tambahHari(hari, 7), keluar: tambahHari(hari, 10), tamu: "2" });
  const [opsi, setOpsi] = useState<Opsi[] | null>(null);
  const [malam, setMalam] = useState(0);
  const [pilih, setPilih] = useState<string>("");
  const [f, setF] = useState({ nama: "", telepon: "", email: "", minat: "Fun Dive", catatan: "", situs: "" });
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [selesai, setSelesai] = useState<{ kode: string; total: number; jamTahanan: number; persenDp: number } | null>(null);

  async function cek(e: React.FormEvent) {
    e.preventDefault();
    setGalat("");
    setOpsi(null);
    setPilih("");
    setSibuk(true);
    try {
      const r = await fetch(`/api/publik/ketersediaan?masuk=${tgl.masuk}&keluar=${tgl.keluar}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.galat ?? "Ketersediaan tidak bisa dicek.");
      setOpsi(d.kamar);
      setMalam(d.malam);
      const pertama = (d.kamar as Opsi[]).find((k) => k.tersedia && k.kapasitas >= Number(tgl.tamu)) ?? (d.kamar as Opsi[]).find((k) => k.tersedia);
      if (pertama) setPilih(pertama.id);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal.");
    } finally {
      setSibuk(false);
    }
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setGalat("");
    setSibuk(true);
    try {
      const r = await fetch("/api/publik/pesan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, masuk: tgl.masuk, keluar: tgl.keluar, tamu: tgl.tamu, kamar: pilih }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.galat ?? "Permintaan belum terkirim.");
      setSelesai(d);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal.");
    } finally {
      setSibuk(false);
    }
  }

  const k = opsi?.find((x) => x.id === pilih);
  const teksWa = encodeURIComponent(`Halo Bakoeria Dive Resort, saya ingin menanyakan ketersediaan ${tglPanjang(tgl.masuk)} sampai ${tglPanjang(tgl.keluar)} untuk ${tgl.tamu} tamu.`);

  if (selesai) {
    return (
      <div className="border border-emas/40 bg-malam-dalam p-8 sm:p-10" role="status">
        <p className={kelasLabel}>Permintaan diterima</p>
        <h3 className="mt-3 font-display text-3xl uppercase tracking-[0.06em] text-emas-muda">Terima kasih, {f.nama.split(" ")[0]}</h3>
        <p className="mt-4 font-light text-pasir">
          Kode pesanan Anda <b className="font-bold text-gading">{selesai.kode}</b>. Cottage kami tahan {selesai.jamTahanan} jam untuk Anda. Tim kami akan membalas lewat {f.telepon ? "WhatsApp" : "email"} dengan konfirmasi dan cara pembayaran uang muka {selesai.persenDp}%.
        </p>
        <p className="mt-4 font-display text-xl text-gading">Perkiraan total {rupiah(selesai.total)}</p>
        {wa && <a className="mt-6 inline-block text-sm font-bold uppercase tracking-[0.2em] text-emas underline" href={`https://wa.me/${wa}?text=${encodeURIComponent(`Halo, saya baru memesan dengan kode ${selesai.kode}.`)}`} target="_blank" rel="noreferrer">Kirim kode lewat WhatsApp</a>}
      </div>
    );
  }

  return (
    <div className="border border-emas/30 bg-malam-dalam p-6 sm:p-10">
      <form onSubmit={cek} className="grid gap-6 sm:grid-cols-[1fr_1fr_6rem_auto] sm:items-end">
        <label className="grid gap-1"><span className={kelasLabel}>Tiba</span><input type="date" className={kelasMasukan} min={hari} value={tgl.masuk} onChange={(e) => setTgl({ ...tgl, masuk: e.target.value, keluar: tgl.keluar <= e.target.value ? tambahHari(e.target.value, 1) : tgl.keluar })} required /></label>
        <label className="grid gap-1"><span className={kelasLabel}>Pulang</span><input type="date" className={kelasMasukan} min={tambahHari(tgl.masuk, 1)} value={tgl.keluar} onChange={(e) => setTgl({ ...tgl, keluar: e.target.value })} required /></label>
        <label className="grid gap-1"><span className={kelasLabel}>Tamu</span><input type="number" min={1} max={20} className={kelasMasukan} value={tgl.tamu} onChange={(e) => setTgl({ ...tgl, tamu: e.target.value })} /></label>
        {aktif ? (
          <button type="submit" disabled={sibuk} className="emas-gradasi px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-malam-dalam disabled:opacity-60">{sibuk && !opsi ? "Mengecek…" : "Cek ketersediaan"}</button>
        ) : (
          <a href={`https://wa.me/${wa}?text=${teksWa}`} target="_blank" rel="noreferrer" className="emas-gradasi px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.22em] text-malam-dalam">Tanya lewat WhatsApp</a>
        )}
      </form>

      {opsi && (
        <div className="mt-10">
          <p className={kelasLabel}>{malam} malam · pilih cottage</p>
          {opsi.every((x) => !x.tersedia) ? (
            <p className="mt-4 font-light text-pasir">Semua cottage sudah terisi untuk tanggal itu. Coba tanggal lain, atau <a className="text-emas underline" href={`https://wa.me/${wa}?text=${teksWa}`} target="_blank" rel="noreferrer">tanya kami lewat WhatsApp</a>.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {opsi.map((x) => (
                <label key={x.id} className={`flex cursor-pointer items-center justify-between gap-4 border p-4 transition ${!x.tersedia ? "cursor-not-allowed border-emas/10 opacity-40" : pilih === x.id ? "border-emas bg-emas/10" : "border-emas/25 hover:border-emas/60"}`}>
                  <span className="flex items-center gap-3">
                    <input type="radio" name="kamar" value={x.id} disabled={!x.tersedia} checked={pilih === x.id} onChange={() => setPilih(x.id)} className="accent-[#E2B05E]" />
                    <span>
                      <span className="block font-display text-xl text-gading">{x.nama}</span>
                      <span className="text-sm font-light text-pasir">{x.tersedia ? `${x.tipe ? x.tipe + " · " : ""}hingga ${x.kapasitas} tamu` : "Terisi"}</span>
                    </span>
                  </span>
                  {x.tersedia && <span className="font-display text-lg text-emas-muda">{rupiah(x.total)}</span>}
                </label>
              ))}
            </div>
          )}
          {k && (
            <form onSubmit={kirim} className="mt-10 grid gap-6 sm:grid-cols-2">
              <label className="grid gap-1"><span className={kelasLabel}>Nama</span><input className={kelasMasukan} required autoComplete="name" value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} /></label>
              <label className="grid gap-1"><span className={kelasLabel}>WhatsApp</span><input className={kelasMasukan} inputMode="tel" autoComplete="tel" value={f.telepon} onChange={(e) => setF({ ...f, telepon: e.target.value })} /></label>
              <label className="grid gap-1"><span className={kelasLabel}>Email</span><input className={kelasMasukan} type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
              <label className="grid gap-1"><span className={kelasLabel}>Minat</span>
                <select className={kelasMasukan} value={f.minat} onChange={(e) => setF({ ...f, minat: e.target.value })}>
                  {["Fun Dive", "Kursus Open Water", "Discover Scuba", "Snorkeling", "Hanya menginap"].map((m) => <option key={m} className="bg-malam-dalam">{m}</option>)}
                </select>
              </label>
              <label className="grid gap-1 sm:col-span-2"><span className={kelasLabel}>Catatan</span><textarea rows={2} className={kelasMasukan} value={f.catatan} onChange={(e) => setF({ ...f, catatan: e.target.value })} /></label>
              <input type="text" name="situs" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={f.situs} onChange={(e) => setF({ ...f, situs: e.target.value })} />
              <div className="flex flex-wrap items-center justify-between gap-4 sm:col-span-2">
                <p className="text-sm font-light text-pasir">{k.nama}, {tglPanjang(tgl.masuk)} sampai {tglPanjang(tgl.keluar)} · <b className="font-bold text-gading">{rupiah(k.total)}</b></p>
                <button type="submit" disabled={sibuk} className="emas-gradasi px-7 py-4 text-xs font-bold uppercase tracking-[0.22em] text-malam-dalam disabled:opacity-60">{sibuk ? "Mengirim…" : "Kirim permintaan"}</button>
              </div>
            </form>
          )}
        </div>
      )}
      {galat && <p role="alert" className="mt-6 border-l-2 border-[#E58C7A] pl-4 text-sm text-[#F2B5A8]">{galat}</p>}
    </div>
  );
}
