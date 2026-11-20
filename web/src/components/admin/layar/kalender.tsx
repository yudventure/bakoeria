"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BULAN_PANJANG, CHANNEL, hariIniWit, jumlahMalam, LABEL_CHANNEL, LABEL_STATUS, malam, MENEMPATI, rupiah, tambahHari, tglPendek, type Channel } from "@/lib/booking";
import { bolehCatat, bolehLayar, lihatRupiah } from "@/lib/peran";
import { api } from "../api";
import { useData } from "../data";
import { WARNA_CHANNEL, WARNA_STATUS } from "../gaya";
import type { Pesanan } from "../tipe";
import { Angka, cx, Galat, Kartu, Kosong, Label, Memuat, Pil, Tombol, useToast } from "../ui";

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const LEBAR = 46;
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
  const papan = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);

  const awal = bulan + "-01";
  const akhir = tambahHari(awal.slice(0, 8) + "28", 4).slice(0, 8) + "01";
  const hariBulan = malam(awal, akhir);
  const geser = (n: number) => {
    const d = new Date(awal + "T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + n);
    setBulan(d.toISOString().slice(0, 7));
  };

  /* Papan digulir supaya hari ini terlihat, dengan dua hari ke belakang sebagai konteks. */
  useEffect(() => {
    const el = papan.current;
    if (!el) return;
    el.scrollLeft = bulan === hari.slice(0, 7) ? Math.max(0, (Number(hari.slice(8)) - 3) * LEBAR) : 0;
    if (strip.current) strip.current.scrollLeft = bulan === hari.slice(0, 7) ? Math.max(0, (Number(hari.slice(8)) - 2) * 52) : 0;
  }, [bulan, hari, memuat]);

  const terlihat = useMemo(() => pesanan.filter((p) => TAMPIL(p) && (saring.length === 0 || saring.includes(p.channel))), [pesanan, saring]);
  const dalamBulan = terlihat.filter((p) => p.checkIn < akhir && p.checkOut > awal);

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
    return { okupansi: aktif ? malamTerjual / (aktif * hariBulan.length) : 0, malamTerjual, pendapatan };
  }, [kamar, pesanan, awal, akhir, hariBulan.length]);

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
  if (tanpaDb) return <Galat pesan="Database belum tersambung. Isi DATABASE_URL di panel Node.js Hostinger." />;
  if (galat) return <Galat pesan={galat} ulang={muat} />;

  const judulBulan = `${BULAN_PANJANG[Number(bulan.slice(5)) - 1]} ${bulan.slice(0, 4)}`;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => geser(-1)} className="grid size-10 place-items-center rounded-full bg-white ring-1 ring-panel-garis hover:bg-panel-lembut" aria-label="Bulan sebelumnya">‹</button>
          <h1 className="min-w-44 text-center text-2xl font-bold">{judulBulan}</h1>
          <button onClick={() => geser(1)} className="grid size-10 place-items-center rounded-full bg-white ring-1 ring-panel-garis hover:bg-panel-lembut" aria-label="Bulan berikutnya">›</button>
          {bulan !== hari.slice(0, 7) && <Tombol kecil varian="hantu" onClick={() => { setBulan(hari.slice(0, 7)); setPilih(hari); }}>Hari ini</Tombol>}
        </div>
        <div className="flex flex-wrap gap-2">
          {bolehLayar(akun.peran, "sinkron") && <Tombol varian="garis" disabled={sinkron} onClick={sinkronkan}>{sinkron ? "Menyinkronkan…" : "Sinkronkan OTA"}</Tombol>}
          {catat && <Tombol varian="garis" onClick={() => bukaForm({ channel: "BLOCK", status: "BLOCKED", checkIn: pilih })}>Tutup kamar</Tombol>}
          {catat && <Tombol onClick={() => bukaForm({ checkIn: pilih >= hari ? pilih : hari })}>+ Pesanan</Tombol>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Angka label="Okupansi bulan ini" nilai={`${Math.round(stat.okupansi * 100)}%`} />
        <Angka label="Malam terjual" nilai={stat.malamTerjual} />
        {rp && <Angka label="Pendapatan bulan ini" nilai={rupiah(stat.pendapatan)} ket="dibagi rata per malam" />}
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Saring sumber">
        {CHANNEL.filter((c) => pesanan.some((p) => p.channel === c)).map((c) => {
          const on = saring.includes(c);
          return (
            <button key={c} onClick={() => setSaring(on ? saring.filter((x) => x !== c) : [...saring, c])} className={cx("flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ring-1 transition", on ? "bg-panel-utama text-white ring-panel-utama" : "bg-white text-panel-tinta ring-panel-garis")}>
              <i className="size-2.5 rounded-full" style={{ background: WARNA_CHANNEL[c] }} />
              {LABEL_CHANNEL[c]}
            </button>
          );
        })}
        {saring.length > 0 && <button onClick={() => setSaring([])} className="px-2 text-sm font-bold text-panel-redup underline">Semua sumber</button>}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Papan kamar × tanggal (layar lebar) */}
        <Kartu className="hidden p-0 sm:block sm:p-0">
          {kamar.length === 0 ? (
            <div className="p-6"><Kosong judul="Belum ada kamar" isi="Tambahkan cottage di menu Kamar & tarif dulu." /></div>
          ) : (
            <div className="overflow-x-auto" ref={papan}>
              <div className="relative" style={{ width: 168 + hariBulan.length * LEBAR }}>
                <div className="sticky top-0 z-10 flex border-b border-panel-garis bg-white">
                  <div className="sticky left-0 z-10 w-[168px] shrink-0 bg-white px-4 py-3"><Label>Kamar</Label></div>
                  {hariBulan.map((t) => {
                    const dow = new Date(t + "T00:00:00Z").getUTCDay();
                    return (
                      <button key={t} onClick={() => setPilih(t)} style={{ width: LEBAR }} className={cx("shrink-0 py-2 text-center", t === pilih && "bg-panel-emas-lembut", dow === 0 || dow === 6 ? "text-panel-tinta" : "text-panel-redup")}>
                        <span className="block text-[10px] font-bold uppercase">{HARI[dow]}</span>
                        <span className={cx("angka mx-auto mt-0.5 grid size-7 place-items-center rounded-full text-sm font-bold", t === hari && "bg-panel-utama text-white")}>{Number(t.slice(8))}</span>
                      </button>
                    );
                  })}
                </div>
                {kamar.map((k) => (
                  <div key={k.id} className="relative flex h-14 border-b border-panel-garis last:border-0">
                    <div className="sticky left-0 z-[5] flex w-[168px] shrink-0 flex-col justify-center bg-white px-4">
                      <span className="truncate text-sm font-bold">{k.name}</span>
                      <span className="truncate text-xs text-panel-redup">{k.isActive ? k.roomType ?? `${k.capAdult + k.capChild} tamu` : "Nonaktif"}</span>
                    </div>
                    {hariBulan.map((t) => (
                      <button
                        key={t}
                        aria-label={`${k.name} ${t}`}
                        onClick={() => {
                          setPilih(t);
                          if (catat && k.isActive) bukaForm({ roomId: k.id, checkIn: t, checkOut: tambahHari(t, 2) });
                        }}
                        style={{ width: LEBAR }}
                        className={cx("shrink-0 border-l border-panel-garis/60 hover:bg-panel-lembut", t === pilih && "bg-panel-emas-lembut/60", !k.isActive && "bg-panel-latar", t < hari && "bg-panel-latar/50")}
                      />
                    ))}
                    {dalamBulan
                      .filter((p) => p.roomId === k.id)
                      .map((p) => {
                        const mulai = Math.max(0, jumlahMalam(awal, p.checkIn));
                        const selesai = Math.min(hariBulan.length, jumlahMalam(awal, p.checkOut));
                        const potongKiri = p.checkIn < awal;
                        const potongKanan = p.checkOut > akhir;
                        return (
                          <button
                            key={p.id}
                            onClick={() => bukaPesanan(p.id)}
                            title={`${p.guest?.name ?? p.code} · ${LABEL_STATUS[p.status]} · ${p.checkIn} → ${p.checkOut}`}
                            className={cx("absolute top-2 z-[6] flex h-10 items-center gap-1.5 overflow-hidden px-2 text-left text-xs font-bold shadow-sm transition hover:brightness-110", WARNA_STATUS[p.status].chip, potongKiri ? "rounded-l-none" : "rounded-l-xl", potongKanan ? "rounded-r-none" : "rounded-r-xl")}
                            style={{ left: 168 + mulai * LEBAR + (potongKiri ? 0 : LEBAR / 2), width: (selesai - mulai) * LEBAR - (potongKiri ? 0 : LEBAR / 2) + (potongKanan ? 0 : LEBAR / 2) - 3 }}
                          >
                            <i className="size-2 shrink-0 rounded-full ring-1 ring-white/70" style={{ background: WARNA_CHANNEL[p.channel] }} />
                            <span className="truncate">{p.status === "BLOCKED" ? p.notes || "Ditutup" : p.guest?.name ?? p.code}</span>
                          </button>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Kartu>

        {/* Daftar per hari (ponsel) */}
        <div className="grid gap-3 sm:hidden">
          <div ref={strip} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
            {hariBulan.map((t) => {
              const isi = new Set(terlihat.filter((p) => MENEMPATI.includes(p.status) && p.checkIn <= t && t < p.checkOut).map((p) => p.roomId)).size;
              return (
                <button key={t} onClick={() => setPilih(t)} className={cx("w-12 shrink-0 rounded-2xl py-2 text-center", t === pilih ? "bg-panel-utama text-white" : "bg-white ring-1 ring-panel-garis")}>
                  <span className="block text-[10px] font-bold uppercase opacity-70">{HARI[new Date(t + "T00:00:00Z").getUTCDay()]}</span>
                  <span className="angka block font-bold">{Number(t.slice(8))}</span>
                  <span className="mx-auto mt-1 block h-1 w-6 overflow-hidden rounded-full bg-current/15">
                    <i className="block h-full bg-emas" style={{ width: `${kamar.length ? (isi / kamar.length) * 100 : 0}%` }} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

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
                  <ul className="mt-1 grid gap-1">
                    {(d as Pesanan[]).map((p) => (
                      <li key={p.id}>
                        <button onClick={() => bukaPesanan(p.id)} className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-panel-latar">
                          <span className="min-w-0 truncate"><b>{p.guest?.name ?? p.code}</b> <span className="text-panel-redup">· {p.roomName}</span></span>
                          {p.status !== "CONFIRMED" && <Pil nada={WARNA_STATUS[p.status].pil}>{LABEL_STATUS[p.status]}</Pil>}
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
                    <button key={k.id} disabled={!catat} onClick={() => bukaForm({ roomId: k.id, checkIn: pilih, checkOut: tambahHari(pilih, 2) })} className="rounded-full bg-panel-hijau-lembut px-3 py-1 text-xs font-bold text-panel-hijau hover:brightness-95">
                      {k.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Kartu>
          <div className="flex flex-wrap gap-x-4 gap-y-2 px-1 text-xs text-panel-redup">
            {(["CONFIRMED", "TENTATIVE", "CHECKED_IN", "CONFLICT", "BLOCKED"] as const).map((s) => (
              <span key={s} className="flex items-center gap-1.5"><i className={cx("block h-3 w-5 rounded", WARNA_STATUS[s].chip)} />{LABEL_STATUS[s]}</span>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
