"use client";

import { useEffect, useRef, useState } from "react";
import { daftarLebar, GALERI, SLOT_FOTO, urlFoto, type Foto, type ItemGaleri, type NamaGaleri, type PetaFoto, type PetaGaleri, type SlotFoto } from "@/lib/foto";
import { api } from "./api";
import { Galat, Kartu, Memuat, Tombol, useToast } from "./ui";

const kb = (n: number) => (n >= 1024 ? `${(n / 1024).toFixed(1).replace(".", ",")} MB` : `${n} KB`);
const tidur = (ms: number) => new Promise((r) => setTimeout(r, ms));

/*
 * Alur unggah yang tahan gangguan:
 * 1. Foto dikompres di perangkat ini (bukan di server hosting yang lambat): diluruskan
 *    menurut orientasi kamera, dikecilkan bertahap supaya tetap tajam, lalu disimpan
 *    sebagai WebP kualitas 82 dalam beberapa lebar (640 sampai 2560 px).
 * 2. Tiap ukuran dikirim sebagai berkas kecil tersendiri. Permintaan yang putus,
 *    kehabisan waktu, atau ditolak sementara diulang otomatis dengan jeda bertambah;
 *    saat koneksi hilang, unggahan menunggu sampai tersambung lagi.
 * 3. Setelah semua ukuran sampai, foto "diresmikan" ke slotnya. Bila server bilang
 *    ada ukuran yang belum ada, ukuran itu saja yang dikirim ulang.
 * Bila tetap gagal, hasil kompresi disimpan di halaman dan tombol "Coba lagi"
 * melanjutkan dari bagian yang belum terkirim, tanpa mengompres ulang.
 */

type Tujuan = { slot: SlotFoto } | { galeri: NamaGaleri };
interface Tugas {
  tujuan: Tujuan;
  id: string;
  jenis: "webp" | "jpg";
  h: number;
  kbAsli: number;
  bagian: { w: number; blob: Blob }[];
  terkirim: Set<number>;
}
interface Status { teks: string; persen: number; gagal?: string; pratinjau?: string }

async function bacaFoto(f: File): Promise<ImageBitmap | HTMLImageElement> {
  const bmp = await createImageBitmap(f, { imageOrientation: "from-image" }).catch(() => null);
  if (bmp) return bmp;
  const img = new Image();
  img.src = URL.createObjectURL(f);
  try {
    await img.decode();
    return img;
  } catch {
    throw new Error(/heic|heif/i.test(f.type + f.name) ? "Foto HEIC belum bisa dibaca browser ini. Buka dashboard dari Safari, atau kirim fotonya sebagai JPG (iPhone: Pengaturan › Kamera › Format › Paling Kompatibel)." : "Berkas ini bukan foto yang bisa dibaca. Pakai JPG, PNG, WebP, atau AVIF.");
  }
}
const ukuran = (g: ImageBitmap | HTMLImageElement) => ("naturalWidth" in g ? [g.naturalWidth, g.naturalHeight] : [g.width, g.height]);

/** Pengecilan bertahap (setengah demi setengah) supaya hasilnya tetap tajam, bukan bergerigi. */
function gambarKe(src: ImageBitmap | HTMLImageElement | HTMLCanvasElement, w: number, h: number): HTMLCanvasElement {
  let sumber: CanvasImageSource = src;
  let [sw, sh] = src instanceof HTMLCanvasElement ? [src.width, src.height] : ukuran(src);
  while (sw / 2 >= w) {
    const c = document.createElement("canvas");
    c.width = Math.round(sw / 2);
    c.height = Math.round(sh / 2);
    const x = c.getContext("2d")!;
    x.imageSmoothingQuality = "high";
    x.drawImage(sumber, 0, 0, c.width, c.height);
    sumber = c;
    sw = c.width;
    sh = c.height;
  }
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;
  x.imageSmoothingQuality = "high";
  x.drawImage(sumber, 0, 0, w, h);
  return c;
}
const keBlob = (c: HTMLCanvasElement, jenis: string, q: number) => new Promise<Blob>((ok, gagal) => c.toBlob((b) => (b ? ok(b) : gagal(new Error("Foto gagal dikompres. Coba foto lain atau browser lain."))), jenis, q));

async function kompres(tujuan: Tujuan, f: File, lapor: (teks: string, persen: number) => void): Promise<Tugas> {
  lapor("Membaca foto…", 3);
  const g = await bacaFoto(f);
  const [W, H] = ukuran(g);
  const lebar = daftarLebar(W, H);
  const bagian: Tugas["bagian"] = [];
  let jenis: Tugas["jenis"] = "webp";
  /* Dari yang terbesar ke terkecil: tiap ukuran dikecilkan dari hasil sebelumnya, jadi cepat dan hemat memori. */
  let sumber: ImageBitmap | HTMLImageElement | HTMLCanvasElement = g;
  let h = 0;
  for (const [i, w] of [...lebar].reverse().entries()) {
    lapor(`Mengompres ${i + 1}/${lebar.length}…`, 5 + Math.round((i / lebar.length) * 35));
    await tidur(0);
    const tinggi = Math.round((w * H) / W);
    const c = gambarKe(sumber, w, tinggi);
    let b = jenis === "webp" ? await keBlob(c, "image/webp", 0.82) : null;
    if (!b || b.type !== "image/webp") {
      jenis = "jpg"; // browser lama (Safari < 16) tidak bisa membuat WebP
      b = await keBlob(c, "image/jpeg", 0.86);
    }
    bagian.push({ w, blob: b });
    if (!h) h = tinggi;
    sumber = c;
  }
  if (jenis === "jpg") for (const x of bagian) if (x.blob.type !== "image/jpeg") x.blob = await keBlob(gambarKe(g, x.w, Math.round((x.w * H) / W)), "image/jpeg", 0.86);
  if ("close" in g) g.close();
  const acak = [...crypto.getRandomValues(new Uint8Array(4))].map((x) => x.toString(16).padStart(2, "0")).join("");
  return { tujuan, id: `${Date.now().toString(36)}-${acak}`, jenis, h, kbAsli: Math.round(f.size / 1024), bagian: bagian.reverse(), terkirim: new Set() };
}

class GalatTetap extends Error {}

/** Satu permintaan dengan ulang otomatis untuk gangguan sementara. Galat dari isi permintaan (4xx) tidak diulang. */
async function minta(url: string, init: RequestInit, percobaan = 6): Promise<{ status: number; data: Record<string, unknown> }> {
  let pesan = "";
  for (let i = 0; i < percobaan; i++) {
    if (i) await tidur(Math.min(15000, 1000 * 2 ** (i - 1)) + Math.random() * 400);
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      await new Promise<void>((r) => {
        const t = setTimeout(r, 60000);
        window.addEventListener("online", () => (clearTimeout(t), r()), { once: true });
      });
    }
    const henti = new AbortController();
    const waktu = setTimeout(() => henti.abort(), 90000);
    try {
      const r = await fetch(url, { ...init, signal: henti.signal, cache: "no-store" });
      const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (r.ok || r.status === 409) return { status: r.status, data };
      if (r.status === 401) throw new GalatTetap("Sesi habis. Masuk lagi di tab lain, lalu tekan Coba lagi.");
      pesan = typeof data.galat === "string" ? data.galat : `Server membalas ${r.status}.`;
      if (r.status >= 400 && r.status < 500 && ![408, 425, 429].includes(r.status) && !data.ulang) throw new GalatTetap(pesan);
    } catch (e) {
      if (e instanceof GalatTetap) throw e;
      pesan = henti.signal.aborted ? "Server terlalu lama menjawab." : "Koneksi terputus.";
    } finally {
      clearTimeout(waktu);
    }
  }
  throw new Error(`${pesan} Sudah dicoba ${percobaan} kali.`);
}

async function unggahTugas(t: Tugas, lapor: (teks: string, persen: number) => void): Promise<{ foto: PetaFoto; galeri: PetaGaleri }> {
  for (let putaran = 0; putaran < 3; putaran++) {
    const sisa = t.bagian.filter((b) => !t.terkirim.has(b.w));
    for (const b of sisa) {
      lapor(`Mengunggah ${t.terkirim.size + 1}/${t.bagian.length}…`, 40 + Math.round((t.terkirim.size / t.bagian.length) * 55));
      const fd = new FormData();
      fd.set("id", t.id);
      fd.set("w", String(b.w));
      fd.set("jenis", t.jenis);
      fd.set("berkas", b.blob, `${t.id}-${b.w}.${t.jenis}`);
      await minta("/api/foto/bagian", { method: "POST", body: fd });
      t.terkirim.add(b.w);
    }
    lapor("Memasang foto…", 97);
    const r = await minta("/api/foto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...t.tujuan, id: t.id, lebar: t.bagian.map((b) => b.w), h: t.h, jenis: t.jenis, kbAsli: t.kbAsli }),
    });
    if (r.status !== 409) return { foto: r.data.foto as PetaFoto, galeri: r.data.galeri as PetaGaleri };
    for (const w of (r.data.kurang as number[]) ?? []) t.terkirim.delete(w);
  }
  throw new Error("Sebagian ukuran foto tidak sampai ke server.");
}

/** Slot lama galeri (kamar1-5, galeri1-5) diganti editor galeri; tidak ditampilkan sebagai slot. */
const SLOT_GALERI = new Set<SlotFoto>([...GALERI.menginap.slot, ...GALERI.aktivitas.slot]);
const KET_UNGGAH = "Unggah foto asli dari kamera atau ponsel (JPG, PNG, WebP, AVIF; ukuran berapa pun). Foto dikompres di perangkat ini menjadi WebP beberapa ukuran, lalu diunggah sedikit demi sedikit dan diulang otomatis bila koneksi putus. Langsung tayang tanpa menekan Simpan, untuk kedua bahasa. Klik foto unggahan untuk memilih titik fokus.";

function Proses({ st }: { st: Status }) {
  return (
    <span data-status className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 px-4 text-center text-sm font-bold text-white">
      {st.teks}
      <span className="h-1.5 w-2/3 overflow-hidden rounded-full bg-white/30"><span className="block h-full rounded-full bg-white transition-all" style={{ width: `${st.persen}%` }} /></span>
    </span>
  );
}
const titikKlik = (e: React.MouseEvent<HTMLElement>): [number, number] => {
  const r = e.currentTarget.getBoundingClientRect();
  return [Math.round(((e.clientX - r.left) / r.width) * 100), Math.round(((e.clientY - r.top) / r.height) * 100)];
};

/**
 * Foto situs untuk satu atau beberapa kelompok (`grup`), dan editor galeri
 * (`galeri`): foto bebas jumlahnya, urutan diatur dengan tombol geser atau seret.
 * Foto langsung tayang setelah selesai diunggah.
 */
export default function FotoSitus({ grup, galeri: namaGaleri, judul = "Foto" }: { grup: string[]; galeri?: NamaGaleri; judul?: string }) {
  const toast = useToast();
  const [peta, setPeta] = useState<PetaFoto | null>(null);
  const [galeri, setGaleri] = useState<PetaGaleri | null>(null);
  const [galat, setGalat] = useState("");
  /* Status unggahan per kunci: id slot, atau "galeri:<nama>:<n>" untuk foto galeri yang sedang diunggah. */
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [seret, setSeret] = useState<number | null>(null);
  const pilih = useRef<HTMLInputElement>(null);
  const pilihBanyak = useRef<HTMLInputElement>(null);
  const tujuan = useRef<SlotFoto | null>(null);
  const tertunda = useRef(new Map<string, { tujuan: Tujuan; tugas?: Tugas; berkas: File }>());
  /* Satu foto diproses dalam satu waktu supaya ponsel tidak kehabisan memori; sisanya mengantre. */
  const antrean = useRef<Promise<unknown>>(Promise.resolve());
  const nomor = useRef(0);
  useEffect(() => {
    api<{ foto: PetaFoto; galeri: PetaGaleri }>("/api/foto").then((r) => { setPeta(r.foto); setGaleri(r.galeri); }).catch((e) => setGalat(e.message));
  }, []);
  const jalan = Object.values(status).some((x) => !x.gagal);
  useEffect(() => {
    if (!jalan) return;
    const tahan = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", tahan);
    return () => window.removeEventListener("beforeunload", tahan);
  }, [jalan]);
  if (galat) return <Galat pesan={galat} />;
  if (!peta || !galeri) return <Kartu judul={judul}><Memuat /></Kartu>;

  const ubahStatus = (kunci: string, s: Partial<Status> | null) => setStatus((l) => {
    const n = { ...l };
    if (s) n[kunci] = { ...(l[kunci] ?? { teks: "", persen: 0 }), ...s };
    else {
      if (l[kunci]?.pratinjau) URL.revokeObjectURL(l[kunci].pratinjau!);
      delete n[kunci];
    }
    return n;
  });

  function unggah(kunci: string, t: Tujuan, berkas: File) {
    const lama = status[kunci]?.pratinjau;
    if (lama) URL.revokeObjectURL(lama);
    ubahStatus(kunci, { teks: "Menunggu antrean…", persen: 0, gagal: undefined, pratinjau: URL.createObjectURL(berkas) });
    tertunda.current.set(kunci, { tujuan: t, berkas });
    proses(kunci);
  }
  function proses(kunci: string) {
    antrean.current = antrean.current.then(async () => {
      const p = tertunda.current.get(kunci);
      if (!p) return;
      const lapor = (teks: string, persen: number) => ubahStatus(kunci, { teks, persen, gagal: undefined });
      try {
        p.tugas ??= await kompres(p.tujuan, p.berkas, lapor);
        const hasil = await unggahTugas(p.tugas, lapor);
        tertunda.current.delete(kunci);
        setPeta(hasil.foto);
        setGaleri(hasil.galeri);
        ubahStatus(kunci, null);
        const x = "slot" in p.tujuan ? hasil.foto[p.tujuan.slot] : hasil.galeri[p.tujuan.galeri].find((i) => i.kunci === p.tugas!.id)?.foto;
        toast(x ? `Foto tayang: ${kb(x.kbAsli)} menjadi ${kb(x.kb)}` : "Foto tersimpan");
      } catch (e) {
        ubahStatus(kunci, { gagal: e instanceof Error ? e.message : "Unggahan gagal." });
      }
    });
  }
  async function bawaan(slot: SlotFoto) {
    if (!confirm("Kembalikan ke foto bawaan? Foto unggahan di slot ini dihapus.")) return;
    try {
      setPeta((await api<{ foto: PetaFoto }>(`/api/foto?slot=${slot}`, { method: "DELETE" })).foto);
      toast("Kembali ke foto bawaan");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    }
  }
  async function fokus(slot: SlotFoto, e: React.MouseEvent<HTMLElement>) {
    const titik = titikKlik(e);
    setPeta({ ...peta!, [slot]: { ...peta![slot]!, fokus: titik } });
    try {
      setPeta((await api<{ foto: PetaFoto }>("/api/foto", { method: "PATCH", body: { slot, fokus: titik } })).foto);
    } catch (er) {
      toast(er instanceof Error ? er.message : "Gagal", "galat");
    }
  }

  /* ---------- galeri */
  const daftar = namaGaleri ? galeri[namaGaleri] : [];
  async function susun(baru: ItemGaleri[], pesan?: string) {
    if (!namaGaleri) return;
    const lama = galeri!;
    setGaleri({ ...lama, [namaGaleri]: baru });
    try {
      setGaleri((await api<{ galeri: PetaGaleri }>("/api/foto/galeri", { method: "PUT", body: { nama: namaGaleri, kunci: baru.map((x) => x.kunci) } })).galeri);
      if (pesan) toast(pesan);
    } catch (e) {
      setGaleri(lama);
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    }
  }
  const pindah = (dari: number, ke: number) => {
    if (ke < 0 || ke >= daftar.length || dari === ke) return;
    const n = [...daftar];
    const [x] = n.splice(dari, 1);
    n.splice(ke, 0, x);
    void susun(n);
  };
  async function fokusGaleri(it: ItemGaleri, e: React.MouseEvent<HTMLElement>) {
    if (!namaGaleri || !it.foto) return;
    const titik = titikKlik(e);
    setGaleri({ ...galeri!, [namaGaleri]: daftar.map((x) => (x.kunci === it.kunci ? { ...x, foto: { ...x.foto!, fokus: titik } } : x)) });
    try {
      setGaleri((await api<{ galeri: PetaGaleri }>("/api/foto/galeri", { method: "PATCH", body: { nama: namaGaleri, kunci: it.kunci, fokus: titik } })).galeri);
    } catch (er) {
      toast(er instanceof Error ? er.message : "Gagal", "galat");
    }
  }
  const unggahanGaleri = Object.entries(status).filter(([k]) => namaGaleri && k.startsWith(`galeri:${namaGaleri}:`));
  const mosaik = namaGaleri ? GALERI[namaGaleri].mosaik : 0;

  const slot = SLOT_FOTO.filter((s) => grup.includes(s.grup) && !SLOT_GALERI.has(s.id));
  return (
    <Kartu judul={judul} ket={KET_UNGGAH}>
      <input ref={pilih} type="file" accept="image/*" className="sr-only" data-unggah-foto onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (f && tujuan.current) unggah(tujuan.current, { slot: tujuan.current }, f);
      }} />
      <input ref={pilihBanyak} type="file" accept="image/*" multiple className="sr-only" data-unggah-galeri onChange={(e) => {
        const daftarBerkas = [...(e.target.files ?? [])];
        e.target.value = "";
        if (namaGaleri) for (const f of daftarBerkas) unggah(`galeri:${namaGaleri}:${++nomor.current}`, { galeri: namaGaleri }, f);
      }} />

      {slot.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {slot.map((s) => {
            const f: Foto | undefined = peta[s.id];
            const st = status[s.id];
            return (
              <li key={s.id} data-slot={s.id} className="overflow-hidden rounded-xl bg-white ring-1 ring-panel-garis">
                <button type="button" disabled={!f || Boolean(st)} title={f ? "Klik untuk memilih titik fokus" : undefined} onClick={(e) => f && fokus(s.id, e)} className={`relative block aspect-[16/10] w-full overflow-hidden bg-panel-garis ${f ? "cursor-crosshair" : "cursor-default"}`}>
                  <img src={st?.pratinjau ?? (f ? urlFoto(f, f.lebar[0]) : s.bawaan)} alt="" className="size-full object-cover" style={f ? { objectPosition: `${f.fokus[0]}% ${f.fokus[1]}%` } : undefined} />
                  {f && !st && <span aria-hidden="true" className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-panel-hijau/80 shadow" style={{ left: `${f.fokus[0]}%`, top: `${f.fokus[1]}%` }} />}
                  {st && !st.gagal && <Proses st={st} />}
                </button>
                <div className="grid gap-2 p-3">
                  <div>
                    <b className="block text-sm">{s.grup !== judul && grup.length > 1 ? `${s.grup} · ` : ""}{s.label}</b>
                    <span className="block text-xs text-panel-redup">{f ? `${f.jenis.toUpperCase()} ${f.w}×${f.h} · ${f.lebar.length} ukuran · ${kb(f.kb)}${f.kbAsli ? ` (asli ${kb(f.kbAsli)})` : ""}` : `Foto bawaan · saran: ${s.saran}`}</span>
                  </div>
                  {st?.gagal && <p data-gagal className="rounded-lg bg-panel-merah/10 px-2.5 py-2 text-xs font-bold text-panel-merah">Belum terunggah: {st.gagal}</p>}
                  <div className="flex flex-wrap gap-2">
                    {st?.gagal ? (
                      <>
                        <Tombol kecil onClick={() => { ubahStatus(s.id, { gagal: undefined, teks: "Melanjutkan…" }); proses(s.id); }}>Coba lagi</Tombol>
                        <Tombol kecil varian="garis" onClick={() => { tertunda.current.delete(s.id); ubahStatus(s.id, null); }}>Batal</Tombol>
                      </>
                    ) : (
                      <>
                        <Tombol kecil disabled={Boolean(st)} onClick={() => { tujuan.current = s.id; pilih.current?.click(); }}>{f ? "Ganti" : "Unggah foto"}</Tombol>
                        {f && <Tombol kecil varian="garis" disabled={Boolean(st)} onClick={() => bawaan(s.id)}>Bawaan</Tombol>}
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {namaGaleri && (
        <div data-galeri={namaGaleri} className={slot.length ? "mt-6 border-t border-panel-garis pt-5" : ""}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold">{GALERI[namaGaleri].label} · {daftar.length} foto</p>
              <p className="text-xs text-panel-redup">{mosaik} foto pertama mengisi mosaik di situs; sisanya tampil setelah pengunjung menekan “Show more”. Seret foto atau pakai tombol ‹ › untuk mengatur urutan.</p>
            </div>
            <div className="flex gap-2">
              <Tombol kecil varian="garis" onClick={async () => {
                if (!confirm("Kembalikan galeri ke 5 foto awal? Foto unggahan tambahan di galeri ini dihapus.")) return;
                try { setGaleri((await api<{ galeri: PetaGaleri }>(`/api/foto/galeri?nama=${namaGaleri}`, { method: "DELETE" })).galeri); toast("Galeri dikembalikan"); } catch (e) { toast(e instanceof Error ? e.message : "Gagal", "galat"); }
              }}>Susunan awal</Tombol>
              <Tombol kecil onClick={() => pilihBanyak.current?.click()}>+ Tambah foto</Tombol>
            </div>
          </div>
          <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {daftar.map((it, i) => (
              <li
                key={it.kunci}
                data-item={i + 1}
                draggable
                onDragStart={(e) => { setSeret(i); e.dataTransfer.effectAllowed = "move"; }}
                onDragOver={(e) => { if (seret !== null) e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); if (seret !== null) pindah(seret, i); setSeret(null); }}
                onDragEnd={() => setSeret(null)}
                className={`overflow-hidden rounded-xl bg-white ring-1 transition ${seret === i ? "opacity-40 ring-panel-utama" : "ring-panel-garis"}`}
              >
                <button type="button" disabled={!it.foto} title={it.foto ? "Klik untuk memilih titik fokus" : undefined} onClick={(e) => fokusGaleri(it, e)} className={`relative block aspect-[4/3] w-full overflow-hidden bg-panel-garis ${it.foto ? "cursor-crosshair" : "cursor-grab"}`}>
                  <img src={it.foto ? urlFoto(it.foto, it.foto.lebar[0]) : it.bawaan!} alt="" draggable={false} className="size-full object-cover" style={it.foto ? { objectPosition: `${it.foto.fokus[0]}% ${it.foto.fokus[1]}%` } : undefined} />
                  <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${i < mosaik ? "bg-panel-utama text-white" : "bg-white/90 text-panel-tinta"}`}>{i + 1}{i < mosaik ? " · mosaik" : ""}</span>
                  {it.foto && <span aria-hidden="true" className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-panel-hijau/80 shadow" style={{ left: `${it.foto.fokus[0]}%`, top: `${it.foto.fokus[1]}%` }} />}
                </button>
                <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                  <span className="flex gap-1">
                    <button type="button" aria-label={`Geser foto ${i + 1} ke kiri`} disabled={i === 0} onClick={() => pindah(i, i - 1)} className="grid size-8 place-items-center rounded-full text-lg hover:bg-panel-latar disabled:opacity-30">‹</button>
                    <button type="button" aria-label={`Geser foto ${i + 1} ke kanan`} disabled={i === daftar.length - 1} onClick={() => pindah(i, i + 1)} className="grid size-8 place-items-center rounded-full text-lg hover:bg-panel-latar disabled:opacity-30">›</button>
                  </span>
                  <span className="truncate text-[11px] text-panel-redup">{it.foto ? kb(it.foto.kb) : "bawaan"}</span>
                  <button type="button" aria-label={`Hapus foto ${i + 1}`} onClick={() => confirm("Hapus foto ini dari galeri?") && susun(daftar.filter((x) => x.kunci !== it.kunci), "Foto dihapus dari galeri")} className="grid size-8 place-items-center rounded-full text-lg text-panel-redup hover:bg-panel-merah/10 hover:text-panel-merah">×</button>
                </div>
              </li>
            ))}
            {unggahanGaleri.map(([k, st]) => (
              <li key={k} data-unggahan className="overflow-hidden rounded-xl bg-white ring-1 ring-panel-garis">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-panel-garis">
                  {st.pratinjau && <img src={st.pratinjau} alt="" className="size-full object-cover" />}
                  {!st.gagal && <Proses st={st} />}
                </div>
                {st.gagal ? (
                  <div className="grid gap-1.5 p-2">
                    <p data-gagal className="text-[11px] font-bold text-panel-merah">{st.gagal}</p>
                    <span className="flex gap-1.5">
                      <Tombol kecil onClick={() => { ubahStatus(k, { gagal: undefined, teks: "Melanjutkan…" }); proses(k); }}>Coba lagi</Tombol>
                      <Tombol kecil varian="garis" onClick={() => { tertunda.current.delete(k); ubahStatus(k, null); }}>Batal</Tombol>
                    </span>
                  </div>
                ) : <p className="px-2 py-2.5 text-[11px] text-panel-redup">Mengunggah…</p>}
              </li>
            ))}
            <li>
              <button type="button" onClick={() => pilihBanyak.current?.click()} className="grid aspect-[4/3] w-full place-items-center rounded-xl border-2 border-dashed border-panel-garis text-sm font-bold text-panel-redup hover:border-panel-utama hover:text-panel-utama">+ Tambah foto</button>
            </li>
          </ol>
        </div>
      )}
    </Kartu>
  );
}
