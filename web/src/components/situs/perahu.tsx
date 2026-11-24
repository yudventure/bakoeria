import { atribut, type Gambar } from "@/lib/foto";
import type { Konten } from "@/lib/konten";

/**
 * Kartu perahu antar-jemput (longboat, speedboat): foto, mesin, keterangan, dan harga
 * per perahu pulang pergi. Antar-jemput dibayar terpisah dari kamar. Tampil di seksi
 * Menginap di bawah fasilitas (tata "menginap": judul di kolom kiri seperti "Di setiap
 * cottage"), atau di seksi Cara menuju ke sini bila seksi Menginap dimatikan.
 */
export default function PerahuJemput({ judul, isi, perahu, foto, tata = "lokasi" }: { judul: string; isi: string; perahu: Konten["perahu"]; foto: Gambar[]; tata?: "menginap" | "lokasi" }) {
  if (!perahu.length) return null;
  const kartu = (
    <ul className={`grid gap-4 ${perahu.length > 1 ? "sm:grid-cols-2" : ""} ${perahu.length > 2 ? "lg:grid-cols-3" : ""}`}>
      {perahu.map((x, i) => (
        <li key={x.judul + i} style={{ "--tunda": i } as React.CSSProperties} className={`muncul flex overflow-hidden rounded-[1.4rem] bg-white shadow-[0_10px_30px_rgba(10,36,64,.07)] ring-1 ring-malam/5 ${perahu.length === 1 ? "flex-col sm:flex-row" : "flex-col"}`}>
          <div className={`relative overflow-hidden bg-busa ${perahu.length === 1 ? "aspect-[16/10] sm:w-1/2" : "aspect-[16/10]"}`}>
            <img {...atribut(foto[i] ?? foto[foto.length - 1], "(min-width: 640px) 40vw, 100vw")} alt={x.judul} loading="lazy" className="absolute inset-0 size-full object-cover" />
          </div>
          <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-display text-[24px] leading-tight">{x.judul}</h4>
              {x.mesin && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-busa px-3 py-1 text-[12.5px] font-bold text-malam/80">
                  <svg viewBox="0 0 24 24" className="size-4 text-emas-tua" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
                  {x.mesin}
                </span>
              )}
            </div>
            {x.isi && <p className="text-[14px] leading-relaxed text-malam/65">{x.isi}</p>}
            {x.harga.length > 0 && (
              <dl className="mt-auto grid gap-2 pt-1">
                {x.harga.map((h, j) => (
                  <div key={h.rute + j} className="flex items-baseline justify-between gap-3 rounded-xl bg-[#F6F4EF] px-3.5 py-2.5">
                    <dt className="text-[13.5px] text-malam/70">{h.rute}</dt>
                    <dd className="angka whitespace-nowrap text-[15px] font-bold text-emas-tua">{h.harga}</dd>
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
