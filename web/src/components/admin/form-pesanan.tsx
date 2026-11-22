"use client";

import PilihTanggal from "@/components/tanggal";
import { useEffect, useMemo, useState } from "react";
import { totalDenganAnak, CHANNEL, jumlahMalam, KOMISI_BAWAAN, LABEL_CHANNEL, LABEL_STATUS, MENEMPATI, rincianHarga, rupiah, tambahHari, tanggalSah, tumpang, hariIniWit, type Channel, type Status } from "@/lib/booking";
import { lihatRupiah } from "@/lib/peran";
import { api, GalatApi } from "./api";
import { useData } from "./data";
import type { Pesanan } from "./tipe";
import { Bidang, masukan, Modal, Tombol, useToast } from "./ui";

const STATUS_FORM: Status[] = ["TENTATIVE", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW", "BLOCKED"];

export default function FormPesanan() {
  const { formAwal, tutupForm, kamar, pesanan, ganti, akun, bukaPesanan } = useData();
  const toast = useToast();
  const buka = formAwal !== undefined;
  const ubahId = formAwal?.id;
  const rp = lihatRupiah(akun.peran);
  const hari = hariIniWit();

  const awal = () => ({
    roomId: formAwal?.roomId ?? kamar.find((k) => k.isActive)?.id ?? "",
    checkIn: formAwal?.checkIn ?? hari,
    checkOut: formAwal?.checkOut ?? tambahHari(formAwal?.checkIn ?? hari, 2),
    channel: (formAwal?.channel ?? "WHATSAPP") as Channel,
    status: (formAwal?.status ?? "CONFIRMED") as Status,
    pax: formAwal?.pax?.toString() ?? "2",
    paxChild: formAwal?.paxChild?.toString() ?? "",
    paxInfant: formAwal?.paxInfant?.toString() ?? "",
    dives: formAwal?.dives?.toString() ?? "",
    totalAmount: formAwal?.totalAmount?.toString() ?? "",
    otaCommissionEst: formAwal?.otaCommissionEst?.toString() ?? "",
    notes: formAwal?.notes ?? "",
    nama: formAwal?.guest?.name ?? "",
    telepon: formAwal?.guest?.phone ?? "",
    email: formAwal?.guest?.email ?? "",
    asal: formAwal?.guest?.origin ?? "",
    sertifikat: formAwal?.guest?.diveCert ?? "",
  });
  const [f, setF] = useState(awal);
  const [galat, setGalat] = useState("");
  const [lawan, setLawan] = useState<{ code: string; guest: string | null; checkIn: string; checkOut: string }[]>([]);
  const [kirim, setKirim] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (buka) {
      setF(awal());
      setGalat("");
      setLawan([]);
    }
  }, [buka, formAwal]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const sah = tanggalSah(f.checkIn) && tanggalSah(f.checkOut) && f.checkOut > f.checkIn;
  const k = kamar.find((x) => x.id === f.roomId);
  const anakBayar = Math.max(0, Math.round(Number(f.paxChild) || 0));
  const saran = useMemo(() => (k && sah ? totalDenganAnak(rincianHarga(f.checkIn, f.checkOut, k.baseRate, k.musim).total, anakBayar).total : null), [k, sah, f.checkIn, f.checkOut, anakBayar]);
  const bentrok = useMemo(
    () => (sah && MENEMPATI.includes(f.status) ? pesanan.filter((p) => p.id !== ubahId && p.roomId === f.roomId && MENEMPATI.includes(p.status) && tumpang(p.checkIn, p.checkOut, f.checkIn, f.checkOut)) : []),
    [sah, f.status, f.roomId, f.checkIn, f.checkOut, pesanan, ubahId],
  );
  const kosong = useMemo(
    () => (sah ? kamar.filter((x) => x.isActive && !pesanan.some((p) => p.id !== ubahId && p.roomId === x.id && MENEMPATI.includes(p.status) && tumpang(p.checkIn, p.checkOut, f.checkIn, f.checkOut))) : []),
    [sah, kamar, pesanan, ubahId, f.checkIn, f.checkOut],
  );

  async function simpan() {
    setGalat("");
    setLawan([]);
    if (!sah) return setGalat("Check-out harus sesudah check-in.");
    if (f.channel !== "BLOCK" && !f.nama.trim()) return setGalat("Isi nama tamu.");
    setKirim(true);
    const total = f.totalAmount.trim() === "" ? null : Number(f.totalAmount);
    const komisi = f.otaCommissionEst.trim() === "" ? (total != null && KOMISI_BAWAAN[f.channel] ? Math.round(total * KOMISI_BAWAAN[f.channel]!) : null) : Number(f.otaCommissionEst);
    const body: Record<string, unknown> = {
      roomId: f.roomId,
      checkIn: f.checkIn,
      checkOut: f.checkOut,
      channel: f.channel,
      status: f.channel === "BLOCK" ? "BLOCKED" : f.status,
      pax: f.pax,
      paxChild: f.paxChild,
      paxInfant: f.paxInfant,
      dives: f.dives,
      notes: f.notes,
      guest: f.nama.trim() ? { id: formAwal?.guest?.id, name: f.nama, phone: f.telepon, email: f.email, origin: f.asal, diveCert: f.sertifikat } : null,
    };
    if (rp) {
      body.totalAmount = total;
      body.otaCommissionEst = komisi;
      if (total == null && !ubahId) body.hargaOtomatis = f.channel !== "BLOCK";
    }
    if (f.status === "TENTATIVE" && !ubahId) body.holdExpiresAt = new Date(Date.now() + 24 * 3600000).toISOString();
    try {
      const r = await api<{ pesanan: Pesanan }>(ubahId ? `/api/pesanan/${ubahId}` : "/api/pesanan", { method: ubahId ? "PATCH" : "POST", body });
      ganti(r.pesanan);
      toast(ubahId ? "Pesanan diperbarui" : `Pesanan ${r.pesanan.code} tersimpan`);
      tutupForm();
      bukaPesanan(r.pesanan.id);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal menyimpan.");
      if (e instanceof GalatApi && Array.isArray(e.data.lawan)) setLawan(e.data.lawan as typeof lawan);
    } finally {
      setKirim(false);
    }
  }

  const tutup = tutupForm;
  const blok = f.channel === "BLOCK";
  return (
    <Modal
      judul={ubahId ? `Ubah pesanan ${formAwal?.code ?? ""}` : blok ? "Tutup kamar" : "Pesanan baru"}
      buka={buka}
      tutup={tutup}
      lebar="max-w-3xl"
      kaki={
        <>
          <Tombol varian="garis" onClick={tutup}>Batal</Tombol>
          <Tombol onClick={simpan} disabled={kirim}>{kirim ? "Menyimpan…" : "Simpan"}</Tombol>
        </>
      }
    >
      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang label="Kamar">
            <select className={masukan} value={f.roomId} onChange={set("roomId")}>
              {kamar.map((x) => (
                <option key={x.id} value={x.id} disabled={!x.isActive && x.id !== f.roomId}>
                  {x.name}
                  {!x.isActive ? " (nonaktif)" : ""}
                </option>
              ))}
            </select>
          </Bidang>
          <Bidang label="Sumber">
            <select className={masukan} value={f.channel} onChange={set("channel")}>
              {CHANNEL.map((c) => (
                <option key={c} value={c}>{LABEL_CHANNEL[c]}</option>
              ))}
            </select>
          </Bidang>
          <Bidang label="Check-in">
            <PilihTanggal value={f.checkIn} onChange={(v) => setF((x) => ({ ...x, checkIn: v, checkOut: x.checkOut <= v ? tambahHari(v, 1) : x.checkOut }))} />
          </Bidang>
          <Bidang label="Check-out" ket={sah ? `${jumlahMalam(f.checkIn, f.checkOut)} malam` : undefined}>
            <PilihTanggal value={f.checkOut} min={tambahHari(f.checkIn, 1)} onChange={(v) => setF((x) => ({ ...x, checkOut: v }))} />
          </Bidang>
          {!blok && (
            <Bidang label="Status">
              <select className={masukan} value={f.status} onChange={set("status")}>
                {STATUS_FORM.filter((s) => s !== "BLOCKED").map((s) => (
                  <option key={s} value={s}>{LABEL_STATUS[s]}</option>
                ))}
              </select>
            </Bidang>
          )}
        </div>

        {bentrok.length > 0 && (
          <div className="rounded-2xl bg-panel-merah-lembut px-4 py-3 text-sm text-panel-merah">
            <p className="font-bold">Kamar ini sudah terisi pada sebagian tanggal itu:</p>
            <ul className="mt-1 list-disc pl-5">
              {bentrok.map((p) => (
                <li key={p.id}>{p.guest?.name ?? p.code}, {p.checkIn} sampai {p.checkOut}</li>
              ))}
            </ul>
            {kosong.length > 0 && <p className="mt-2">Kamar yang kosong: {kosong.map((x) => x.name).join(", ")}.</p>}
          </div>
        )}

        {!blok && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="Nama tamu"><input className={masukan} value={f.nama} onChange={set("nama")} autoComplete="off" /></Bidang>
            <Bidang label="WhatsApp atau telepon"><input className={masukan} value={f.telepon} onChange={set("telepon")} inputMode="tel" /></Bidang>
            <Bidang label="Email"><input className={masukan} type="email" value={f.email} onChange={set("email")} /></Bidang>
            <Bidang label="Asal"><input className={masukan} value={f.asal} onChange={set("asal")} placeholder="Kota atau negara" /></Bidang>
            <Bidang label="Sertifikat selam"><input className={masukan} value={f.sertifikat} onChange={set("sertifikat")} placeholder="Misalnya Open Water" /></Bidang>
            <div className="grid grid-cols-2 gap-4">
              <Bidang label="Jumlah tamu" ket="Semua tamu, termasuk anak."><input className={masukan} type="number" min={1} value={f.pax} onChange={set("pax")} /></Bidang>
              <Bidang label="Penyelaman"><input className={masukan} type="number" min={0} value={f.dives} onChange={set("dives")} placeholder="0" /></Bidang>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Bidang label="Anak 5 tahun ke atas" ket="50% harga kamar, dapat extra bed."><input className={masukan} type="number" min={0} value={f.paxChild} onChange={set("paxChild")} placeholder="0" /></Bidang>
              <Bidang label="Balita di bawah 5 tahun" ket="Gratis."><input className={masukan} type="number" min={0} value={f.paxInfant} onChange={set("paxInfant")} placeholder="0" /></Bidang>
            </div>
          </div>
        )}

        {rp && !blok && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="Total (Rp)" ket={saran != null ? <>Menurut tarif kamar{anakBayar ? ` + ${anakBayar} anak (50%)` : ""}: <b>{rupiah(saran)}</b>{f.totalAmount === "" ? " (dipakai bila dikosongkan)" : ""}</> : undefined}>
              <input className={masukan} type="number" min={0} value={f.totalAmount} onChange={set("totalAmount")} placeholder={saran != null ? String(saran) : ""} />
            </Bidang>
            <Bidang label="Perkiraan komisi OTA (Rp)" ket={KOMISI_BAWAAN[f.channel] ? `Kosongkan untuk ${Math.round(KOMISI_BAWAAN[f.channel]! * 100)}% dari total.` : "Isi bila ada komisi agen."}>
              <input className={masukan} type="number" min={0} value={f.otaCommissionEst} onChange={set("otaCommissionEst")} />
            </Bidang>
          </div>
        )}

        <Bidang label={blok ? "Alasan" : "Catatan"}>
          <textarea className={masukan} rows={3} value={f.notes} onChange={set("notes")} placeholder={blok ? "Misalnya perbaikan atap" : "Permintaan khusus, jam tiba, alergi"} />
        </Bidang>

        {galat && (
          <div role="alert" className="rounded-2xl bg-panel-merah-lembut px-4 py-3 text-sm font-bold text-panel-merah">
            {galat}
            {lawan.length > 0 && (
              <ul className="mt-1 list-disc pl-5 font-normal">
                {lawan.map((l) => (
                  <li key={l.code}>{l.guest ?? l.code}, {l.checkIn} sampai {l.checkOut}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
