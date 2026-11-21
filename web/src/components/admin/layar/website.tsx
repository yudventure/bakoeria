"use client";

import { useEffect, useState } from "react";
import { IKON_KEUNGGULAN, type Konten } from "@/lib/konten";
import { api } from "../api";
import { Bidang, Galat, Kartu, masukan, Memuat, Tombol, useToast } from "../ui";

export default function Website() {
  const toast = useToast();
  const [k, setK] = useState<Konten | null>(null);
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  useEffect(() => {
    api<{ konten: Konten }>("/api/konten").then((r) => setK(r.konten)).catch((e) => setGalat(e.message));
  }, []);
  if (galat) return <Galat pesan={galat} />;
  if (!k) return <Memuat />;

  const set = <K extends keyof Konten>(kunci: K, v: Konten[K]) => setK({ ...k, [kunci]: v });
  async function simpan() {
    setSibuk(true);
    try {
      const r = await api<{ konten: Konten }>("/api/konten", { method: "PUT", body: { konten: k } });
      setK(r.konten);
      toast("Tersimpan dan langsung tayang");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    } finally {
      setSibuk(false);
    }
  }
  const Daftar = <T,>({ judul, isi, kosong, ubah, render }: { judul: string; isi: T[]; kosong: T; ubah: (v: T[]) => void; render: (x: T, set: (v: T) => void) => React.ReactNode }) => (
    <Kartu judul={judul} aksi={<Tombol kecil varian="garis" onClick={() => ubah([...isi, kosong])}>+ Tambah</Tombol>}>
      <div className="grid gap-4">
        {isi.map((x, i) => (
          <div key={i} className="relative grid gap-3 rounded-2xl bg-panel-latar p-4">
            {render(x, (v) => ubah(isi.map((y, j) => (j === i ? v : y))))}
            <div className="flex justify-end gap-3 text-sm font-bold">
              {i > 0 && <button onClick={() => { const n = [...isi]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; ubah(n); }} className="text-panel-redup underline">Naikkan</button>}
              <button onClick={() => ubah(isi.filter((_, j) => j !== i))} className="text-panel-merah underline">Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </Kartu>
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Website</h1>
          <p className="mt-1 text-sm text-panel-redup">Isi situs publik. Perubahan langsung tayang setelah disimpan, tanpa menunggu build.</p>
        </div>
        <div className="flex gap-2">
          <Tombol varian="garis" onClick={() => window.open("/", "_blank")}>Lihat situs</Tombol>
          <Tombol disabled={sibuk} onClick={simpan}>{sibuk ? "Menyimpan…" : "Simpan"}</Tombol>
        </div>
      </div>
      <Kartu judul="Status situs">
        <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" className="size-4" checked={k.tutup} onChange={(e) => set("tutup", e.target.checked)} /> Tutup sementara (situs menampilkan halaman perbaikan, dashboard tetap jalan)</label>
        <Bidang label="Pengumuman di atas halaman" ket="Kosongkan bila tidak ada." className="mt-4"><input className={masukan} value={k.pengumuman} onChange={(e) => set("pengumuman", e.target.value)} placeholder="Resort tutup 1–15 Februari untuk perawatan" /></Bidang>
      </Kartu>
      <Kartu judul="Kontak">
        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang label="WhatsApp"><input className={masukan} value={k.kontak.whatsapp} onChange={(e) => set("kontak", { ...k.kontak, whatsapp: e.target.value })} /></Bidang>
          <Bidang label="Email"><input className={masukan} value={k.kontak.email} onChange={(e) => set("kontak", { ...k.kontak, email: e.target.value })} /></Bidang>
          <Bidang label="Instagram"><input className={masukan} value={k.kontak.instagram} onChange={(e) => set("kontak", { ...k.kontak, instagram: e.target.value })} /></Bidang>
          <Bidang label="Alamat atau lokasi"><input className={masukan} value={k.kontak.alamat} onChange={(e) => set("kontak", { ...k.kontak, alamat: e.target.value })} /></Bidang>
        </div>
      </Kartu>
      <Kartu judul="Pembuka">
        <div className="grid gap-4">
          <Bidang label="Tagline"><input className={masukan} value={k.tagline} onChange={(e) => set("tagline", e.target.value)} /></Bidang>
          <Bidang label="Judul sambutan"><input className={masukan} value={k.introJudul} onChange={(e) => set("introJudul", e.target.value)} /></Bidang>
          <Bidang label="Isi sambutan"><textarea rows={4} className={masukan} value={k.introIsi} onChange={(e) => set("introIsi", e.target.value)} /></Bidang>
        </div>
      </Kartu>
      <Kartu judul="Angka di hero" ket="Tiga kartu di kanan foto pembuka. Kosongkan angka untuk menghitung otomatis: kartu pertama memakai jumlah cottage aktif, kartu kedua jumlah program selam. Jangan mengisi angka yang tidak bisa dibuktikan.">
        <div className="grid gap-4 sm:grid-cols-3">
          {k.sorotan.map((x, i) => (
            <div key={i} className="grid gap-3 rounded-2xl bg-panel-latar p-4">
              <Bidang label="Angka"><input className={masukan} value={x.nilai} placeholder={i < 2 ? "otomatis" : ""} onChange={(e) => set("sorotan", k.sorotan.map((y, j) => (j === i ? { ...y, nilai: e.target.value } : y)))} /></Bidang>
              <Bidang label="Keterangan"><input className={masukan} value={x.label} onChange={(e) => set("sorotan", k.sorotan.map((y, j) => (j === i ? { ...y, label: e.target.value } : y)))} /></Bidang>
            </div>
          ))}
        </div>
      </Kartu>
      <Kartu judul="Bagian Tentang">
        <Bidang label="Kalimat besar" ket="Ditulis kapital di situs. Kata di antara tanda bintang diberi warna emas, contoh: *laut*."><textarea rows={3} className={masukan} value={k.pernyataan} onChange={(e) => set("pernyataan", e.target.value)} /></Bidang>
      </Kartu>
      <Bidang label="Judul bagian keunggulan"><input className={masukan} value={k.keunggulanJudul} onChange={(e) => set("keunggulanJudul", e.target.value)} /></Bidang>
      <Daftar judul="Keunggulan" isi={k.keunggulan} kosong={{ ikon: "bintang", judul: "", isi: "" }} ubah={(v) => set("keunggulan", v)} render={(x, s) => (
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
          <Bidang label="Ikon">
            <select className={masukan} value={x.ikon} onChange={(e) => s({ ...x, ikon: e.target.value })}>
              {IKON_KEUNGGULAN.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Bidang>
          <Bidang label="Judul"><input className={masukan} value={x.judul} onChange={(e) => s({ ...x, judul: e.target.value })} /></Bidang>
          <Bidang label="Keterangan" className="sm:col-span-2"><input className={masukan} value={x.isi} onChange={(e) => s({ ...x, isi: e.target.value })} /></Bidang>
        </div>
      )} />
      <Daftar judul="Program selam" isi={k.program} kosong={{ judul: "", isi: "", meta: "", harga: "" }} ubah={(v) => set("program", v)} render={(x, s) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Bidang label="Nama"><input className={masukan} value={x.judul} onChange={(e) => s({ ...x, judul: e.target.value })} /></Bidang>
          <Bidang label="Harga" ket="Teks bebas, misalnya Rp1.200.000 per orang. Kosongkan untuk tidak menampilkan."><input className={masukan} value={x.harga} onChange={(e) => s({ ...x, harga: e.target.value })} /></Bidang>
          <Bidang label="Keterangan" className="sm:col-span-2"><textarea rows={2} className={masukan} value={x.isi} onChange={(e) => s({ ...x, isi: e.target.value })} /></Bidang>
          <Bidang label="Label kecil" className="sm:col-span-2"><input className={masukan} value={x.meta} onChange={(e) => s({ ...x, meta: e.target.value })} /></Bidang>
        </div>
      )} />
      <Bidang label="Catatan di bawah judul program"><input className={masukan} value={k.programCatatan} onChange={(e) => set("programCatatan", e.target.value)} /></Bidang>
      <Kartu judul="Cottage">
        <div className="grid gap-4">
          <Bidang label="Judul"><input className={masukan} value={k.cottageJudul} onChange={(e) => set("cottageJudul", e.target.value)} /></Bidang>
          <Bidang label="Isi"><textarea rows={3} className={masukan} value={k.cottageIsi} onChange={(e) => set("cottageIsi", e.target.value)} /></Bidang>
          <Bidang label="Fasilitas" ket="Satu baris satu fasilitas."><textarea rows={5} className={masukan} value={k.cottageFitur.join("\n")} onChange={(e) => set("cottageFitur", e.target.value.split("\n"))} /></Bidang>
        </div>
      </Kartu>
      <Daftar judul="Ritme harian" isi={k.jadwal} kosong={{ jam: "", judul: "", isi: "" }} ubah={(v) => set("jadwal", v)} render={(x, s) => (
        <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
          <Bidang label="Jam"><input className={masukan} value={x.jam} onChange={(e) => s({ ...x, jam: e.target.value })} /></Bidang>
          <Bidang label="Judul"><input className={masukan} value={x.judul} onChange={(e) => s({ ...x, judul: e.target.value })} /></Bidang>
          <Bidang label="Keterangan" className="sm:col-span-2"><input className={masukan} value={x.isi} onChange={(e) => s({ ...x, isi: e.target.value })} /></Bidang>
        </div>
      )} />
      <Daftar judul="Tanya jawab" isi={k.tanya} kosong={{ t: "", j: "" }} ubah={(v) => set("tanya", v)} render={(x, s) => (
        <>
          <Bidang label="Pertanyaan"><input className={masukan} value={x.t} onChange={(e) => s({ ...x, t: e.target.value })} /></Bidang>
          <Bidang label="Jawaban"><textarea rows={2} className={masukan} value={x.j} onChange={(e) => s({ ...x, j: e.target.value })} /></Bidang>
        </>
      )} />
      <Kartu judul="Pemesanan">
        <Bidang label="Teks di atas formulir"><textarea rows={2} className={masukan} value={k.pesanIsi} onChange={(e) => set("pesanIsi", e.target.value)} /></Bidang>
      </Kartu>
      <div className="flex justify-end"><Tombol disabled={sibuk} onClick={simpan}>{sibuk ? "Menyimpan…" : "Simpan semua"}</Tombol></div>
    </div>
  );
}
