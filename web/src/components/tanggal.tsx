"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Pemilih tanggal milik sendiri, dipakai di website dan dashboard sebagai
 * pengganti kalender bawaan browser (yang tampilannya berbeda di tiap perangkat
 * dan tidak bisa diberi gaya).
 *
 * Nilainya selalu teks "YYYY-MM-DD", sama seperti <input type="date">.
 * Papan ketik: panah untuk berpindah hari, PageUp/PageDown bulan, Home/End
 * awal/akhir minggu, Enter memilih, Esc menutup.
 */
type Bahasa = "en" | "id";

const NAMA_BULAN: Record<Bahasa, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  id: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
};
const BULAN_PENDEK: Record<Bahasa, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
};
const NAMA_HARI: Record<Bahasa, string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  id: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
};
const HARI_PENDEK: Record<Bahasa, string[]> = {
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  id: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
};
const TEKS = {
  en: { pilih: "Choose a date", sebelum: "Previous month", sesudah: "Next month", hariIni: "Today", hapus: "Clear" },
  id: { pilih: "Pilih tanggal", sebelum: "Bulan sebelumnya", sesudah: "Bulan berikutnya", hariIni: "Hari ini", hapus: "Kosongkan" },
};

const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
const geser = (t: string, n: number) => new Date(Date.parse(t + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const geserBulan = (t: string, n: number) => {
  const [y, m, d] = t.split("-").map(Number);
  const akhir = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
  return iso(y, m - 1 + n, Math.min(d, akhir));
};
/** Hari ini di zona resort (Papua, WIT). */
const hariIniWit = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jayapura", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export function tulisTanggal(t: string, bahasa: Bahasa = "id") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return "";
  const [y, m, d] = t.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${HARI_PENDEK[bahasa][dow]}, ${d} ${BULAN_PENDEK[bahasa][m - 1]} ${y}`;
}

const TEMA = {
  /* Website publik: membulat, biru ombak. */
  situs: {
    pemicu: "w-full rounded-2xl border border-malam/10 bg-white/80 px-4 py-3 text-[15px] text-malam outline-none transition hover:border-emas-tua/50 focus-visible:border-emas-tua focus-visible:bg-white",
    papan: "rounded-[1.4rem] border border-malam/10 bg-white p-4 text-malam shadow-[0_24px_60px_rgba(10,36,64,.22)]",
    judul: "font-display text-[19px] text-malam",
    panah: "grid size-9 place-items-center rounded-full text-malam hover:bg-[#F6F4EF] disabled:opacity-30",
    hari: "text-malam hover:bg-busa",
    pilih: "bg-emas-tua font-bold text-white",
    kini: "ring-1 ring-inset ring-emas-tua",
    kaki: "text-emas-tua",
  },
  /* Dashboard: lebih rapat, navy. */
  panel: {
    pemicu: "w-full min-w-0 rounded-xl border border-panel-garis bg-white px-3.5 py-2.5 text-[15px] text-panel-tinta outline-none transition hover:border-panel-utama/40 focus-visible:border-panel-utama focus-visible:ring-2 focus-visible:ring-panel-utama/10",
    papan: "rounded-2xl border border-panel-garis bg-white p-3.5 text-panel-tinta shadow-angkat",
    judul: "text-[15px] font-bold text-panel-tinta",
    panah: "grid size-8 place-items-center rounded-full text-panel-tinta hover:bg-panel-latar disabled:opacity-30",
    hari: "text-panel-tinta hover:bg-panel-lembut",
    pilih: "bg-panel-utama font-bold text-white",
    kini: "ring-1 ring-inset ring-panel-utama",
    kaki: "text-panel-utama",
  },
} as const;

export interface PropsTanggal {
  value: string;
  onChange: (t: string) => void;
  min?: string;
  max?: string;
  bahasa?: Bahasa;
  tema?: keyof typeof TEMA;
  /** id untuk dipasangkan dengan <label htmlFor>. */
  id?: string;
  /** Nama yang dibacakan pembaca layar bila tidak ada label terpisah. */
  label?: string;
  /** Boleh dikosongkan (menampilkan tombol "Kosongkan"). */
  bolehKosong?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-describedby"?: string;
}

export default function PilihTanggal({ value, onChange, min, max, bahasa = "id", tema = "panel", id, label, bolehKosong, disabled, className, "aria-describedby": dijelaskan }: PropsTanggal) {
  const g = TEMA[tema];
  const t = TEKS[bahasa];
  const idAuto = useId();
  const idPemicu = id ?? idAuto;
  const kini = hariIniWit();
  const sah = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const [buka, setBuka] = useState(false);
  /** Hari yang sedang disorot papan ketik; bulannya yang ditampilkan. */
  const [sorot, setSorot] = useState(sah ? value : kini);
  const [keAtas, setKeAtas] = useState(false);
  const [keKanan, setKeKanan] = useState(false);
  const wadah = useRef<HTMLDivElement>(null);
  const pemicu = useRef<HTMLButtonElement>(null);
  const papan = useRef<HTMLDivElement>(null);

  const dalamBatas = (x: string) => (!min || x >= min) && (!max || x <= max);
  const jepit = (x: string) => (min && x < min ? min : max && x > max ? max : x);

  function bukaPapan() {
    if (disabled) return;
    setSorot(jepit(sah ? value : kini));
    const r = pemicu.current?.getBoundingClientRect();
    if (r) {
      setKeAtas(window.innerHeight - r.bottom < 380 && r.top > 380);
      setKeKanan(r.left + 320 > window.innerWidth - 8);
    }
    setBuka(true);
  }
  function tutup(fokus = true) {
    setBuka(false);
    if (fokus) pemicu.current?.focus();
  }
  function pilih(x: string) {
    if (!dalamBatas(x)) return;
    onChange(x);
    tutup();
  }

  /* Tutup saat klik di luar. */
  useEffect(() => {
    if (!buka) return;
    const luar = (e: PointerEvent) => {
      if (!wadah.current?.contains(e.target as Node)) setBuka(false);
    };
    document.addEventListener("pointerdown", luar);
    return () => document.removeEventListener("pointerdown", luar);
  }, [buka]);
  /* Fokus mengikuti hari yang disorot. */
  useEffect(() => {
    if (buka) papan.current?.querySelector<HTMLButtonElement>(`[data-tgl="${sorot}"]`)?.focus();
  }, [buka, sorot]);

  function tombol(e: React.KeyboardEvent) {
    const langkah: Record<string, () => string> = {
      ArrowLeft: () => geser(sorot, -1),
      ArrowRight: () => geser(sorot, 1),
      ArrowUp: () => geser(sorot, -7),
      ArrowDown: () => geser(sorot, 7),
      PageUp: () => geserBulan(sorot, -1),
      PageDown: () => geserBulan(sorot, 1),
      Home: () => geser(sorot, -new Date(sorot + "T00:00:00Z").getUTCDay()),
      End: () => geser(sorot, 6 - new Date(sorot + "T00:00:00Z").getUTCDay()),
    };
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      tutup();
    } else if (langkah[e.key]) {
      e.preventDefault();
      setSorot(jepit(langkah[e.key]()));
    }
  }

  const [y, m] = sorot.split("-").map(Number);
  const awalBulan = iso(y, m - 1, 1);
  const mulai = geser(awalBulan, -new Date(awalBulan + "T00:00:00Z").getUTCDay());
  const sel = Array.from({ length: 42 }, (_, i) => geser(mulai, i));
  const bulanIni = sorot.slice(0, 7);
  const bisaMundur = !min || geser(awalBulan, -1) >= min;
  const bisaMaju = !max || geserBulan(awalBulan, 1) <= max;

  return (
    <div ref={wadah} className={`relative ${className ?? ""}`}>
      <button
        ref={pemicu}
        type="button"
        id={idPemicu}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={buka}
        aria-label={label ? `${label}: ${sah ? tulisTanggal(value, bahasa) : t.pilih}` : undefined}
        aria-describedby={dijelaskan}
        data-nilai={value}
        onClick={() => (buka ? tutup(false) : bukaPapan())}
        onKeyDown={(e) => {
          if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !buka) {
            e.preventDefault();
            bukaPapan();
          }
        }}
        className={`flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60 ${g.pemicu}`}
      >
        <span className={`truncate ${sah ? "" : "opacity-45"}`}>{sah ? tulisTanggal(value, bahasa) : t.pilih}</span>
        <svg viewBox="0 0 24 24" className="size-[18px] shrink-0 opacity-55" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
        </svg>
      </button>

      {buka && (
        <div
          ref={papan}
          role="dialog"
          aria-label={label ?? t.pilih}
          onKeyDown={tombol}
          className={`absolute z-50 w-[19.5rem] max-w-[calc(100vw-1.5rem)] ${keAtas ? "bottom-[calc(100%+.5rem)]" : "top-[calc(100%+.5rem)]"} ${keKanan ? "right-0" : "left-0"} ${g.papan}`}
        >
          <div className="flex items-center justify-between gap-2">
            <button type="button" className={g.panah} aria-label={t.sebelum} data-nav="-1" disabled={!bisaMundur} onClick={() => setSorot(jepit(geserBulan(sorot, -1)))}>‹</button>
            <p className={g.judul} aria-live="polite" data-bulan={bulanIni}>{NAMA_BULAN[bahasa][m - 1]} {y}</p>
            <button type="button" className={g.panah} aria-label={t.sesudah} data-nav="1" disabled={!bisaMaju} onClick={() => setSorot(jepit(geserBulan(sorot, 1)))}>›</button>
          </div>
          <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-bold uppercase tracking-[0.06em] opacity-50" aria-hidden="true">
            {HARI_PENDEK[bahasa].map((h) => <span key={h} className="py-1">{h}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5" role="grid">
            {sel.map((x) => {
              const diBulan = x.slice(0, 7) === bulanIni;
              const boleh = dalamBatas(x);
              const [, mm, dd] = x.split("-").map(Number);
              const dow = new Date(x + "T00:00:00Z").getUTCDay();
              return (
                <button
                  key={x}
                  type="button"
                  role="gridcell"
                  data-tgl={x}
                  tabIndex={x === sorot ? 0 : -1}
                  disabled={!boleh}
                  aria-selected={x === value}
                  aria-current={x === kini ? "date" : undefined}
                  aria-label={`${NAMA_HARI[bahasa][dow]}, ${dd} ${NAMA_BULAN[bahasa][mm - 1]} ${x.slice(0, 4)}`}
                  onClick={() => pilih(x)}
                  onFocus={() => x !== sorot && boleh && diBulan && setSorot(x)}
                  className={`angka mx-auto grid size-10 place-items-center rounded-full text-[14px] outline-none transition focus-visible:ring-2 focus-visible:ring-current disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent ${
                    x === value ? g.pilih : `${g.hari} ${x === kini ? g.kini : ""} ${diBulan ? "" : "opacity-35"}`
                  }`}
                >
                  {dd}
                </button>
              );
            })}
          </div>
          <div className={`mt-2 flex items-center justify-between border-t border-current/10 pt-2 text-[13px] font-bold ${g.kaki}`}>
            {dalamBatas(kini) ? <button type="button" className="rounded-full px-2 py-1 hover:underline" onClick={() => pilih(kini)}>{t.hariIni}</button> : <span />}
            {bolehKosong && value && <button type="button" className="rounded-full px-2 py-1 hover:underline" onClick={() => { onChange(""); tutup(); }}>{t.hapus}</button>}
          </div>
        </div>
      )}
    </div>
  );
}
