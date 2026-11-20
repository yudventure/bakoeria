"use client";

import { cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";

export const cx = (...k: (string | false | null | undefined)[]) => k.filter(Boolean).join(" ");

export function Kartu({ children, className, judul, aksi, ket }: { children: ReactNode; className?: string; judul?: ReactNode; aksi?: ReactNode; ket?: ReactNode }) {
  return (
    <section className={cx("min-w-0 rounded-3xl bg-white p-5 shadow-panel ring-1 ring-panel-garis sm:p-6", className)}>
      {(judul || aksi) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {judul && <h2 className="text-[17px] font-bold text-panel-tinta">{judul}</h2>}
            {ket && <p className="mt-1 text-sm text-panel-redup">{ket}</p>}
          </div>
          {aksi && <div className="flex flex-wrap gap-2">{aksi}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export const Label = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cx("block text-[11px] font-bold uppercase tracking-[0.16em] text-emas-tua", className)}>{children}</span>
);

type Varian = "utama" | "garis" | "hantu" | "bahaya" | "emas";
const VARIAN: Record<Varian, string> = {
  utama: "bg-panel-utama text-white hover:bg-panel-utama-2",
  emas: "emas-gradasi text-malam-dalam hover:brightness-105",
  garis: "bg-white text-panel-tinta ring-1 ring-panel-garis hover:ring-panel-utama/40",
  hantu: "text-panel-tinta hover:bg-panel-lembut",
  bahaya: "bg-panel-merah text-white hover:brightness-110",
};

export function Tombol({ varian = "utama", kecil, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { varian?: Varian; kecil?: boolean }) {
  return (
    <button
      type="button"
      {...p}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
        kecil ? "px-3.5 py-1.5 text-[13px]" : "px-5 py-2.5 text-sm",
        VARIAN[varian],
        className,
      )}
    />
  );
}

type Nada = "netral" | "hijau" | "kuning" | "merah" | "biru" | "emas";
const NADA: Record<Nada, string> = {
  netral: "bg-panel-lembut text-panel-redup",
  hijau: "bg-panel-hijau-lembut text-panel-hijau",
  kuning: "bg-panel-kuning-lembut text-panel-kuning",
  merah: "bg-panel-merah-lembut text-panel-merah",
  biru: "bg-panel-utama text-white",
  emas: "bg-panel-emas-lembut text-emas-tua",
};
export const Pil = ({ nada = "netral", children, className }: { nada?: Nada; children: ReactNode; className?: string }) => (
  <span className={cx("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", NADA[nada], className)}>{children}</span>
);

export const masukan =
  "w-full min-w-0 rounded-xl border border-panel-garis bg-white px-3.5 py-2.5 text-[15px] text-panel-tinta outline-none transition placeholder:text-panel-redup/60 focus:border-panel-utama focus:ring-2 focus:ring-panel-utama/10 disabled:bg-panel-latar";

/** Satu isian berlabel. Label dan keterangan dihubungkan lewat id, bukan dengan membungkus isiannya. */
export function Bidang({ label, ket, children, className }: { label: string; ket?: ReactNode; children: ReactNode; className?: string }) {
  const id = useId();
  const idKet = `${id}-ket`;
  const isian = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string; "aria-describedby"?: string }>, { id: (children.props as { id?: string }).id ?? id, ...(ket ? { "aria-describedby": idKet } : {}) })
    : children;
  return (
    <div className={cx("grid min-w-0 content-start gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-bold text-panel-tinta">{label}</label>
      {isian}
      {ket && <span id={idKet} className="text-xs text-panel-redup">{ket}</span>}
    </div>
  );
}

export function Modal({ judul, buka, tutup, children, lebar = "max-w-xl", kaki }: { judul: ReactNode; buka: boolean; tutup: () => void; children: ReactNode; lebar?: string; kaki?: ReactNode }) {
  useEffect(() => {
    if (!buka) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && tutup();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [buka, tutup]);
  if (!buka) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-panel-utama/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && tutup()}>
      <div role="dialog" aria-modal="true" className={cx("flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-angkat sm:rounded-3xl", lebar)}>
        <div className="flex items-center justify-between gap-3 border-b border-panel-garis px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-panel-tinta">{judul}</h2>
          <button onClick={tutup} aria-label="Tutup" className="grid size-9 place-items-center rounded-full text-xl text-panel-redup hover:bg-panel-lembut">×</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {kaki && <div className="flex flex-wrap justify-end gap-2 border-t border-panel-garis px-5 py-4 sm:px-6">{kaki}</div>}
      </div>
    </div>
  );
}

/* Toast */
const KonteksToast = createContext<(pesan: string, nada?: "biasa" | "galat") => void>(() => {});
export const useToast = () => useContext(KonteksToast);
export function PenyediaToast({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ pesan: string; nada: "biasa" | "galat"; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tampil = useCallback((pesan: string, nada: "biasa" | "galat" = "biasa") => {
    if (timer.current) clearTimeout(timer.current);
    setT({ pesan, nada, id: Date.now() });
    timer.current = setTimeout(() => setT(null), nada === "galat" ? 5000 : 2600);
  }, []);
  return (
    <KonteksToast.Provider value={tampil}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
        {t && (
          <div key={t.id} className={cx("pointer-events-auto max-w-md rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-angkat", t.nada === "galat" ? "bg-panel-merah" : "bg-panel-tinta")}>
            {t.pesan}
          </div>
        )}
      </div>
    </KonteksToast.Provider>
  );
}

export function Kosong({ judul, isi, aksi }: { judul: string; isi?: ReactNode; aksi?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-panel-garis bg-panel-latar/60 px-5 py-10 text-center">
      <p className="font-bold text-panel-tinta">{judul}</p>
      {isi && <p className="mx-auto mt-1 max-w-md text-sm text-panel-redup">{isi}</p>}
      {aksi && <div className="mt-4 flex justify-center">{aksi}</div>}
    </div>
  );
}

export function Penjelasan({ children, judul = "Penjelasan" }: { children: ReactNode; judul?: string }) {
  return (
    <details className="group rounded-2xl bg-panel-latar px-4 py-3 text-sm text-panel-redup">
      <summary className="cursor-pointer font-bold text-panel-tinta">
        <span className="mr-1 inline-block transition group-open:rotate-90">›</span> {judul}
      </summary>
      <div className="mt-2 grid gap-2 leading-relaxed">{children}</div>
    </details>
  );
}

export function Tab<T extends string>({ pilihan, nilai, ubah }: { pilihan: { id: T; label: string }[]; nilai: T; ubah: (v: T) => void }) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist">
      {pilihan.map((p) => (
        <button
          key={p.id}
          role="tab"
          aria-selected={nilai === p.id}
          onClick={() => ubah(p.id)}
          className={cx("whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition", nilai === p.id ? "bg-panel-utama text-white" : "bg-white text-panel-redup ring-1 ring-panel-garis hover:text-panel-tinta")}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function Angka({ label, nilai, ket, nada }: { label: string; nilai: ReactNode; ket?: ReactNode; nada?: "merah" | "hijau" }) {
  return (
    <div className="min-w-0 rounded-3xl bg-white p-4 shadow-panel ring-1 ring-panel-garis sm:p-5">
      <Label>{label}</Label>
      <div className={cx("angka mt-2 text-[21px] font-bold leading-tight sm:text-[28px]", nada === "merah" ? "text-panel-merah" : nada === "hijau" ? "text-panel-hijau" : "text-panel-tinta")}>{nilai}</div>
      {ket && <div className="mt-1 text-[13px] text-panel-redup">{ket}</div>}
    </div>
  );
}

export function Memuat({ teks = "Memuat…" }: { teks?: string }) {
  return <div className="py-16 text-center text-sm text-panel-redup">{teks}</div>;
}

export function Galat({ pesan, ulang }: { pesan: string; ulang?: () => void }) {
  return (
    <div className="rounded-2xl bg-panel-merah-lembut px-5 py-4 text-sm text-panel-merah">
      <p className="font-bold">{pesan}</p>
      {ulang && <button onClick={ulang} className="mt-2 font-bold underline">Coba lagi</button>}
    </div>
  );
}
