import type { Gambar } from "@/lib/foto";
import KaroselFoto from "./karosel-foto";
import type { Konten } from "@/lib/konten";

/**
 * Kartu perahu antar-jemput (longboat, speedboat): foto, mesin, keterangan, dan harga
 * per perahu pulang pergi. Antar-jemput dibayar terpisah dari kamar. Tampil di seksi
 * Menginap di bawah fasilitas (tata "menginap": judul di kolom kiri seperti "Di setiap
 * cottage"), atau di seksi Cara menuju ke sini bila seksi Menginap dimatikan.
 */
export default function PerahuJemput({ judul, isi, perahu, foto, teks, tata = "lokasi" }: { judul: string; isi: string; perahu: Konten["perahu"]; /** Foto tiap perahu (karosel), berurutan sesuai perahu. */ foto: Gambar[][]; teks: { sebelum: string; sesudah: string; foto: string; dari: string; pp: string; sekali: string }; tata?: "menginap" | "lokasi" }) {
  if (!perahu.length) return null;
  const kartu = (
    <ul className={`grid gap-4 ${perahu.length > 1 ? "sm:grid-cols-2" : ""} ${perahu.length > 2 ? "lg:grid-cols-3" : ""}`}>
      {perahu.map((x, i) => (
        <li key={x.judul + i} style={{ "--tunda": i } as React.CSSProperties} className={`muncul flex overflow-hidden rounded-[1.4rem] bg-white shadow-[0_10px_30px_rgba(10,36,64,.07)] ring-1 ring-malam/5 ${perahu.length === 1 ? "flex-col sm:flex-row" : "flex-col"}`}>
          <div className={`relative overflow-hidden bg-busa ${perahu.length === 1 ? "aspect-[16/10] sm:w-1/2" : "aspect-[16/10]"}`}>
            <div className="absolute inset-0"><KaroselFoto foto={foto[i]?.length ? foto[i] : foto[foto.length - 1] ?? []} alt={x.judul} sizes="(min-width: 640px) 40vw, 100vw" teks={teks} /></div>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-display text-[24px] leading-tight">{x.judul}</h4>
              <span className="flex flex-wrap gap-1.5">
              {x.mesin && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-busa px-3 py-1 text-[12.5px] font-bold text-malam/80">
                  <svg viewBox="0 0 24 24" className="size-4 text-emas-tua" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
                  {x.mesin}
                </span>
              )}
              {x.muat && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-busa px-3 py-1 text-[12.5px] font-bold text-malam/80">
                  <svg viewBox="0 0 24 24" className="size-4 text-emas-tua" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 5.6M18 20a6 6 0 0 0-3-5.2" /></svg>
                  {x.muat}
                </span>
              )}
              </span>
            </div>
            {x.isi && <p className="text-[14px] leading-relaxed text-malam/65">{x.isi}</p>}
            {x.harga.length > 0 && (
              <dl className="mt-auto grid gap-2 pt-1">
                {x.harga.map((h, j) => (
                  <div key={h.rute + j} data-harga-perahu className="rounded-xl bg-[#F6F4EF] px-3.5 py-2.5">
                    <dt className="text-[13.5px] font-bold text-malam/80">{h.rute}</dt>
                    {h.harga && <dd className="flex items-baseline justify-between gap-3"><span className="text-[13px] text-malam/60">{teks.pp}</span><span className="angka whitespace-nowrap text-[15px] font-bold text-emas-tua">{h.harga}</span></dd>}
                    {h.sekali && <dd data-sekali className="flex items-baseline justify-between gap-3"><span className="text-[13px] text-malam/60">{teks.sekali}</span><span className="angka whitespace-nowrap text-[15px] font-bold text-emas-tua">{h.sekali}</span></dd>}
                  </div>
                ))}
              </dl>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
  if (tata === "menginap")
    return (
      <div data-perahu className="mt-10 grid gap-4 md:grid-cols-[14rem_1fr] md:items-start">
        <div className="muncul">
          <p className="font-display text-[22px] leading-snug">{judul}</p>
          {isi && <p className="mt-2 text-[13.5px] leading-relaxed text-malam/60">{isi}</p>}
        </div>
        {kartu}
      </div>
    );
  return (
    <div data-perahu className="mt-12">
      <div className="muncul grid gap-3 lg:grid-cols-[1fr_1.1fr] lg:items-end">
        <h3 className="font-display text-[clamp(24px,3vw,32px)] font-normal leading-tight">{judul}</h3>
        {isi && <p className="max-w-xl text-[14px] leading-relaxed text-malam/65 lg:justify-self-end">{isi}</p>}
      </div>
      <div className="mt-6">{kartu}</div>
    </div>
  );
}
