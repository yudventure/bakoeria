"use client";

import { LABEL_UNTUK, tebakUntuk, UNTUK_SELAM } from "@/lib/selam";
import { KolomHargaTeks } from "../kolom-rupiah";
import { useEffect, useState } from "react";
import { bacaTitik, rapikanTempat, tautanResort, NAMA_TEMPAT_MAPS, idYoutube, sumberVideo, tautanPendekTiktok, IKON_KEUNGGULAN, KOORDINAT, SEKSI, tautanPeta, type Konten } from "@/lib/konten";
import { api } from "../api";
import { Bidang, Galat, Kartu, masukan, Memuat, Tab, Tombol, useToast } from "../ui";
import type { Bahasa } from "@/lib/kamus";
import FotoSitus from "../foto-situs";
import PilihFasilitas from "../fasilitas";

const BAGIAN = [
  { id: "umum", label: "Umum" },
  { id: "kontak", label: "Kontak" },
  { id: "pembuka", label: "Pembuka & tentang" },
  { id: "menginap", label: "Menginap" },
  { id: "selam", label: "Selam" },
  { id: "aktivitas", label: "Aktivitas" },
  { id: "lokasi", label: "Lokasi" },
  { id: "harian", label: "Harian & FAQ" },
  { id: "pesan", label: "Pemesanan" },
] as const;
type Bagian = (typeof BAGIAN)[number]["id"];

export default function Website() {
  const [bagian, setBagian] = useState<Bagian>("umum");
  /* Tab terakhir yang dibuka diingat di browser ini. */
  useEffect(() => {
    try {
      const v = localStorage.getItem("website-bagian");
      if (BAGIAN.some((x) => x.id === v)) setBagian(v as Bagian);
    } catch {
      /* penyimpanan browser tidak tersedia */
    }
  }, []);
  const pilihBagian = (b: Bagian) => {
    setBagian(b);
    try { localStorage.setItem("website-bagian", b); } catch { /* penyimpanan browser tidak tersedia */ }
    window.scrollTo({ top: 0 });
  };
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
    if (k!.kontak.peta.trim() && !bacaTitik(k!.kontak.peta)) {
      toast("Titik peta belum terbaca. Tempel koordinat dari Google Maps, misalnya -0.460074, 130.691116.", "galat");
      return;
    }
    if (k!.kontak.petaTempat.trim() && !rapikanTempat(k!.kontak.petaTempat)) {
      toast("Tautan halaman Google Maps belum benar. Pakai link dari tombol Bagikan di Google Maps.", "galat");
      return;
    }
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
      {/* Pengaturan dipecah per seksi supaya tidak perlu menggulir jauh. Isian di tab lain tetap tersimpan sampai menekan Simpan. */}
      <nav aria-label="Seksi pengaturan website" className="sticky top-[4.5rem] z-20 -mx-1 flex gap-1 overflow-x-auto rounded-2xl bg-panel-latar/95 p-1 backdrop-blur">
        {BAGIAN.map((x) => (
          <button key={x.id} type="button" aria-current={bagian === x.id ? "page" : undefined} onClick={() => pilihBagian(x.id)} className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-bold transition ${bagian === x.id ? "bg-white text-panel-tinta shadow-sm" : "text-panel-redup hover:text-panel-tinta"}`}>{x.label}</button>
        ))}
      </nav>
      {bagian === "umum" && (
        <>
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
        </>
      )}
      {bagian === "kontak" && (
        <>
        <Kartu judul="Kontak">
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="WhatsApp"><input className={masukan} value={k.kontak.whatsapp} onChange={(e) => set("kontak", { ...k.kontak, whatsapp: e.target.value })} /></Bidang>
            <Bidang label="Email"><input className={masukan} value={k.kontak.email} onChange={(e) => set("kontak", { ...k.kontak, email: e.target.value })} /></Bidang>
            <Bidang label="Instagram"><input className={masukan} value={k.kontak.instagram} onChange={(e) => set("kontak", { ...k.kontak, instagram: e.target.value })} /></Bidang>
            <Bidang label="Alamat atau lokasi"><input className={masukan} value={k.kontak.alamat} onChange={(e) => set("kontak", { ...k.kontak, alamat: e.target.value })} /></Bidang>
            <Bidang label="Facebook" ket="Alamat lengkap, diawali https://. Kosongkan bila tidak ada."><input className={masukan} value={k.kontak.facebook} onChange={(e) => set("kontak", { ...k.kontak, facebook: e.target.value })} /></Bidang>
            <Bidang label="TikTok"><input className={masukan} value={k.kontak.tiktok} placeholder="https://www.tiktok.com/@…" onChange={(e) => set("kontak", { ...k.kontak, tiktok: e.target.value })} /></Bidang>
            <Bidang label="YouTube"><input className={masukan} value={k.kontak.youtube} placeholder="https://www.youtube.com/@…" onChange={(e) => set("kontak", { ...k.kontak, youtube: e.target.value })} /></Bidang>
            <Bidang label="Paragraf di footer" className="sm:col-span-2"><textarea rows={3} className={masukan} value={k.footerTentang} onChange={(e) => set("footerTentang", e.target.value)} /></Bidang>
          </div>
        </Kartu>
        </>
      )}
      {bagian === "pembuka" && (
        <>
        <Kartu judul="Pembuka">
          <div className="grid gap-4">
            <Bidang label="Tagline"><input className={masukan} value={k.tagline} onChange={(e) => set("tagline", e.target.value)} /></Bidang>
            <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
              <Bidang label="Awalan kata berganti" ket="Tampil di bawah judul hero."><input className={masukan} value={k.heroAwalan} onChange={(e) => set("heroAwalan", e.target.value)} /></Bidang>
              <Bidang label="Kata yang bergantian" ket="Satu baris satu frasa, sebaiknya pendek (2–3 kata). Bergantian setiap beberapa detik."><textarea rows={4} className={masukan} value={k.heroKata.join("\n")} onChange={(e) => set("heroKata", e.target.value.split("\n"))} /></Bidang>
            </div>
            <Bidang label="Judul sambutan"><input className={masukan} value={k.introJudul} onChange={(e) => set("introJudul", e.target.value)} /></Bidang>
            <Bidang label="Isi sambutan"><textarea rows={4} className={masukan} value={k.introIsi} onChange={(e) => set("introIsi", e.target.value)} /></Bidang>
            <Bidang label="Judul kisah" ket="Kotak kisah di bawah foto bagian About."><input className={masukan} value={k.kisahJudul} onChange={(e) => set("kisahJudul", e.target.value)} /></Bidang>
            <Bidang label="Isi kisah" ket="Pisahkan paragraf dengan satu baris kosong. Kosongkan untuk menyembunyikan kotak kisah."><textarea rows={10} className={masukan} value={k.kisahIsi} onChange={(e) => set("kisahIsi", e.target.value)} /></Bidang>
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
          <FotoSitus judul="Foto pembuka, tentang, dan keunggulan" grup={["Pembuka", "Tentang kami", "Keunggulan"]} />
        </>
      )}
      {bagian === "menginap" && (
        <>
        <Kartu judul="Cottage">
          <div className="grid gap-4">
            <Bidang label="Judul"><input className={masukan} value={k.cottageJudul} onChange={(e) => set("cottageJudul", e.target.value)} /></Bidang>
            <Bidang label="Isi"><textarea rows={3} className={masukan} value={k.cottageIsi} onChange={(e) => set("cottageIsi", e.target.value)} /></Bidang>
            <Bidang label="Fasilitas" ket="Satu baris satu fasilitas."><textarea rows={5} className={masukan} value={k.cottageFitur.join("\n")} onChange={(e) => set("cottageFitur", e.target.value.split("\n"))} /></Bidang>
          </div>
        </Kartu>
        <Kartu judul="Video">
          <div className="grid gap-4">
            <Bidang label="Video di bagian Menginap (tautan YouTube)" ket={k.kontak.video && !idYoutube(k.kontak.video) ? "Tautan ini bukan tautan video YouTube yang dikenali." : "Tampil lebar di atas galeri: diputar otomatis, berulang, tanpa suara, tanpa tombol dan logo YouTube. Kosongkan untuk menyembunyikan."} className="sm:col-span-2"><input className={masukan} value={k.kontak.video} placeholder="https://www.youtube.com/watch?v=…" onChange={(e) => set("kontak", { ...k.kontak, video: e.target.value })} /></Bidang>
          </div>
        </Kartu>
          <FotoSitus judul="Foto menginap" grup={["Menginap"]} galeri="menginap" />
        </>
      )}
      {bagian === "selam" && (
        <>
        <Kartu judul="Program selam dan harganya" ket="Kolom Ditawarkan untuk menentukan paket mana yang muncul di formulir pesan: penyelam bersertifikat, tanpa sertifikat (try dive), kursus, atau bukan diving (snorkeling, trip pulau). Otomatis ditebak dari namanya dan berlaku untuk kedua bahasa. Tiap kelompok menjadi satu kartu di bagian Program selam; kartu yang ditunjuk kursor membuka dan menampilkan harganya serta apa saja yang termasuk.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="Judul bagian"><input className={masukan} value={k.paketJudul} onChange={(e) => set("paketJudul", e.target.value)} /></Bidang>
            <Bidang label="Catatan di samping judul"><input className={masukan} value={k.paketCatatan} onChange={(e) => set("paketCatatan", e.target.value)} /></Bidang>
          </div>
          <div className="mt-4 grid gap-4">
            {k.paket.map((grup, i) => {
              const ubah = (v: Partial<typeof grup>) => set("paket", k.paket.map((x, j) => (j === i ? { ...x, ...v } : x)));
              return (
                <div key={i} className="grid gap-3 rounded-2xl bg-panel-latar p-4 sm:grid-cols-2">
                  <Bidang label={`Kelompok ${i + 1}`}><input className={masukan} value={grup.judul} onChange={(e) => ubah({ judul: e.target.value })} /></Bidang>
                  <Bidang label="Catatan kelompok"><input className={masukan} value={grup.catatan} onChange={(e) => ubah({ catatan: e.target.value })} /></Bidang>
                  {/* Baris harga: satu baris satu paket, langsung diisi tanpa format khusus. */}
                  <div className="grid gap-2 sm:col-span-2">
                    <span className="text-[13px] font-bold text-panel-tinta">Daftar harga</span>
                    <div className="hidden grid-cols-[1.3fr_1.3fr_9rem_10rem_auto] gap-2 px-1 text-xs text-panel-redup sm:grid"><span>Nama paket</span><span>Keterangan (boleh kosong)</span><span>Harga</span><span title="Siapa yang ditawari paket ini di formulir pesan">Ditawarkan untuk</span><span className="w-[4.5rem]" /></div>
                    {grup.isi.map((x, r) => {
                      const ubahBaris = (v: Partial<typeof x>) => ubah({ isi: grup.isi.map((y, q) => (q === r ? { ...y, ...v } : y)) });
                      return (
                        <div key={r} data-baris-harga={r} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-white p-2 ring-1 ring-panel-garis sm:grid-cols-[1.3fr_1.3fr_9rem_10rem_auto] sm:bg-transparent sm:p-0 sm:ring-0">
                          <input aria-label="Nama paket" className={masukan} placeholder="Nama paket" value={x.nama} onChange={(e) => ubahBaris({ nama: e.target.value })} />
                          <input aria-label="Keterangan" className={`${masukan} col-start-1 sm:col-start-auto`} placeholder="Keterangan" value={x.ket} onChange={(e) => ubahBaris({ ket: e.target.value })} />
                          <KolomHargaTeks label="Harga" className="col-start-1 sm:col-start-auto" placeholder="900000" nilai={x.harga} ubah={(v) => ubahBaris({ harga: v })} />
                          <select aria-label="Ditawarkan untuk" className={`${masukan} col-start-1 sm:col-start-auto`} value={x.untuk ?? ""} onChange={(e) => ubahBaris({ untuk: e.target.value })}>
                            <option value="">Otomatis: {LABEL_UNTUK[tebakUntuk(grup.judul, x.nama, x.ket)].toLowerCase()}</option>
                            {UNTUK_SELAM.map((u) => <option key={u} value={u}>{LABEL_UNTUK[u]}</option>)}
                          </select>
                          <span className="col-start-2 row-span-4 row-start-1 flex flex-col items-center justify-center gap-1 sm:col-start-auto sm:row-span-1 sm:row-start-auto sm:flex-row">
                            <button type="button" aria-label={`Naikkan baris ${r + 1}`} disabled={r === 0} onClick={() => { const n = [...grup.isi]; [n[r - 1], n[r]] = [n[r], n[r - 1]]; ubah({ isi: n }); }} className="grid size-8 place-items-center rounded-full text-panel-redup hover:bg-panel-latar disabled:opacity-30">↑</button>
                            <button type="button" aria-label={`Hapus baris ${r + 1}`} onClick={() => ubah({ isi: grup.isi.filter((_, q) => q !== r) })} className="grid size-8 place-items-center rounded-full text-lg text-panel-redup hover:bg-panel-merah/10 hover:text-panel-merah">×</button>
                          </span>
                        </div>
                      );
                    })}
                    <button type="button" className="justify-self-start text-sm font-bold text-panel-utama underline" onClick={() => ubah({ isi: [...grup.isi, { nama: "", ket: "", harga: "", untuk: "" }] })}>+ Tambah baris harga</button>
                  </div>
                  <div className="sm:col-span-2"><PilihFasilitas jenis="selam" terpilih={grup.termasuk ?? []} ubah={(v) => ubah({ termasuk: v })} judul="Termasuk dalam harga" /></div>
                  <button type="button" className="justify-self-start text-sm font-bold text-panel-merah underline" onClick={() => set("paket", k.paket.filter((_, j) => j !== i))}>Hapus kelompok</button>
                </div>
              );
            })}
          </div>
          <button type="button" className="mt-4 text-sm font-bold text-panel-utama underline" onClick={() => set("paket", [...k.paket, { judul: "Kelompok baru", catatan: "", isi: [] }])}>+ Tambah kelompok harga</button>
        </Kartu>
          <FotoSitus judul="Foto kartu program selam" grup={["Program selam"]} />
        <Daftar judul="Program selam" isi={k.program} kosong={{ judul: "", isi: "", meta: "", harga: "" }} ubah={(v) => set("program", v)} render={(x, s) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <Bidang label="Nama"><input className={masukan} value={x.judul} onChange={(e) => s({ ...x, judul: e.target.value })} /></Bidang>
            <Bidang label="Harga" ket="Ketik angkanya saja; keterangan seperti per orang di kolom kanan. Kosongkan untuk tidak menampilkan."><KolomHargaTeks label="Harga" nilai={x.harga} akhiran="per orang" ubah={(v) => s({ ...x, harga: v })} /></Bidang>
            <Bidang label="Keterangan" className="sm:col-span-2"><textarea rows={2} className={masukan} value={x.isi} onChange={(e) => s({ ...x, isi: e.target.value })} /></Bidang>
            <Bidang label="Label kecil" className="sm:col-span-2"><input className={masukan} value={x.meta} onChange={(e) => s({ ...x, meta: e.target.value })} /></Bidang>
          </div>
        )} />
        <Bidang label="Catatan di bawah judul program"><input className={masukan} value={k.programCatatan} onChange={(e) => set("programCatatan", e.target.value)} /></Bidang>
        </>
      )}
      {bagian === "aktivitas" && (
        <>
        <Kartu judul="Aktivitas lain" ket="Tampil di bawah program selam. Tiga aktivitas pertama tampil sebagai kartu tegak; isi tautan video tegak dari TikTok atau YouTube Shorts agar kartunya memutar video polos yang berulang. Tautan video berlaku untuk kedua bahasa.">
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
                    <Bidang label="Video (YouTube Shorts atau TikTok)" ket={!k.kontak.aktivitasVideo[i] ? "Tempel tautan video tegak. Diputar polos: tanpa tombol, tanpa suara, berulang." : sumberVideo(k.kontak.aktivitasVideo[i]) ? `Terbaca: video ${sumberVideo(k.kontak.aktivitasVideo[i])!.jenis === "tiktok" ? "TikTok" : "YouTube"}.` : tautanPendekTiktok(k.kontak.aktivitasVideo[i]) ? "Tautan pendek TikTok: diubah ke tautan lengkap saat disimpan." : "Bukan tautan video YouTube atau TikTok yang dikenali."}>
                      <input className={masukan} value={k.kontak.aktivitasVideo[i] ?? ""} placeholder="https://www.tiktok.com/@akun/video/… atau youtube.com/shorts/…" onChange={(e) => set("kontak", { ...k.kontak, aktivitasVideo: [0, 1, 2].map((j) => (j === i ? e.target.value : k.kontak.aktivitasVideo[j] ?? "")) })} />
                    </Bidang>
                  ) : <div />}
                  <Bidang label="Keterangan" className="sm:col-span-2"><textarea rows={2} className={masukan} value={x.isi} onChange={(e) => ubah({ isi: e.target.value })} /></Bidang>
                  <div className="sm:col-span-2"><PilihFasilitas jenis="trip" terpilih={x.termasuk ?? []} ubah={(v) => ubah({ termasuk: v })} judul="Termasuk" /></div>
                </div>
              );
            })}
          </div>
        </Kartu>
          <FotoSitus judul="Foto aktivitas" grup={["Aktivitas lain"]} galeri="aktivitas" />
        </>
      )}
      {bagian === "lokasi" && (
        <>
          <Kartu judul="Perahu antar-jemput" ket="Kartu perahu di seksi Menginap, di bawah fasilitas (di bawah peta rute bila seksi Menginap dimatikan). Antar-jemput dibayar terpisah dari kamar. Harga ditulis bebas, misalnya Rp 4.000.000. Harga sekali jalan boleh dikosongkan; bila diisi, tamu bisa memilih sekali jalan di formulir pesan. Foto tiap perahu (karosel: luar, kabin, kursi) diatur di kotak foto perahu di bawah, urutannya sama dengan urutan perahu.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Bidang label="Judul"><input className={masukan} value={k.perahuJudul} onChange={(e) => set("perahuJudul", e.target.value)} /></Bidang>
              <Bidang label="Pengantar"><input className={masukan} value={k.perahuIsi} onChange={(e) => set("perahuIsi", e.target.value)} /></Bidang>
            </div>
            <div className="mt-4 grid gap-4">
              {k.perahu.map((x, i) => {
                const ubah = (v: Partial<typeof x>) => set("perahu", k.perahu.map((y, j) => (j === i ? { ...y, ...v } : y)));
                return (
                  <div key={i} data-perahu-admin={i} className="grid gap-3 rounded-2xl bg-panel-latar p-4 sm:grid-cols-2">
                    <Bidang label={`Perahu ${i + 1}`}><input className={masukan} value={x.judul} placeholder="Speedboat" onChange={(e) => ubah({ judul: e.target.value })} /></Bidang>
                    <Bidang label="Mesin"><input className={masukan} value={x.mesin} placeholder="2 mesin 150 PK" onChange={(e) => ubah({ mesin: e.target.value })} /></Bidang>
                    <Bidang label="Muatan"><input className={masukan} value={x.muat} placeholder="Maksimal 12 orang" onChange={(e) => ubah({ muat: e.target.value })} /></Bidang>
                    <Bidang label="Keterangan" className="sm:col-span-2"><input className={masukan} value={x.isi} onChange={(e) => ubah({ isi: e.target.value })} /></Bidang>
                    <div className="grid gap-2 sm:col-span-2">
                      <span className="text-[13px] font-bold text-panel-tinta">Harga per perahu</span>
                      {x.harga.length > 0 && <div className="hidden grid-cols-[1fr_9.5rem_9.5rem_2.25rem] gap-2 text-xs text-panel-redup sm:grid"><span>Rute</span><span>Pulang pergi</span><span>Sekali jalan (boleh kosong)</span></div>}
                      {x.harga.map((h, r) => (
                        <div key={r} data-baris-perahu={r} className="grid grid-cols-2 gap-2 rounded-xl bg-white p-2 ring-1 ring-panel-garis sm:grid-cols-[1fr_9.5rem_9.5rem_2.25rem] sm:bg-transparent sm:p-0 sm:ring-0">
                          <input aria-label="Rute" className={`${masukan} col-span-2 sm:col-span-1`} value={h.rute} placeholder="Waisai" onChange={(e) => ubah({ harga: x.harga.map((y, q) => (q === r ? { ...y, rute: e.target.value } : y)) })} />
                          <KolomHargaTeks label="Harga pulang pergi" nilai={h.harga} placeholder="4000000" ubah={(v) => ubah({ harga: x.harga.map((y, q) => (q === r ? { ...y, harga: v } : y)) })} />
                          <KolomHargaTeks label="Harga sekali jalan" nilai={h.sekali} placeholder="Boleh kosong" ubah={(v) => ubah({ harga: x.harga.map((y, q) => (q === r ? { ...y, sekali: v } : y)) })} />
                          <button type="button" aria-label={`Hapus harga ${r + 1}`} onClick={() => ubah({ harga: x.harga.filter((_, q) => q !== r) })} className="col-span-2 grid size-9 place-items-center justify-self-end self-center sm:col-span-1 rounded-full text-lg text-panel-redup hover:bg-panel-merah/10 hover:text-panel-merah">×</button>
                        </div>
                      ))}
                      <button type="button" className="justify-self-start text-sm font-bold text-panel-utama underline" onClick={() => ubah({ harga: [...x.harga, { rute: "", harga: "", sekali: "" }] })}>+ Tambah harga</button>
                    </div>
                    <button type="button" className="justify-self-start text-sm font-bold text-panel-merah underline" onClick={() => set("perahu", k.perahu.filter((_, j) => j !== i))}>Hapus perahu</button>
                  </div>
                );
              })}
            </div>
            {k.perahu.length < 3 && <button type="button" className="mt-4 text-sm font-bold text-panel-utama underline" onClick={() => set("perahu", [...k.perahu, { judul: "Perahu baru", mesin: "", muat: "", isi: "", harga: [] }])}>+ Tambah perahu</button>}
          </Kartu>
          {k.perahu.map((x, i) => i < 3 && <FotoSitus key={i} judul={`Foto ${x.judul || `perahu ${i + 1}`}`} grup={[]} galeri={(["perahu1", "perahu2", "perahu3"] as const)[i]} />)}
        <Kartu judul="Titik resort di peta">
          <div className="grid gap-4">
            <Bidang
              label="Titik peta (koordinat untuk penanda di peta rute)"
              ket={(() => {
                const t = bacaTitik(k.kontak.peta);
                if (!k.kontak.peta.trim()) return `Kosong, memakai titik bawaan ${KOORDINAT.lat}, ${KOORDINAT.lon}. Di Google Maps, klik kanan titik resort lalu klik angka koordinat paling atas untuk menyalinnya, dan tempel di sini.`;
                if (!t) return <span className="font-bold text-panel-merah">Koordinat tidak terbaca. Tempel angkanya, misalnya -0.460074, 130.691116. Tautan pendek maps.app.goo.gl tidak berisi koordinat, tempel di kolom tautan halaman di bawah.</span>;
                return <span>Terbaca <b className="text-panel-hijau">{t.lat}, {t.lon}</b> · <a href={tautanPeta(t)} target="_blank" rel="noopener noreferrer" className="font-bold underline">cek titiknya</a>. Hanya untuk penanda di peta rute dan data lokasi untuk Google, bukan tautan yang dibuka tamu.</span>;
              })()}
            >
              <input className={masukan} value={k.kontak.peta} placeholder={`${KOORDINAT.lat}, ${KOORDINAT.lon}`} inputMode="text" onChange={(e) => {
                const v = e.target.value;
                /* Tautan halaman tempat yang ditempel di sini ikut mengisi kolom tautan halaman. */
                const tempat = rapikanTempat(v);
                set("kontak", { ...k.kontak, peta: v, petaTempat: tempat && !k.kontak.petaTempat.trim() ? tempat : k.kontak.petaTempat });
              }} />
            </Bidang>
            <Bidang
              label="Tautan halaman Bakoeria di Google Maps"
              ket={(() => {
                const v = k.kontak.petaTempat.trim();
                if (!v) return <span>Kosong, tamu dibawa ke pencarian {NAMA_TEMPAT_MAPS} di Google Maps · <a href={tautanResort(k)} target="_blank" rel="noopener noreferrer" className="font-bold underline">coba</a>. Supaya pasti, buka halaman Bakoeria Dive Resort di Google Maps, klik Bagikan, Salin link, lalu tempel di sini.</span>;
                if (!rapikanTempat(v)) return <span className="font-bold text-panel-merah">Bukan tautan halaman tempat Google Maps. Pakai link dari tombol Bagikan (maps.app.goo.gl/...) atau alamat yang diawali google.com/maps/place/.</span>;
                return <span>Terbaca · <a href={rapikanTempat(v)} target="_blank" rel="noopener noreferrer" className="font-bold underline">buka untuk mengecek</a>. Dibuka oleh tombol Buka di Google Maps dan alamat di footer.</span>;
              })()}
            >
              <input className={masukan} value={k.kontak.petaTempat} placeholder="https://maps.app.goo.gl/..." inputMode="url" onChange={(e) => set("kontak", { ...k.kontak, petaTempat: e.target.value })} />
            </Bidang>
          </div>
        </Kartu>
        <Kartu judul="Cara menuju ke sini" ket="Tampil di atas tanya jawab, di samping peta rute. Langkah 1 berlaku untuk semua tamu; berikutnya adalah jalur alternatif A (speedboat privat) dan B (feri).">
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
        </>
      )}
      {bagian === "harian" && (
        <>
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
        </>
      )}
      {bagian === "pesan" && (
        <>
        <Kartu judul="Pemesanan">
          <Bidang label="Teks di atas formulir"><textarea rows={2} className={masukan} value={k.pesanIsi} onChange={(e) => set("pesanIsi", e.target.value)} /></Bidang>
        </Kartu>
          <FotoSitus judul="Foto pemesanan" grup={["Pemesanan"]} />
        </>
      )}
      <div className="flex justify-end"><Tombol disabled={sibuk} onClick={simpan}>{sibuk ? "Menyimpan…" : "Simpan semua"}</Tombol></div>
    </div>
  );
}
