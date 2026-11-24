"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { Bidang, Kartu, masukan, Pil, Tombol, useToast } from "./ui";

interface Status {
  aktif: boolean;
  mode: "sandbox" | "produksi";
  serverKey: string;
  signatureKey: string;
  sumber: "env" | "panel" | null;
  diuji: string;
  kabar: { waktu: string; orderId: string; hasil: string } | null;
}

const HASIL: Record<string, string> = {
  dicatat: "Pembayaran lunas dicatat ke pesanan",
  sudahTercatat: "Sudah tercatat sebelumnya",
  belumLunas: "Diterima, transaksi belum lunas",
  bukanPesanan: "Bukan pesanan Bakoeria (misalnya tombol uji Midtrans)",
  tandaTanganSalah: "Ditolak: tanda tangan tidak cocok. Periksa Signature Secret Key",
  belumDipasang: "Ditolak: pembayaran online belum dipasang",
  statusTidakCocok: "Status di kabar berbeda dengan status di Midtrans",
};
const waktu = (s: string) => (s ? new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jayapura" }) + " WIT" : "");

/**
 * Pembayaran online lewat Midtrans. Sejak 28 Oktober 2026 Midtrans memakai Server Key
 * (dibuat lewat "Generate server key") untuk API dan Signature Secret Key untuk memeriksa
 * kabar pembayaran. Keduanya disimpan di server dan tidak pernah ditampilkan lagi.
 */
export default function PengaturanMidtrans({ boleh }: { boleh: boolean }) {
  const toast = useToast();
  const [st, setSt] = useState<Status | null>(null);
  const [f, setF] = useState({ aktif: true, mode: "sandbox" as Status["mode"], serverKey: "", signatureKey: "" });
  const [sibuk, setSibuk] = useState(false);
  const [asal, setAsal] = useState("https://bakoeria.com");
  useEffect(() => {
    setAsal(window.location.origin);
    api<{ midtrans: Status }>("/api/midtrans").then((r) => { setSt(r.midtrans); setF((x) => ({ ...x, aktif: r.midtrans.aktif || !r.midtrans.serverKey, mode: r.midtrans.mode })); }).catch(() => undefined);
  }, []);
  if (!st) return null;

  async function simpan(lain: Record<string, unknown> = {}) {
    setSibuk(true);
    try {
      const r = await api<{ midtrans: Status }>("/api/midtrans", { method: "PUT", body: { ...f, ...lain } });
      setSt(r.midtrans);
      setF((x) => ({ ...x, serverKey: "", signatureKey: "" }));
      toast(lain.hapus ? "Kunci Midtrans dihapus" : "Pengaturan Midtrans disimpan");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    } finally {
      setSibuk(false);
    }
  }
  const notifikasi = `${asal}/api/publik/midtrans`;
  return (
    <Kartu
      judul="Pembayaran online (Midtrans)"
      ket="Tamu membayar total pesanan di halaman Midtrans (transfer bank, QRIS, e-wallet, dan metode lain yang aktif di akun Midtrans). Begitu lunas, pembayaran tercatat sendiri dan pesanan menjadi terkonfirmasi."
      aksi={<Pil nada={st.aktif ? "hijau" : "kuning"}>{st.aktif ? `Aktif · ${st.mode === "produksi" ? "Produksi" : "Sandbox"}` : "Belum aktif"}</Pil>}
    >
      <div className="grid gap-4">
        <ol className="grid list-decimal gap-1 pl-5 text-sm text-panel-redup">
          <li>Buka Dashboard Midtrans (Sandbox untuk uji coba, Produksi untuk pembayaran sungguhan), menu Settings, Access Keys, tab Payment.</li>
          <li>Klik <b>Generate server key</b>, beri nama (misalnya Website Bakoeria), centang izin Snap dan status transaksi, lalu salin kuncinya. Kunci ini hanya ditampilkan sekali.</li>
          <li>Di baris <b>Signature Secret Key</b>, klik ikon mata lalu salin. Kunci ini dipakai untuk memeriksa kabar pembayaran.</li>
          <li>Di Settings, Payment, isi <b>Notification URL</b> dengan alamat di bawah, lalu simpan.</li>
        </ol>
        <Bidang label="Notification URL (salin ke Dashboard Midtrans)">
          <div className="flex gap-2">
            <input className={`${masukan} font-mono text-sm`} readOnly value={notifikasi} onFocus={(e) => e.target.select()} />
            <Tombol kecil varian="garis" onClick={() => navigator.clipboard?.writeText(notifikasi).then(() => toast("Alamat disalin"))}>Salin</Tombol>
          </div>
        </Bidang>
        {st.sumber === "env" && <p className="rounded-xl bg-panel-latar px-3 py-2 text-sm">Server Key diambil dari variabel MIDTRANS_SERVER_KEY di hPanel. Kosongkan variabel itu bila ingin mengaturnya dari sini.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang label="Mode" ket="Kunci baru tidak lagi menandai sandbox atau produksi, jadi pilih sesuai Dashboard tempat kunci dibuat.">
            <select className={masukan} disabled={!boleh} value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as Status["mode"] })}>
              <option value="sandbox">Sandbox (uji coba, tanpa uang sungguhan)</option>
              <option value="produksi">Produksi (pembayaran sungguhan)</option>
            </select>
          </Bidang>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-bold"><input type="checkbox" className="size-4" disabled={!boleh} checked={f.aktif} onChange={(e) => setF({ ...f, aktif: e.target.checked })} /> Tampilkan tombol bayar di website</label>
          <Bidang label="Server Key" ket={st.serverKey ? `Terpasang ${st.serverKey}${st.diuji ? `, diuji ${waktu(st.diuji)}` : ""}. Kosongkan bila tidak diganti.` : "Belum dipasang."}>
            <input className={`${masukan} font-mono`} type="password" autoComplete="off" disabled={!boleh} placeholder={st.serverKey ? "Tidak diganti" : "Tempel Server Key"} value={f.serverKey} onChange={(e) => setF({ ...f, serverKey: e.target.value.trim() })} />
          </Bidang>
          <Bidang label="Signature Secret Key" ket={st.signatureKey ? `Terpasang ${st.signatureKey}. Setelah diganti, kunci lama masih diterima 3 hari untuk kabar ulangan.` : "Akun lama yang belum pernah membuat Server Key baru boleh mengosongkannya: Server Key dipakai sebagai gantinya."}>
            <input className={`${masukan} font-mono`} type="password" autoComplete="off" disabled={!boleh} placeholder={st.signatureKey ? "Tidak diganti" : "Tempel Signature Secret Key"} value={f.signatureKey} onChange={(e) => setF({ ...f, signatureKey: e.target.value.trim() })} />
          </Bidang>
        </div>
        {st.kabar && (
          <p className="rounded-xl bg-panel-latar px-3 py-2 text-sm">
            Kabar terakhir dari Midtrans: <b>{HASIL[st.kabar.hasil] ?? st.kabar.hasil}</b>, {waktu(st.kabar.waktu)}{st.kabar.orderId ? `, order ${st.kabar.orderId}` : ""}.
          </p>
        )}
        {boleh && (
          <div className="flex flex-wrap gap-2">
            <Tombol disabled={sibuk} onClick={() => simpan()}>{sibuk ? "Menguji ke Midtrans…" : "Simpan dan uji kunci"}</Tombol>
            {st.serverKey && st.sumber !== "env" && <Tombol varian="garis" disabled={sibuk} onClick={() => simpan({ uji: true })}>Uji kunci yang terpasang</Tombol>}
            {st.serverKey && st.sumber !== "env" && <Tombol varian="garis" disabled={sibuk} onClick={() => { if (window.confirm("Hapus kunci Midtrans? Tombol bayar di website hilang sampai kunci dipasang lagi.")) simpan({ hapus: true }); }}>Hapus kunci</Tombol>}
          </div>
        )}
      </div>
    </Kartu>
  );
}
