"use client";

import { useMemo, useState } from "react";
import { BULAN_PANJANG, CHANNEL, hariIniWit, jumlahMalam, LABEL_CHANNEL, LABEL_STATUS, malam, MENEMPATI, rupiah, tambahHari, tglPendek, type Channel } from "@/lib/booking";
import { bolehCatat, bolehLayar, lihatRupiah } from "@/lib/peran";
import { api } from "../api";
import { useData } from "../data";
import { WARNA_CHANNEL, WARNA_STATUS } from "../gaya";
import type { Pesanan } from "../tipe";
import { cx, Galat, Kartu, Kosong, Label, Memuat, Pil, Tombol, useToast } from "../ui";

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const PER_HARI = 4;
const TAMPIL = (p: Pesanan) => !["CANCELLED", "NO_SHOW"].includes(p.status);

export default function Kalender() {
  const { akun, kamar, pesanan, memuat, galat, tanpaDb, muat, bukaPesanan, bukaForm } = useData();
  const toast = useToast();
  const hari = hariIniWit();
  const [bulan, setBulan] = useState(hari.slice(0, 7));
  const [saring, setSaring] = useState<Channel[]>([]);
  const [pilih, setPilih] = useState(hari);
  const [sinkron, setSinkron] = useState(false);
  const rp = lihatRupiah(akun.peran);
  const catat = bolehCatat(akun.peran);

  const awal = bulan + "-01";
  const akhir = tambahHari(awal.slice(0, 8) + "28", 4).slice(0, 8) + "01";
  const hariBulan = malam(awal, akhir);
  const geser = (n: number) => {
    const d = new Date(awal + "T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + n);
    setBulan(d.toISOString().slice(0, 7));
  };

  const terlihat = useMemo(() => pesanan.filter((p) => TAMPIL(p) && (saring.length === 0 || saring.includes(p.channel))), [pesanan, saring]);

  const stat = useMemo(() => {
    const aktif = kamar.filter((k) => k.isActive).length;
    const isi = pesanan.filter((p) => MENEMPATI.includes(p.status) && p.status !== "BLOCKED" && p.checkIn < akhir && p.checkOut > awal);
    let malamTerjual = 0;
    let pendapatan = 0;
    for (const p of isi) {
      const m = malam(p.checkIn, p.checkOut);
      const di = m.filter((t) => t >= awal && t < akhir).length;
      malamTerjual += di;
      if (p.totalAmount) pendapatan += (p.totalAmount * di) / m.length;
    }
    const tujuh = tambahHari(hari, 7);
    const sah = pesanan.filter((p) => !["CANCELLED", "NO_SHOW", "BLOCKED"].includes(p.status));
    const piutang = sah
      .filter((p) => ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"].includes(p.status) && p.totalAmount && p.checkIn <= hari)
      .reduce((n, p) => n + Math.max(0, (p.totalAmount ?? 0) - p.payments.reduce((m, x) => m + (x.kind === "REFUND" ? -x.amount : x.amount), 0)), 0);
    return {
      okupansi: aktif ? malamTerjual / (aktif * hariBulan.length) : 0,
      malamTerjual,
      pendapatan,
      baru: sah.filter((p) => p.createdAt.slice(0, 10) > tambahHari(hari, -7)).length,
      tiba: sah.filter((p) => p.checkIn >= hari && p.checkIn < tujuh).length,
      piutang,
    };
  }, [kamar, pesanan, awal, akhir, hariBulan.length, hari]);

  /* Selalu 6 baris x 7 hari, mulai Minggu, supaya tinggi kisi tidak berubah antarbulan. */
  const sel = useMemo(() => {
    const mulaiDow = new Date(awal + "T00:00:00Z").getUTCDay();
    const pertama = tambahHari(awal, -mulaiDow);
    const urutKamar = new Map(kamar.map((k, i) => [k.id, i]));
    const aktif = kamar.filter((k) => k.isActive).length;
    return Array.from({ length: 42 }, (_, i) => {
      const t = tambahHari(pertama, i);
      const di = terlihat
        .filter((p) => p.checkIn <= t && t < p.checkOut)
        .sort((a, b) => (urutKamar.get(a.roomId) ?? 0) - (urutKamar.get(b.roomId) ?? 0) || a.id.localeCompare(b.id));
      const isi = new Set(di.filter((p) => MENEMPATI.includes(p.status) && p.status !== "BLOCKED").map((p) => p.roomId)).size;
      return { t, diBulan: t.startsWith(bulan), di, isi, kapasitas: aktif, bentrok: di.some((p) => p.status === "CONFLICT") };
    });
  }, [awal, bulan, kamar, terlihat]);

  const bentrok = useMemo(() => pesanan.filter((p) => p.status === "CONFLICT" && p.checkOut > hari).sort((a, b) => a.checkIn.localeCompare(b.checkIn)), [pesanan, hari]);
  const tibaDekat = useMemo(
    () => pesanan.filter((p) => !["CANCELLED", "NO_SHOW", "BLOCKED"].includes(p.status) && p.checkIn >= hari && p.checkIn < tambahHari(hari, 8)).sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.roomName.localeCompare(b.roomName)),
    [pesanan, hari],
  );

  const aktivitas = useMemo(() => {
    const aktif = pesanan.filter((p) => MENEMPATI.includes(p.status) || p.status === "TENTATIVE" || p.status === "CONFLICT").filter((p) => p.status !== "BLOCKED");
    return {
      tiba: aktif.filter((p) => p.checkIn === pilih),
      pulang: aktif.filter((p) => p.checkOut === pilih),
      menginap: aktif.filter((p) => p.checkIn < pilih && pilih < p.checkOut),
      kosong: kamar.filter((k) => k.isActive && !pesanan.some((p) => p.roomId === k.id && MENEMPATI.includes(p.status) && p.checkIn <= pilih && pilih < p.checkOut)),
    };
  }, [pesanan, kamar, pilih]);

  async function sinkronkan() {
    setSinkron(true);
    try {
      const r = await api<{ hasil: { ok?: boolean; createdCount?: number; updatedCount?: number; cancelledCount?: number; galat?: string }[] }>("/api/sinkron/jalankan", { body: { semua: true } });
      const gagal = r.hasil.filter((x) => !x.ok).length;
      const baru = r.hasil.reduce((n, x) => n + (x.createdCount ?? 0), 0);
      toast(r.hasil.length === 0 ? "Belum ada sambungan OTA." : `Sinkron selesai: ${baru} pesanan baru${gagal ? `, ${gagal} sambungan gagal` : ""}.`, gagal ? "galat" : "biasa");
      await muat();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    } finally {
      setSinkron(false);
    }
  }

  if (memuat) return <Memuat />;
  if (tanpaDb) return <Galat pesan={`${galat} Buka Ringkasan atau Pengaturan untuk melihat diagnosis database.`} />;
  if (galat) return <Galat pesan={galat} ulang={muat} />;

  const judulBulan = `${BULAN_PANJANG[Number(bulan.slice(5)) - 1]} ${bulan.slice(0, 4)}`;
  const kapanTiba = (t: string) => (t === hari ? "Hari ini" : t === tambahHari(hari, 1) ? "Besok" : tglPendek(t));
  const Stat = ({ label, nilai }: { label: string; nilai: string }) => (
    <div>
      <p className="text-[11px] text-panel-redup">{label}</p>
      <p className="angka text-[19px] font-bold leading-tight">{nilai}</p>
    </div>
  );

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {bulan !== hari.slice(0, 7) && <Tombol kecil varian="hantu" onClick={() => { setBulan(hari.slice(0, 7)); setPilih(hari); }}>Kembali ke hari ini</Tombol>}
        {bolehLayar(akun.peran, "sinkron") && <Tombol varian="garis" disabled={sinkron} onClick={sinkronkan}>{sinkron ? "Menyinkronkan…" : "Sinkronkan OTA"}</Tombol>}
        {catat && <Tombol varian="garis" onClick={() => bukaForm({ channel: "BLOCK", status: "BLOCKED", checkIn: pilih })}>Tutup kamar</Tombol>}
        {catat && <Tombol onClick={() => bukaForm({ checkIn: pilih >= hari ? pilih : hari })}>+ Pesanan</Tombol>}
      </div>

      {bentrok.length > 0 && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border-2 border-panel-merah bg-panel-merah px-4 py-3.5 text-white shadow-[0_6px_18px_-6px_rgba(176,56,38,.55)] sm:flex-row sm:items-center">
          <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-panel-merah">!</span>
          <p className="flex-1 text-[14.5px] font-bold leading-snug">
            {bentrok.length} pesanan bentrok. Terdekat: {bentrok[0].roomName} terjual dua kali pada {tglPendek(bentrok[0].checkIn)} sampai {tglPendek(bentrok[0].checkOut)}.
          </p>
          <button type="button" onClick={() => bukaPesanan(bentrok[0].id)} className="shrink-0 rounded-xl bg-white px-4 py-2 text-[13px] font-bold text-panel-merah hover:bg-red-50">Tinjau</button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <button type="button" onClick={() => geser(-1)} className="grid size-9 place-items-center rounded-xl bg-white ring-1 ring-panel-garis hover:bg-panel-lembut" aria-label="Bulan sebelumnya">‹</button>
            <button type="button" onClick={() => geser(1)} className="grid size-9 place-items-center rounded-xl bg-white ring-1 ring-panel-garis hover:bg-panel-lembut" aria-label="Bulan berikutnya">›</button>
          </div>
          <h1 className="text-[22px] font-bold">{judulBulan}</h1>
        </div>
        <div className="grid w-full grid-cols-2 gap-x-6 gap-y-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-panel-garis sm:ml-auto sm:flex sm:w-auto sm:flex-wrap sm:gap-6 sm:bg-transparent sm:p-0 sm:ring-0">
          <Stat label="Okupansi bulan ini" nilai={`${Math.round(stat.okupansi * 100)}%`} />
          <Stat label="Malam terjual" nilai={`${stat.malamTerjual} malam`} />
          {rp && <Stat label="Pendapatan" nilai={rupiah(stat.pendapatan)} />}
          <Stat label="Pesanan baru 7 hari" nilai={String(stat.baru)} />
          <Stat label="Tiba 7 hari" nilai={String(stat.tiba)} />
          {rp && <Stat label="Piutang berjalan" nilai={rupiah(stat.piutang)} />}
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Saring sumber">
        {CHANNEL.filter((c) => pesanan.some((p) => p.channel === c)).map((c) => {
          const on = saring.includes(c);
          return (
            <button key={c} type="button" onClick={() => setSaring(on ? saring.filter((x) => x !== c) : [...saring, c])} aria-pressed={on} className={cx("flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ring-1 transition", on ? "bg-panel-utama text-white ring-panel-utama" : "bg-white text-panel-tinta ring-panel-garis hover:bg-panel-lembut")}>
              <i className="size-2.5 rounded-full" style={{ background: WARNA_CHANNEL[c] }} />
              {LABEL_CHANNEL[c]}
            </button>
          );
        })}
        {saring.length > 0 && <button type="button" onClick={() => setSaring([])} className="px-2 text-sm font-bold text-panel-redup underline">Semua sumber</button>}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        {kamar.length === 0 ? (
          <Kartu><Kosong judul="Belum ada kamar" isi="Tambahkan cottage di menu Kamar & tarif dulu." /></Kartu>
        ) : (
          <div className="min-w-0">
            <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-panel-garis">
              <div className="grid grid-cols-7 bg-panel-latar">
                {HARI.map((h) => <div key={h} className="px-1 py-2 text-center text-[10px] font-bold uppercase tracking-[.08em] text-panel-redup sm:px-3 sm:py-2.5 sm:text-left sm:text-[11px]">{h}</div>)}
              </div>

              {/* Ponsel: peta kepadatan, ketuk tanggal untuk melihat namanya. */}
              <div className="grid grid-cols-7 sm:hidden">
                {sel.map((c) => (
                  <button
                    key={c.t}
                    type="button"
                    onClick={() => setPilih(c.t)}
                    aria-pressed={pilih === c.t}
                    aria-label={`${c.t}, ${c.isi} dari ${c.kapasitas} kamar terisi`}
                    className={cx("flex flex-col items-center gap-1 border-b border-r border-panel-garis/70 px-1 py-2", !c.diBulan && "bg-panel-latar/70", c.bentrok && "bg-panel-merah-lembut", pilih === c.t && "outline outline-2 -outline-offset-2 outline-emas-tua")}
                  >
                    <span className={cx("grid h-6 min-w-6 place-items-center rounded-full text-[13px] font-bold", c.t === hari ? "bg-panel-utama text-white" : c.diBulan ? "text-panel-tinta" : "text-panel-redup")}>{Number(c.t.slice(8))}</span>
                    <Meter c={c} />
                    <span className={cx("angka text-[10px]", c.bentrok ? "text-panel-merah" : "text-panel-redup")}>{c.diBulan && c.kapasitas ? `${c.isi}/${c.kapasitas}` : " "}</span>
                  </button>
                ))}
              </div>

              {/* Layar lebar: tiap tanggal memuat kartu tamu yang menginap malam itu. */}
              <div className="hidden overflow-x-auto sm:block">
                <div className="grid min-w-[700px] grid-cols-7">
                  {sel.map((c) => (
                    <div key={c.t} className={cx("relative min-h-[126px] border-b border-r border-panel-garis/70 px-2 py-2", !c.diBulan && "bg-panel-latar/70 opacity-60", c.bentrok && "bg-panel-merah-lembut", c.t === hari && "bg-panel-emas-lembut/50", pilih === c.t && "outline outline-2 -outline-offset-2 outline-emas-tua")}>
                      <button type="button" onClick={() => setPilih(c.t)} aria-pressed={pilih === c.t} title="Lihat semua pesanan pada tanggal ini" className="flex w-full items-center justify-between rounded-lg px-1 py-0.5 text-left hover:bg-panel-lembut">
                        <span className={cx("grid h-[26px] min-w-[26px] place-items-center rounded-full text-[13px]", c.t === hari ? "bg-panel-utama font-bold text-white" : "font-medium")}>{Number(c.t.slice(8))}</span>
                        {c.diBulan && c.kapasitas > 0 && <span className={cx("angka text-[10.5px]", c.isi >= c.kapasitas ? "font-bold text-panel-merah" : "text-panel-redup")}>{c.isi}/{c.kapasitas}</span>}
                      </button>
                      <div className="mt-1.5 flex flex-col gap-1">
                        {c.di.slice(0, PER_HARI).map((p) => {
                          const n = jumlahMalam(p.checkIn, p.checkOut);
                          const ke = jumlahMalam(p.checkIn, c.t) + 1;
                          const w = warnaChip(p);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => bukaPesanan(p.id)}
                              title={`${p.status === "BLOCKED" ? p.notes || "Ditutup" : p.guest?.name ?? p.code} · ${p.roomName} · ${LABEL_STATUS[p.status]} · ${p.checkIn} → ${p.checkOut}`}
                              className={cx("flex w-full min-w-0 flex-col overflow-hidden rounded-[7px] px-1.5 py-1 text-left transition hover:brightness-95", w.kelas)}
                              style={w.gaya}
                            >
                              <span className="flex w-full min-w-0 items-center gap-1.5">
                                <i className="h-3 w-[3px] shrink-0 rounded-sm" style={{ background: w.titik }} />
                                <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold">{p.status === "BLOCKED" ? "Ditutup" : (p.guest?.name ?? p.code).replace(/\s*\(demo\)$/, "").split(" ")[0]}</span>
                                {n > 1 && <span className="angka shrink-0 text-[9.5px] opacity-70" title={`Malam ke-${ke} dari ${n}`}>{ke}/{n}</span>}
                              </span>
                              <span className="truncate pl-2 text-[9.5px] opacity-75">{p.roomName}</span>
                            </button>
                          );
                        })}
                        {c.di.length > PER_HARI && (
                          <button type="button" onClick={() => setPilih(c.t)} className="self-start rounded px-1 text-[11px] text-panel-redup underline decoration-dotted underline-offset-2 hover:text-panel-utama">+{c.di.length - PER_HARI} lagi</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 px-1 text-xs text-panel-redup">
              <span className="sm:hidden">Ketuk tanggal untuk melihat siapa yang menginap dan kamar mana yang kosong.</span>
              {(["CONFIRMED", "TENTATIVE", "CHECKED_IN", "CHECKED_OUT", "CONFLICT", "BLOCKED"] as const).map((st) => {
                const w = warnaChip({ status: st, channel: "WEBSITE" } as Pesanan);
                return <span key={st} className="hidden items-center gap-1.5 sm:flex"><i className={cx("block h-3 w-5 rounded", w.kelas)} style={w.gaya} />{LABEL_STATUS[st]}</span>;
              })}
            </div>
          </div>
        )}

        <aside className="grid content-start gap-4">
          <Kartu judul={pilih === hari ? "Hari ini" : tglPendek(pilih)} ket={`${aktivitas.kosong.length} kamar kosong malam itu`}>
            {[
              ["Tiba", aktivitas.tiba],
              ["Pulang", aktivitas.pulang],
              ["Menginap", aktivitas.menginap],
            ].map(([judul, d]) => (
              <div key={judul as string} className="mb-4 last:mb-0">
                <Label>{judul as string} · {(d as Pesanan[]).length}</Label>
                {(d as Pesanan[]).length === 0 ? (
                  <p className="mt-1 text-sm text-panel-redup">Tidak ada.</p>
                ) : (
                  <ul className="mt-1 grid grid-cols-[minmax(0,1fr)] gap-1">
                    {(d as Pesanan[]).map((p) => (
                      <li key={p.id}>
                        <button type="button" onClick={() => bukaPesanan(p.id)} className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-panel-latar">
                          <span className="block min-w-0 flex-1 truncate"><b>{p.guest?.name ?? p.code}</b> <span className="text-panel-redup">· {p.roomName}</span></span>
                          {p.status !== "CONFIRMED" && <Pil nada={WARNA_STATUS[p.status].pil} className="shrink-0">{LABEL_STATUS[p.status]}</Pil>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {aktivitas.kosong.length > 0 && (
              <div className="mt-4 border-t border-panel-garis pt-4">
                <Label>Kosong</Label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {aktivitas.kosong.map((k) => (
                    <button key={k.id} type="button" disabled={!catat} onClick={() => bukaForm({ roomId: k.id, checkIn: pilih, checkOut: tambahHari(pilih, 2) })} className="rounded-full bg-panel-hijau-lembut px-3 py-1 text-xs font-bold text-panel-hijau hover:brightness-95">
                      {k.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Kartu>

          <Kartu judul={<span className="flex items-center gap-2">Tiba terdekat <span className="rounded-full bg-panel-lembut px-2 text-xs">{tibaDekat.length}</span></span>} ket="7 hari ke depan">
            {tibaDekat.length === 0 ? (
              <p className="text-sm text-panel-redup">Tidak ada tamu tiba dalam 7 hari ke depan.</p>
            ) : (
              <ul className="grid max-h-[26rem] gap-2 overflow-y-auto pr-1">
                {tibaDekat.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => bukaPesanan(p.id)} className="w-full rounded-2xl bg-panel-latar px-3.5 py-2.5 text-left hover:bg-panel-lembut">
                      <span className="flex items-center gap-2">
                        <i className="size-2 shrink-0 rounded-full" style={{ background: WARNA_CHANNEL[p.channel] }} />
                        <b className="min-w-0 flex-1 truncate text-sm">{p.guest?.name ?? p.code}</b>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${WARNA_CHANNEL[p.channel]}1F`, color: WARNA_CHANNEL[p.channel] }}>{LABEL_CHANNEL[p.channel]}</span>
                      </span>
                      <span className="mt-0.5 block pl-4 text-xs text-panel-redup">
                        <b className={p.checkIn <= tambahHari(hari, 1) ? "text-panel-hijau" : "font-normal"}>{kapanTiba(p.checkIn)}</b> · {p.roomName} · {tglPendek(p.checkIn)} – {tglPendek(p.checkOut)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Kartu>
        </aside>
      </div>
    </div>
  );
}

/** Kepadatan satu hari sebagai batang, untuk ponsel. */
function Meter({ c }: { c: { diBulan: boolean; isi: number; kapasitas: number; bentrok: boolean } }) {
  if (!c.diBulan || !c.kapasitas) return <div className="h-[5px]" />;
  const r = Math.min(1, c.isi / c.kapasitas);
  return (
    <div className="h-[5px] w-full overflow-hidden rounded-full bg-panel-garis" role="img" aria-label={`${c.isi} dari ${c.kapasitas} kamar terisi`}>
      <div className="h-full rounded-full" style={{ width: `${r > 0 ? Math.max(r * 100, 14) : 0}%`, background: c.bentrok ? "#B03826" : c.isi >= c.kapasitas ? "#B5893B" : "#2F7A4F" }} />
    </div>
  );
}

/** Warna kartu tamu: warna sumber (Booking.com, WhatsApp, …), ditimpa status yang perlu menonjol. */
function warnaChip(p: Pesanan): { kelas: string; gaya?: React.CSSProperties; titik: string } {
  const w = WARNA_CHANNEL[p.channel];
  switch (p.status) {
    case "CONFLICT":
      return { kelas: "text-[#B04A3A]", gaya: { background: "#FBE3DA" }, titik: "#DC2626" };
    case "BLOCKED":
      return { kelas: "bg-[repeating-linear-gradient(135deg,#e5e2da_0_6px,#f4f3ef_6px_12px)] text-panel-redup", titik: "#9CA3AF" };
    case "TENTATIVE":
      return { kelas: "border border-dashed border-panel-kuning/60 bg-panel-kuning-lembut text-panel-kuning", titik: w };
    case "CHECKED_OUT":
      return { kelas: "text-panel-redup", gaya: { background: "#EEECE6" }, titik: w };
    case "CHECKED_IN":
      return { kelas: "text-panel-tinta ring-1 ring-inset ring-panel-hijau/40", gaya: { background: `${w}24` }, titik: w };
    default:
      return { kelas: "text-panel-tinta", gaya: { background: `${w}1F` }, titik: w };
  }
}
