import { nomorWa, tautanInstagram, type Konten } from "@/lib/konten";
import { Ikon } from "./ikon";

/**
 * Footer lengkap, disusun seperti Fantasea: logo dan paragraf tentang, menu
 * "Jelajahi", kolom "Kontak" dengan WhatsApp, email, dan alamat (bertaut ke
 * peta bila ada), "Ikuti kami" untuk media sosial yang diisi, lalu baris hak
 * cipta dan tautan masuk dashboard.
 */
const MENU = [
  ["#tentang", "Tentang"],
  ["#menginap", "Menginap"],
  ["#menyelam", "Program selam"],
  ["#sehari", "Sehari di Bakoeria"],
  ["#tanya", "Tanya jawab"],
  ["#pesan", "Pesan"],
];

const Judul = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[12px] font-bold uppercase tracking-[0.22em] text-emas ${className}`}>{children}</p>
);

export default function Footer({ k, namaResort }: { k: Konten; namaResort: string }) {
  const { kontak } = k;
  const wa = nomorWa(kontak.whatsapp);
  const pesanWa = encodeURIComponent(`Halo ${namaResort}, saya ingin bertanya.`);
  const sosial = [
    { href: tautanInstagram(kontak.instagram), ikon: "ig", nama: "Instagram" },
    { href: kontak.facebook, ikon: "facebook", nama: "Facebook" },
    { href: kontak.tiktok, ikon: "tiktok", nama: "TikTok" },
    { href: kontak.youtube, ikon: "youtube", nama: "YouTube" },
  ].filter((x) => x.href);

  return (
    <footer className="bg-malam text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,1fr))] lg:py-16">
        <div>
          <img src="/brand/bakoeria-logo-horizontal-gold.svg" alt={namaResort} className="h-11 w-auto" loading="lazy" />
          {k.footerTentang && <p className="mt-5 max-w-[38ch] text-[15px] leading-relaxed">{k.footerTentang}</p>}
          <p className="mt-4 font-display text-lg italic text-pasir/90">{k.tagline}</p>
        </div>

        <div>
          <Judul>Jelajahi</Judul>
          <ul className="mt-4 grid gap-2.5">
            {MENU.map(([h, l]) => (
              <li key={h}>
                <a href={h} className="text-[15px] font-bold text-white/85 transition hover:text-white">{l}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0">
          <Judul>Kontak</Judul>
          <ul className="mt-4 grid gap-3 text-[15px]">
            {wa && (
              <li>
                <a href={`https://wa.me/${wa}?text=${pesanWa}`} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-2.5 font-bold text-white/85 hover:text-white">
                  <Ikon nama="wa" className="size-5 flex-none text-emas" />
                  {kontak.whatsapp}
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
                {kontak.peta ? (
                  <a href={kontak.peta} target="_blank" rel="noopener noreferrer" className="font-bold text-white/85 hover:text-white">{kontak.alamat}</a>
                ) : (
                  <span>{kontak.alamat}</span>
                )}
              </li>
            )}
          </ul>
          {sosial.length > 0 && (
            <>
              <Judul className="mt-7">Ikuti kami</Judul>
              <div className="mt-3 flex gap-2">
                {sosial.map((x) => (
                  <a key={x.nama} href={x.href} target="_blank" rel="noopener noreferrer" aria-label={x.nama} className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
                    <Ikon nama={x.ikon} className="size-5" />
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-[13.5px] text-white/55">
          <span>© {new Date().getFullYear()} {namaResort}. Hak cipta dilindungi.</span>
          <a href="/kelola" rel="nofollow" className="inline-flex items-center gap-1.5 font-bold hover:text-white">
            <Ikon nama="kunci" className="size-4" /> Masuk
          </a>
        </div>
      </div>
    </footer>
  );
}
