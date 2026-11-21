"use client";

import { useState } from "react";
import { hariIniWit, rupiah, tambahHari } from "@/lib/booking";
import { KAMUS, tglBahasa, type Bahasa } from "@/lib/kamus";

interface Opsi {
  id: string;
  nama: string;
  tipe: string | null;
  kapasitas: number;
  tersedia: boolean;
  total: number;
}

const kelasMasukan = "w-full rounded-2xl border border-malam/10 bg-white/80 px-4 py-3 text-[15px] text-malam outline-none transition placeholder:text-malam/35 focus:border-emas-tua focus:bg-white";
const kelasLabel = "text-xs text-malam/55";

/**
 * Formulir pemesanan langsung: pilih tanggal, lihat cottage yang kosong beserta
 * harganya, lalu kirim. Pesanan masuk ke dashboard sebagai tahanan. Bila
 * pemesanan online belum aktif, formulir beralih ke WhatsApp.
 */
export default function Pemesanan({ wa, aktif, bahasa }: { wa: string; aktif: boolean; bahasa: Bahasa }) {
  const t = KAMUS[bahasa].form;
  const tgl_ = (s: string) => tglBahasa(s, bahasa);
  const hari = hariIniWit();
  const [tgl, setTgl] = useState({ masuk: tambahHari(hari, 7), keluar: tambahHari(hari, 10), tamu: "2" });
  const [opsi, setOpsi] = useState<Opsi[] | null>(null);
  const [malam, setMalam] = useState(0);
  const [pilih, setPilih] = useState<string>("");
  const [f, setF] = useState({ nama: "", telepon: "", email: "", minat: t.minatPilihan[0], catatan: "", situs: "" });
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
      const r = await fetch(`/api/publik/ketersediaan?masuk=${tgl.masuk}&keluar=${tgl.keluar}&bahasa=${bahasa}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.galat ?? t.galatCek);
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
      const r = await fetch("/api/publik/pesan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, masuk: tgl.masuk, keluar: tgl.keluar, tamu: tgl.tamu, kamar: pilih, bahasa }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.galat ?? t.galatKirim);
      setSelesai(d);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal.");
    } finally {
      setSibuk(false);
    }
  }

  const k = opsi?.find((x) => x.id === pilih);
  const teksWa = encodeURIComponent(t.pesanWaTanya(tgl_(tgl.masuk), tgl_(tgl.keluar), tgl.tamu));

  if (selesai) {
    return (
      <div className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_20px_60px_rgba(4,28,62,.12)] backdrop-blur-xl sm:p-10" role="status">
        <p className={kelasLabel}>{t.diterima}</p>
        <h3 className="mt-2 font-display text-4xl text-malam">{t.terimaKasih(f.nama.split(" ")[0])}</h3>
        <p className="mt-4 text-malam/70">
          {t.kodeAnda} <b className="font-bold text-malam">{selesai.kode}</b>. {t.ditahan(selesai.jamTahanan, f.telepon ? t.lewatWa : t.lewatEmail, selesai.persenDp)}
        </p>
        <p className="mt-4 font-display text-2xl text-malam">{t.perkiraan} {rupiah(selesai.total)}</p>
        {wa && <a className="mt-6 inline-flex items-center gap-2 rounded-full bg-emas-tua px-6 py-3 text-sm font-bold text-white" href={`https://wa.me/${wa}?text=${encodeURIComponent(t.pesanWaKode(selesai.kode))}`} target="_blank" rel="noreferrer">{t.kirimKode}</a>}
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(4,28,62,.12)] backdrop-blur-xl sm:p-8">
      <form onSubmit={cek} className="grid gap-4 sm:grid-cols-[1fr_1fr_6rem_auto] sm:items-end">
        <label className="grid gap-1.5"><span className={kelasLabel}>{t.tiba}</span><input type="date" className={kelasMasukan} min={hari} value={tgl.masuk} onChange={(e) => setTgl({ ...tgl, masuk: e.target.value, keluar: tgl.keluar <= e.target.value ? tambahHari(e.target.value, 1) : tgl.keluar })} required /></label>
        <label className="grid gap-1.5"><span className={kelasLabel}>{t.pulang}</span><input type="date" className={kelasMasukan} min={tambahHari(tgl.masuk, 1)} value={tgl.keluar} onChange={(e) => setTgl({ ...tgl, keluar: e.target.value })} required /></label>
        <label className="grid gap-1.5"><span className={kelasLabel}>{t.tamu}</span><input type="number" min={1} max={20} className={kelasMasukan} value={tgl.tamu} onChange={(e) => setTgl({ ...tgl, tamu: e.target.value })} /></label>
        {aktif ? (
          <button type="submit" disabled={sibuk} className="rounded-full bg-emas-tua px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60">{sibuk && !opsi ? t.mengecek : KAMUS[bahasa].cekKetersediaan}</button>
        ) : (
          <a href={`https://wa.me/${wa}?text=${teksWa}`} target="_blank" rel="noreferrer" className="rounded-full bg-emas-tua px-6 py-3.5 text-center text-sm font-bold text-white">{t.tanyaWa}</a>
        )}
      </form>

      {opsi && (
        <div className="mt-8">
          <p className="text-sm text-malam/60">{t.malam(malam)} · {t.pilihCottage}</p>
          {opsi.every((x) => !x.tersedia) ? (
            <p className="mt-3 text-malam/70">{t.semuaTerisi} <a className="text-emas-tua underline" href={`https://wa.me/${wa}?text=${teksWa}`} target="_blank" rel="noreferrer">{t.tanyaKami}</a>.</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {opsi.map((x) => (
                <label key={x.id} className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition ${!x.tersedia ? "cursor-not-allowed border-malam/5 opacity-45" : pilih === x.id ? "border-emas-tua bg-emas/10" : "border-malam/10 bg-white/70 hover:border-emas-tua/50"}`}>
                  <span className="flex items-center gap-3">
                    <input type="radio" name="kamar" value={x.id} disabled={!x.tersedia} checked={pilih === x.id} onChange={() => setPilih(x.id)} className="accent-[#B98A3A]" />
                    <span>
                      <span className="block font-display text-xl text-malam">{x.nama}</span>
                      <span className="text-sm text-malam/55">{x.tersedia ? `${x.tipe ? x.tipe + " · " : ""}${KAMUS[bahasa].hingga(x.kapasitas)}` : t.terisi}</span>
                    </span>
                  </span>
                  {x.tersedia && <span className="font-display text-lg text-malam">{rupiah(x.total)}</span>}
                </label>
              ))}
            </div>
          )}
          {k && (
            <form onSubmit={kirim} className="mt-8 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5"><span className={kelasLabel}>{t.nama}</span><input className={kelasMasukan} required autoComplete="name" value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} /></label>
              <label className="grid gap-1.5"><span className={kelasLabel}>{t.whatsapp}</span><input className={kelasMasukan} inputMode="tel" autoComplete="tel" value={f.telepon} onChange={(e) => setF({ ...f, telepon: e.target.value })} /></label>
              <label className="grid gap-1.5"><span className={kelasLabel}>{t.email}</span><input className={kelasMasukan} type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
              <label className="grid gap-1.5"><span className={kelasLabel}>{t.minat}</span>
                <select className={kelasMasukan} value={f.minat} onChange={(e) => setF({ ...f, minat: e.target.value })}>
                  {t.minatPilihan.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>
              <label className="grid gap-1 sm:col-span-2"><span className={kelasLabel}>{t.catatan}</span><textarea rows={2} className={kelasMasukan} value={f.catatan} onChange={(e) => setF({ ...f, catatan: e.target.value })} /></label>
              <input type="text" name="situs" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={f.situs} onChange={(e) => setF({ ...f, situs: e.target.value })} />
              <div className="flex flex-wrap items-center justify-between gap-4 sm:col-span-2">
                <p className="text-sm text-malam/60">{k.nama}, {tgl_(tgl.masuk)} {t.sampai} {tgl_(tgl.keluar)} · <b className="font-bold text-malam">{rupiah(k.total)}</b></p>
                <button type="submit" disabled={sibuk} className="inline-flex items-center gap-3 rounded-full bg-emas-tua py-2 pl-6 pr-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60">{sibuk ? t.mengirim : t.kirim}<span className="grid size-9 place-items-center rounded-full bg-white/20">→</span></button>
              </div>
            </form>
          )}
        </div>
      )}
      {galat && <p role="alert" className="mt-5 rounded-2xl bg-[#FBE4DE] px-4 py-3 text-sm text-[#B03826]">{galat}</p>}
    </div>
  );
}
