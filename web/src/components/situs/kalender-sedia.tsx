"use client";

import { useMemo, useState } from "react";
import { jumlahMalam, tambahHari } from "@/lib/booking";
import { KAMUS, type Bahasa } from "@/lib/kamus";

/** Malam terlama satu pesanan dari situs (sama dengan batas server). */
const MAKS_MALAM = 30;

const awalBulan = (d: string) => `${d.slice(0, 7)}-01`;
const tambahBulan = (d: string, n: number) => {
  const t = new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1 + n, 1));
  return t.toISOString().slice(0, 10);
};
const hariBulan = (d: string) => new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)), 0)).getUTCDate();

/**
 * Kalender ketersediaan bulanan (seperti di situs Mambetron). Tiap tanggal mewakili
 * malamnya: penuh bila tidak ada cottage kosong. Ketukan pertama tanggal check-in,
 * ketukan kedua tanggal check-out. Malam penuh masih bisa jadi tanggal check-out,
 * karena tamu pergi pagi harinya.
 */
export default function KalenderSedia({ bahasa, sisa, awal, akhir, masuk, keluar, pilih }: {
  bahasa: Bahasa;
  /** Cottage kosong per malam; malam yang tidak tercantum semuanya kosong. */
  sisa: Record<string, number>;
  awal: string;
  akhir: string;
  masuk: string;
  keluar: string;
  pilih: (masuk: string, keluar: string) => void;
}) {
  const t = KAMUS[bahasa].form.kalender;
  const lokal = bahasa === "en" ? "en-GB" : "id-ID";
  const [bulan, setBulan] = useState(() => awalBulan(masuk || awal));
  const [sorot, setSorot] = useState("");
  const penuh = (d: string) => (sisa[d] ?? 1) < 1;
  const bisaMasuk = (d: string) => d >= awal && d < akhir && !penuh(d);
  const memilihKeluar = Boolean(masuk && !keluar);
  /* Check-out paling jauh: malam penuh pertama setelah check-in, atau batas malam terlama. */
  const batasKeluar = useMemo(() => {
    if (!masuk) return "";
    let d = masuk;
    for (let i = 0; i < MAKS_MALAM; i++) {
      if (penuh(d)) return d;
      d = tambahHari(d, 1);
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masuk, sisa]);
  const bisaKeluar = (d: string) => memilihKeluar && d > masuk && d <= batasKeluar;
  const ujung = keluar || (memilihKeluar && sorot && bisaKeluar(sorot) ? sorot : "");

  const namaHari = useMemo(() => {
    const f = new Intl.DateTimeFormat(lokal, { weekday: "narrow", timeZone: "UTC" });
    return Array.from({ length: 7 }, (_, i) => f.format(new Date(Date.UTC(2026, 10, 2 + i))));
  }, [lokal]);
  const judulBulan = new Date(bulan + "T00:00:00Z").toLocaleDateString(lokal, { month: "long", year: "numeric", timeZone: "UTC" });
  const panjang = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString(lokal, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const singkat = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString(lokal, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  function ketuk(d: string) {
    if (bisaKeluar(d)) { pilih(masuk, d); setSorot(""); return; }
    if (bisaMasuk(d)) pilih(d, "");
  }

  const geser = (new Date(bulan + "T00:00:00Z").getUTCDay() + 6) % 7;
  const sel: (string | null)[] = [...Array(geser).fill(null), ...Array.from({ length: hariBulan(bulan) }, (_, i) => tambahHari(bulan, i))];
  const pesan = !masuk ? t.pilihTiba : !keluar ? t.pilihPulang : `${KAMUS[bahasa].form.malam(jumlahMalam(masuk, keluar))}`;
  const panah = "grid size-10 place-items-center rounded-full bg-white text-malam ring-1 ring-malam/10 transition hover:ring-emas-tua disabled:opacity-30";

  return (
    <div data-kalender-sedia className="mt-8 grid gap-4">
      <div>
        <p className="font-display text-2xl text-malam">{t.judul}</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-malam/60">{t.ket}</p>
      </div>
      <div className="rounded-[1.6rem] bg-white/85 p-4 shadow-[0_14px_40px_rgba(10,36,64,.08)] ring-1 ring-malam/5 sm:p-5" onMouseLeave={() => setSorot("")}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <button type="button" className={panah} aria-label={t.sebelum} disabled={bulan <= awalBulan(awal)} onClick={() => setBulan(tambahBulan(bulan, -1))}>‹</button>
          <p className="font-display text-xl capitalize text-malam" aria-live="polite">{judulBulan}</p>
          <button type="button" className={panah} aria-label={t.berikut} disabled={bulan >= awalBulan(akhir)} onClick={() => setBulan(tambahBulan(bulan, 1))}>›</button>
        </div>
        <div className="grid grid-cols-7 text-center text-xs font-bold text-malam/45" aria-hidden="true">
          {namaHari.map((h, i) => <span key={i} className="py-1">{h}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {sel.map((d, i) => {
            if (!d) return <span key={`k${i}`} />;
            const kiri = d === masuk;
            const kanan = d === ujung;
            const dalam = !!masuk && !!ujung && d > masuk && d < ujung;
            const malamPenuh = penuh(d) && d >= awal && d < akhir;
            const aktif = bisaKeluar(d) || bisaMasuk(d);
            let gaya = "text-malam hover:bg-busa";
            if (!aktif) gaya = malamPenuh ? "text-[#B03826]/60 line-through" : "text-malam/25";
            if (dalam) gaya = "text-malam";
            if (kiri || kanan) gaya = "bg-emas-tua text-white";
            return (
              <div key={d} className={`flex justify-center ${dalam ? "bg-busa" : ""} ${kiri && ujung ? "bg-[linear-gradient(90deg,transparent_50%,var(--color-busa)_50%)]" : ""} ${kanan && masuk ? "bg-[linear-gradient(270deg,transparent_50%,var(--color-busa)_50%)]" : ""}`}>
                <button
                  type="button"
                  data-tgl={d}
                  data-penuh={malamPenuh || undefined}
                  disabled={!aktif}
                  onClick={() => ketuk(d)}
                  onMouseEnter={() => memilihKeluar && setSorot(d)}
                  aria-label={`${panjang(d)}${malamPenuh ? `, ${t.penuh}` : ""}`}
                  aria-pressed={kiri || kanan}
                  className={`angka grid size-10 place-items-center rounded-full text-[15px] transition-colors disabled:cursor-not-allowed ${gaya}`}
                >
                  {Number(d.slice(8))}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center text-sm font-bold text-emas-tua" aria-live="polite">{pesan}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-malam/60">
          <ul className="flex flex-wrap gap-4">
            <li className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-busa ring-1 ring-malam/10" />{t.kosong}</li>
            <li className="inline-flex items-center gap-1.5"><span className="text-[#B03826]/70 line-through">12</span>{t.penuh}</li>
            <li className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-emas-tua" />{t.pilihan}</li>
          </ul>
          {masuk && <button type="button" onClick={() => pilih("", "")} className="font-bold text-malam/70 underline underline-offset-4 hover:text-malam">{t.ulangi}</button>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3" data-tanggal-terpilih>
        {([[t.checkin, masuk], [t.checkout, keluar]] as const).map(([label, d]) => (
          <button key={label} type="button" onClick={() => d && setBulan(awalBulan(d))} className="grid gap-0.5 rounded-2xl border border-malam/10 bg-white/80 px-4 py-3 text-left">
            <span className="text-xs text-malam/55">{label}</span>
            <span className={`text-[15px] ${d ? "text-malam" : "text-malam/40"}`}>{d ? singkat(d) : t.belum}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
