"use client";

import { useCallback, useEffect, useState } from "react";
import type { Statistik } from "@/lib/server/kunjungan";
import { api } from "../api";

type Rentang = 7 | 30 | 90;

const BLN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const tanggalPendek = (t: string) => `${Number(t.slice(8))} ${BLN[Number(t.slice(5, 7)) - 1]}`;
let namaNegara: Intl.DisplayNames | null = null;
const nama = (kode: string) => {
  try {
    namaNegara ??= new Intl.DisplayNames(["id"], { type: "region" });
    return namaNegara.of(kode) ?? kode;
  } catch {
    return kode;
  }
};
const bendera = (kode: string) => (/^[A-Z]{2}$/.test(kode) ? String.fromCodePoint(...[...kode].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "");
const angka = (n: number) => n.toLocaleString("id-ID");
const persen = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

function Ubin({ label, nilai, ket, gelap = false }: { label: string; nilai: number; ket: string; gelap?: boolean }) {
  return (
    <div className={`rounded-3xl px-5 py-5 ring-1 ${gelap ? "bg-panel-utama text-white ring-panel-utama" : "bg-white text-panel-utama ring-panel-garis"}`}>
      <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${gelap ? "text-white/80" : "text-emas-tua"}`}>{label}</p>
      <p className="angka mt-2 text-[2.2rem] font-bold leading-none">{angka(nilai)}</p>
      <p className={`mt-2 text-sm ${gelap ? "text-white/80" : "text-panel-utama/70"}`}>{ket}</p>
    </div>
  );
}

/**
 * Statistik pengunjung website, seperti di Unmehopa: jumlah pengunjung, grafik
 * per hari, rincian satu hari, dan asal negara beserta jumlahnya. Datanya dari
 * penghitung milik sendiri (/api/kunjungan), dimulai sejak fitur ini tayang.
 */
export default function LayarStatistik() {
  const [rentang, setRentang] = useState<Rentang>(30);
  const [hari, setHari] = useState<string | null>(null);
  const [st, setSt] = useState<Statistik | null>(null);
  const [galat, setGalat] = useState("");
  const [semuaNegara, setSemuaNegara] = useState(false);

  const muat = useCallback(async () => {
    try {
      const q = new URLSearchParams({ rentang: String(rentang) });
      if (hari) q.set("hari", hari);
      setSt((await api<{ statistik: Statistik }>(`/api/kunjungan?${q}`)).statistik);
      setGalat("");
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Statistik belum bisa dimuat.");
    }
  }, [rentang, hari]);

  useEffect(() => {
    void muat();
    const t = setInterval(() => document.visibilityState === "visible" && void muat(), 30_000);
    return () => clearInterval(t);
  }, [muat]);

  const puncak = Math.max(1, ...(st?.seri.map((x) => x.unik) ?? [1]));
  const totalNegara = st?.negara.reduce((n, x) => n + x.n, 0) ?? 0;
  const totalSemua = totalNegara + (st?.tanpaNegara ?? 0);
  const daftar = semuaNegara ? st?.negara ?? [] : st?.negara.slice(0, 8) ?? [];
  const totalBahasa = (st?.bahasa.en ?? 0) + (st?.bahasa.id ?? 0);

  return (
    <div className="grid gap-5">
      <section className="rounded-3xl bg-white p-5 ring-1 ring-panel-garis">
        <div className="flex flex-wrap items-start gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emas-tua">Statistik website</p>
            <h1 className="mt-1 text-[1.6rem] font-bold leading-tight text-panel-utama">Pengunjung website Bakoeria</h1>
            <p className="mt-1 text-sm text-panel-utama/70">Berapa orang membuka website, dari negara mana, dan halaman apa yang dilihat.</p>
          </div>
          <div className="ml-auto text-right text-xs text-panel-utama/60">
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-panel-lembut px-2 py-0.5 font-bold text-emas-tua">● Langsung</span>
            {st && <div>Diperbarui {new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jayapura", hour: "2-digit", minute: "2-digit" }).format(new Date(st.diperbarui)).replace(":", ".")} WIT</div>}
          </div>
        </div>
        {galat && <p className="mt-3 text-sm text-panel-merah">{galat}</p>}
      </section>

      {st && (
        <>
          {st.mulai === null && (
            <p className="rounded-2xl bg-panel-latar px-5 py-4 text-[0.9375rem] text-panel-utama">
              Belum ada kunjungan tercatat. Penghitungan dimulai sejak fitur ini tayang. Kunjungan Anda sendiri saat sedang masuk ke dashboard tidak dihitung, jadi untuk mencoba, buka website dari peramban lain atau jendela samaran.
            </p>
          )}
          <section aria-label="Angka kunjungan" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Ubin gelap label="Aktif sekarang" nilai={st.aktif} ket="pengunjung dalam 5 menit terakhir" />
            <Ubin label="Hari ini" nilai={st.hariIni.unik} ket={`${angka(st.hariIni.tampil)} tampilan halaman`} />
            <Ubin label="7 hari terakhir" nilai={st.tujuhHari.unik} ket={`${angka(st.tujuhHari.tampil)} tampilan halaman`} />
            <Ubin label="30 hari terakhir" nilai={st.tigaPuluhHari.unik} ket={`${angka(st.tigaPuluhHari.tampil)} tampilan halaman`} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0 rounded-3xl bg-white p-5 ring-1 ring-panel-garis">
              <div className="flex flex-wrap items-center gap-2">
                <div>
                  <p className="text-base font-bold text-panel-utama">Pengunjung per hari</p>
                  <p className="text-xs text-panel-utama/60">{tanggalPendek(st.seri[0].tanggal)} sampai {tanggalPendek(st.seri[st.seri.length - 1].tanggal)}</p>
                </div>
                <div role="tablist" aria-label="Rentang" className="ml-auto flex gap-1 rounded-full bg-panel-latar p-1">
                  {([7, 30, 90] as const).map((r) => (
                    <button key={r} type="button" role="tab" aria-selected={rentang === r} onClick={() => setRentang(r)} className={`rounded-full px-3 py-1 text-[0.8125rem] ${rentang === r ? "bg-panel-utama font-bold text-white" : "text-panel-utama hover:bg-panel-lembut"}`}>
                      {r} hari
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex h-56 items-end gap-[2px] sm:gap-[3px]" role="img" aria-label={`Grafik pengunjung unik per hari, ${rentang} hari terakhir`}>
                {st.seri.map((x, i) => {
                  const tinggi = Math.max(x.unik ? 4 : 1, Math.round((x.unik / puncak) * 100));
                  const pilih = x.tanggal === st.detail.tanggal;
                  const akhir = i === st.seri.length - 1;
                  const label = rentang === 7 || akhir || i % (rentang === 30 ? 5 : 15) === 0;
                  return (
                    <button key={x.tanggal} type="button" onClick={() => setHari(x.tanggal)} title={`${tanggalPendek(x.tanggal)}: ${x.unik} pengunjung, ${x.tampil} tampilan`} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                      <span className={`angka mb-1 text-[10px] text-panel-utama/70 ${rentang === 7 || x.unik === puncak || akhir ? "" : "opacity-0"}`}>{x.unik}</span>
                      <span className={`w-full rounded-t-md ${pilih ? "bg-emas-tua" : "bg-panel-utama"} group-hover:opacity-80`} style={{ height: `${tinggi}%` }} />
                      <span className={`mt-1 whitespace-nowrap text-[10px] ${akhir ? "font-bold text-panel-utama" : "text-panel-utama/60"} ${label ? "" : "invisible"}`}>{akhir ? "Hari ini" : tanggalPendek(x.tanggal)}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-panel-utama/60">Pilih batang untuk melihat rincian hari itu.</p>
              <div className="sr-only">
                <table>
                  <caption>Pengunjung unik per hari</caption>
                  <tbody>{st.seri.map((x) => <tr key={x.tanggal}><th>{x.tanggal}</th><td>{x.unik}</td></tr>)}</tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl bg-panel-lembut p-5">
              <p className="text-base font-bold text-panel-utama">Rincian {st.detail.tanggal === st.seri[st.seri.length - 1].tanggal ? "hari ini" : tanggalPendek(st.detail.tanggal)}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div><p className="text-xs text-panel-utama/70">Pengunjung</p><p className="angka text-[2rem] font-bold leading-tight text-panel-utama">{st.detail.unik}</p></div>
                <div><p className="text-xs text-panel-utama/70">Tampilan</p><p className="angka text-[2rem] font-bold leading-tight text-panel-utama">{st.detail.tampil}</p></div>
              </div>
              <p className="mt-4 text-xs font-bold text-panel-utama/70">Negara teratas</p>
              {st.detail.negara.length === 0 ? <p className="mt-1 text-sm text-panel-utama/70">Belum ada.</p> : (
                <ul className="mt-1 grid gap-1 text-sm text-panel-utama">
                  {st.detail.negara.map(([k, n]) => <li key={k} className="flex justify-between gap-2"><span className="truncate">{bendera(k)} {nama(k)}</span><span className="angka">{n}</span></li>)}
                </ul>
              )}
              <p className="mt-4 text-xs font-bold text-panel-utama/70">Halaman teratas</p>
              {st.detail.halaman.length === 0 ? <p className="mt-1 text-sm text-panel-utama/70">Belum ada.</p> : (
                <ul className="mt-1 grid gap-1 text-sm text-panel-utama">
                  {st.detail.halaman.map(([h, n]) => <li key={h} className="flex justify-between gap-2"><span className="min-w-0 truncate">{h === "/" ? "Beranda (Inggris)" : h === "/id" ? "Beranda (Indonesia)" : h}</span><span className="angka">{n}</span></li>)}
                </ul>
              )}
              <p className="mt-4 text-xs text-panel-utama/60">Satu pengunjung bisa membuka beberapa halaman.</p>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="rounded-3xl bg-white p-5 ring-1 ring-panel-garis">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-base font-bold text-panel-utama">Asal negara pengunjung</p>
                  <p className="text-xs text-panel-utama/60">
                    {rentang} hari terakhir · {angka(totalNegara)} pengunjung dari {st.negara.length} negara{st.tanpaNegara ? ` · ${angka(st.tanpaNegara)} belum diketahui negaranya` : ""}
                  </p>
                </div>
              </div>
              {st.negara.length === 0 ? <p className="mt-3 text-sm text-panel-utama/70">Belum ada data negara.</p> : (
                <>
                  <table className="mt-4 w-full text-sm text-panel-utama">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-panel-utama/60">
                        <th className="w-8 pb-2 font-bold">#</th>
                        <th className="pb-2 font-bold">Negara</th>
                        <th className="hidden pb-2 font-bold sm:table-cell" aria-hidden="true" />
                        <th className="pb-2 text-right font-bold">Pengunjung</th>
                        <th className="w-14 pb-2 text-right font-bold">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daftar.map((x, i) => (
                        <tr key={x.kode} className="border-t border-panel-garis/70">
                          <td className="angka py-2 text-panel-utama/60">{i + 1}</td>
                          <td className="py-2"><span className="mr-1.5 text-base">{bendera(x.kode)}</span>{nama(x.kode)}</td>
                          <td className="hidden w-[40%] py-2 sm:table-cell">
                            <span className="block h-2 rounded-full bg-panel-latar"><span className="block h-2 rounded-full bg-panel-utama" style={{ width: `${Math.max(3, persen(x.n, totalNegara))}%` }} /></span>
                          </td>
                          <td className="angka py-2 text-right font-bold">{angka(x.n)}</td>
                          <td className="angka py-2 text-right text-panel-utama/70">{persen(x.n, totalNegara)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {st.negara.length > 8 && (
                    <button type="button" onClick={() => setSemuaNegara(!semuaNegara)} className="mt-3 text-sm font-bold text-panel-utama underline">
                      {semuaNegara ? "Tampilkan 8 teratas" : `Tampilkan semua ${st.negara.length} negara`}
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="grid content-start gap-4">
              <div className="rounded-3xl bg-white p-5 ring-1 ring-panel-garis">
                <p className="text-base font-bold text-panel-utama">Bahasa website</p>
                <p className="text-xs text-panel-utama/60">Tampilan halaman, {rentang} hari terakhir</p>
                {totalBahasa === 0 ? <p className="mt-3 text-sm text-panel-utama/70">Belum ada.</p> : (
                  <>
                    <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-panel-latar">
                      <span className="bg-panel-utama" style={{ width: `${persen(st.bahasa.en, totalBahasa)}%` }} />
                      <span className="bg-emas" style={{ width: `${persen(st.bahasa.id, totalBahasa)}%` }} />
                    </div>
                    <ul className="mt-3 grid gap-1 text-sm text-panel-utama">
                      <li className="flex justify-between"><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-panel-utama" />Inggris</span><span className="angka">{angka(st.bahasa.en)} · {persen(st.bahasa.en, totalBahasa)}%</span></li>
                      <li className="flex justify-between"><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-emas" />Indonesia</span><span className="angka">{angka(st.bahasa.id)} · {persen(st.bahasa.id, totalBahasa)}%</span></li>
                    </ul>
                  </>
                )}
              </div>
              <div className="rounded-3xl bg-white p-5 ring-1 ring-panel-garis">
                <p className="text-base font-bold text-panel-utama">Dalam negeri dan mancanegara</p>
                <p className="text-xs text-panel-utama/60">{rentang} hari terakhir, yang negaranya diketahui</p>
                {totalNegara === 0 ? <p className="mt-3 text-sm text-panel-utama/70">Belum ada.</p> : (() => {
                  const id = st.negara.find((x) => x.kode === "ID")?.n ?? 0;
                  return (
                    <ul className="mt-3 grid gap-1 text-sm text-panel-utama">
                      <li className="flex justify-between"><span>🇮🇩 Indonesia</span><span className="angka">{angka(id)} · {persen(id, totalNegara)}%</span></li>
                      <li className="flex justify-between"><span>🌏 Mancanegara</span><span className="angka">{angka(totalNegara - id)} · {persen(totalNegara - id, totalNegara)}%</span></li>
                    </ul>
                  );
                })()}
              </div>
            </div>
          </section>

          <p className="px-1 text-xs leading-relaxed text-panel-utama/60">
            Penghitung milik sendiri: tanpa cookie, alamat IP tidak disimpan, dan pengunjung dikenali hanya dalam satu hari lewat sidik acak yang tidak bisa dilacak ke hari lain. Do Not Track dan Global Privacy Control dihormati, robot dan pratinjau tautan (WhatsApp, Facebook) disaring, dan pengelola yang sedang masuk tidak dihitung. Negara dibaca dari alamat IP dengan basis data GeoLite2 dari MaxMind yang tersimpan di server sendiri (IP tidak dikirim ke layanan lain); pengguna VPN terhitung di negara VPN-nya. Total {angka(totalSemua)} pengunjung dalam {rentang} hari terakhir.
          </p>
        </>
      )}
    </div>
  );
}
