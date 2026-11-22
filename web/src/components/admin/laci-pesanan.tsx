"use client";

import PilihTanggal from "@/components/tanggal";
import { useEffect, useState } from "react";
import { hariIniWit, jumlahMalam, LABEL_CHANNEL, LABEL_KIND, LABEL_METHOD, LABEL_STATUS, rupiah, sisaTagihan, tglPanjang, type PaymentKind, type PaymentMethod, type Status } from "@/lib/booking";
import { nomorWa } from "@/lib/konten";
import { bolehCatat, lihatRupiah } from "@/lib/peran";
import { api } from "./api";
import { useData } from "./data";
import { WARNA_STATUS } from "./gaya";
import type { Pesanan } from "./tipe";
import { Bidang, cx, Label, masukan, Pil, Tombol, useToast } from "./ui";

/** Langkah berikutnya dari tiap status, untuk satu tombol utama. */
const LANJUT: Partial<Record<Status, { ke: Status; label: string }>> = {
  TENTATIVE: { ke: "CONFIRMED", label: "Konfirmasi" },
  CONFLICT: { ke: "CONFIRMED", label: "Tandai beres" },
  CONFIRMED: { ke: "CHECKED_IN", label: "Tamu tiba" },
  CHECKED_IN: { ke: "CHECKED_OUT", label: "Tamu pulang" },
};

interface Riwayat {
  id: string;
  action: string;
  actor: string | null;
  at: string;
  diff: unknown;
}

const LABEL_AKSI: Record<string, string> = { buat: "Dibuat", ubah: "Diubah", bayar: "Pembayaran dicatat", "hapus-bayar": "Pembayaran dihapus", hapus: "Dihapus" };
const LABEL_BIDANG: Record<string, string> = { status: "Status", roomId: "Kamar", checkIn: "Check-in", checkOut: "Check-out", channel: "Sumber", pax: "Tamu", dives: "Penyelaman", totalAmount: "Total", otaCommissionEst: "Komisi", notes: "Catatan", holdExpiresAt: "Batas tahanan" };
function nilaiRiwayat(k: string, v: unknown, kamar: { id: string; name: string }[]): string {
  if (v == null || v === "") return "–";
  if (k === "status") return LABEL_STATUS[v as Status] ?? String(v);
  if (k === "channel") return LABEL_CHANNEL[v as keyof typeof LABEL_CHANNEL] ?? String(v);
  if (k === "roomId") return kamar.find((x) => x.id === v)?.name ?? "kamar lain";
  if (k === "totalAmount" || k === "otaCommissionEst") return rupiah(Number(v));
  if ((k === "checkIn" || k === "checkOut") && typeof v === "string") return tglPanjang(v);
  return String(v);
}

export default function LaciPesanan() {
  const { pesananTerbuka, bukaPesanan, pesanan, ganti, buang, akun, bukaForm, kamar } = useData();
  const toast = useToast();
  const p = pesanan.find((x) => x.id === pesananTerbuka) ?? null;
  const [riwayat, setRiwayat] = useState<Riwayat[]>([]);
  const [bayar, setBayar] = useState({ amount: "", kind: "DEPOSIT" as PaymentKind, method: "TRANSFER" as PaymentMethod, paidAt: hariIniWit(), reference: "" });
  const [formBayar, setFormBayar] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const rp = lihatRupiah(akun.peran);
  const catat = bolehCatat(akun.peran);

  const [versi, setVersi] = useState(0);
  useEffect(() => {
    if (!pesananTerbuka) return;
    api<{ pesanan: Pesanan; riwayat: Riwayat[] }>(`/api/pesanan/${pesananTerbuka}`)
      .then((r) => {
        setRiwayat(r.riwayat);
        ganti(r.pesanan);
      })
      .catch(() => setRiwayat([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pesananTerbuka, versi]);
  useEffect(() => setFormBayar(false), [pesananTerbuka]);
  /** Setelah tiap perubahan, muat ulang supaya riwayat ikut terbaru. */
  const segarkan = (p: Pesanan) => {
    ganti(p);
    setVersi((v) => v + 1);
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && bukaPesanan(null);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [bukaPesanan]);

  if (!pesananTerbuka) return null;
  if (!p) {
    return (
      <Rak tutup={() => bukaPesanan(null)}>
        <p className="p-6 text-sm text-panel-redup">Pesanan ini di luar rentang yang dimuat atau sudah dihapus.</p>
      </Rak>
    );
  }

  async function ubahStatus(status: Status) {
    setSibuk(true);
    try {
      const r = await api<{ pesanan: Pesanan }>(`/api/pesanan/${p!.id}`, { method: "PATCH", body: { status } });
      segarkan(r.pesanan);
      toast(`Status: ${LABEL_STATUS[status]}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    } finally {
      setSibuk(false);
    }
  }

  async function simpanBayar() {
    setSibuk(true);
    try {
      const r = await api<{ pesanan: Pesanan }>(`/api/pesanan/${p!.id}/bayar`, { body: { ...bayar, amount: Number(bayar.amount) } });
      segarkan(r.pesanan);
      setFormBayar(false);
      setBayar((b) => ({ ...b, amount: "", reference: "" }));
      toast("Pembayaran tercatat");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    } finally {
      setSibuk(false);
    }
  }

  async function hapusBayar(pid: string) {
    if (!window.confirm("Hapus catatan pembayaran ini?")) return;
    try {
      const r = await api<{ pesanan: Pesanan }>(`/api/pesanan/${p!.id}/bayar?pid=${pid}`, { method: "DELETE" });
      segarkan(r.pesanan);
      toast("Pembayaran dihapus");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    }
  }

  async function hapus() {
    if (!window.confirm(`Hapus pesanan ${p!.code} untuk selamanya? Untuk pembatalan biasa, pakai status Batal.`)) return;
    try {
      await api(`/api/pesanan/${p!.id}`, { method: "DELETE" });
      buang(p!.id);
      bukaPesanan(null);
      toast("Pesanan dihapus");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    }
  }

  const lanjut = LANJUT[p.status];
  const tagihan = sisaTagihan(p.totalAmount, p.payments);
  const wa = p.guest?.phone ? nomorWa(p.guest.phone) : "";
  const iCal = p.source === "ICAL";

  return (
    <Rak tutup={() => bukaPesanan(null)}>
      <div className="border-b border-panel-garis px-6 pb-5 pt-6">
        <div className="flex items-center gap-2">
          <Pil nada={WARNA_STATUS[p.status].pil}>{LABEL_STATUS[p.status]}</Pil>
          <span className="angka text-xs font-bold text-panel-redup">{p.code}</span>
        </div>
        <h2 className="mt-2 text-2xl font-bold">{p.guest?.name ?? (p.status === "BLOCKED" ? "Kamar ditutup" : "Tanpa nama")}</h2>
        <p className="mt-1 text-sm text-panel-redup">
          {p.roomName} · {LABEL_CHANNEL[p.channel]}
          {iCal ? " · dari sinkron iCal" : p.source === "WEBSITE" ? " · dari website" : ""}
        </p>
        {p.status === "TENTATIVE" && p.holdExpiresAt && (
          <p className="mt-3 rounded-xl bg-panel-kuning-lembut px-3 py-2 text-xs font-bold text-panel-kuning">
            Tahanan batal otomatis {new Date(p.holdExpiresAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })} bila belum dikonfirmasi.
          </p>
        )}
        {p.status === "CONFLICT" && (
          <p className="mt-3 rounded-xl bg-panel-merah-lembut px-3 py-2 text-xs text-panel-merah">
            <b>Bentrok.</b> OTA mengirim pesanan ini, tetapi kamarnya sudah terisi. Pindahkan salah satu tamu ke kamar lain atau ubah tanggalnya, lalu tandai beres.
          </p>
        )}
        {catat && (
          <div className="mt-4 flex flex-wrap gap-2">
            {lanjut && <Tombol kecil disabled={sibuk} onClick={() => ubahStatus(lanjut.ke)}>{lanjut.label}</Tombol>}
            <Tombol kecil varian="garis" onClick={() => bukaForm(p)}>Ubah</Tombol>
            {!["CANCELLED", "CHECKED_OUT"].includes(p.status) && <Tombol kecil varian="hantu" disabled={sibuk} onClick={() => ubahStatus("CANCELLED")}>Batalkan</Tombol>}
            {p.status === "CONFIRMED" && p.checkIn <= hariIniWit() && <Tombol kecil varian="hantu" onClick={() => ubahStatus("NO_SHOW")}>Tidak datang</Tombol>}
          </div>
        )}
      </div>

      <div className="grid gap-6 px-6 py-5">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><Label>Check-in</Label><dd className="mt-1 font-bold">{tglPanjang(p.checkIn)}</dd></div>
          <div><Label>Check-out</Label><dd className="mt-1 font-bold">{tglPanjang(p.checkOut)}</dd></div>
          <div><Label>Malam</Label><dd className="angka mt-1 font-bold">{jumlahMalam(p.checkIn, p.checkOut)}</dd></div>
          <div><Label>Tamu</Label><dd className="angka mt-1 font-bold">{p.pax ?? "–"}{p.paxChild ? ` · ${p.paxChild} anak 5+` : ""}{p.paxInfant ? ` · ${p.paxInfant} balita` : ""}{p.dives ? ` · ${p.dives} selam` : ""}</dd></div>
        </dl>

        {p.guest && (
          <div className="rounded-2xl bg-panel-latar p-4 text-sm">
            <Label>Kontak tamu</Label>
            <div className="mt-2 grid gap-1">
              {p.guest.phone && (
                <span className="flex items-center justify-between gap-2">
                  <span className="angka select-all">{p.guest.phone}</span>
                  {wa && <a className="font-bold text-panel-hijau underline" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp</a>}
                </span>
              )}
              {p.guest.email && <span className="select-all break-all">{p.guest.email}</span>}
              {p.guest.origin && <span className="text-panel-redup">Dari {p.guest.origin}</span>}
              {p.guest.diveCert && <span className="text-panel-redup">Sertifikat: {p.guest.diveCert}</span>}
            </div>
          </div>
        )}

        {p.notes && (
          <div className="text-sm">
            <Label>Catatan</Label>
            <p className="mt-1 whitespace-pre-line">{p.notes}</p>
          </div>
        )}

        {rp && (
          <div>
            <div className="flex items-end justify-between gap-3">
              <Label>Pembayaran</Label>
              {catat && !formBayar && <button className="text-sm font-bold text-panel-utama underline" onClick={() => setFormBayar(true)}>+ Catat pembayaran</button>}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-2xl bg-panel-latar p-3"><span className="block text-xs text-panel-redup">Total</span><b className="angka">{rupiah(p.totalAmount)}</b></div>
              <div className="rounded-2xl bg-panel-latar p-3"><span className="block text-xs text-panel-redup">Dibayar</span><b className="angka">{rupiah(tagihan.dibayar)}</b></div>
              <div className={cx("rounded-2xl p-3", tagihan.sisa && tagihan.sisa > 0 ? "bg-panel-kuning-lembut" : "bg-panel-hijau-lembut")}>
                <span className="block text-xs text-panel-redup">Sisa</span>
                <b className="angka">{tagihan.sisa == null ? "–" : rupiah(tagihan.sisa)}</b>
              </div>
            </div>
            {p.otaCommissionEst ? <p className="mt-2 text-xs text-panel-redup">Perkiraan komisi OTA {rupiah(p.otaCommissionEst)}.</p> : null}
            {formBayar && (
              <div className="mt-3 grid gap-3 rounded-2xl ring-1 ring-panel-garis p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Bidang label="Jumlah (Rp)"><input className={masukan} type="number" min={0} value={bayar.amount} onChange={(e) => setBayar({ ...bayar, amount: e.target.value })} autoFocus /></Bidang>
                  <Bidang label="Tanggal"><PilihTanggal value={bayar.paidAt} onChange={(v) => setBayar({ ...bayar, paidAt: v })} /></Bidang>
                  <Bidang label="Jenis">
                    <select className={masukan} value={bayar.kind} onChange={(e) => setBayar({ ...bayar, kind: e.target.value as PaymentKind })}>
                      {(Object.keys(LABEL_KIND) as PaymentKind[]).map((k) => <option key={k} value={k}>{LABEL_KIND[k]}</option>)}
                    </select>
                  </Bidang>
                  <Bidang label="Cara">
                    <select className={masukan} value={bayar.method} onChange={(e) => setBayar({ ...bayar, method: e.target.value as PaymentMethod })}>
                      {(Object.keys(LABEL_METHOD) as PaymentMethod[]).map((k) => <option key={k} value={k}>{LABEL_METHOD[k]}</option>)}
                    </select>
                  </Bidang>
                </div>
                <Bidang label="Referensi"><input className={masukan} value={bayar.reference} onChange={(e) => setBayar({ ...bayar, reference: e.target.value })} placeholder="Nomor transfer atau catatan" /></Bidang>
                <div className="flex justify-end gap-2">
                  <Tombol kecil varian="garis" onClick={() => setFormBayar(false)}>Batal</Tombol>
                  <Tombol kecil disabled={sibuk || !bayar.amount} onClick={simpanBayar}>Simpan</Tombol>
                </div>
              </div>
            )}
            {p.payments.length > 0 && (
              <ul className="mt-3 divide-y divide-panel-garis text-sm">
                {p.payments.map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <b className={x.kind === "REFUND" ? "text-panel-merah" : ""}>{LABEL_KIND[x.kind]}</b> <span className="text-panel-redup">· {LABEL_METHOD[x.method]} · {tglPanjang(x.paidAt)}</span>
                      {x.reference && <span className="block truncate text-xs text-panel-redup">{x.reference}</span>}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                      <b className="angka">{x.kind === "REFUND" ? "−" : ""}{rupiah(x.amount)}</b>
                      {["developer", "pemilik", "manajer", "keuangan"].includes(akun.peran) && (
                        <button onClick={() => hapusBayar(x.id)} className="text-panel-redup hover:text-panel-merah" aria-label="Hapus pembayaran">×</button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {riwayat.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer font-bold">Riwayat perubahan ({riwayat.length})</summary>
            <ul className="mt-2 grid gap-2">
              {riwayat.map((r) => (
                <li key={r.id} className="rounded-xl bg-panel-latar px-3 py-2">
                  <b>{LABEL_AKSI[r.action] ?? r.action}</b> <span className="text-panel-redup">oleh {r.actor ?? "sistem"}, {new Date(r.at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
                  {r.action === "ubah" && r.diff != null && typeof r.diff === "object" ? (
                    <span className="block text-xs text-panel-redup">
                      {Object.entries(r.diff as Record<string, { dari: unknown; ke: unknown }>)
                        .map(([k, v]) => `${LABEL_BIDANG[k] ?? k}: ${nilaiRiwayat(k, v.dari, kamar)} → ${nilaiRiwayat(k, v.ke, kamar)}`)
                        .join("; ")}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </details>
        )}

        {["developer", "pemilik", "manajer"].includes(akun.peran) && (
          <button onClick={hapus} className="justify-self-start text-sm font-bold text-panel-merah underline">Hapus pesanan</button>
        )}
      </div>
    </Rak>
  );
}

function Rak({ children, tutup }: { children: React.ReactNode; tutup: () => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-panel-utama/30" onMouseDown={(e) => e.target === e.currentTarget && tutup()}>
      <aside role="dialog" aria-modal="true" className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-white shadow-angkat">
        <button onClick={tutup} aria-label="Tutup" className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-xl text-panel-redup hover:bg-panel-lembut">×</button>
        {children}
      </aside>
    </div>
  );
}
