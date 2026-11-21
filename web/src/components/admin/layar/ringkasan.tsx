"use client";

import { useMemo } from "react";
import { hariIniWit, jumlahMalam, LABEL_STATUS, malam, MENEMPATI, rupiah, tambahHari, tglPendek } from "@/lib/booking";
import { bolehLayar, lihatRupiah } from "@/lib/peran";
import { useData } from "../data";
import { LABEL_LAYAR } from "../rangka";
import { Angka, Galat, Kartu, Kosong, Label, Memuat, Pil, Tombol } from "../ui";
import { WARNA_STATUS } from "../gaya";

export default function Ringkasan() {
  const { akun, kamar, pesanan, memuat, galat, tanpaDb, muat, bukaPesanan, keLayar, bukaForm } = useData();
  const hari = hariIniWit();
  const jam = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Jayapura" }));
  const salam = jam < 11 ? "Selamat pagi" : jam < 15 ? "Selamat siang" : jam < 19 ? "Selamat sore" : "Selamat malam";
  const rp = lihatRupiah(akun.peran);

  const s = useMemo(() => {
    const aktifKamar = kamar.filter((k) => k.isActive);
    const menempati = pesanan.filter((p) => MENEMPATI.includes(p.status) && p.status !== "BLOCKED");
    const bulan = hari.slice(0, 7);
    const bulanIni = pesanan.filter((p) => p.checkIn.startsWith(bulan) && !["CANCELLED", "NO_SHOW", "BLOCKED"].includes(p.status));
    const malamTerisi = (tgl: string) => new Set(menempati.filter((p) => p.checkIn <= tgl && tgl < p.checkOut).map((p) => p.roomId)).size;
    const tigaPuluh = malam(hari, tambahHari(hari, 30));
    const okupansi = aktifKamar.length ? tigaPuluh.reduce((n, t) => n + malamTerisi(t), 0) / (aktifKamar.length * 30) : 0;
    const tiga = tambahHari(hari, 3);
    return {
      malamIni: malamTerisi(hari),
      jumlahKamar: aktifKamar.length,
      tibaHariIni: menempati.filter((p) => p.checkIn === hari).length,
      okupansi,
      bulanIni: bulanIni.length,
      nilaiBulan: bulanIni.reduce((n, p) => n + (p.totalAmount ?? 0), 0),
      tahanan: pesanan.filter((p) => p.status === "TENTATIVE"),
      bentrok: pesanan.filter((p) => p.status === "CONFLICT" && p.checkOut >= hari),
      tahananDekat: pesanan.filter((p) => p.status === "TENTATIVE" && p.checkIn <= tiga && p.checkOut >= hari),
      tiba: menempati.filter((p) => p.checkIn >= hari && p.checkIn <= tiga).sort((a, b) => a.checkIn.localeCompare(b.checkIn)),
      piutang: pesanan
        .filter((p) => ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"].includes(p.status) && p.totalAmount && p.checkIn <= tambahHari(hari, 7))
        .map((p) => ({ p, sisa: (p.totalAmount ?? 0) - p.payments.reduce((n, x) => n + (x.kind === "REFUND" ? -x.amount : x.amount), 0) }))
        .filter((x) => x.sisa > 0)
        .sort((a, b) => a.p.checkIn.localeCompare(b.p.checkIn)),
    };
  }, [kamar, pesanan, hari]);

  const perlu = [...s.bentrok, ...s.tahananDekat];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jayapura" })}</Label>
          <h1 className="mt-1 text-3xl font-bold">{salam}, {akun.nama.split(" ")[0]}.</h1>
        </div>
        {bolehLayar(akun.peran, "kalender") && ["developer", "pemilik", "manajer", "resepsionis"].includes(akun.peran) && <Tombol onClick={() => bukaForm(null)}>+ Pesanan baru</Tombol>}
      </div>

      {!bolehLayar(akun.peran, "kalender") ? (
        <Kartu judul="Menu Anda">
          <p className="text-sm text-panel-redup">Peran Anda membuka menu berikut.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["website", "laporan", "keuangan"] as const).filter((l) => bolehLayar(akun.peran, l)).map((l) => (
              <Tombol key={l} varian="garis" onClick={() => keLayar(l)}>{LABEL_LAYAR[l]}</Tombol>
            ))}
          </div>
        </Kartu>
      ) : memuat ? (
        <Memuat />
      ) : tanpaDb ? (
        <Kartu judul="Database belum diatur">
          <p className="text-sm text-panel-redup">Kalender, pesanan, dan laporan membutuhkan database MySQL. Buat database di hPanel (Databases, MySQL Databases), lalu isi <b>DB_NAME</b>, <b>DB_USER</b>, dan <b>DB_PASSWORD</b> di panel Node.js Hostinger dan jalankan ulang aplikasinya. Tabelnya dibuat sendiri.</p>
        </Kartu>
      ) : galat ? (
        <Galat pesan={galat} ulang={muat} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Angka label="Terisi malam ini" nilai={`${s.malamIni}/${s.jumlahKamar}`} ket="kamar aktif" />
            <Angka label="Tiba hari ini" nilai={s.tibaHariIni} ket={s.tibaHariIni ? "lihat daftar di bawah" : "tidak ada"} />
            <Angka label="Okupansi 30 hari" nilai={`${Math.round(s.okupansi * 100)}%`} ket="dari hari ini" />
            {rp ? <Angka label="Nilai pesanan bulan ini" nilai={rupiah(s.nilaiBulan)} ket={`${s.bulanIni} pesanan tiba bulan ini`} /> : <Angka label="Pesanan bulan ini" nilai={s.bulanIni} ket="tiba bulan ini" />}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Kartu judul="Perlu perhatian" ket="Bentrok dari OTA dan tahanan yang tiba dalam 3 hari.">
              {perlu.length === 0 ? (
                <Kosong judul="Semua beres" isi="Tidak ada bentrok atau tahanan yang mendesak." />
              ) : (
                <ul className="grid gap-2">
                  {perlu.map((p) => (
                    <li key={p.id}>
                      <button onClick={() => bukaPesanan(p.id)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-panel-latar px-4 py-3 text-left hover:bg-panel-lembut">
                        <span className="min-w-0">
                          <span className="block truncate font-bold">{p.guest?.name ?? p.code}</span>
                          <span className="text-sm text-panel-redup">{p.roomName} · {tglPendek(p.checkIn)} sampai {tglPendek(p.checkOut)}</span>
                        </span>
                        <Pil nada={WARNA_STATUS[p.status].pil}>{LABEL_STATUS[p.status]}</Pil>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Kartu>

            <Kartu judul="Tiba dalam 3 hari" aksi={<Tombol kecil varian="garis" onClick={() => keLayar("kalender")}>Buka kalender</Tombol>}>
              {s.tiba.length === 0 ? (
                <Kosong judul="Belum ada tamu yang tiba" />
              ) : (
                <ul className="grid gap-2">
                  {s.tiba.map((p) => (
                    <li key={p.id}>
                      <button onClick={() => bukaPesanan(p.id)} className="flex w-full items-center gap-4 rounded-2xl bg-panel-latar px-4 py-3 text-left hover:bg-panel-lembut">
                        <span className="w-14 shrink-0 text-center">
                          <span className="block text-[11px] font-bold uppercase text-emas-tua">{p.checkIn === hari ? "Hari ini" : tglPendek(p.checkIn).split(" ")[1]}</span>
                          <span className="angka block text-xl font-bold">{Number(p.checkIn.slice(8))}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold">{p.guest?.name ?? p.code}</span>
                          <span className="text-sm text-panel-redup">{p.roomName} · {jumlahMalam(p.checkIn, p.checkOut)} malam{p.pax ? ` · ${p.pax} tamu` : ""}{p.dives ? ` · ${p.dives} selam` : ""}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Kartu>
          </div>

          {rp && s.piutang.length > 0 && (
            <Kartu judul="Belum lunas" ket="Pesanan yang tiba sampai 7 hari ke depan dan masih ada sisa tagihan.">
              <ul className="divide-y divide-panel-garis">
                {s.piutang.slice(0, 8).map(({ p, sisa }) => (
                  <li key={p.id}>
                    <button onClick={() => bukaPesanan(p.id)} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:text-panel-utama">
                      <span className="min-w-0 truncate"><b>{p.guest?.name ?? p.code}</b> <span className="text-sm text-panel-redup">· {tglPendek(p.checkIn)} · {p.roomName}</span></span>
                      <b className="angka shrink-0">{rupiah(sisa)}</b>
                    </button>
                  </li>
                ))}
              </ul>
            </Kartu>
          )}
        </>
      )}
    </div>
  );
}
