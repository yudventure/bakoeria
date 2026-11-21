import { databaseReady } from "@/lib/db";
import { rupiah } from "@/lib/booking";
import { nomorWa } from "@/lib/konten";
import { ambilKamar, type Kamar } from "@/lib/server/buku";
import { bacaKonten, bacaPengaturan } from "@/lib/server/simpanan";
import { Ikon, ikonProgram } from "@/components/situs/ikon";
import { Nav } from "@/components/situs/interaksi";
import Pemesanan from "@/components/situs/pemesanan";

export const dynamic = "force-dynamic";

const FOTO = ["/img/cottage-left.jpg", "/img/cottage-right.jpg", "/img/lights-path.jpg", "/img/palms.jpg"];

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

function Bintang({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block text-emas-tua ${className}`}>✻</span>;
}

async function kamarPublik(): Promise<Kamar[]> {
  if (!databaseReady()) return [];
  try {
    return await ambilKamar(false);
  } catch (e) {
    console.error("[beranda] kamar tidak terbaca", e instanceof Error ? e.message : e);
    return [];
  }
}

export default async function Beranda() {
  const [k, set, kamar] = await Promise.all([bacaKonten(), bacaPengaturan(), kamarPublik()]);
  const wa = nomorWa(k.kontak.whatsapp);

  if (k.tutup) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-[#F6F4EF] px-6 text-center text-malam">
        <img src="/brand/bakoeria-logo-stacked-navy.svg" alt="Bakoeria Dive Resort" className="w-[min(340px,78vw)]" />
        <p className="mt-10 font-display text-3xl">Kami sedang berbenah sebentar.</p>
        {k.pengumuman && <p className="mt-3 max-w-md text-malam/65">{k.pengumuman}</p>}
        <p className="mt-8 text-sm text-malam/65">WhatsApp <span className="select-all font-bold text-malam">{k.kontak.whatsapp}</span> · {k.kontak.email}</p>
      </main>
    );
  }

  return (
    <div className="bg-[#F6F4EF] text-[16px] leading-relaxed text-malam">
      <a href="#isi" className="absolute -left-[999px] top-0 z-50 rounded-full bg-malam px-4 py-2 text-white focus:left-3 focus:top-3">Lewati ke konten</a>
      <Nav />

      <main id="isi">
        {/* HERO */}
        <section id="atas" className="relative scroll-mt-24 px-2 sm:px-3">
          <div className="relative flex min-h-[560px] flex-col overflow-hidden rounded-[2rem] rounded-b-[2.5rem] sm:min-h-[600px] lg:h-[min(78svh,700px)]">
            <img src="/img/resort-night.jpg" alt="Cottage kayu jati Bakoeria dengan lampu hangat di malam hari" className="absolute inset-0 h-full w-full object-cover object-[58%_70%]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,28,62,.6)_0%,rgba(4,28,62,.2)_40%,rgba(4,28,62,.05)_62%,rgba(4,28,62,.5)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_22%_52%,rgba(4,28,62,.62)_0%,rgba(4,28,62,0)_58%)]" />
            <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-16 pt-12">
              <div className="flex items-start gap-4">
                <h1 className="font-display text-[clamp(64px,13.5vw,190px)] font-normal leading-[0.82] tracking-[-0.035em] text-white">
                  bakoeria
                </h1>
                <span className="mt-[2vw] hidden text-[13px] tracking-[0.18em] text-white [text-shadow:0_1px_10px_rgba(4,28,62,.7)] sm:block">dive resort</span>
              </div>
              <p className="mt-6 max-w-[17rem] text-[15px] leading-snug text-white [text-shadow:0_1px_12px_rgba(4,28,62,.6)]">{k.tagline}</p>
              {k.pengumuman && <p className="mt-5 max-w-md rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-md">{k.pengumuman}</p>}
            </div>
          </div>
          <div className="relative z-10 -mt-9 flex justify-center px-4">
            <a href="#pesan" className="group flex items-center gap-10 rounded-full border border-white bg-[#F6F4EF]/95 py-2.5 pl-7 pr-2.5 shadow-[0_14px_40px_rgba(4,28,62,.16)] backdrop-blur">
              <span className="text-[14px] text-malam">Cek ketersediaan</span>
              <span className="grid size-10 place-items-center rounded-full bg-emas-tua text-white transition group-hover:translate-x-0.5"><Ikon nama="panah" className="size-4" /></span>
            </a>
          </div>
        </section>

        {/* TENTANG */}
        <section id="tentang" className="scroll-mt-24 px-5 pb-20 pt-16 sm:pt-20">
          <div className="mx-auto max-w-6xl">
            <div className="muncul grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <h2 className="font-display text-[clamp(56px,8vw,104px)] font-normal leading-[0.9] tracking-[-0.03em] text-malam/80">tentang kami</h2>
              <div className="relative">
                <Bintang className="absolute -top-2 right-0 text-2xl" />
                <p className="pr-8 text-[clamp(18px,2.1vw,25px)] font-normal uppercase leading-[1.35] tracking-[0.02em] text-malam">
                  <Aksen teks={k.pernyataan} />
                  <span className="ml-2 inline-block h-[0.9em] w-[3.2em] translate-y-[0.12em] overflow-hidden rounded-full align-baseline">
                    <img src="/img/lights-path.jpg" alt="" className="h-full w-full object-cover" />
                  </span>
                </p>
                <p className="mt-4 text-right font-display text-xl tracking-[0.3em] text-emas-tua/70" aria-hidden="true">///</p>
              </div>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_0.85fr] lg:items-center">
              {FOTO.slice(0, 3).map((f, i) => (
                <figure key={f} className="muncul m-0 aspect-[4/3] overflow-hidden rounded-[1.4rem]">
                  <img src={f} alt={["Cottage kayu jati dengan jendela menyala", "Teras cottage di malam hari", "Jalan berpasir dengan lampu gantung"][i]} loading="lazy" className="h-full w-full object-cover transition duration-700 hover:scale-[1.04]" />
                </figure>
              ))}
              <div className="muncul text-[14px] leading-relaxed text-malam/65 sm:col-span-2 lg:col-span-1 lg:pl-4">
                <p className="font-bold text-malam">{k.introJudul}</p>
                <p className="mt-2">{k.introIsi}</p>
              </div>
            </div>
          </div>
        </section>

        {/* KEUNGGULAN */}
        {k.keunggulan.length > 0 && (
          <section className="relative overflow-hidden">
            <img src="/img/palms.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,28,62,.82)_0%,rgba(4,28,62,.55)_45%,rgba(4,28,62,.35)_100%)]" />
            <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <h2 className="muncul font-display text-[clamp(40px,5.2vw,64px)] font-normal leading-[0.98] tracking-[-0.02em] text-white">
                {k.keunggulanJudul} <Bintang className="text-xl" />
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {k.keunggulan.map((x) => (
                  <div key={x.judul} className="muncul flex gap-4 rounded-[1.4rem] border border-white/30 bg-white/12 p-5 text-white backdrop-blur-md">
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

        {/* MENGINAP */}
        <section id="menginap" className="scroll-mt-24 px-5 py-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[13rem_1fr]">
            <div className="muncul">
              <h2 className="font-display text-[34px] font-normal leading-tight">Pilihan menginap</h2>
              <Bintang className="mt-2" />
              <p className="mt-4 text-[14px] text-malam/60">{k.cottageIsi}</p>
            </div>
            {kamar.length > 0 ? (
              <div className={`grid gap-4 sm:grid-cols-2 ${kamar.length === 4 ? "xl:grid-cols-4" : kamar.length % 3 === 1 && kamar.length > 4 ? "xl:grid-cols-2" : "xl:grid-cols-3"}`}>
                {kamar.map((r, i) => (
                  <article key={r.id} className="muncul overflow-hidden rounded-[1.4rem] bg-white shadow-[0_10px_30px_rgba(4,28,62,.07)] ring-1 ring-malam/5">
                    <img src={FOTO[i % 3]} alt={r.name} loading="lazy" className="aspect-[16/10] w-full object-cover" />
                    <div className="p-5">
                      <h3 className="text-[16px] font-bold">{r.name}</h3>
                      <p className="mt-1 text-[13px] text-malam/55">{r.roomType ? `${r.roomType} · ` : ""}hingga {r.capAdult + r.capChild} tamu</p>
                      <div className="mt-5 flex items-center justify-between">
                        <p className="text-[15px]">
                          <span className="text-malam/55">mulai </span>
                          <b className="font-bold">{rupiah(Math.min(r.baseRate, ...r.musim.map((m) => m.rate)))}</b>
                          <span className="text-[12px] text-malam/55"> / malam</span>
                        </p>
                        <a href="#pesan" aria-label={`Pesan ${r.name}`} className="grid size-9 place-items-center rounded-full bg-emas-tua text-white transition hover:brightness-110"><Ikon nama="panah" className="size-4" /></a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <img src="/img/cottage-left.jpg" alt="Cottage kayu jati" className="muncul aspect-[16/10] w-full rounded-[1.4rem] object-cover" />
                <div className="muncul rounded-[1.4rem] bg-white p-6 shadow-[0_10px_30px_rgba(4,28,62,.07)] ring-1 ring-malam/5">
                  <h3 className="font-display text-2xl">{k.cottageJudul}</h3>
                  <ul className="mt-4 grid gap-2 text-[14px] text-malam/70">
                    {k.cottageFitur.filter(Boolean).map((f) => <li key={f} className="flex gap-2"><span className="text-emas-tua">—</span>{f}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
          {kamar.length > 0 && k.cottageFitur.filter(Boolean).length > 0 && (
            <ul className="mx-auto mt-8 flex max-w-6xl flex-wrap gap-2 lg:pl-[15rem]">
              {k.cottageFitur.filter(Boolean).map((f) => <li key={f} className="rounded-full bg-white px-4 py-2 text-[13px] text-malam/70 ring-1 ring-malam/8">{f}</li>)}
            </ul>
          )}
        </section>

        {/* PROGRAM SELAM */}
        <section id="menyelam" className="scroll-mt-24 px-5 pb-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[13rem_1fr] lg:items-center">
            <div className="muncul">
              <h2 className="font-display text-[34px] font-normal leading-tight">Program selam</h2>
              <Bintang className="mt-2" />
              {k.programCatatan && <p className="mt-4 text-[14px] text-malam/60">{k.programCatatan}</p>}
            </div>
            <div className="muncul grid overflow-hidden rounded-[1.6rem] bg-white/70 ring-1 ring-malam/8 sm:grid-cols-2 xl:grid-cols-4">
              {k.program.map((p, i) => (
                <div key={p.judul + i} className="flex flex-col items-center gap-2 border-malam/8 px-5 py-7 text-center [&:not(:last-child)]:border-b sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:[&:not(:last-child)]:border-r">
                  <Ikon nama={ikonProgram(p.judul, i)} className="size-9 text-malam/80" />
                  <h3 className="mt-1 text-[15px] font-bold">{p.judul}</h3>
                  <p className="text-[13px] leading-relaxed text-malam/60">{p.isi}</p>
                  {p.harga && <p className="mt-1 text-[14px] font-bold text-emas-tua">{p.harga}</p>}
                  {p.meta && <p className="mt-auto pt-2 text-[11px] uppercase tracking-[0.14em] text-malam/45">{p.meta}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEHARI */}
        <section id="sehari" className="scroll-mt-24 px-5 pb-20">
          <div className="muncul mx-auto max-w-6xl rounded-[1.6rem] bg-white/80 p-6 shadow-[0_10px_30px_rgba(4,28,62,.06)] ring-1 ring-malam/8 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-[34px] font-normal leading-tight">Sehari di Bakoeria</h2>
              <p className="text-[13px] text-malam/55">Waktu Indonesia Timur</p>
            </div>
            <ol className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {k.jadwal.map((j, i) => (
                <li key={i} className="flex gap-4 border-t border-malam/8 pt-4">
                  <time className="font-display text-[28px] leading-none text-emas-tua [font-variant-numeric:lining-nums]">{j.jam}</time>
                  <div>
                    <h3 className="text-[15px] font-bold">{j.judul}</h3>
                    <p className="mt-0.5 text-[13px] text-malam/60">{j.isi}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* TANYA JAWAB */}
        <section id="tanya" className="scroll-mt-24 px-5 pb-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[13rem_1fr]">
            <div className="muncul">
              <h2 className="font-display text-[34px] font-normal leading-tight">Tanya jawab</h2>
              <Bintang className="mt-2" />
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
        </section>

        {/* PESAN */}
        <section id="pesan" className="relative scroll-mt-24 overflow-hidden px-5 pb-56 pt-20 sm:pb-64">
          <img src="/img/resort-night.jpg" alt="" loading="lazy" className="absolute inset-x-0 bottom-0 h-[46%] w-full object-cover object-[50%_80%] [mask-image:linear-gradient(180deg,transparent,#000_40%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="muncul">
              <h2 className="font-display text-[clamp(40px,5vw,58px)] font-normal leading-[0.98] tracking-[-0.02em]">Rencanakan perjalanan Anda</h2>
              <p className="mt-4 max-w-sm text-[14px] text-malam/65">{k.pesanIsi}</p>
              <dl className="mt-6 grid max-w-sm gap-2 text-[14px]">
                {[["wa", "WhatsApp", k.kontak.whatsapp], ["surat", "Email", k.kontak.email], ["ig", "Instagram", k.kontak.instagram]].map(([ikon, dt, dd]) => (
                  <div key={dt} className="flex items-center gap-3 rounded-full bg-white/85 px-4 py-2.5 ring-1 ring-malam/8 backdrop-blur">
                    <Ikon nama={ikon} className="size-5 text-emas-tua" />
                    <dt className="sr-only">{dt}</dt>
                    <dd className="select-all">{dd}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="muncul">
              <Pemesanan wa={wa} aktif={databaseReady() && set.terimaPesananWeb} />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-malam px-5 py-5 text-[13px] text-white/75">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <span>{set.namaResort} © {new Date().getFullYear()}</span>
          <nav aria-label="Footer" className="flex flex-wrap gap-6">
            <a href="#menginap" className="hover:text-white">Menginap</a>
            <a href="#menyelam" className="hover:text-white">Menyelam</a>
            <a href="#pesan" className="hover:text-white">Pesan</a>
          </nav>
          <div className="flex items-center gap-4">
            {k.kontak.instagram && (
              <a href={`https://instagram.com/${k.kontak.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-white"><Ikon nama="ig" className="size-5" /></a>
            )}
            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="hover:text-white"><Ikon nama="wa" className="size-5" /></a>}
          </div>
        </div>
      </footer>
    </div>
  );
}
