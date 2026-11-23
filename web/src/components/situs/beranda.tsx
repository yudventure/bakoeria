import { PencatatKunjungan } from "./pencatat";
import Menginap from "./menginap";
import HargaSelam from "./harga-selam";
import Aktivitas from "./aktivitas";
import PetaRute from "./peta-rute";
import Galeri from "./galeri";
import { KAMAR_DEMO, pastikanDemo } from "@/lib/server/demo";
import { databaseReady } from "@/lib/db";
import { rupiah } from "@/lib/booking";
import { tautanPeta, idYoutube, nomorWa, sumberVideo, titikResort } from "@/lib/konten";
import { KAMUS, type Bahasa } from "@/lib/kamus";
import { ambilKamar, type Kamar } from "@/lib/server/buku";
import { bacaKonten, bacaPengaturan } from "@/lib/server/simpanan";
import { bacaGaleri, bacaPetaFoto } from "@/lib/server/foto";
import { bacaKatalog, pastikanFasilitasTamu } from "@/lib/server/fasilitas";
import { ikonFasilitas, type Fasilitas } from "@/lib/fasilitas";
import { atribut, gambar, gambarItem, type SlotFoto } from "@/lib/foto";
import { Ikon } from "@/components/situs/ikon";
import { Nav } from "@/components/situs/interaksi";
import { Gerak, JudulHero } from "@/components/situs/gerak";
import Pemesanan from "@/components/situs/pemesanan";
import Footer from "@/components/situs/footer";

const ALT = {
  en: { hero: "Bakoeria teak cottages with warm lights at night", foto: ["Teak cottage with glowing windows", "Cottage terrace at night", "Sandy path with hanging lights"], cottage: "Teak cottage" },
  id: { hero: "Cottage kayu jati Bakoeria dengan lampu hangat di malam hari", foto: ["Cottage kayu jati dengan jendela menyala", "Teras cottage di malam hari", "Jalan berpasir dengan lampu gantung"], cottage: "Cottage kayu jati" },
};


/** Kalimat dengan *kata* beraksen emas. */
function Aksen({ teks }: { teks: string }) {
  return (
    <>
      {teks.split(/(\*[^*]+\*)/g).map((b, i) =>
        b.startsWith("*") && b.endsWith("*") ? (
          <span key={i} className="text-emas-tua">{b.slice(1, -1)}</span>
        ) : (
          <span key={i}>{b}</span>
        ),
      )}
    </>
  );
}

/** Tanda kecil di samping judul: versi sederhana pola khas "Ukir Ombak" (brand/pattern). */
function Bintang({ className = "", terang = false }: { className?: string; terang?: boolean }) {
  return <img aria-hidden="true" alt="" src={`/brand/bakoeria-ukir-ikon-${terang ? "putih" : "toska"}.svg`} className={`inline-block h-[0.62em] min-h-[13px] w-auto ${className}`} />;
}

/** Tautan WhatsApp dibuka di tab baru; tautan ke bagian halaman tidak. */
const luar = (h: string) => (h.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {});

/* Bila database tidak bisa dibaca atau belum punya kamar, bagian Menginap tetap tampil
   dengan desain yang sama memakai data cottage Bakoeria yang sebenarnya. */
const JENIS_CADANGAN: { r: Kamar; unit: number }[] = [0, 2].map((i) => ({
  r: { ...KAMAR_DEMO[i], id: `cadangan-${i}`, isActive: true, inactiveReason: null, sortOrder: i, musim: [] },
  unit: 2,
}));

async function kamarPublik(): Promise<Kamar[]> {
  if (!databaseReady()) return [];
  try {
    await pastikanDemo();
    await pastikanFasilitasTamu();
    return await ambilKamar(false);
  } catch (e) {
    console.error("[beranda] kamar tidak terbaca", e instanceof Error ? e.message : e);
    return [];
  }
}

/** Beranda publik dalam satu bahasa. Dipakai app/(en)/page.tsx (/) dan app/(id)/id/page.tsx (/id). */
export default async function Beranda({ bahasa }: { bahasa: Bahasa }) {
  const t = KAMUS[bahasa];
  const alt = ALT[bahasa];
  const [k, set, kamar, petaFoto] = await Promise.all([bacaKonten(bahasa), bacaPengaturan(), kamarPublik(), bacaPetaFoto()]);
  /* Foto unggahan dari dashboard (WebP beberapa ukuran), atau foto bawaan bila slotnya belum diisi. */
  const g = (slot: SlotFoto) => gambar(petaFoto, slot);
  const galeri = await bacaGaleri(petaFoto);
  /* Fasilitas berikon dari katalog yang diatur pemilik, diterjemahkan sesuai bahasa halaman. */
  const katalog = await bacaKatalog();
  const terjemah = (daftar: Fasilitas[], kunci: string[] = []) => kunci.map((x) => daftar.find((d) => d.kunci === x)).filter((x): x is Fasilitas => Boolean(x)).map((x) => ({ d: ikonFasilitas(x.ikon), label: bahasa === "id" ? x.id : x.en }));
  const wa = nomorWa(k.kontak.whatsapp);
  /* Saklar seksi dari menu Website. Bila Pemesanan dimatikan, semua tombol pesan mengarah ke WhatsApp. */
  const on = k.seksi;
  const tautanPesan = on.pesan ? "#pesan" : wa ? `https://wa.me/${wa}?text=${encodeURIComponent(t.pesanWaUmum)}` : "";
  /* Cottage dengan jenis yang sama (misalnya dua Cottage Double) tampil sebagai satu kartu. */
  const jenis = [...kamar.reduce((peta, r) => {
    const kunci = r.roomType ?? r.name;
    const ada = peta.get(kunci);
    if (ada) ada.unit += 1;
    else peta.set(kunci, { r, unit: 1 });
    return peta;
  }, new Map<string, { r: Kamar; unit: number }>()).values()];

  if (k.tutup) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-[#F6F4EF] px-6 text-center text-malam">
        <img src="/brand/bakoeria-logo-stacked-warna.svg" alt="Bakoeria Dive Resort" className="w-[min(340px,78vw)]" />
        <p className="mt-10 font-display text-3xl">{t.sedangBerbenah}</p>
        {k.pengumuman && <p className="mt-3 max-w-md text-malam/65">{k.pengumuman}</p>}
        <p className="mt-8 text-sm text-malam/65">WhatsApp <span className="select-all font-bold text-malam">{k.kontak.whatsapp}</span> · {k.kontak.email}</p>
      </main>
    );
  }

  return (
    <div className="bg-[#F6F4EF] text-[16px] leading-relaxed text-malam">
      <a href="#isi" className="absolute -left-[999px] top-0 z-50 rounded-full bg-malam px-4 py-2 text-white focus:left-3 focus:top-3">{t.lewati}</a>
      <Nav bahasa={bahasa} seksi={on} pesan={tautanPesan} />
      <Gerak />
      <PencatatKunjungan />

      <main id="isi">
        {/* HERO */}
        <section id="atas" className="relative scroll-mt-24 px-2 sm:px-3">
          <div className="relative flex min-h-[560px] flex-col overflow-hidden rounded-[2rem] rounded-b-[2.5rem] sm:min-h-[600px] lg:h-[min(78svh,700px)]">
            <div className="hero-masuk absolute inset-0">
              <img data-hero-foto {...atribut(g("hero"), "100vw")} fetchPriority="high" alt={alt.hero} className="h-full w-full object-cover object-[58%_70%] will-change-transform" />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,36,64,.6)_0%,rgba(10,36,64,.2)_40%,rgba(10,36,64,.05)_62%,rgba(10,36,64,.5)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_22%_52%,rgba(10,36,64,.62)_0%,rgba(10,36,64,0)_58%)]" />
            <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-16 pt-12">
              <JudulHero awalan={k.heroAwalan} kata={k.heroKata} />
              <p className="muncul-lambat mt-6 max-w-[19rem] text-[15px] leading-snug text-white [text-shadow:0_1px_12px_rgba(10,36,64,.6)]" style={{ "--tunda-ms": "1250ms" } as React.CSSProperties}>{k.tagline}</p>
              {k.pengumuman && <p className="mt-5 max-w-md rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-md">{k.pengumuman}</p>}
            </div>
          </div>
          {tautanPesan && <div className="relative z-10 -mt-9 flex justify-center px-4">
            <a href={tautanPesan} {...luar(tautanPesan)} className="group flex items-center gap-10 rounded-full border border-white bg-[#F6F4EF]/95 py-2.5 pl-7 pr-2.5 shadow-[0_14px_40px_rgba(10,36,64,.16)] backdrop-blur">
              <span className="text-[14px] text-malam">{t.cekKetersediaan}</span>
              <span className="grid size-10 place-items-center rounded-full bg-emas-tua text-white transition group-hover:translate-x-0.5"><Ikon nama="panah" className="size-4" /></span>
            </a>
          </div>}
        </section>

        {/* TENTANG */}
        {on.tentang && <section id="tentang" className="scroll-mt-24 px-5 pb-20 pt-16 sm:pt-20">
          <div className="mx-auto max-w-6xl">
            <div className="muncul grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div className="-my-[0.1em] overflow-hidden py-[0.1em]"><h2 data-geser="0.9" className="font-display text-[clamp(56px,8vw,104px)] font-normal leading-[0.9] tracking-[-0.03em] text-malam/80 will-change-transform">{t.tentangKami}</h2></div>
              <div className="relative">
                <Bintang className="absolute -top-1 right-0 text-[34px]" />
                <p className="pr-8 text-[clamp(18px,2.1vw,25px)] font-normal uppercase leading-[1.35] tracking-[0.02em] text-malam">
                  <Aksen teks={k.pernyataan} />
                  <span className="ml-2 inline-block h-[0.9em] w-[3.2em] translate-y-[0.12em] overflow-hidden rounded-full align-baseline">
                    <img {...atribut(g("aksen"), "80px")} alt="" className="h-full w-full object-cover" />
                  </span>
                </p>
                <p className="mt-4 text-right font-display text-xl tracking-[0.3em] text-emas-tua/70" aria-hidden="true">///</p>
              </div>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_0.85fr] lg:items-center">
              {(["tentang1", "tentang2", "tentang3"] as const).map((f, i) => (
                <figure key={f} className="muncul-foto m-0 aspect-[4/3] overflow-hidden rounded-[1.4rem]" style={{ "--tunda": i } as React.CSSProperties}>
                  <img {...atribut(g(f), "(min-width: 1024px) 26vw, (min-width: 640px) 50vw, 100vw")} alt={alt.foto[i]} loading="lazy" className="h-full w-full object-cover" />
                </figure>
              ))}
              <div className="muncul text-[14px] leading-relaxed text-malam/65 sm:col-span-2 lg:col-span-1 lg:pl-4" style={{ "--tunda": 3 } as React.CSSProperties}>
                <p className="font-bold text-malam">{k.introJudul}</p>
                <p className="mt-2">{k.introIsi}</p>
              </div>
            </div>
          </div>
        </section>}

        {/* KEUNGGULAN */}
        {on.keunggulan && k.keunggulan.length > 0 && (
          <section className="relative overflow-hidden">
            <img data-parallax="0.6" {...atribut(g("keunggulan"), "100vw")} alt="" className="absolute inset-0 h-full w-full object-cover will-change-transform" loading="lazy" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,36,64,.82)_0%,rgba(10,36,64,.55)_45%,rgba(10,36,64,.35)_100%)]" />
            <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <h2 className="muncul font-display text-[clamp(40px,5.2vw,64px)] font-normal leading-[0.98] tracking-[-0.02em] text-white">
                {k.keunggulanJudul} <Bintang className="ml-1 text-xl" terang />
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {k.keunggulan.map((x, n) => (
                  <div key={x.judul} style={{ "--tunda": n } as React.CSSProperties} className="muncul flex gap-4 rounded-[1.4rem] border border-white/30 bg-white/12 p-5 text-white backdrop-blur-md">
                    <Ikon nama={x.ikon} className="size-8 shrink-0 text-white/90" />
                    <div>
                      <h3 className="text-[15px] font-bold leading-snug">{x.judul}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-white/75">{x.isi}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* MENGINAP: sorotan dan galeri; tanpa kamar di database memakai isi dari menu Website */}
        {on.menginap && (
          <Menginap katalog={katalog.kamar} galeri={galeri.menginap.map(gambarItem)} poster={g("video")} jenis={jenis.length ? jenis : JENIS_CADANGAN} isi={k.cottageIsi} bahasa={bahasa} pesan={tautanPesan} video={idYoutube(k.kontak.video)} tanda={<Bintang className="block text-[26px]" />} />
        )}

        {/* PROGRAM SELAM: kartu yang membuka dan menampilkan harganya saat ditunjuk kursor */}
        {on.menyelam && <section id="menyelam" className="scroll-mt-24 px-5 pb-20">
          <div className="mx-auto max-w-6xl">
            <div className="muncul grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-end">
              <div>
                <h2 className="font-display text-[clamp(30px,4vw,44px)] font-normal leading-[1.05]">{t.programSelam}</h2>
                <Bintang className="mt-3 block text-[26px]" />
              </div>
              <p className="max-w-xl text-[14.5px] leading-relaxed text-malam/65 lg:justify-self-end">{[k.programCatatan, k.paketCatatan].filter(Boolean).join(" ")}</p>
            </div>
            <div className="muncul mt-8">
              <HargaSelam termasuk={k.paket.map((x) => terjemah(katalog.selam, x.termasuk))} foto={(["selam1", "selam2", "selam3", "selam4", "selam5", "selam6"] as const).map(g)} paket={k.paket} tautan={tautanPesan} teks={{ mulai: t.mulai, lihat: t.lihatHarga, pesan: t.cekKetersediaan }} />
            </div>
          </div>
        </section>}

        {/* AKTIVITAS LAIN: tiga kartu video tegak dan galeri */}
        {on.aktivitas && k.aktivitas.length > 0 && (
          <section id="aktivitas" className="scroll-mt-24 px-5 pb-20">
            <div className="mx-auto max-w-6xl">
              <Aktivitas
                judul={k.aktivitasJudul}
                isi={k.aktivitasIsi}
                tanda={<Bintang className="block text-[26px]" />}
                kartu={k.aktivitas.slice(0, 3).map((x, i) => ({ ...x, termasuk: terjemah(katalog.trip, x.termasuk), video: sumberVideo(k.kontak.aktivitasVideo[i] ?? ""), foto: g((["aktivitas1", "aktivitas2", "aktivitas3"] as const)[i]), posisi: ["object-[60%_40%]", "object-center", "object-[30%_60%]"][i] }))}
              />
              <div className="mt-10">
                {/* Lima foto pertama galeri aktivitas mengisi mosaik; selebihnya tampil setelah "Show more". */}
                <Galeri
                  mosaik={5}
                  teks={{ buka: t.galeri.buka, tutup: t.galeri.tutup, sebelum: t.galeri.sebelum, sesudah: t.galeri.sesudah, lebih: t.galeri.lebih, kurang: t.galeri.kurang }}
                  foto={galeri.aktivitas.map(gambarItem).map((x, i) => {
                    const besar = i === 0;
                    const altBawaan = [t.galeri.alt[1], t.galeri.alt[4], t.galeri.alt[2], t.galeri.alt[0], t.galeri.alt[3]][i];
                    return { ...x, alt: !x.srcSet && altBawaan ? altBawaan : t.galeri.fotoKe(i + 1), kelas: i >= 5 ? "" : besar ? "col-span-6 aspect-[3/2] lg:col-span-6 lg:row-span-6 lg:aspect-auto" : "col-span-3 aspect-[3/2] lg:col-span-3 lg:row-span-3 lg:aspect-auto", bentuk: "rounded-[1.4rem]", posisi: besar && !x.srcSet ? "object-[50%_70%]" : undefined };
                  })}
                />
              </div>
            </div>
          </section>
        )}

        {/* SEHARI */}
        {on.sehari && <section id="sehari" className="scroll-mt-24 px-5 pb-20">
          <div className="muncul mx-auto max-w-6xl rounded-[1.6rem] bg-white/80 p-6 shadow-[0_10px_30px_rgba(10,36,64,.06)] ring-1 ring-malam/8 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-[34px] font-normal leading-tight">{t.sehari}</h2>
              <p className="text-[13px] text-malam/55">{t.zonaWaktu}</p>
            </div>
            <ol className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {k.jadwal.map((j, i) => (
                <li key={i} style={{ "--tunda": i } as React.CSSProperties} className="muncul flex gap-4 border-t border-malam/8 pt-4">
                  <time className="font-display text-[28px] leading-none text-emas-tua [font-variant-numeric:lining-nums]">{j.jam}</time>
                  <div>
                    <h3 className="text-[15px] font-bold">{j.judul}</h3>
                    <p className="mt-0.5 text-[13px] text-malam/60">{j.isi}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>}

        {/* TANYA JAWAB */}
        {/* CARA MENUJU KE SINI: peta rute dan tiga langkah */}
        {on.lokasi && k.cara.length > 0 && (
          <section id="lokasi" className="scroll-mt-24 px-5 pb-20">
            <div className="mx-auto max-w-6xl">
              <div className="muncul grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-end">
                <div>
                  <h2 className="font-display text-[clamp(30px,4vw,44px)] font-normal leading-[1.05]">{k.caraJudul}</h2>
                  <Bintang className="mt-3 block text-[26px]" />
                </div>
                {k.caraIsi && <p className="max-w-xl text-[14.5px] leading-relaxed text-malam/65 lg:justify-self-end">{k.caraIsi}</p>}
              </div>
              {/* Dua kolom sama tinggi: peta mengisi kolomnya, tombol menempel di dasar sejajar tepi bawah peta. */}
              <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-stretch">
                <div className="muncul min-h-[22rem]">
                  <PetaRute titik={titikResort(k)} id={`peta-${bahasa}`} teks={{ ...t.peta, feri: [t.peta.feri, k.caraWaktuFeri].filter(Boolean).join(" · "), perahu: [t.peta.perahu, k.caraWaktuPerahu].filter(Boolean).join(" · "), speedboat: [t.peta.speedboat, k.cara[1]?.waktu].filter(Boolean).join(" · ") }} />
                </div>
                <div className="flex flex-col">
                  {/* Langkah pertama sama untuk semua; sisanya jalur alternatif A dan B. */}
                  <ol className="grid gap-3">
                    {k.cara.map((x, i) => (
                      <li key={x.judul + i} style={{ "--tunda": i } as React.CSSProperties} className="muncul">
                        {i === 1 && <p className="mb-3 mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emas-tua">{t.peta.pilih}</p>}
                        <div className={`flex gap-4 rounded-[1.2rem] bg-white p-5 ring-1 ${i === 1 ? "ring-2 ring-karang/50" : "ring-malam/8"}`}>
                          <span className={`angka grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${i === 1 ? "bg-karang" : i === 0 ? "bg-emas-tua" : "bg-malam"}`}>{i === 0 ? "1" : String.fromCharCode(64 + i)}</span>
                          <div className="min-w-0">
                            <h3 className="font-display text-[22px] leading-tight">{x.judul}</h3>
                            {x.waktu && <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-busa px-2.5 py-0.5 text-[12.5px] font-bold text-emas-tua"><svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{x.waktu}</p>}
                            <p className="mt-1.5 text-[14px] leading-relaxed text-malam/65">{x.isi}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {k.caraCatatan && <p className="muncul mt-5 text-[13.5px] leading-relaxed text-malam/60">{k.caraCatatan}</p>}
                  <div className="muncul mt-5 grid gap-3 sm:grid-cols-2 lg:mt-auto lg:pt-5">
                    <a href={tautanPeta(titikResort(k))} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-emas-tua px-4 py-3 text-center text-sm font-bold text-white transition hover:brightness-110"><Ikon nama="pin" className="size-4 shrink-0" />{t.peta.buka}</a>
                    {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(t.peta.pesanWa)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-center text-sm font-bold text-malam ring-1 ring-malam/15 transition hover:bg-busa"><Ikon nama="wa" className="size-4 shrink-0" />{t.peta.tanya}</a>}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {on.tanya && <section id="tanya" className="relative scroll-mt-24 overflow-hidden px-5 pb-20">
          {/* Pola khas: satu ukiran besar yang samar di sudut. */}
          <img aria-hidden="true" alt="" src="/brand/bakoeria-ukiran-cermin-pasir.svg" loading="lazy" className="pointer-events-none absolute -bottom-10 -left-44 w-[760px] max-w-none opacity-[0.1]" />
          <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[13rem_1fr]">
            <div className="muncul">
              <h2 className="font-display text-[34px] font-normal leading-tight">{t.tanyaJawab}</h2>
              <Bintang className="mt-3 block text-[26px]" />
            </div>
            <div className="muncul grid gap-2">
              {k.tanya.map((t, i) => (
                <details key={i} className="group rounded-[1.2rem] bg-white/80 px-5 ring-1 ring-malam/8 open:bg-white">
                  <summary className="relative cursor-pointer py-4 pr-10 text-[15px] font-bold">
                    {t.t}
                    <span className="absolute right-0 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-[#F6F4EF] text-lg font-normal text-emas-tua transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="pb-5 text-[14px] leading-relaxed text-malam/65">{t.j}</p>
                </details>
              ))}
            </div>
          </div>
        </section>}

        {/* PESAN */}
        {on.pesan && <section id="pesan" className="relative scroll-mt-24 overflow-hidden px-5 pb-56 pt-20 sm:pb-64">
          <img {...atribut(g("pesan"), "100vw")} alt="" loading="lazy" className="absolute inset-x-0 bottom-0 h-[46%] w-full object-cover object-[50%_80%] [mask-image:linear-gradient(180deg,transparent,#000_40%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="muncul">
              <h2 className="font-display text-[clamp(40px,5vw,58px)] font-normal leading-[0.98] tracking-[-0.02em]">{t.rencanakan}</h2>
              <p className="mt-4 max-w-sm text-[14px] text-malam/65">{k.pesanIsi}</p>
              <dl className="mt-6 grid max-w-sm gap-2 text-[14px]">
                {[["wa", "WhatsApp", k.kontak.whatsapp], ["surat", "Email", k.kontak.email], ["ig", "Instagram", k.kontak.instagram]].filter(([, , dd]) => dd.trim()).map(([ikon, dt, dd]) => (
                  <div key={dt} className="flex items-center gap-3 rounded-full bg-white/85 px-4 py-2.5 ring-1 ring-malam/8 backdrop-blur">
                    <Ikon nama={ikon} className="size-5 text-emas-tua" />
                    <dt className="sr-only">{dt}</dt>
                    <dd className="select-all">{dd}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="muncul">
              <Pemesanan wa={wa} aktif={databaseReady() && set.terimaPesananWeb} bahasa={bahasa} />
            </div>
          </div>
        </section>}
      </main>

      <Footer k={k} namaResort={set.namaResort} bahasa={bahasa} />
    </div>
  );
}
