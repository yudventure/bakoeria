import { databaseReady } from "@/lib/db";
import { nomorWa } from "@/lib/konten";
import { bacaKonten, bacaPengaturan } from "@/lib/server/simpanan";
import { Nav } from "@/components/situs/interaksi";
import Pemesanan from "@/components/situs/pemesanan";

export const dynamic = "force-dynamic";

const Eyebrow = ({ children }: { children: React.ReactNode }) => <span className="mb-4 block text-xs font-bold uppercase tracking-[0.28em] text-emas">{children}</span>;
const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="teks-emas font-display text-[clamp(30px,4.6vw,50px)] font-medium uppercase leading-[1.15] tracking-[0.07em] text-balance">{children}</h2>;
const Lead = ({ children }: { children: React.ReactNode }) => <p className="mt-5 max-w-[62ch] text-[clamp(18px,2vw,21px)] font-light text-pasir">{children}</p>;
const Wrap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`mx-auto max-w-6xl px-5 ${className}`}>{children}</div>;

export default async function Beranda() {
  const [k, set] = await Promise.all([bacaKonten(), bacaPengaturan()]);
  const wa = nomorWa(k.kontak.whatsapp);

  if (k.tutup) {
    return (
      <main className="bintang flex min-h-svh flex-col items-center justify-center bg-malam px-6 text-center text-gading">
        <img src="/brand/bakoeria-logo-stacked-gold.svg" alt="Bakoeria Dive Resort" className="w-[min(380px,80vw)]" />
        <p className="mt-10 font-display text-2xl italic text-pasir">Kami sedang berbenah sebentar.</p>
        {k.pengumuman && <p className="mt-3 max-w-md font-light text-pasir">{k.pengumuman}</p>}
        <p className="mt-8 text-sm font-light text-pasir">WhatsApp <span className="select-all font-bold text-gading">{k.kontak.whatsapp}</span> · {k.kontak.email}</p>
      </main>
    );
  }

  return (
    <div className="bg-malam text-[17px] font-light leading-[1.7] text-gading">
      <a href="#isi" className="absolute -left-[999px] top-0 z-50 bg-emas px-4 py-2 text-malam-dalam focus:left-3 focus:top-3">Lewati ke konten</a>
      <Nav />
      <main id="isi">
        <section id="atas" className="relative flex flex-col items-center overflow-hidden bg-[linear-gradient(180deg,#020F26_0%,#041C3E_46%,#06295a_100%)] pt-[clamp(120px,15vw,170px)]">
          <div className="bintang absolute inset-x-0 top-0 h-[60%]" />
          {k.pengumuman && <p className="relative z-10 mb-8 border border-emas/40 px-5 py-2 text-center text-sm text-emas-muda">{k.pengumuman}</p>}
          <div className="relative z-10 flex flex-col items-center px-5 text-center">
            <h1 className="sr-only">Bakoeria Dive Resort</h1>
            <img src="/brand/bakoeria-logo-stacked-gold.svg" alt="" className="w-[min(460px,78vw)]" />
            <p className="mt-8 font-display text-[clamp(20px,2.6vw,27px)] italic text-pasir">{k.tagline}</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3.5">
              <a href="#pesan" className="emas-gradasi px-8 py-4 text-xs font-bold uppercase tracking-[0.24em] text-malam-dalam">Cek ketersediaan</a>
              <a href="#menyelam" className="border border-emas px-8 py-4 text-xs font-bold uppercase tracking-[0.24em] text-emas-muda hover:bg-emas/10">Lihat program selam</a>
            </div>
          </div>
          <img src="/img/resort-night.jpg" alt="Dua cottage kayu jati dengan lampu hangat dan pasir pantai di malam hari" width={1536} height={562} className="relative z-[1] mt-[-8px] w-[170%] max-w-none [mask-image:linear-gradient(180deg,transparent_0,#000_26%)] sm:w-full sm:max-w-[1536px]" />
        </section>

        <section className="py-[clamp(72px,10vw,128px)]">
          <Wrap className="muncul max-w-3xl text-center">
            <Eyebrow>Selamat datang</Eyebrow>
            <H2>{k.introJudul}</H2>
            <p className="mx-auto mt-5 max-w-[62ch] text-[clamp(18px,2vw,21px)] font-light text-pasir">{k.introIsi}</p>
            <div className="mt-11 flex items-center justify-center gap-5" aria-hidden="true">
              <i className="h-px w-16 bg-emas" /><img src="/brand/bakoeria-mark-gold.svg" alt="" className="w-12" /><i className="h-px w-16 bg-emas" />
            </div>
          </Wrap>
        </section>

        <section id="menyelam" className="scroll-mt-20 bg-malam-dalam py-[clamp(72px,10vw,128px)]">
          <Wrap>
            <div className="muncul mb-14 max-w-2xl"><Eyebrow>Menyelam</Eyebrow><H2>Program selam</H2>{k.programCatatan && <p className="mt-4 text-pasir">{k.programCatatan}</p>}</div>
            <div className="grid border border-emas/25 sm:grid-cols-2 lg:grid-cols-4">
              {k.program.map((p, i) => (
                <article key={i} className="muncul flex flex-col gap-3.5 border-b border-emas/25 p-8 transition hover:bg-malam-lembut/50 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
                  <h3 className="font-display text-[23px] tracking-[0.04em] text-emas-muda">{p.judul}</h3>
                  <p className="flex-1 text-base text-pasir">{p.isi}</p>
                  {p.harga && <p className="font-display text-lg text-gading">{p.harga}</p>}
                  <span className="border-t border-emas/25 pt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-emas">{p.meta}</span>
                </article>
              ))}
            </div>
          </Wrap>
        </section>

        <section id="cottage" className="scroll-mt-20 py-[clamp(72px,10vw,128px)]">
          <Wrap className="grid items-center gap-[clamp(36px,6vw,88px)] md:grid-cols-2">
            <div className="muncul">
              <Eyebrow>Menginap</Eyebrow>
              <H2>{k.cottageJudul}</H2>
              <Lead>{k.cottageIsi}</Lead>
              <ul className="my-9 grid gap-3">
                {k.cottageFitur.filter(Boolean).map((f, i) => <li key={i} className="relative pl-8 text-pasir before:absolute before:left-0 before:top-[0.85em] before:h-px before:w-4 before:bg-emas">{f}</li>)}
              </ul>
              <a href="#pesan" className="emas-gradasi inline-block px-8 py-4 text-xs font-bold uppercase tracking-[0.24em] text-malam-dalam">Pilih tanggal</a>
            </div>
            <div className="muncul grid grid-cols-6">
              <img src="/img/cottage-left.jpg" alt="Cottage kayu jati dengan jendela menyala" loading="lazy" className="col-span-5 col-start-1 row-start-1 w-full border border-emas/25 object-cover" />
              <img src="/img/cottage-right.jpg" alt="Cottage kayu dengan teras berpagar" loading="lazy" className="col-span-4 col-start-3 row-start-2 -mt-[18%] w-full border border-emas/25 object-cover shadow-[0_24px_60px_rgba(0,0,0,.55)]" />
            </div>
          </Wrap>
        </section>

        <section id="sehari" className="scroll-mt-20 bg-malam-dalam py-[clamp(72px,10vw,128px)]">
          <Wrap>
            <div className="muncul mb-14"><Eyebrow>Ritme harian</Eyebrow><H2>Sehari di Bakoeria</H2></div>
            <ol className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {k.jadwal.map((j, i) => (
                <li key={i} className="muncul grid grid-cols-[86px_1fr] gap-4 border-t border-emas/25 py-6">
                  <time className="font-display text-3xl leading-tight text-emas [font-variant-numeric:lining-nums]">{j.jam}</time>
                  <div><h3 className="font-display text-xl text-emas-muda">{j.judul}</h3><p className="mt-1 text-[15.5px] text-pasir">{j.isi}</p></div>
                </li>
              ))}
            </ol>
          </Wrap>
        </section>

        <section id="galeri" className="scroll-mt-20 py-[clamp(72px,10vw,128px)]">
          <Wrap>
            <div className="muncul mb-14"><Eyebrow>Galeri</Eyebrow><H2>{k.galeriJudul}</H2></div>
            <div className="grid grid-cols-2 gap-3.5 md:grid-cols-[1fr_1.5fr_1.2fr]">
              {[["palms.jpg", "Pohon kelapa di bawah langit malam"], ["lights-path.jpg", "Jalan berpasir di antara cottage dengan lampu gantung"], ["cottage-right.jpg", "Cottage dari samping"]].map(([f, a], i) => (
                <figure key={f} className={`muncul m-0 overflow-hidden border border-emas/25 ${i === 1 ? "col-span-2 row-start-1 aspect-[16/10] md:col-span-1 md:row-start-auto md:aspect-auto" : "aspect-[4/5]"}`}>
                  <img src={`/img/${f}`} alt={a} loading="lazy" className="h-full w-full object-cover transition duration-700 hover:scale-[1.04]" />
                </figure>
              ))}
            </div>
          </Wrap>
        </section>

        <section id="tanya" className="scroll-mt-20 bg-malam-dalam py-[clamp(72px,10vw,128px)]">
          <Wrap className="max-w-3xl">
            <div className="muncul mb-12"><Eyebrow>Tanya jawab</Eyebrow><H2>Sebelum Anda datang</H2></div>
            <div className="divide-y divide-emas/25 border-y border-emas/25">
              {k.tanya.map((t, i) => (
                <details key={i} className="group">
                  <summary className="relative cursor-pointer py-6 pr-12 font-display text-[22px] tracking-[0.02em] text-emas-muda">
                    {t.t}
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 font-sans text-3xl font-light text-emas transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-[64ch] pb-7 pr-12 text-pasir">{t.j}</p>
                </details>
              ))}
            </div>
          </Wrap>
        </section>

        <section id="pesan" className="scroll-mt-20 bg-[linear-gradient(180deg,#041C3E,#0B2A5B)] py-[clamp(72px,10vw,128px)]">
          <Wrap>
            <div className="muncul mb-12 grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end">
              <div><Eyebrow>Pesan</Eyebrow><H2>Rencanakan perjalanan Anda</H2><Lead>{k.pesanIsi}</Lead></div>
              <dl className="grid">
                {[["WhatsApp", k.kontak.whatsapp], ["Email", k.kontak.email], ["Instagram", k.kontak.instagram], ...(k.kontak.alamat ? [["Lokasi", k.kontak.alamat]] : [])].map(([dt, dd]) => (
                  <div key={dt} className="flex justify-between gap-4 border-t border-emas/25 py-3.5">
                    <dt className="self-center text-[11.5px] font-bold uppercase tracking-[0.22em] text-emas">{dt}</dt>
                    <dd className="select-all text-right font-display text-xl text-gading">{dd}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <Pemesanan wa={wa} aktif={databaseReady() && set.terimaPesananWeb} />
          </Wrap>
        </section>
      </main>

      <footer className="border-t border-emas/25 bg-malam-dalam py-16 text-center">
        <Wrap className="flex flex-col items-center gap-6">
          <img src="/brand/bakoeria-logo-stacked-gold.svg" alt="Bakoeria Dive Resort" className="w-56" loading="lazy" />
          <p className="font-display text-xl italic text-pasir">{k.tagline}</p>
          <nav aria-label="Footer" className="flex w-full max-w-3xl flex-wrap justify-center gap-x-8 gap-y-3 border-y border-emas/25 py-6">
            {[["#menyelam", "Menyelam"], ["#cottage", "Cottage"], ["#sehari", "Sehari di Bakoeria"], ["#pesan", "Pesan"]].map(([h, l]) => (
              <a key={h} href={h} className="text-[11.5px] font-bold uppercase tracking-[0.22em] hover:text-emas-muda">{l}</a>
            ))}
          </nav>
          <small className="text-xs tracking-[0.06em] text-pasir/60">© {new Date().getFullYear()} {set.namaResort}</small>
        </Wrap>
      </footer>
    </div>
  );
}
