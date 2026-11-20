"use client";

import { useMemo, useState } from "react";
import { hariIniWit, malam, MENEMPATI, rupiah, tambahHari } from "@/lib/booking";
import { hitungStok, type BarisStok } from "@/lib/modul";
import { useData } from "../data";
import { Angka, Bidang, cx, Kartu, Kosong, masukan, Modal, Penjelasan, Pil, Tab, Tombol, useToast } from "../ui";
import { Pembungkus, TabelModul, useModul } from "./modul";
import { unduhCsv } from "./pesanan";

export default function Gudang() {
  const m = useModul("gudang");
  const { pesanan } = useData();
  const toast = useToast();
  const [tab, setTab] = useState<"stok" | "barang" | "mutasi">("stok");
  const [cepat, setCepat] = useState<{ b: BarisStok; jenis: "Masuk" | "Keluar"; jumlah: string; harga: string } | null>(null);
  const hari = hariIniWit();
  const kamarMalam30 = useMemo(() => {
    const t = malam(hari, tambahHari(hari, 30));
    return t.reduce((n, d) => n + new Set(pesanan.filter((p) => MENEMPATI.includes(p.status) && p.status !== "BLOCKED" && p.checkIn <= d && d < p.checkOut).map((p) => p.roomId)).size, 0);
  }, [pesanan, hari]);
  const stok = useMemo(() => hitungStok(m.data.barang ?? [], m.data.mutasi ?? [], kamarMalam30), [m.data, kamarMalam30]);
  const belanja = stok.filter((s) => s.perluBeli > 0);
  const biayaBelanja = belanja.reduce((n, s) => n + s.perluBeli * s.harga, 0);
  const bolehMutasi = m.tulisKoleksi.includes("mutasi");

  async function simpanCepat() {
    if (!cepat) return;
    const g = await m.simpan("mutasi", { tanggal: hari, barang: cepat.b.id, jenis: cepat.jenis, jumlah: cepat.jumlah, harga: cepat.jenis === "Masuk" ? cepat.harga || 0 : 0, catatan: "" });
    if (g) toast(g, "galat");
    else {
      toast(`${cepat.b.nama}: ${cepat.jenis.toLowerCase()} ${cepat.jumlah} ${cepat.b.satuan}`);
      setCepat(null);
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Stok gudang</h1>
        <p className="mt-1 text-sm text-panel-redup">Stok dihitung dari catatan keluar masuk. Kebutuhan 30 hari diperkirakan dari kamar yang sudah terisi.</p>
      </div>
      <Tab pilihan={[{ id: "stok", label: "Stok & belanja" }, { id: "barang", label: "Daftar barang" }, { id: "mutasi", label: "Keluar masuk" }]} nilai={tab} ubah={setTab} />
      <Pembungkus m={m}>
        {tab === "stok" && (
          <>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <Angka label="Barang habis" nilai={stok.filter((s) => s.status === "Habis").length} nada={stok.some((s) => s.status === "Habis") ? "merah" : undefined} />
              <Angka label="Menipis" nilai={stok.filter((s) => s.status === "Menipis").length} />
              <Angka label="Perlu dibeli" nilai={belanja.length} ket="jenis barang" />
              <Angka label="Perkiraan belanja" nilai={rupiah(biayaBelanja)} ket={`${kamarMalam30} malam kamar terisi 30 hari ke depan`} />
            </div>
            <Kartu judul="Stok sekarang" aksi={belanja.length > 0 && <Tombol kecil varian="garis" onClick={() => unduhCsv(`belanja-${hari}.csv`, [["Barang", "Stok", "Perlu dibeli", "Satuan", "Perkiraan harga"], ...belanja.map((s) => [s.nama, s.stok, s.perluBeli, s.satuan, s.perluBeli * s.harga])])}>Unduh daftar belanja</Tombol>}>
              {stok.length === 0 ? (
                <Kosong judul="Belum ada barang" isi="Tambahkan barang di tab Daftar barang." />
              ) : (
                <ul className="divide-y divide-panel-garis">
                  {[...stok].sort((a, b) => ["Habis", "Menipis", "Cukup"].indexOf(a.status) - ["Habis", "Menipis", "Cukup"].indexOf(b.status) || a.nama.localeCompare(b.nama)).map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <span className="min-w-0">
                        <b>{s.nama}</b> <Pil nada={s.status === "Habis" ? "merah" : s.status === "Menipis" ? "kuning" : "hijau"}>{s.status}</Pil>
                        <span className="block text-sm text-panel-redup">
                          <span className="angka">{s.stok} {s.satuan}</span> · minimum {s.minimum}
                          {s.kebutuhan30 != null && ` · butuh ${s.kebutuhan30} untuk 30 hari`}
                          {s.perluBeli > 0 && <b className="text-panel-kuning"> · beli {s.perluBeli}</b>}
                        </span>
                      </span>
                      {bolehMutasi && (
                        <span className="flex gap-1">
                          <Tombol kecil varian="garis" onClick={() => setCepat({ b: s, jenis: "Masuk", jumlah: String(s.perluBeli || 1), harga: String(s.harga || "") })}>+ Masuk</Tombol>
                          <Tombol kecil varian="garis" onClick={() => setCepat({ b: s, jenis: "Keluar", jumlah: "1", harga: "" })}>− Keluar</Tombol>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Kartu>
            <Penjelasan>
              <p>Status Menipis bila stok sama dengan atau di bawah minimum. Perlu dibeli = jumlah untuk mencapai minimum, atau kebutuhan 30 hari bila lebih besar.</p>
              <p>Kebutuhan 30 hari = pemakaian per kamar per malam × malam kamar terisi 30 hari ke depan menurut kalender.</p>
            </Penjelasan>
          </>
        )}
        {tab === "barang" && <TabelModul m={m} koleksiId="barang" urut={(a, b) => String(a.nama).localeCompare(String(b.nama))} />}
        {tab === "mutasi" && <TabelModul m={m} koleksiId="mutasi" />}
      </Pembungkus>
      <Modal judul={cepat ? `${cepat.jenis === "Masuk" ? "Barang masuk" : "Barang keluar"}: ${cepat.b.nama}` : ""} buka={!!cepat} tutup={() => setCepat(null)} lebar="max-w-md" kaki={<><Tombol varian="garis" onClick={() => setCepat(null)}>Batal</Tombol><Tombol onClick={simpanCepat}>Simpan</Tombol></>}>
        {cepat && (
          <div className="grid gap-4">
            <Bidang label={`Jumlah (${cepat.b.satuan})`} ket={`Stok sekarang ${cepat.b.stok}.`}><input autoFocus className={masukan} type="number" min={1} value={cepat.jumlah} onChange={(e) => setCepat({ ...cepat, jumlah: e.target.value })} /></Bidang>
            {cepat.jenis === "Masuk" && <Bidang label="Harga satuan (Rp)"><input className={cx(masukan)} type="number" min={0} value={cepat.harga} onChange={(e) => setCepat({ ...cepat, harga: e.target.value })} /></Bidang>}
          </div>
        )}
      </Modal>
    </div>
  );
}
