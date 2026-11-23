"use client";

import { useEffect, useRef, useState } from "react";
import { daftarLebar, SLOT_FOTO, urlFoto, type Foto, type PetaFoto, type SlotFoto } from "@/lib/foto";
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

interface Tugas {
  slot: SlotFoto;
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

async function kompres(slot: SlotFoto, f: File, lapor: (teks: string, persen: number) => void): Promise<Tugas> {
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
  return { slot, id: `${Date.now().toString(36)}-${acak}`, jenis, h, kbAsli: Math.round(f.size / 1024), bagian: bagian.reverse(), terkirim: new Set() };
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

async function unggahTugas(t: Tugas, lapor: (teks: string, persen: number) => void): Promise<PetaFoto> {
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
      body: JSON.stringify({ slot: t.slot, id: t.id, lebar: t.bagian.map((b) => b.w), h: t.h, jenis: t.jenis, kbAsli: t.kbAsli }),
    });
    if (r.status !== 409) return r.data.foto as PetaFoto;
    for (const w of (r.data.kurang as number[]) ?? []) t.terkirim.delete(w);
  }
  throw new Error("Sebagian ukuran foto tidak sampai ke server.");
}

/**
 * Kotak Foto di menu Website: ganti foto tiap bagian situs. Foto langsung tayang
 * setelah selesai diunggah; klik foto untuk memilih titik fokus (bagian yang
 * tetap terlihat saat dipotong).
 */
export default function FotoSitus() {
  const toast = useToast();
  const [peta, setPeta] = useState<PetaFoto | null>(null);
  const [galat, setGalat] = useState("");
  const [status, setStatus] = useState<Partial<Record<SlotFoto, Status>>>({});
  const [buka, setBuka] = useState<string>(SLOT_FOTO[0].grup);
  const pilih = useRef<HTMLInputElement>(null);
  const tujuan = useRef<SlotFoto | null>(null);
  const tertunda = useRef(new Map<SlotFoto, { tugas?: Tugas; berkas: File }>());
  /* Satu foto diproses dalam satu waktu supaya ponsel tidak kehabisan memori; sisanya mengantre. */
  const antrean = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    api<{ foto: PetaFoto }>("/api/foto").then((r) => setPeta(r.foto)).catch((e) => setGalat(e.message));
  }, []);
  const jalan = Object.values(status).some((x) => x && !x.gagal);
  useEffect(() => {
    if (!jalan) return;
    const tahan = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", tahan);
    return () => window.removeEventListener("beforeunload", tahan);
  }, [jalan]);
  if (galat) return <Galat pesan={galat} />;
  if (!peta) return <Kartu judul="Foto"><Memuat /></Kartu>;

  const ubahStatus = (slot: SlotFoto, s: Partial<Status> | null) => setStatus((l) => {
    const n = { ...l };
    if (s) n[slot] = { ...(l[slot] ?? { teks: "", persen: 0 }), ...s };
    else {
      if (l[slot]?.pratinjau) URL.revokeObjectURL(l[slot]!.pratinjau!);
      delete n[slot];
    }
    return n;
  });

  function unggah(slot: SlotFoto, berkas: File) {
    const lama = status[slot]?.pratinjau;
    if (lama) URL.revokeObjectURL(lama);
    ubahStatus(slot, { teks: "Menunggu antrean…", persen: 0, gagal: undefined, pratinjau: URL.createObjectURL(berkas) });
    tertunda.current.set(slot, { berkas });
    proses(slot);
  }
  function proses(slot: SlotFoto) {
    antrean.current = antrean.current.then(async () => {
      const p = tertunda.current.get(slot);
      if (!p) return;
      const lapor = (teks: string, persen: number) => ubahStatus(slot, { teks, persen, gagal: undefined });
      try {
        p.tugas ??= await kompres(slot, p.berkas, lapor);
        const hasil = await unggahTugas(p.tugas, lapor);
        tertunda.current.delete(slot);
        setPeta(hasil);
        ubahStatus(slot, null);
        const x = hasil[slot];
        toast(x ? `Foto tayang: ${kb(x.kbAsli)} menjadi ${kb(x.kb)}` : "Foto tersimpan");
      } catch (e) {
        ubahStatus(slot, { gagal: e instanceof Error ? e.message : "Unggahan gagal." });
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
    const r = e.currentTarget.getBoundingClientRect();
    const titik: [number, number] = [Math.round(((e.clientX - r.left) / r.width) * 100), Math.round(((e.clientY - r.top) / r.height) * 100)];
    setPeta({ ...peta!, [slot]: { ...peta![slot]!, fokus: titik } });
    try {
      setPeta((await api<{ foto: PetaFoto }>("/api/foto", { method: "PATCH", body: { slot, fokus: titik } })).foto);
    } catch (er) {
      toast(er instanceof Error ? er.message : "Gagal", "galat");
    }
  }

  const grup = [...new Set(SLOT_FOTO.map((s) => s.grup))];
  const terisi = (g: string) => SLOT_FOTO.filter((s) => s.grup === g && peta[s.id]).length;
  return (
    <Kartu
      judul="Foto"
      ket="Ganti foto tiap bagian situs. Unggah foto asli dari kamera atau ponsel (JPG, PNG, WebP, AVIF; ukuran berapa pun); foto dikompres di perangkat ini menjadi WebP dalam beberapa ukuran (ponsel pengunjung mengunduh yang kecil, layar lebar yang tajam), lalu diunggah sedikit demi sedikit dan diulang otomatis bila koneksi putus. Foto langsung tayang tanpa menekan Simpan dan berlaku untuk kedua bahasa. Klik foto unggahan untuk memilih titik fokus."
    >
      <input
        ref={pilih}
        type="file"
        accept="image/*"
        className="sr-only"
        data-unggah-foto
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f && tujuan.current) unggah(tujuan.current, f);
        }}
      />
      <div className="grid gap-2">
        {grup.map((g) => (
          <details key={g} open={buka === g} onToggle={(e) => (e.currentTarget.open ? setBuka(g) : buka === g && setBuka(""))} className="rounded-2xl bg-panel-latar">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-bold">
              {g}
              <span className="text-xs font-normal text-panel-redup">{SLOT_FOTO.some((x) => x.grup === g && status[x.id]) && <b className="mr-2 text-panel-hijau">sedang diunggah</b>}{terisi(g)} dari {SLOT_FOTO.filter((s) => s.grup === g).length} diganti</span>
            </summary>
            <ul className="grid gap-3 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-3">
              {SLOT_FOTO.filter((s) => s.grup === g).map((s) => {
                const f: Foto | undefined = peta[s.id];
                const st = status[s.id];
                return (
                  <li key={s.id} data-slot={s.id} className="overflow-hidden rounded-xl bg-white ring-1 ring-panel-garis">
                    <button
                      type="button"
                      disabled={!f || Boolean(st)}
                      title={f ? "Klik untuk memilih titik fokus" : undefined}
                      onClick={(e) => f && fokus(s.id, e)}
                      className={`relative block aspect-[16/10] w-full overflow-hidden bg-panel-garis ${f ? "cursor-crosshair" : "cursor-default"}`}
                    >
                      <img src={st?.pratinjau ?? (f ? urlFoto(f, f.lebar[0]) : s.bawaan)} alt="" className="size-full object-cover" style={f ? { objectPosition: `${f.fokus[0]}% ${f.fokus[1]}%` } : undefined} />
                      {f && !st && <span aria-hidden="true" className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-panel-hijau/80 shadow" style={{ left: `${f.fokus[0]}%`, top: `${f.fokus[1]}%` }} />}
                      {st && !st.gagal && (
                        <span data-status className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 px-4 text-sm font-bold text-white">
                          {st.teks}
                          <span className="h-1.5 w-2/3 overflow-hidden rounded-full bg-white/30"><span className="block h-full rounded-full bg-white transition-all" style={{ width: `${st.persen}%` }} /></span>
                        </span>
                      )}
                    </button>
                    <div className="grid gap-2 p-3">
                      <div>
                        <b className="block text-sm">{s.label}</b>
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
          </details>
        ))}
      </div>
    </Kartu>
  );
}
