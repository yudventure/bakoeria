"use client";

import { useEffect, useState } from "react";
import { idYoutube, IKON_KEUNGGULAN, SEKSI, type Konten } from "@/lib/konten";
import { api } from "../api";
import { Bidang, Galat, Kartu, masukan, Memuat, Tab, Tombol, useToast } from "../ui";
import type { Bahasa } from "@/lib/kamus";

export default function Website() {
  const toast = useToast();
  const [bahasa, setBahasa] = useState<Bahasa>("en");
  const [k, setK] = useState<Konten | null>(null);
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  useEffect(() => {
    setK(null);
    api<{ konten: Konten }>(`/api/konten?bahasa=${bahasa}`).then((r) => setK(r.konten)).catch((e) => setGalat(e.message));
  }, [bahasa]);
  const tab = (
    <div className="grid gap-2">
      <Tab<Bahasa> pilihan={[{ id: "en", label: "English (bawaan, alamat /)" }, { id: "id", label: "Indonesia (alamat /id)" }]} nilai={bahasa} ubah={setBahasa} />
      <p className="text-xs text-panel-redup">Teks diisi terpisah untuk tiap bahasa. Kontak, media sosial, dan status tutup berlaku untuk kedua bahasa. Simpan dulu sebelum pindah tab.</p>
    </div>
  );
  if (galat) return <Galat pesan={galat} />;
  if (!k) return <div className="grid gap-6">{tab}<Memuat /></div>;

  const set = <K extends keyof Konten>(kunci: K, v: Konten[K]) => setK({ ...k, [kunci]: v });
  async function simpan() {
    setSibuk(true);
    try {
      const r = await api<{ konten: Konten }>("/api/konten", { method: "PUT", body: { konten: k, bahasa } });
      setK(r.konten);
      toast(bahasa === "en" ? "Versi English tersimpan dan langsung tayang" : "Versi Indonesia tersimpan dan langsung tayang");
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
          <Tombol varian="garis" onClick={() => window.open(bahasa === "en" ? "/" : "/id", "_blank")}>Lihat situs</Tombol>
          <Tombol disabled={sibuk} onClick={simpan}>{sibuk ? "Menyimpan…" : "Simpan"}</Tombol>
        </div>
      </div>
      {tab}
      <Kartu judul="Status situs">
        <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" className="size-4" checked={k.tutup} onChange={(e) => set("tutup", e.target.checked)} /> Tutup sementara (situs menampilkan halaman perbaikan, dashboard tetap jalan)</label>
        <Bidang label="Pengumuman di atas halaman" ket="Kosongkan bila tidak ada." className="mt-4"><input className={masukan} value={k.pengumuman} onChange={(e) => set("pengumuman", e.target.value)} placeholder="Resort tutup 1–15 Februari untuk perawatan" /></Bidang>
      </Kartu>
      <Kartu judul="Seksi halaman" ket="Matikan seksi yang belum siap, misalnya program selam. Seksi yang mati hilang dari halaman, menu atas, dan footer. Berlaku untuk kedua bahasa; tekan Simpan agar tayang.">
        <ul className="grid gap-2 sm:grid-cols-2">
          {SEKSI.map((x) => {
            const nyala = k.seksi[x.id];
            return (
              <li key={x.id}>
                <label data-seksi={x.id} className={`flex cursor-pointer items-start justify-between gap-4 rounded-2xl p-4 ring-1 transition ${nyala ? "bg-panel-latar ring-transparent" : "bg-transparent ring-panel-garis opacity-70"}`}>
                  <span className="min-w-0">
                    <b className="block text-sm">{x.label}</b>
                    <span className="block text-xs text-panel-redup">{x.ket}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className={`text-xs font-bold ${nyala ? "text-panel-hijau" : "text-panel-redup"}`}>{nyala ? "Tampil" : "Mati"}</span>
                    <input type="checkbox" role="switch" className="peer sr-only" checked={nyala} onChange={(e) => set("seksi", { ...k.seksi, [x.id]: e.target.checked })} />
                    <span aria-hidden="true" className={`relative h-6 w-11 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 ${nyala ? "bg-panel-hijau" : "bg-panel-garis"}`}>
                      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${nyala ? "left-[22px]" : "left-0.5"}`} />
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </Kartu>
      <Kartu judul="Kontak">
        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang label="WhatsApp"><input className={masukan} value={k.kontak.whatsapp} onChange={(e) => set("kontak", { ...k.kontak, whatsapp: e.target.value })} /></Bidang>
          <Bidang label="Email"><input className={masukan} value={k.kontak.email} onChange={(e) => set("kontak", { ...k.kontak, email: e.target.value })} /></Bidang>
          <Bidang label="Instagram"><input className={masukan} value={k.kontak.instagram} onChange={(e) => set("kontak", { ...k.kontak, instagram: e.target.value })} /></Bidang>
          <Bidang label="Alamat atau lokasi"><input className={masukan} value={k.kontak.alamat} onChange={(e) => set("kontak", { ...k.kontak, alamat: e.target.value })} /></Bidang>
          <Bidang label="Tautan peta" ket="Contoh tautan Google Maps. Alamat di footer menjadi tautan ke sini."><input className={masukan} value={k.kontak.peta} placeholder="https://maps.app.goo.gl/…" onChange={(e) => set("kontak", { ...k.kontak, peta: e.target.value })} /></Bidang>
          <Bidang label="Facebook" ket="Alamat lengkap, diawali https://. Kosongkan bila tidak ada."><input className={masukan} value={k.kontak.facebook} onChange={(e) => set("kontak", { ...k.kontak, facebook: e.target.value })} /></Bidang>
          <Bidang label="TikTok"><input className={masukan} value={k.kontak.tiktok} placeholder="https://www.tiktok.com/@…" onChange={(e) => set("kontak", { ...k.kontak, tiktok: e.target.value })} /></Bidang>
          <Bidang label="YouTube"><input className={masukan} value={k.kontak.youtube} placeholder="https://www.youtube.com/@…" onChange={(e) => set("kontak", { ...k.kontak, youtube: e.target.value })} /></Bidang>
          <Bidang label="Video di bagian Menginap (tautan YouTube)" ket={k.kontak.video && !idYoutube(k.kontak.video) ? "Tautan ini bukan tautan video YouTube yang dikenali." : "Tampil lebar di atas galeri: diputar otomatis, berulang, tanpa suara, tanpa tombol dan logo YouTube. Kosongkan untuk menyembunyikan."} className="sm:col-span-2"><input className={masukan} value={k.kontak.video} placeholder="https://www.youtube.com/watch?v=…" onChange={(e) => set("kontak", { ...k.kontak, video: e.target.value })} /></Bidang>
          <Bidang label="Paragraf di footer" className="sm:col-span-2"><textarea rows={3} className={masukan} value={k.footerTentang} onChange={(e) => set("footerTentang", e.target.value)} /></Bidang>
        </div>
      </Kartu>
      <Kartu judul="Pembuka">
        <div className="grid gap-4">
          <Bidang label="Tagline"><input className={masukan} value={k.tagline} onChange={(e) => set("tagline", e.target.value)} /></Bidang>
          <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
            <Bidang label="Awalan kata berganti" ket="Tampil di bawah judul hero."><input className={masukan} value={k.heroAwalan} onChange={(e) => set("heroAwalan", e.target.value)} /></Bidang>
            <Bidang label="Kata yang bergantian" ket="Satu baris satu frasa, sebaiknya pendek (2–3 kata). Bergantian setiap beberapa detik."><textarea rows={4} className={masukan} value={k.heroKata.join("\n")} onChange={(e) => set("heroKata", e.target.value.split("\n"))} /></Bidang>
          </div>
          <Bidang label="Judul sambutan"><input className={masukan} value={k.introJudul} onChange={(e) => set("introJudul", e.target.value)} /></Bidang>
          <Bidang label="Isi sambutan"><textarea rows={4} className={masukan} value={k.introIsi} onChange={(e) => set("introIsi", e.target.value)} /></Bidang>
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
      <Kartu judul="Cara menuju ke sini" ket="Tampil di atas tanya jawab, di samping peta rute. Langkah 1 berlaku untuk semua tamu; berikutnya adalah jalur alternatif A (speedboat privat) dan B (feri). Titik resort di peta: -0.460074, 130.691116.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang label="Judul bagian"><input className={masukan} value={k.caraJudul} onChange={(e) => set("caraJudul", e.target.value)} /></Bidang>
          <Bidang label="Pengantar"><input className={masukan} value={k.caraIsi} onChange={(e) => set("caraIsi", e.target.value)} /></Bidang>
          {k.cara.map((x, i) => (
            <div key={i} className="grid gap-3 rounded-2xl bg-panel-latar p-4 sm:col-span-2 sm:grid-cols-[14rem_9rem_1fr]">
              <Bidang label={i === 0 ? "Langkah 1" : `Jalur ${String.fromCharCode(64 + i)}`}><input className={masukan} value={x.judul} onChange={(e) => set("cara", k.cara.map((y, j) => (j === i ? { ...y, judul: e.target.value } : y)))} /></Bidang>
              <Bidang label="Waktu tempuh"><input className={masukan} value={x.waktu} placeholder="± 2 jam" onChange={(e) => set("cara", k.cara.map((y, j) => (j === i ? { ...y, waktu: e.target.value } : y)))} /></Bidang>
              <Bidang label="Keterangan"><input className={masukan} value={x.isi} onChange={(e) => set("cara", k.cara.map((y, j) => (j === i ? { ...y, isi: e.target.value } : y)))} /></Bidang>
            </div>
          ))}
          <Bidang label="Waktu feri Sorong ke Waisai (di peta)"><input className={masukan} value={k.caraWaktuFeri} onChange={(e) => set("caraWaktuFeri", e.target.value)} /></Bidang>
          <Bidang label="Waktu perahu Waisai ke resort (di peta)"><input className={masukan} value={k.caraWaktuPerahu} onChange={(e) => set("caraWaktuPerahu", e.target.value)} /></Bidang>
          <Bidang label="Catatan di bawah langkah" className="sm:col-span-2"><input className={masukan} value={k.caraCatatan} onChange={(e) => set("caraCatatan", e.target.value)} /></Bidang>
        </div>
      </Kartu>
      <Kartu judul="Aktivitas lain" ket="Tampil di bawah program selam. Tiga aktivitas pertama tampil sebagai kartu tegak; isi tautan video YouTube (sebaiknya video tegak atau Shorts) agar kartunya memutar video polos yang berulang. Tautan video berlaku untuk kedua bahasa.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang label="Judul bagian"><input className={masukan} value={k.aktivitasJudul} onChange={(e) => set("aktivitasJudul", e.target.value)} /></Bidang>
          <Bidang label="Pengantar"><input className={masukan} value={k.aktivitasIsi} onChange={(e) => set("aktivitasIsi", e.target.value)} /></Bidang>
        </div>
        <div className="mt-4 grid gap-4">
          {k.aktivitas.map((x, i) => {
            const ubah = (v: Partial<typeof x>) => set("aktivitas", k.aktivitas.map((y, j) => (j === i ? { ...y, ...v } : y)));
            return (
              <div key={i} className="grid gap-3 rounded-2xl bg-panel-latar p-4 sm:grid-cols-2">
                <Bidang label={`Aktivitas ${i + 1}`}><input className={masukan} value={x.judul} onChange={(e) => ubah({ judul: e.target.value })} /></Bidang>
                {i < 3 ? (
                  <Bidang label="Video (tautan YouTube)" ket={k.kontak.aktivitasVideo[i] && !idYoutube(k.kontak.aktivitasVideo[i]) ? "Bukan tautan video YouTube yang dikenali." : undefined}>
                    <input className={masukan} value={k.kontak.aktivitasVideo[i] ?? ""} placeholder="https://www.youtube.com/shorts/…" onChange={(e) => set("kontak", { ...k.kontak, aktivitasVideo: [0, 1, 2].map((j) => (j === i ? e.target.value : k.kontak.aktivitasVideo[j] ?? "")) })} />
                  </Bidang>
                ) : <div />}
                <Bidang label="Keterangan" className="sm:col-span-2"><textarea rows={2} className={masukan} value={x.isi} onChange={(e) => ubah({ isi: e.target.value })} /></Bidang>
              </div>
            );
          })}
        </div>
      </Kartu>
      <Kartu judul="Program selam dan harganya" ket="Tiap kelompok menjadi satu kartu di bagian Program selam; kartu yang ditunjuk kursor membuka dan menampilkan harganya. Baris harga ditulis satu per baris dengan bentuk: nama | keterangan | harga. Keterangan boleh kosong.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang label="Judul bagian"><input className={masukan} value={k.paketJudul} onChange={(e) => set("paketJudul", e.target.value)} /></Bidang>
          <Bidang label="Catatan di samping judul"><input className={masukan} value={k.paketCatatan} onChange={(e) => set("paketCatatan", e.target.value)} /></Bidang>
        </div>
        <div className="mt-4 grid gap-4">
          {k.paket.map((grup, i) => {
            const ubah = (v: Partial<typeof grup>) => set("paket", k.paket.map((x, j) => (j === i ? { ...x, ...v } : x)));
            return (
              <div key={`${i}-${k.paket.length}`} className="grid gap-3 rounded-2xl bg-panel-latar p-4 sm:grid-cols-2">
                <Bidang label={`Kelompok ${i + 1}`}><input className={masukan} value={grup.judul} onChange={(e) => ubah({ judul: e.target.value })} /></Bidang>
                <Bidang label="Catatan kelompok"><input className={masukan} value={grup.catatan} onChange={(e) => ubah({ catatan: e.target.value })} /></Bidang>
                <Bidang label="Baris harga" ket="nama | keterangan | harga" className="sm:col-span-2">
                  <textarea
                    className={masukan + " font-mono text-[13px]"}
                    rows={Math.max(3, grup.isi.length + 1)}
                    defaultValue={grup.isi.map((x) => [x.nama, x.ket, x.harga].join(" | ")).join("\n")}
                    onBlur={(e) => ubah({ isi: e.target.value.split("\n").map((b) => b.split("|").map((x) => x.trim())).filter((b) => b[0]).map((b) => ({ nama: b[0], ket: b.length > 2 ? b[1] : "", harga: b.length > 2 ? b.slice(2).join(" | ") : b[1] ?? "" })) })}
                  />
                </Bidang>
                <button type="button" className="justify-self-start text-sm font-bold text-panel-merah underline" onClick={() => set("paket", k.paket.filter((_, j) => j !== i))}>Hapus kelompok</button>
              </div>
            );
          })}
        </div>
        <button type="button" className="mt-4 text-sm font-bold text-panel-utama underline" onClick={() => set("paket", [...k.paket, { judul: "Kelompok baru", catatan: "", isi: [] }])}>+ Tambah kelompok harga</button>
      </Kartu>
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
