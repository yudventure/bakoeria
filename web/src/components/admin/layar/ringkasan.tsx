"use client";

import { useEffect, useMemo, useState } from "react";
import { BULAN_PANJANG, hariIniWit, malam, MENEMPATI, rupiah, tambahHari, tglPendek } from "@/lib/booking";
import { hitungStok, type Rekaman } from "@/lib/modul";
import { aksesModul, bolehCatat, bolehLayar, LABEL_PERAN, layarUntuk, lihatRupiah, type Layar } from "@/lib/peran";
import { api } from "../api";
import { useData } from "../data";
import DataDemo from "../data-demo";
import DiagnosaDb from "../diagnosa-db";
import { IKON, Ikon, LABEL_LAYAR } from "../rangka";
import { Galat, Kartu, Memuat, Tombol } from "../ui";

/** Keterangan singkat di kartu pintasan. */
const KET_LAYAR: Partial<Record<Layar, string>> = {
  kalender: "Kamar terisi per tanggal",
  pesanan: "Daftar, cari, dan unduh pesanan",
  tamu: "Riwayat dan kontak tamu",
  kamar: "Kamar, tarif dasar, dan musim",
  sinkron: "Booking.com, Agoda, Airbnb",
  laporan: "Pendapatan dan okupansi",
  keuangan: "Pemasukan, pengeluaran, aset",
  sdm: "Pegawai, absensi, dan gaji",
  gudang: "Stok dan daftar belanja",
  website: "Isi website dua bahasa",
  statistik: "Pengunjung website dan negaranya",
  pengguna: "Akun dan hak akses staf",
  pengaturan: "Data resort dan server",
};

const AKTIF = (s: string) => !["CANCELLED", "NO_SHOW", "BLOCKED"].includes(s);

/** Salam menurut jam Papua (WIT), bukan jam perangkat. */
function salam(jam: number) {
  if (jam >= 4 && jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 18) return "Selamat sore";
  return "Selamat malam";
}

function JamLangsung() {
  /* Diisi setelah tampil: server tidak tahu jam berapa di Papua saat dibuka. */
  const [kini, setKini] = useState<Date | null>(null);
  useEffect(() => {
    setKini(new Date());
    const t = setInterval(() => setKini(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!kini) return <div className="h-[4.25rem]" aria-hidden />;
  const zona = { timeZone: "Asia/Jayapura" } as const;
  const jam = new Intl.DateTimeFormat("id-ID", { ...zona, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(kini).replace(/:/g, ".");
  const tgl = new Intl.DateTimeFormat("id-ID", { ...zona, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(kini);
  return (
    <div className="sm:text-right">
      <div className="angka text-[2.4rem] font-bold leading-none tracking-tight">{jam}</div>
      <div className="mt-1.5 text-sm text-white/80">{tgl} WIT</div>
    </div>
  );
}

function Ubin({ label, nilai, ket, gelap = false }: { label: string; nilai: string; ket?: string; gelap?: boolean }) {
  return (
    <div className={`rounded-3xl px-5 py-5 ring-1 ${gelap ? "bg-panel-utama text-white ring-panel-utama" : "bg-white text-panel-utama ring-panel-garis"}`}>
      <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${gelap ? "text-white/80" : "text-emas-tua"}`}>{label}</p>
      <p className="angka mt-2 text-[2rem] font-bold leading-tight">{nilai}</p>
      {ket && <p className={`mt-1 text-sm ${gelap ? "text-white/80" : "text-panel-utama/70"}`}>{ket}</p>}
    </div>
  );
}

const JudulKartu = ({ children }: { children: React.ReactNode }) => <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emas-tua">{children}</p>;

export default function Ringkasan() {
  const { akun, kamar, pesanan, memuat, galat, tanpaDb, muat, bukaPesanan, keLayar, bukaForm } = useData();
  const hari = hariIniWit();
  const rp = lihatRupiah(akun.peran);
  const adaKalender = bolehLayar(akun.peran, "kalender");
  const jam = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jayapura", hour: "2-digit", hour12: false }).format(new Date()));

  /* Stok gudang yang habis atau menipis, bila akun ini boleh melihat gudang. */
  const [stok, setStok] = useState<{ habis: number; menipis: number; contoh: string[] } | null>(null);
  const bolehGudang = !!aksesModul(akun.peran, "gudang");
  useEffect(() => {
    if (!bolehGudang) return;
    api<{ data: Record<string, Rekaman[]> }>("/api/modul/gudang")
      .then((r) => {
        const baris = hitungStok(r.data.barang ?? [], r.data.mutasi ?? [], 0).filter((b) => b.status !== "Cukup").sort((a, b) => (a.status === b.status ? a.nama.localeCompare(b.nama) : a.status === "Habis" ? -1 : 1));
        const habis = baris.filter((b) => b.status === "Habis").length;
        setStok(baris.length ? { habis, menipis: baris.length - habis, contoh: baris.slice(0, 3).map((b) => b.nama) } : null);
      })
      .catch(() => setStok(null));
  }, [bolehGudang]);

  const s = useMemo(() => {
    const aktif = pesanan.filter((p) => AKTIF(p.status));
    const bulan = hari.slice(0, 7);
    const dibulan = aktif.filter((p) => p.checkIn.startsWith(bulan));
    const diterima = dibulan.filter((p) => ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"].includes(p.status)).length;
    const menunggu = aktif.filter((p) => p.status === "TENTATIVE" && p.checkOut > hari);
    const tiga = tambahHari(hari, 3);
    const menempati = aktif.filter((p) => MENEMPATI.includes(p.status));
    const menginap = menempati.filter((p) => p.checkIn <= hari && hari < p.checkOut);
    const kamarAktif = kamar.filter((k) => k.isActive);
    const ids = new Set(kamarAktif.map((k) => k.id));
    const terisi = malam(hari, tambahHari(hari, 30)).reduce((n, t) => n + new Set(menempati.filter((p) => ids.has(p.roomId) && p.checkIn <= t && t < p.checkOut).map((p) => p.roomId)).size, 0);
    const tersedia = kamarAktif.length * 30;
    return {
      dibulan,
      diterima,
      menunggu,
      mendesak: menunggu.filter((p) => p.checkIn <= tiga),
      tiba: aktif.filter((p) => p.checkIn === hari),
      pulang: aktif.filter((p) => p.checkOut === hari),
      menginap,
      tamuMenginap: menginap.reduce((n, p) => n + (p.pax ?? 0), 0),
      paxKosong: menginap.some((p) => p.pax == null),
      kamarAktif: kamarAktif.length,
      terisi,
      tersedia,
      okupansi: tersedia ? Math.round((terisi / tersedia) * 100) : 0,
      terdekat: aktif.filter((p) => p.checkIn >= hari && p.checkIn <= tiga).sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.roomName.localeCompare(b.roomName)),
      bentrok: pesanan.filter((p) => p.status === "CONFLICT" && p.checkOut > hari),
    };
  }, [kamar, pesanan, hari]);

  const bulanNama = `${BULAN_PANJANG[Number(hari.slice(5, 7)) - 1]} ${hari.slice(0, 4)}`;
  const pintasan = layarUntuk(akun.peran).filter((l) => l !== "ringkasan");
  const sistem = ["developer", "pemilik"].includes(akun.peran);

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-panel-utama px-6 py-7 text-white sm:px-9 sm:py-9">
        <img aria-hidden="true" alt="" src="/brand/bakoeria-ukiran-lembah-putih.svg" className="pointer-events-none absolute -bottom-16 -right-40 w-[900px] max-w-none opacity-[0.08]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">{LABEL_PERAN[akun.peran]} · Bakoeria Dive Resort</p>
            <h1 className="mt-2 text-[1.9rem] font-bold leading-tight sm:text-4xl">{salam(jam)}, {akun.nama.split(" ")[0]}.</h1>
            <p className="mt-2 max-w-[34rem] text-[0.9375rem] leading-relaxed text-white/85">
              {adaKalender && !memuat && !tanpaDb
                ? s.menunggu.length
                  ? `${s.menunggu.length} pesanan menunggu konfirmasi.`
                  : "Tidak ada pesanan yang menunggu konfirmasi."
                : "Pilih halaman yang Anda butuhkan di bawah."}
            </p>
            {adaKalender && bolehCatat(akun.peran) && !tanpaDb && (
              <button type="button" onClick={() => bukaForm(null)} className="mt-5 rounded-full bg-emas px-5 py-2.5 text-sm font-bold text-panel-utama transition hover:brightness-105">+ Pesanan baru</button>
            )}
          </div>
          <JamLangsung />
        </div>
      </section>

      {adaKalender &&
        (memuat ? (
          <Memuat />
        ) : tanpaDb ? (
          <div className="grid gap-6">
            <Kartu judul="Database belum tersambung">
              <p className="text-sm text-panel-redup">{galat} Kalender, pesanan, dan laporan membutuhkan database MySQL dari hPanel (Databases, MySQL Databases). Isi <b>DB_NAME</b>, <b>DB_USER</b>, dan <b>DB_PASSWORD</b> di panel Node.js Hostinger, lalu jalankan ulang aplikasinya. Tabelnya dibuat sendiri.</p>
            </Kartu>
            {sistem && <DiagnosaDb />}
          </div>
        ) : galat ? (
          <Galat pesan={galat} ulang={muat} />
        ) : (
          <>
            {sistem && <DataDemo ringkas />}
            <section aria-label="Angka ringkasan" className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              <Ubin label="Pesanan bulan ini" nilai={String(s.dibulan.length)} ket={`Tiba di ${bulanNama}`} />
              <Ubin label="Dikonfirmasi" nilai={String(s.diterima)} ket={s.dibulan.length ? `${Math.round((s.diterima / s.dibulan.length) * 100)}% dari pesanan bulan ini` : "Belum ada pesanan"} />
              <Ubin label="Menunggu konfirmasi" nilai={String(s.menunggu.length)} ket={s.mendesak.length ? `${s.mendesak.length} tiba dalam 3 hari` : "Tidak ada yang mendesak"} />
              <Ubin label="Tiba hari ini" nilai={String(s.tiba.length)} ket={`${s.pulang.length} pulang, ${s.menginap.length} kamar terisi${s.tamuMenginap && !s.paxKosong ? `, ${s.tamuMenginap} tamu` : ""}`} />
              <Ubin label="Keterisian 30 hari" nilai={`${s.okupansi}%`} ket={`${s.terisi} dari ${s.tersedia} malam kamar`} />
              {rp ? (
                <Ubin label="Nilai pesanan bulan ini" nilai={rupiah(s.dibulan.reduce((n, p) => n + (p.totalAmount ?? 0), 0))} ket="Total semua pesanan yang tiba bulan ini" gelap />
              ) : (
                <Ubin label="Kamar terisi malam ini" nilai={`${s.menginap.length}/${s.kamarAktif}`} ket="Dari kamar aktif" gelap />
              )}
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-3xl bg-white p-5 ring-1 ring-panel-garis">
                <JudulKartu>Perlu perhatian</JudulKartu>
                {s.bentrok.length === 0 && s.mendesak.length === 0 && !stok ? (
                  <p className="mt-3 text-[0.9375rem] text-panel-utama/80">Tidak ada yang perlu dikejar.</p>
                ) : (
                  <ul className="mt-3 grid max-h-[18rem] gap-2 overflow-y-auto pr-1">
                    {s.bentrok.length > 0 && (
                      <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-panel-merah-lembut px-4 py-3 text-[0.9375rem] text-panel-merah">
                        <span className="min-w-0 flex-1">{s.bentrok.length} pesanan bentrok: kamar terjual dua kali pada malam yang sama.</span>
                        <button type="button" onClick={() => bukaPesanan(s.bentrok[0].id)} className="shrink-0 rounded-full bg-panel-merah px-4 py-1.5 text-[0.8125rem] font-bold text-white hover:opacity-90">Tinjau bentrok</button>
                      </li>
                    )}
                    {stok && (
                      <li className={`flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-[0.9375rem] ${stok.habis ? "bg-panel-merah-lembut text-panel-merah" : "bg-amber-100 text-amber-950"}`}>
                        <span className="min-w-0 flex-1">
                          <span className="font-semibold">{[stok.habis ? `${stok.habis} barang gudang habis` : "", stok.menipis ? `${stok.menipis} menipis` : ""].filter(Boolean).join(", ")}.</span> {stok.contoh.join(", ")}
                          {stok.habis + stok.menipis > stok.contoh.length ? ", dan lainnya" : ""}.
                        </span>
                        <button type="button" onClick={() => keLayar("gudang")} className={`shrink-0 rounded-full px-4 py-1.5 text-[0.8125rem] font-bold text-white hover:opacity-90 ${stok.habis ? "bg-panel-merah" : "bg-amber-600"}`}>Buka gudang</button>
                      </li>
                    )}
                    {s.mendesak.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-panel-latar px-4 py-3 text-[0.9375rem] text-panel-utama">
                        <span className="min-w-0 flex-1"><span className="font-semibold">{p.guest?.name ?? p.code}</span> belum dikonfirmasi, tiba {tglPendek(p.checkIn)} di {p.roomName}.</span>
                        <button type="button" onClick={() => bukaPesanan(p.id)} className="shrink-0 rounded-full bg-panel-utama px-4 py-1.5 text-[0.8125rem] font-bold text-white hover:opacity-90">Buka pesanan</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-3xl bg-white p-5 ring-1 ring-panel-garis">
                <JudulKartu>
                  Tiba terdekat
                  <span className="rounded-full bg-panel-lembut px-2 py-px normal-case tracking-normal text-panel-utama">{s.terdekat.length}</span>
                  <span className="ml-auto normal-case tracking-normal text-panel-utama/60">3 hari ke depan</span>
                </JudulKartu>
                {s.terdekat.length === 0 ? (
                  <p className="mt-3 text-[0.9375rem] text-panel-utama/80">Tidak ada tamu tiba dalam 3 hari ke depan.</p>
                ) : (
                  <ul className="mt-3 grid max-h-[18rem] gap-2 overflow-y-auto pr-1" aria-label="Tamu tiba dalam 3 hari ke depan">
                    {s.terdekat.map((p) => (
                      <li key={p.id}>
                        <button type="button" onClick={() => bukaPesanan(p.id)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-panel-latar px-4 py-3 text-left text-[0.9375rem] text-panel-utama hover:bg-panel-lembut">
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{p.guest?.name ?? p.code}</span>
                            <span className="block text-sm text-panel-utama/70">{p.roomName}</span>
                          </span>
                          <span className="shrink-0 font-semibold">{p.checkIn === hari ? "Hari ini" : p.checkIn === tambahHari(hari, 1) ? "Besok" : tglPendek(p.checkIn)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        ))}

      {pintasan.length > 0 && (
        <section aria-label="Halaman Anda" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pintasan.map((l) => (
            <button key={l} type="button" onClick={() => keLayar(l)} className="flex items-start gap-4 rounded-3xl bg-white p-5 text-left text-panel-utama ring-1 ring-panel-garis transition-colors hover:bg-panel-latar">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-panel-lembut text-emas-tua">
                <Ikon d={IKON[l]} />
              </span>
              <span>
                <span className="block text-[1.0625rem] font-semibold">{LABEL_LAYAR[l]}</span>
                {KET_LAYAR[l] && <span className="mt-0.5 block text-sm text-panel-utama/70">{KET_LAYAR[l]}</span>}
              </span>
            </button>
          ))}
        </section>
      )}
      {!adaKalender && pintasan.length === 0 && <Tombol varian="garis" onClick={() => keLayar("ringkasan")}>Muat ulang</Tombol>}
    </div>
  );
}
