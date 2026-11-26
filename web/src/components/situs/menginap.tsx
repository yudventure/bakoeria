import { rupiah } from "@/lib/booking";
import { KAMUS, type Bahasa } from "@/lib/kamus";
import type { Kamar } from "@/lib/server/buku";
import Galeri, { type FotoGaleri } from "./galeri";
import VideoLatar from "./video";
import type { Gambar } from "@/lib/foto";
import { cariLabel, ikonFasilitas, type Fasilitas } from "@/lib/fasilitas";

/**
 * Bagian "Menginap": sorotan dan galeri, bukan daftar kartu kamar.
 * Semua cottage isinya sama dan hanya beda di kasurnya, jadi fasilitas
 * ditampilkan satu kali sebagai sorotan berikon, pilihan kasur ditampilkan
 * ringkas, dan harganya di satu ubin. Fotonya disusun mosaik dengan ukuran
 * yang berbeda-beda.
 */
const IKON: [RegExp, string][] = [
  [/\bac\b|air con/i, "M3 8h18M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4H3zM7 16v2M12 16v3M17 16v2"],
  [/shower/i, "M8 4h6a4 4 0 0 1 4 4v1M12 9h12M14 13v1M18 13v1M22 13v1M15 17v1M19 17v1M4 4v16"],
  [/toilet/i, "M7 3h5v7H7zM5 10h14a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6zM9 16l-1 5h8l-1-5"],
  [/lemari|wardrobe/i, "M5 3h14v17H5zM12 3v17M10 11v2M14 11v2M7 20v1.5M17 20v1.5"],
  [/sofa/i, "M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M3 12a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v6H3zM6 18v2M18 18v2"],
  [/makan|meal/i, "M5 3v8a2 2 0 0 0 4 0V3M7 3v18M17 3c-2 2-3 4-3 7 0 2 1 3 3 3zM17 13v8"],
  [/cottage|rumah|house/i, "M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6"],
  [/kasur|bed/i, "M3 18V7M3 13h18v5M21 18v-7a3 3 0 0 0-3-3h-7v5M7 10.5a1.5 1.5 0 1 0 0-.01"],
];
const jalurIkon = (teks: string) => IKON.find(([r]) => r.test(teks))?.[1] ?? "M5 12.5l4.5 4.5L19 7.5";
const Ikon = ({ d, className = "" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={`size-5 shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

export default function Menginap({ jenis, isi, bahasa, tanda, video, galeri, poster, pesan = "#pesan", katalog = [], perahu }: { /** Kartu perahu antar-jemput, di bawah fasilitas. */ perahu?: React.ReactNode; /** Katalog fasilitas kamar: ikon pilihan pemilik untuk tiap fasilitas. */ katalog?: Fasilitas[]; /** Foto galeri menginap, berurutan; jumlahnya bebas. */ galeri: Gambar[]; poster: Gambar; jenis: { r: Kamar; unit: number }[]; isi: string; bahasa: Bahasa; /** Tujuan tombol pesan: "#pesan", WhatsApp, atau "" (tombol disembunyikan). */ pesan?: string; tanda: React.ReactNode; /** Id video YouTube, atau "" bila belum diisi. */ video: string }) {
  const t = KAMUS[bahasa];
  const g = t.galeri;
  const fitur = (r: Kamar) => (bahasa === "id" ? (r.featuresId.length ? r.featuresId : r.featuresEn) : r.featuresEn.length ? r.featuresEn : r.featuresId);
  /* Fasilitas yang dimiliki semua jenis menjadi sorotan; sisanya (kasur) menjadi pembeda tiap jenis. */
  const semua = jenis.map((j) => fitur(j.r));
  const bersama = (semua[0] ?? []).filter((x) => semua.every((f) => f.includes(x)));
  const khas = (r: Kamar) => fitur(r).filter((x) => !bersama.includes(x));
  const utama = jenis[0]?.r;
  const termurah = Math.min(...jenis.map((j) => j.r.baseRate));
  const normal = utama?.normalRate != null && utama.normalRate > termurah ? utama.normalRate : null;

  /* Mosaik 12 kolom x 6 baris dengan ukuran ubin berbeda-beda; semua sudutnya membulat kecil, sama dengan bingkai video.
     Lima foto pertama galeri mengisi mosaik; selebihnya tampil setelah "Show more". */
  const TATA = [
    { kelas: "col-span-3 row-span-2 aspect-[3/4] lg:col-span-3 lg:col-start-1 lg:row-span-4 lg:row-start-1 lg:aspect-auto", posisi: "object-[35%_50%]" },
    { kelas: "col-span-3 aspect-[3/2] lg:col-span-6 lg:col-start-4 lg:row-span-3 lg:row-start-1 lg:aspect-auto", posisi: "object-[50%_78%]" },
    { kelas: "col-span-3 aspect-[3/2] lg:col-span-3 lg:col-start-10 lg:row-span-3 lg:row-start-1 lg:aspect-auto", posisi: "object-[55%_50%]" },
    { kelas: "col-span-3 aspect-[3/2] lg:col-span-4 lg:col-start-4 lg:row-span-3 lg:row-start-4 lg:aspect-auto", posisi: "object-[60%_55%]" },
    { kelas: "col-span-3 aspect-[3/2] lg:col-span-3 lg:col-start-1 lg:row-span-2 lg:row-start-5 lg:aspect-auto", posisi: "object-[50%_30%]" },
  ];
  /* Teks alt bawaan menggambarkan foto bawaan; foto unggahan (punya srcset) memakai teks umum. */
  const foto: FotoGaleri[] = galeri.map((x, i) => ({ ...x, alt: !x.srcSet && g.alt[i] ? g.alt[i] : g.fotoKe(i + 1), kelas: TATA[i]?.kelas ?? "", bentuk: "rounded-[1.4rem]", posisi: x.srcSet ? undefined : TATA[i]?.posisi }));

  return (
    <section id="menginap" className="scroll-mt-24 px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="muncul grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <div>
            <h2 className="font-display text-[clamp(38px,5vw,60px)] font-normal leading-[1.02] tracking-[-0.01em]">{t.pilihanMenginap}</h2>
            <div className="mt-3">{tanda}</div>
          </div>
          <p className="max-w-xl text-[15.5px] leading-relaxed text-malam/65 lg:justify-self-end">{isi}</p>
        </div>

        {/* Video selebar layar dan utuh, tidak dipotong. */}
        {video && <div className="mt-10 ml-[calc(50%-50vw)] w-screen"><VideoLatar video={{ jenis: "youtube", id: video }} poster={poster} sizes="100vw" judul={g.video} utuh /></div>}

        <div className={video ? "mt-4" : "mt-10"}>
          <Galeri foto={foto} mosaik={TATA.length} tetap={4} teks={{ buka: g.buka, tutup: g.tutup, sebelum: g.sebelum, sesudah: g.sesudah, lebih: g.lebih, kurang: g.kurang }}>
            {/* Ubin harga, ikut dalam mosaik */}
            <div className="muncul relative col-span-6 flex flex-col justify-between overflow-hidden rounded-[1.4rem] bg-malam p-6 text-white lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-4" style={{ "--tunda": 2 } as React.CSSProperties}>
              <img aria-hidden="true" alt="" src="/brand/bakoeria-ukiran-putih.svg" className="pointer-events-none absolute -bottom-10 -right-24 w-[420px] max-w-none opacity-[0.09]" />
              <div className="relative">
                {normal != null && <span className="rounded-full bg-emas-muda px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-malam">{t.promo}</span>}
                <p className="mt-4 text-[13px] text-white/70">{g.hargaJudul}</p>
                {normal != null && <s className="mt-2 block text-[15px] text-white/50">{rupiah(normal)}</s>}
                <p className="mt-1 whitespace-nowrap leading-none">
                  <b className="font-display text-[clamp(32px,4vw,46px)] font-medium">{rupiah(termurah)}</b>
                  <span className="text-[13px] text-white/70"> {t.perMalam}</span>
                </p>
                <p className="mt-2 text-[13.5px] text-white/75">{g.hargaKet}</p>
              </div>
              {pesan && <a href={pesan} {...(pesan.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="relative mt-5 inline-flex items-center gap-3 self-start rounded-full bg-white py-2 pl-5 pr-2 text-sm font-bold text-malam transition hover:bg-emas-muda">
                {t.cekKetersediaan}
                <span className="grid size-8 place-items-center rounded-full bg-emas-tua text-white">→</span>
              </a>}
            </div>
          </Galeri>
        </div>

        {/* Pilihan kasur: isi cottage sama, bedanya hanya di kasur */}
        <div className="mt-10 grid gap-4 md:grid-cols-[14rem_1fr] md:items-start">
          <p className="muncul font-display text-[22px] leading-snug">{g.kasurJudul}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {jenis.map(({ r, unit }, i) => (
              <div key={r.id} className="muncul flex items-start gap-4 rounded-[1.4rem] bg-white p-5 ring-1 ring-malam/8" style={{ "--tunda": i } as React.CSSProperties}>
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-busa text-emas-tua"><Ikon d={jalurIkon("kasur")} className="size-6" /></span>
                <div className="min-w-0">
                  <h3 className="font-display text-[22px] leading-tight">{r.roomType ?? r.name}</h3>
                  <p className="mt-1 text-[14px] text-malam/70">{khas(r).join(" · ") || (bahasa === "id" ? r.descId || r.descEn : r.descEn || r.descId)}</p>
                  <p className="mt-1 text-[12.5px] text-malam/50">{[unit > 1 ? t.unit(unit) : null, t.muat(r.capAdult, r.capChild)].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sorotan fasilitas, satu kali untuk semua cottage */}
        {bersama.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-[14rem_1fr] md:items-start">
            <p className="muncul font-display text-[22px] leading-snug">{g.fasilitasJudul}</p>
            <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {bersama.map((x, i) => (
                <li key={x} className="muncul flex items-center gap-3 text-[14.5px] text-malam/80" style={{ "--tunda": i % 3 } as React.CSSProperties}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-emas-tua ring-1 ring-malam/8"><Ikon d={(() => { const c = cariLabel(katalog, x); return c ? ikonFasilitas(c.ikon) : jalurIkon(x); })()} /></span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
        )}

        {perahu}

        <p className="muncul mt-8 rounded-2xl bg-busa/60 px-5 py-4 text-[14px] leading-relaxed text-malam/75">{t.kebijakanAnak}</p>
      </div>
    </section>
  );
}
