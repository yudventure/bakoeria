"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import KalenderSedia from "./kalender-sedia";
import type { PaketGrup } from "@/lib/konten";
import { opsiSelam } from "@/lib/selam";
import { hariIniWit, jumlahMalam, rupiah, tambahHari } from "@/lib/booking";
import { KAMUS, tglBahasa, type Bahasa } from "@/lib/kamus";

interface Opsi {
  id: string;
  nama: string;
  tipe: string | null;
  ket: string | null;
  dewasa: number;
  anak: number;
  tersedia: boolean;
  hargaKamar: number;
  tambahanAnak: number;
  total: number;
  normal: number | null;
  /** Potongan kupon untuk cottage ini (0 bila kupon tidak berlaku untuknya). */
  potongan: number;
  /** Nama musim bila ada malam bertarif musiman. */
  musim: string | null;
}
/** Perahu antar-jemput dari isi situs; harganya teks yang ditulis pemilik. */
export interface PerahuPesan { judul: string; muat: string; harga: { rute: string; harga: string; sekali: string }[] }
type HasilKupon = { kode: string; ok: true } | { kode: string; ok: false; alasan: keyof (typeof KAMUS)["en"]["form"]["kuponTolak"]; batas: number | string | null } | null;
/** Cottage dengan jenis yang sama ditawarkan sebagai satu pilihan; unitnya dipilihkan yang kosong. */
interface Jenis { kunci: string; nama: string; ket: string | null; unit: Opsi[]; kosong: Opsi[]; contoh: Opsi }

const kelasMasukan = "w-full rounded-2xl border border-malam/10 bg-white/80 px-4 py-3 text-[15px] text-malam outline-none transition placeholder:text-malam/35 focus:border-emas-tua focus:bg-white";
const kelasLabel = "text-xs text-malam/55";

function Penghitung({ label, ket, nilai, ubah, min, maks, teks }: { label: string; ket?: string; nilai: number; ubah: (n: number) => void; min: number; maks: number; teks: { kurangi: (a: string) => string; tambah: (a: string) => string } }) {
  const id = useId();
  const tombol = "grid size-9 shrink-0 place-items-center rounded-full border border-malam/15 bg-white text-lg leading-none text-malam transition hover:border-emas-tua hover:text-emas-tua disabled:cursor-not-allowed disabled:opacity-30";
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-malam/10 bg-white/80 px-4 py-2.5">
      <div className="min-w-0">
        <p id={id} className="text-[15px] text-malam">{label}</p>
        {ket && <p className="text-xs text-malam/55">{ket}</p>}
      </div>
      <div className="flex items-center gap-2" role="group" aria-labelledby={id}>
        <button type="button" className={tombol} disabled={nilai <= min} onClick={() => ubah(nilai - 1)} aria-label={teks.kurangi(label)}>−</button>
        <output className="angka w-6 text-center text-[16px] font-bold text-malam" aria-live="polite" data-hitung={label}>{nilai}</output>
        <button type="button" className={tombol} disabled={nilai >= maks} onClick={() => ubah(nilai + 1)} aria-label={teks.tambah(label)}>+</button>
      </div>
    </div>
  );
}

/**
 * Formulir pemesanan langsung: pilih tanggal dan jumlah tamu, lihat jenis cottage
 * yang kosong beserta harganya, lalu kirim. Pesanan masuk ke dashboard sebagai
 * tahanan. Anak di bawah 5 tahun gratis; 5 tahun ke atas 50% harga kamar per
 * malam dengan extra bed. Harga dihitung di server.
 */
export default function Pemesanan({ wa, aktif, bahasa, perahu = [], paket = [], selamAktif = true, kiri }: { wa: string; aktif: boolean; bahasa: Bahasa; perahu?: PerahuPesan[]; /** Daftar harga selam (isi situs) untuk pilihan paket diving. */ paket?: PaketGrup[]; /** Seksi Program selam menyala; bila mati, pertanyaan diving tidak ditampilkan. */ selamAktif?: boolean; /** Judul dan keterangan kolom kiri; kalender ketersediaan ditaruh di bawahnya. */ kiri: ReactNode }) {
  const t = KAMUS[bahasa].form;
  const tgl_ = (s: string) => tglBahasa(s, bahasa);
  const hari = hariIniWit();
  /* Tanggal dipilih di kalender ketersediaan; mulai kosong. */
  const [tgl, setTgl] = useState({ masuk: "", keluar: "" });
  const [sedia, setSedia] = useState<{ awal: string; akhir: string; sisa: Record<string, number> }>({ awal: hari, akhir: tambahHari(hari, 400), sisa: {} });
  useEffect(() => {
    if (!aktif) return;
    fetch("/api/publik/kalender").then((r) => (r.ok ? r.json() : null)).then((d) => d && setSedia({ awal: d.dari, akhir: d.sampai, sisa: d.sisa ?? {} })).catch(() => undefined);
  }, [aktif]);
  const [tamu, setTamu] = useState({ dewasa: 2, anak: 0, balita: 0 });
  const [opsi, setOpsi] = useState<Opsi[] | null>(null);
  const [malam, setMalam] = useState(0);
  const [pilih, setPilih] = useState<string>("");
  const [f, setF] = useState({ nama: "", telepon: "", email: "", asal: "", minat: t.minatPilihan[0], sertifikat: t.sertifikatPilihan[t.sertifikatPilihan.length - 1], jamTiba: "", catatan: "", situs: "" });
  /* Pilihan perahu "i-j" (perahu ke-i, rute ke-j) atau "" bila tamu mengatur sendiri. */
  const [transport, setTransport] = useState("");
  const [sekali, setSekali] = useState(false);
  /* Diving: ikut atau tidak, jumlah penyelam, dan paket ("kelompok-baris", "kursus-ow", atau "" bila minta disarankan). */
  const [selam, setSelam] = useState({ ikut: false, jumlah: 2, paket: "" });
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [selesai, setSelesai] = useState<{ kode: string; total: number; jamTahanan: number; persenDp: number } | null>(null);
  const [isianKupon, setIsianKupon] = useState("");
  const [kupon, setKupon] = useState<HasilKupon>(null);
  const [sibukKupon, setSibukKupon] = useState(false);
  const pesanKupon = (h: HasilKupon) => {
    if (!h) return "";
    if (h.ok) return t.kuponDipakai(h.kode);
    const x = t.kuponTolak[h.alasan];
    return typeof x === "function" ? x(h.batas ?? "") : x;
  };

  /* Mengubah tanggal atau tamu membuat hasil cek lama tidak berlaku. */
  const ubahTgl = (x: Partial<typeof tgl>) => { setTgl({ ...tgl, ...x }); setOpsi(null); };
  const ubahTamu = (x: Partial<typeof tamu>) => { setTamu({ ...tamu, ...x }); setOpsi(null); };

  /** Ambil cottage yang kosong beserta harganya; dengan kode kupon, harga sudah dipotong. */
  async function ambil(kode: string) {
    const r = await fetch(`/api/publik/ketersediaan?masuk=${tgl.masuk}&keluar=${tgl.keluar}&anak=${tamu.anak}&bahasa=${bahasa}${kode ? `&kupon=${encodeURIComponent(kode)}` : ""}`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.galat ?? t.galatCek);
    return d as { kamar: Opsi[]; malam: number; kupon: HasilKupon };
  }
  async function cek(e: React.FormEvent) {
    e.preventDefault();
    setGalat("");
    setOpsi(null);
    setPilih("");
    setSibuk(true);
    try {
      const d = await ambil(kupon?.ok ? kupon.kode : "");
      setOpsi(d.kamar);
      setMalam(d.malam);
      setKupon(d.kupon?.ok ? d.kupon : null);
      const muat = (k: Opsi) => k.tersedia && k.dewasa >= tamu.dewasa && k.anak >= tamu.anak;
      const pertama = d.kamar.find(muat) ?? d.kamar.find((k) => k.tersedia);
      if (pertama) setPilih(pertama.tipe ?? pertama.nama);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal.");
    } finally {
      setSibuk(false);
    }
  }
  /** Pakai atau lepas kupon tanpa mengubah cottage yang sudah dipilih. */
  async function aturKupon(kode: string) {
    setSibukKupon(true);
    try {
      const d = await ambil(kode);
      setOpsi(d.kamar);
      setMalam(d.malam);
      setKupon(d.kupon);
      if (!kode) setIsianKupon("");
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal.");
    } finally {
      setSibukKupon(false);
    }
  }

  const jenis = useMemo<Jenis[]>(() => {
    const peta = new Map<string, Jenis>();
    for (const o of opsi ?? []) {
      const kunci = o.tipe ?? o.nama;
      const j = peta.get(kunci) ?? { kunci, nama: kunci, ket: o.ket, unit: [], kosong: [], contoh: o };
      j.unit.push(o);
      if (o.tersedia) j.kosong.push(o);
      if (o.tersedia && !j.contoh.tersedia) j.contoh = o;
      peta.set(kunci, j);
    }
    return [...peta.values()];
  }, [opsi]);
  const j = jenis.find((x) => x.kunci === pilih && x.kosong.length > 0);
  const k = j?.kosong[0];
  const melebihi = k ? tamu.dewasa > k.dewasa || tamu.anak > k.anak : false;

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (!k) return;
    setGalat("");
    setSibuk(true);
    try {
      const r = await fetch("/api/publik/pesan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, masuk: tgl.masuk, keluar: tgl.keluar, ...tamu, minat: minatSah, kamar: k.id, bahasa, kupon: kupon?.ok ? kupon.kode : "", transport: perahuDipilih ? perahuDipilih.kunci : "", arah: satuArah ? "sekali" : "pp", selam: selam.ikut ? penyelam : 0, paketSelam: selam.ikut ? paketSah : "" }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.galat ?? t.galatKirim);
      setSelesai(d);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal.");
    } finally {
      setSibuk(false);
    }
  }

  const jumlahTamu = tamu.dewasa + tamu.anak + tamu.balita;
  const pilihanPerahu = perahu.flatMap((p, i) => p.harga.map((h, j) => ({ kunci: `${i}-${j}`, judul: p.judul, rute: h.rute, harga: h.harga, sekali: h.sekali, muat: Number(p.muat.match(/\d+/)?.[0]) || 0 })));
  const perahuDipilih = pilihanPerahu.find((x) => x.kunci === transport);
  const satuArah = (sekali && !!perahuDipilih?.sekali) || (!!perahuDipilih && !perahuDipilih.harga);
  const hargaPerahu = perahuDipilih ? (satuArah ? perahuDipilih.sekali : perahuDipilih.harga) : "";
  const penyelam = Math.min(selam.jumlah, jumlahTamu);
  const minatLain = t.minatPilihan.slice(3);
  const tingkatSelam = t.sertifikatPilihan.slice(0, -1);
  const bersertifikat = f.sertifikat !== t.sertifikatPilihan[0];
  const opsi_ = opsiSelam(paket, bersertifikat);
  /* Belum bersertifikat dan belum ada baris kursus di daftar harga: tetap tawarkan kursus Open Water (harga menyusul). */
  const kursusCadangan = !bersertifikat && !opsi_.some((x) => x.untuk === "kursus");
  const grupSelam = [...new Set(opsi_.map((x) => x.grup))];
  const paketDipilih = opsi_.find((x) => x.kunci === selam.paket);
  const paketSah = paketDipilih || (kursusCadangan && selam.paket === "kursus-ow") ? selam.paket : "";
  const namaPaketSelam = paketDipilih ? `${paketDipilih.nama}${paketDipilih.harga ? ` · ${paketDipilih.harga}` : ""}` : paketSah === "kursus-ow" ? t.kursusOw : t.paketBelumTahu;
  const minatSah = selam.ikut ? (paketDipilih ? `${paketDipilih.grup}: ${paketDipilih.nama}` : paketSah === "kursus-ow" ? t.minatPilihan[1] : t.minatPilihan[0]) : minatLain.includes(f.minat) ? f.minat : minatLain[0];
  const aturSelam = (ikut: boolean) => {
    setSelam({ ...selam, ikut, jumlah: Math.max(1, Math.min(selam.jumlah, jumlahTamu)) });
    setF({ ...f, sertifikat: ikut ? t.sertifikatPilihan[1] : t.sertifikatPilihan[t.sertifikatPilihan.length - 1] });
  };
  const chip = (on: boolean, mati = false) => `flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${mati ? "cursor-not-allowed border-malam/5 opacity-45" : on ? "border-emas-tua bg-busa/50" : "border-malam/10 bg-white/80 hover:border-emas-tua/50"}`;
  const teksWa = encodeURIComponent(t.pesanWaTanya(tgl_(tgl.masuk), tgl_(tgl.keluar), String(jumlahTamu)));

  const isiSelesai = selesai ? (
      <div className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_20px_60px_rgba(10,36,64,.12)] backdrop-blur-xl sm:p-10" role="status">
        <p className={kelasLabel}>{t.diterima}</p>
        <h3 className="mt-2 font-display text-4xl text-malam">{t.terimaKasih(f.nama.split(" ")[0])}</h3>
        <p className="mt-4 text-malam/70">
          {t.kodeAnda} <b className="font-bold text-malam">{selesai.kode}</b>. {t.ditahan(selesai.jamTahanan, f.telepon ? t.lewatWa : t.lewatEmail, selesai.persenDp)}
        </p>
        <p className="mt-4 font-display text-2xl text-malam">{t.perkiraan} {rupiah(selesai.total)}</p>
        {wa && <a className="mt-6 inline-flex items-center gap-2 rounded-full bg-emas-tua px-6 py-3 text-sm font-bold text-white" href={`https://wa.me/${wa}?text=${encodeURIComponent(t.pesanWaKode(selesai.kode))}`} target="_blank" rel="noreferrer">{t.kirimKode}</a>}
      </div>
  ) : null;

  const isiForm = (
    <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(10,36,64,.12)] backdrop-blur-xl sm:p-8">
      <form onSubmit={cek} className="grid gap-4">
        <p data-tanggal-form className="rounded-2xl bg-[#F6F4EF] px-4 py-3 text-[14px] text-malam">{tgl.masuk && tgl.keluar ? <>{tgl_(tgl.masuk)} {t.sampai} {tgl_(tgl.keluar)} · {t.malam(jumlahMalam(tgl.masuk, tgl.keluar))}</> : <span className="text-malam/55">{tgl.masuk ? t.kalender.pilihPulang : t.kalender.pilihTiba}</span>}</p>
        <fieldset className="grid gap-2">
          <legend className={`${kelasLabel} mb-1.5`}>{t.tamu}</legend>
          <Penghitung label={t.dewasa} nilai={tamu.dewasa} min={1} maks={8} ubah={(n) => ubahTamu({ dewasa: n })} teks={t} />
          <Penghitung label={t.anak} ket={t.ketAnak} nilai={tamu.anak} min={0} maks={4} ubah={(n) => ubahTamu({ anak: n })} teks={t} />
          <Penghitung label={t.balita} ket={t.ketBalita} nilai={tamu.balita} min={0} maks={4} ubah={(n) => ubahTamu({ balita: n })} teks={t} />
        </fieldset>
        {pilihanPerahu.length > 0 && (
          <fieldset className="grid gap-2" data-pilih-transport>
            <legend className={`${kelasLabel} mb-1.5`}>{t.transport}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className={chip(transport === "")}>
                <input type="radio" name="transport" checked={transport === ""} onChange={() => setTransport("")} className="accent-[#0F6490]" />
                <span className="text-[15px] text-malam">{t.transportTidak}</span>
              </label>
              {pilihanPerahu.map((x) => {
                const mati = x.muat > 0 && jumlahTamu > x.muat;
                return (
                  <label key={x.kunci} className={chip(transport === x.kunci, mati)}>
                    <input type="radio" name="transport" disabled={mati} checked={transport === x.kunci} onChange={() => setTransport(x.kunci)} className="accent-[#0F6490]" />
                    <span className="min-w-0 leading-snug">
                      <span className="block text-[15px] text-malam">{x.judul} · {x.rute}</span>
                      <span className="block text-xs text-malam/55">{[x.harga && `${t.pp} ${x.harga}`, x.sekali && `${t.sekaliJalan} ${x.sekali}`].filter(Boolean).join(" · ")}{x.muat ? ` · ${mati ? t.transportPenuh(jumlahTamu) : t.transportMuat(x.muat)}` : ""}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {perahuDipilih?.sekali && perahuDipilih.harga && (
              <div data-pilih-arah className="grid grid-cols-2 gap-2">
                {[false, true].map((v) => (
                  <label key={String(v)} className={chip(sekali === v)}>
                    <input type="radio" name="arah" checked={sekali === v} onChange={() => setSekali(v)} className="accent-[#0F6490]" />
                    <span className="min-w-0 leading-snug"><span className="block text-[15px] text-malam">{v ? t.sekaliJalan : t.pp}</span><span className="block text-xs text-malam/55">{v ? perahuDipilih.sekali : perahuDipilih.harga}</span></span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-malam/55">{t.transportKet}</p>
          </fieldset>
        )}
        {selamAktif && <fieldset className="grid gap-2" data-pilih-selam>
          <legend className={`${kelasLabel} mb-1.5`}>{t.selam}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={chip(selam.ikut)}>
              <input type="radio" name="selam" checked={selam.ikut} onChange={() => aturSelam(true)} className="accent-[#0F6490]" />
              <span className="text-[15px] text-malam">{t.selamYa}</span>
            </label>
            <label className={chip(!selam.ikut)}>
              <input type="radio" name="selam" checked={!selam.ikut} onChange={() => aturSelam(false)} className="accent-[#0F6490]" />
              <span className="text-[15px] text-malam">{t.selamTidak}</span>
            </label>
          </div>
          {selam.ikut && (
            <>
              <Penghitung label={t.penyelam} ket={t.selamKet} nilai={penyelam} min={1} maks={jumlahTamu} ubah={(n) => setSelam({ ...selam, jumlah: n })} teks={t} />
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="grid min-w-0 gap-1.5"><span className={kelasLabel}>{t.sertifikatTanya}</span>
                  <select data-pilih-sertifikat className={kelasMasukan} value={tingkatSelam.includes(f.sertifikat) ? f.sertifikat : tingkatSelam[1]} onChange={(e) => { setF({ ...f, sertifikat: e.target.value }); setSelam({ ...selam, paket: "" }); }}>
                    {tingkatSelam.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </label>
                <label className="grid min-w-0 gap-1.5"><span className={kelasLabel}>{t.paketSelam}</span>
                  <select data-pilih-paket-selam className={kelasMasukan} value={paketSah} onChange={(e) => setSelam({ ...selam, paket: e.target.value })}>
                    <option value="">{t.paketBelumTahu}</option>
                    {grupSelam.map((g) => (
                      <optgroup key={g} label={g}>
                        {opsi_.filter((x) => x.grup === g).map((x) => <option key={x.kunci} value={x.kunci}>{x.nama}{x.harga ? ` · ${x.harga}` : ""}</option>)}
                      </optgroup>
                    ))}
                    {kursusCadangan && <optgroup label={t.grupKursus}><option value="kursus-ow">{t.kursusOw}</option></optgroup>}
                  </select>
                </label>
              </div>
              {paketDipilih?.ket && <p className="text-xs text-malam/60">{paketDipilih.ket}</p>}
              <p className="text-xs text-malam/55">{bersertifikat ? t.ketPaketSelam : `${t.ketPemula} ${t.ketPaketSelam}`}</p>
            </>
          )}
        </fieldset>}
        <p className="rounded-2xl bg-busa/60 px-4 py-3 text-[13px] leading-relaxed text-malam/75"><b className="font-bold text-malam">{t.kebijakanJudul}.</b> {t.kebijakan} {t.termasukMakan}</p>
        {aktif ? (
          <button type="submit" disabled={sibuk || !tgl.masuk || !tgl.keluar} className="justify-self-start rounded-full bg-emas-tua px-7 py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60">{sibuk && !opsi ? t.mengecek : !tgl.masuk || !tgl.keluar ? t.kalender.pilihDulu : KAMUS[bahasa].cekKetersediaan}</button>
        ) : (
          <a href={`https://wa.me/${wa}?text=${teksWa}`} target="_blank" rel="noreferrer" className="justify-self-start rounded-full bg-emas-tua px-7 py-3.5 text-center text-sm font-bold text-white">{t.tanyaWa}</a>
        )}
      </form>

      {opsi && (
        <div className="mt-8 border-t border-malam/10 pt-7">
          <p className="text-sm text-malam/60">{t.malam(malam)} · {t.pilihCottage}</p>
          {jenis.every((x) => x.kosong.length === 0) ? (
            <p className="mt-3 text-malam/70">{t.semuaTerisi} <a className="text-emas-tua underline" href={`https://wa.me/${wa}?text=${teksWa}`} target="_blank" rel="noreferrer">{t.tanyaKami}</a>.</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {jenis.map((x) => {
                const ada = x.kosong.length > 0;
                const c = x.kosong[0] ?? x.contoh;
                return (
                  <label key={x.kunci} className={`flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition ${!ada ? "cursor-not-allowed border-malam/5 opacity-45" : pilih === x.kunci ? "border-emas-tua bg-busa/50" : "border-malam/10 bg-white/70 hover:border-emas-tua/50"}`}>
                    <span className="flex items-start gap-3">
                      <input type="radio" name="jenis" value={x.kunci} disabled={!ada} checked={pilih === x.kunci} onChange={() => setPilih(x.kunci)} className="mt-1.5 accent-[#0F6490]" />
                      <span className="min-w-0">
                        <span className="block font-display text-xl text-malam">{x.nama}</span>
                        {x.ket && <span className="mt-0.5 block text-[13px] leading-snug text-malam/60">{x.ket}</span>}
                        <span className="mt-1 block text-xs font-bold text-emas-tua">{ada ? t.tersisa(x.kosong.length) : t.terisi}{ada && c.musim ? <span className="ml-2 rounded-full bg-busa px-2 py-0.5 font-bold text-malam/70">{c.musim}</span> : null}</span>
                      </span>
                    </span>
                    {ada && (
                      <span className="mt-auto flex flex-wrap items-baseline justify-end gap-x-2 gap-y-1">
                        {c.normal != null && <span className="mr-auto rounded-full bg-emas-tua px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">{t.promo}</span>}
                        {c.normal != null && <s className="whitespace-nowrap text-sm text-malam/45">{rupiah(c.normal)}</s>}
                        <span className="whitespace-nowrap font-display text-xl text-malam">{rupiah(c.total)}</span>
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
          {k && j && melebihi && <p role="alert" className="mt-4 rounded-2xl bg-[#FFF4D6] px-4 py-3 text-sm text-[#6B4A0B]">{t.melebihi(k.dewasa, k.anak)}</p>}
          {k && j && !melebihi && (
            <form onSubmit={kirim} className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#F6F4EF] p-4 sm:col-span-2">
                <p className={kelasLabel}>{t.ringkasan}</p>
                <p className="mt-1 text-[15px] text-malam"><b className="font-bold">{j.nama}</b> · {tgl_(tgl.masuk)} {t.sampai} {tgl_(tgl.keluar)} · {t.malam(malam)}</p>
                <p className="text-sm text-malam/65">{t.tamuRingkas(tamu.dewasa, tamu.anak, tamu.balita)}</p>
                <dl className="mt-3 grid gap-1 border-t border-malam/10 pt-3 text-sm text-malam/75">
                  <div className="flex justify-between gap-3"><dt>{t.hargaKamar}</dt><dd className="angka">{rupiah(k.hargaKamar)}</dd></div>
                  {tamu.anak > 0 && <div className="flex justify-between gap-3"><dt>{t.tambahanAnak(tamu.anak)}</dt><dd className="angka">{rupiah(k.tambahanAnak)}</dd></div>}
                  {tamu.balita > 0 && <div className="flex justify-between gap-3"><dt>{t.balitaGratis(tamu.balita)}</dt><dd>{t.gratis}</dd></div>}
                  {k.potongan > 0 && kupon?.ok && <div data-potongan className="flex justify-between gap-3 font-bold text-[#1E7A4C]"><dt>{t.potongan(kupon.kode)}</dt><dd className="angka">−{rupiah(k.potongan)}</dd></div>}
                  <div className="flex justify-between gap-3 border-t border-malam/10 pt-2 text-base font-bold text-malam"><dt>{t.total}</dt><dd className="angka">{rupiah(k.total)}</dd></div>
                  {perahuDipilih && <div data-ringkas-transport className="flex justify-between gap-3 pt-1"><dt>{t.transportRingkas}<span className="block text-xs text-malam/55">{perahuDipilih.judul} · {perahuDipilih.rute} · {satuArah ? t.sekaliJalan : t.pp}</span></dt><dd className="angka whitespace-nowrap">{hargaPerahu}</dd></div>}
                  {selam.ikut && <div data-ringkas-selam className="flex justify-between gap-3 pt-1"><dt>{t.selamRingkas(penyelam)}<span className="block text-xs text-malam/55">{f.sertifikat} · {paketDipilih ? paketDipilih.nama : namaPaketSelam}</span></dt>{paketDipilih?.harga && <dd className="angka whitespace-nowrap">{paketDipilih.harga}</dd>}</div>}
                </dl>
                <div className="mt-3 border-t border-malam/10 pt-3">
                  {kupon?.ok ? (
                    <p className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#1E7A4C]">
                      <span>{k.potongan > 0 ? pesanKupon(kupon) : t.kuponTolak.kamar}</span>
                      <button type="button" onClick={() => aturKupon("")} disabled={sibukKupon} className="font-bold text-malam/60 underline hover:text-malam">{t.hapusKupon}</button>
                    </p>
                  ) : (
                    <div className="grid gap-1.5">
                      <label htmlFor="kode-kupon" className={kelasLabel}>{t.punyaKupon}</label>
                      <div className="flex gap-2">
                        <input id="kode-kupon" className={`${kelasMasukan} uppercase`} value={isianKupon} autoComplete="off" placeholder={t.kupon} onChange={(e) => setIsianKupon(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (isianKupon.trim()) aturKupon(isianKupon.trim()); } }} />
                        <button type="button" disabled={sibukKupon || !isianKupon.trim()} onClick={() => aturKupon(isianKupon.trim())} className="shrink-0 rounded-full bg-malam px-5 text-sm font-bold text-white transition hover:brightness-125 disabled:opacity-40">{t.pakaiKupon}</button>
                      </div>
                      {kupon && !kupon.ok && <p role="alert" className="text-sm text-[#B03826]">{pesanKupon(kupon)}</p>}
                    </div>
                  )}
                </div>
              </div>
              <p className="font-display text-xl text-malam sm:col-span-2">{t.dataTamu}</p>
              <label className="grid min-w-0 gap-1.5"><span className={kelasLabel}>{t.nama}</span><input className={kelasMasukan} required autoComplete="name" value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} /></label>
              <label className="grid min-w-0 gap-1.5"><span className={kelasLabel}>{t.whatsapp}</span><input className={kelasMasukan} inputMode="tel" autoComplete="tel" value={f.telepon} onChange={(e) => setF({ ...f, telepon: e.target.value })} /></label>
              <label className="grid min-w-0 gap-1.5"><span className={kelasLabel}>{t.email}</span><input className={kelasMasukan} type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
              <label className="grid min-w-0 gap-1.5"><span className={kelasLabel}>{t.asal}</span><input className={kelasMasukan} autoComplete="country-name" value={f.asal} onChange={(e) => setF({ ...f, asal: e.target.value })} /></label>
              {!selam.ikut && <label className="grid min-w-0 gap-1.5 sm:col-span-2"><span className={kelasLabel}>{t.minat}</span>
                <select className={kelasMasukan} value={minatSah} onChange={(e) => setF({ ...f, minat: e.target.value })}>
                  {minatLain.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>}
              <label className="grid min-w-0 gap-1.5 sm:col-span-2"><span className={kelasLabel}>{t.jamTiba}</span><input className={kelasMasukan} placeholder={t.jamTibaKet} value={f.jamTiba} onChange={(e) => setF({ ...f, jamTiba: e.target.value })} /></label>
              <label className="grid gap-1.5 sm:col-span-2"><span className={kelasLabel}>{t.catatan}</span><textarea rows={2} className={kelasMasukan} value={f.catatan} onChange={(e) => setF({ ...f, catatan: e.target.value })} /></label>
              <input type="text" name="situs" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={f.situs} onChange={(e) => setF({ ...f, situs: e.target.value })} />
              <div className="flex flex-wrap items-center justify-between gap-4 sm:col-span-2">
                <p className="text-sm text-malam/60">{t.total} <b className="font-bold text-malam">{rupiah(k.total)}</b></p>
                <button type="submit" disabled={sibuk} className="inline-flex items-center gap-3 rounded-full bg-emas-tua py-2 pl-6 pr-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60">{sibuk ? t.mengirim : t.kirim}<span className="grid size-9 place-items-center rounded-full bg-white/20">→</span></button>
              </div>
            </form>
          )}
        </div>
      )}
      {galat && <p role="alert" className="mt-5 rounded-2xl bg-[#FBE4DE] px-4 py-3 text-sm text-[#B03826]">{galat}</p>}
    </div>
  );

  return (
    <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
      <div className="muncul">
        {kiri}
        {!selesai && <KalenderSedia bahasa={bahasa} sisa={sedia.sisa} awal={sedia.awal} akhir={sedia.akhir} masuk={tgl.masuk} keluar={tgl.keluar} pilih={(masuk, keluar) => ubahTgl({ masuk, keluar })} />}
      </div>
      <div className="muncul">{isiSelesai ?? isiForm}</div>
    </div>
  );
}
