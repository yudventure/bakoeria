import { nomorTampil, nomorWa, tautanInstagram, tautanResort, titikResort, type Konten, type SeksiId } from "@/lib/konten";
import { KAMUS, type Bahasa } from "@/lib/kamus";
import { Ikon } from "./ikon";
import { TombolIzinIklan } from "./promosi";

/**
 * Footer lengkap, disusun seperti Fantasea: logo dan paragraf tentang, menu
 * "Jelajahi", kolom "Kontak" dengan WhatsApp, email, dan alamat (bertaut ke
 * peta bila ada), "Ikuti kami" untuk media sosial yang diisi, lalu baris hak
 * cipta dan tautan masuk dashboard.
 */

const Judul = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[12px] font-bold uppercase tracking-[0.22em] text-emas ${className}`}>{children}</p>
);

export default function Footer({ k, namaResort, bahasa, iklan = false }: { k: Konten; namaResort: string; bahasa: Bahasa; /** Pixel atau Google Ads terpasang: tampilkan tautan pengaturan cookie iklan. */ iklan?: boolean }) {
  const t = KAMUS[bahasa];
  const { kontak } = k;
  const MENU = [
    ["#tentang", t.menu.tentang],
    ["#menginap", t.menu.menginap],
    ["#menyelam", t.footer.program],
    ["#sehari", t.sehari],
    ["#tanya", t.tanyaJawab],
    ["#pesan", t.menu.pesan],
  ].filter(([h]) => k.seksi[h.slice(1) as SeksiId] !== false);
  const wa = nomorWa(kontak.whatsapp);
  const pesanWa = encodeURIComponent(t.pesanWaUmum);
  /* Akun yang belum diisi mengarah ke halaman awal platformnya, supaya ikonnya tetap tampil. */
  const sosial = [
    { href: tautanInstagram(kontak.instagram), ikon: "ig", nama: "Instagram" },
    { href: kontak.tiktok || "https://www.tiktok.com/", ikon: "tiktok", nama: "TikTok" },
    { href: kontak.facebook || "https://www.facebook.com/", ikon: "facebook", nama: "Facebook" },
    { href: kontak.youtube || "https://www.youtube.com/", ikon: "youtube", nama: "YouTube" },
  ];

  return (
    <footer className="relative overflow-hidden bg-malam text-white/70">
      <img aria-hidden="true" alt="" src="/brand/bakoeria-ukiran-putih.svg" loading="lazy" className="pointer-events-none absolute -bottom-16 -right-44 w-[860px] max-w-none opacity-[0.06]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,1fr))] lg:py-16">
        <div>
          <img src="/brand/bakoeria-logo-horizontal-terbalik.svg" alt={namaResort} className="h-16 w-auto" loading="lazy" />
          {k.footerTentang && <p className="mt-5 max-w-[38ch] text-[15px] leading-relaxed">{k.footerTentang}</p>}
          <p className="mt-4 font-display text-lg italic text-pasir/90">{k.tagline}</p>
        </div>

        <div>
          <Judul>{t.footer.jelajahi}</Judul>
          <ul className="mt-4 grid gap-2.5">
            {MENU.map(([h, l]) => (
              <li key={h}>
                <a href={h} className="text-[15px] font-bold text-white/85 transition hover:text-white">{l}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0">
          <Judul>{t.footer.kontak}</Judul>
          <ul className="mt-4 grid gap-3 text-[15px]">
            {wa && (
              <li>
                <a href={`https://wa.me/${wa}?text=${pesanWa}`} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-2.5 font-bold text-white/85 hover:text-white">
                  <Ikon nama="wa" className="size-5 flex-none text-emas" />
                  {nomorTampil(kontak.whatsapp)}
                </a>
              </li>
            )}
            {kontak.email && (
              <li>
                <a href={`mailto:${kontak.email}`} className="inline-flex max-w-full items-center gap-2.5 font-bold text-white/85 hover:text-white">
                  <Ikon nama="surat" className="size-5 flex-none text-emas" />
                  <span className="min-w-0 [overflow-wrap:anywhere]">{kontak.email}</span>
                </a>
              </li>
            )}
            {kontak.alamat && (
              <li className="flex items-start gap-2.5">
                <Ikon nama="pin" className="mt-0.5 size-5 flex-none text-emas" />
                <a href={tautanResort(k)} target="_blank" rel="noopener noreferrer" className="font-bold text-white/85 hover:text-white">{kontak.alamat}</a>
              </li>
            )}
          </ul>
          <>
              <Judul className="mt-7">{t.footer.ikuti}</Judul>
              <div className="mt-3 flex gap-2">
                {sosial.map((x) => (
                  <a key={x.nama} href={x.href} target="_blank" rel="noopener noreferrer" aria-label={x.nama} className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
                    <Ikon nama={x.ikon} className="size-5" />
                  </a>
                ))}
              </div>
          </>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-[13.5px] text-white/55">
          <span>© {new Date().getFullYear()} {namaResort}. {t.footer.hak}{iklan && <> · <TombolIzinIklan label={t.footer.cookie} /></>}</span>
          <a href="/kelola" rel="nofollow" className="inline-flex items-center gap-1.5 font-bold hover:text-white">
            <Ikon nama="kunci" className="size-4" /> {t.footer.masuk}
          </a>
        </div>
      </div>
    </footer>
  );
}
