"use client";

import { useEffect, useRef, useState } from "react";
import { daftarLebar, SLOT_FOTO, urlFoto, type Foto, type PetaFoto, type SlotFoto } from "@/lib/foto";
import { api, GalatApi } from "./api";
import { Galat, Kartu, Memuat, Tombol, useToast } from "./ui";

const kb = (n: number) => (n >= 1024 ? `${(n / 1024).toFixed(1).replace(".", ",")} MB` : `${n} KB`);

/** Foto asli yang besar atau berformat lain (misalnya HEIC di iPhone) dikecilkan dulu di browser agar unggahan ringan. */
async function siapkanAsli(f: File): Promise<Blob> {
  const biasa = ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(f.type);
  if (biasa && f.size <= 15 * 1024 * 1024) return f;
  const bmp = await createImageBitmap(f, { imageOrientation: "from-image" }).catch(() => null);
  if (!bmp) throw new Error(/heic|heif/i.test(f.type + f.name) ? "Foto HEIC belum bisa dibaca browser ini. Kirim sebagai JPG (di iPhone: Pengaturan › Kamera › Format › Paling Kompatibel), atau buka dashboard dari Safari." : "Berkas ini bukan foto yang bisa dibaca.");
  const s = Math.min(1, 4096 / Math.max(bmp.width, bmp.height));
  const kanvas = gambarKe(bmp, Math.round(bmp.width * s), Math.round(bmp.height * s));
  return keBlob(kanvas, "image/jpeg", 0.95);
}

/** Pengecilan bertahap (setengah demi setengah) supaya hasilnya tetap tajam, bukan bergerigi. */
function gambarKe(src: CanvasImageSource & { width: number; height: number }, w: number, h: number): HTMLCanvasElement {
  let sumber: CanvasImageSource = src;
  let sw = src.width;
  let sh = src.height;
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
const keBlob = (c: HTMLCanvasElement, jenis: string, q: number) => new Promise<Blob>((ok, gagal) => c.toBlob((b) => (b ? ok(b) : gagal(new Error("Foto gagal diubah."))), jenis, q));

/** Cadangan bila server tidak punya pengolah foto: buat sendiri WebP (atau JPG di browser lama) dalam beberapa lebar. */
async function ubahDiBrowser(f: Blob, slot: SlotFoto, kbAsli: number): Promise<FormData> {
  const bmp = await createImageBitmap(f, { imageOrientation: "from-image" });
  const lebar = daftarLebar(bmp.width, bmp.height);
  const fd = new FormData();
  fd.set("slot", slot);
  fd.set("klien", "1");
  fd.set("kbAsli", String(kbAsli));
  let tinggi = 0;
  for (const w of lebar) {
    const h = Math.round((w * bmp.height) / bmp.width);
    const c = gambarKe(bmp, w, h);
    let b = await keBlob(c, "image/webp", 0.82);
    if (b.type !== "image/webp") b = await keBlob(c, "image/jpeg", 0.86);
    fd.set(`v${w}`, b, `v${w}`);
    tinggi = h;
  }
  fd.set("h", String(tinggi));
  return fd;
}

async function kirim(fd: FormData): Promise<PetaFoto> {
  const r = await fetch("/api/foto", { method: "POST", body: fd, cache: "no-store" });
  const d = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (r.status === 401) window.location.reload();
  if (!r.ok) throw new GalatApi(typeof d.galat === "string" ? d.galat : `Unggahan gagal (${r.status}).`, r.status, d);
  return d.foto as PetaFoto;
}

/**
 * Kotak Foto di menu Website: ganti foto tiap bagian situs. Foto langsung tayang
 * setelah selesai diunggah. Server mengubahnya menjadi WebP beberapa ukuran;
 * klik foto untuk memilih titik fokus (bagian yang tetap terlihat saat dipotong).
 */
export default function FotoSitus() {
  const toast = useToast();
  const [peta, setPeta] = useState<PetaFoto | null>(null);
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState<SlotFoto | null>(null);
  const [buka, setBuka] = useState<string>(SLOT_FOTO[0].grup);
  const pilih = useRef<HTMLInputElement>(null);
  const tujuan = useRef<SlotFoto | null>(null);
  useEffect(() => {
    api<{ foto: PetaFoto }>("/api/foto").then((r) => setPeta(r.foto)).catch((e) => setGalat(e.message));
  }, []);
  if (galat) return <Galat pesan={galat} />;
  if (!peta) return <Kartu judul="Foto"><Memuat /></Kartu>;

  async function unggah(slot: SlotFoto, f: File) {
    setSibuk(slot);
    try {
      const asli = await siapkanAsli(f);
      const fd = new FormData();
      fd.set("slot", slot);
      fd.set("berkas", asli, f.name);
      let hasil: PetaFoto;
      try {
        hasil = await kirim(fd);
      } catch (e) {
        if (!(e instanceof GalatApi && e.data.kode === "tanpa-sharp")) throw e;
        hasil = await kirim(await ubahDiBrowser(asli, slot, Math.round(f.size / 1024)));
      }
      setPeta(hasil);
      const x = hasil[slot];
      toast(x ? `Foto tayang: ${kb(x.kbAsli)} menjadi ${kb(x.kb)}` : "Foto tersimpan");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Unggahan gagal", "galat");
    } finally {
      setSibuk(null);
    }
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
      ket="Ganti foto tiap bagian situs. Unggah foto asli dari kamera atau ponsel (JPG, PNG, WebP, AVIF; sampai 40 MB); server otomatis mengubahnya menjadi WebP dalam beberapa ukuran, jadi ponsel mengunduh yang kecil dan layar lebar yang tajam. Foto langsung tayang tanpa menekan Simpan dan berlaku untuk kedua bahasa. Klik foto unggahan untuk memilih titik fokus."
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
          if (f && tujuan.current) void unggah(tujuan.current, f);
        }}
      />
      <div className="grid gap-2">
        {grup.map((g) => (
          <details key={g} open={buka === g} onToggle={(e) => (e.currentTarget.open ? setBuka(g) : buka === g && setBuka(""))} className="rounded-2xl bg-panel-latar">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-bold">
              {g}
              <span className="text-xs font-normal text-panel-redup">{terisi(g)} dari {SLOT_FOTO.filter((s) => s.grup === g).length} diganti</span>
            </summary>
            <ul className="grid gap-3 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-3">
              {SLOT_FOTO.filter((s) => s.grup === g).map((s) => {
                const f: Foto | undefined = peta[s.id];
                return (
                  <li key={s.id} data-slot={s.id} className="overflow-hidden rounded-xl bg-white ring-1 ring-panel-garis">
                    <button
                      type="button"
                      disabled={!f}
                      title={f ? "Klik untuk memilih titik fokus" : undefined}
                      onClick={(e) => f && fokus(s.id, e)}
                      className={`relative block aspect-[16/10] w-full overflow-hidden bg-panel-garis ${f ? "cursor-crosshair" : "cursor-default"}`}
                    >
                      <img src={f ? urlFoto(f, f.lebar[0]) : s.bawaan} alt="" className="size-full object-cover" style={f ? { objectPosition: `${f.fokus[0]}% ${f.fokus[1]}%` } : undefined} />
                      {f && <span aria-hidden="true" className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-panel-hijau/80 shadow" style={{ left: `${f.fokus[0]}%`, top: `${f.fokus[1]}%` }} />}
                      {sibuk === s.id && <span className="absolute inset-0 grid place-items-center bg-black/55 text-sm font-bold text-white">Mengubah ukuran…</span>}
                    </button>
                    <div className="grid gap-2 p-3">
                      <div>
                        <b className="block text-sm">{s.label}</b>
                        <span className="block text-xs text-panel-redup">{f ? `${f.jenis.toUpperCase()} ${f.w}×${f.h} · ${f.lebar.length} ukuran · ${kb(f.kb)}${f.kbAsli ? ` (asli ${kb(f.kbAsli)})` : ""}` : `Foto bawaan · saran: ${s.saran}`}</span>
                      </div>
                      <div className="flex gap-2">
                        <Tombol kecil disabled={sibuk !== null} onClick={() => { tujuan.current = s.id; pilih.current?.click(); }}>{f ? "Ganti" : "Unggah foto"}</Tombol>
                        {f && <Tombol kecil varian="garis" disabled={sibuk !== null} onClick={() => bawaan(s.id)}>Bawaan</Tombol>}
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
