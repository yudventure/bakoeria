"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { useData } from "./data";
import { Kartu, Pil, Tombol, useToast } from "./ui";

interface Status { aktif: boolean; dibuat?: string; kamar: number }

/**
 * Pasang atau hapus data demo (4 kamar, tamu, pesanan, keuangan, SDM, gudang)
 * dari dashboard, karena di hosting tidak ada terminal. Hanya developer dan pemilik.
 */
export default function DataDemo({ ringkas = false, selesai }: { ringkas?: boolean; selesai?: () => void }) {
  const { muat, kamar } = useData();
  const toast = useToast();
  const [s, setS] = useState<Status | null>(null);
  const [sibuk, setSibuk] = useState(false);
  useEffect(() => {
    api<Status>("/api/demo").then(setS).catch(() => setS(null));
  }, []);
  if (!s) return null;
  /* Di Ringkasan hanya muncul saat database masih kosong. */
  if (ringkas && (s.aktif || kamar.length > 0)) return null;

  async function jalan(metode: "POST" | "DELETE") {
    if (metode === "DELETE" && !window.confirm("Hapus semua data demo? Kamar, tamu, pesanan, dan catatan demo akan dihapus. Data yang Anda buat sendiri tidak ikut terhapus.")) return;
    setSibuk(true);
    try {
      const r = await api<{ status: Status; kamar?: number; pesanan?: number; catatan?: number; tertinggal?: string[] }>("/api/demo", { method: metode });
      setS(r.status);
      toast(metode === "POST" ? `Data demo terpasang: ${r.kamar} kamar, ${r.pesanan} pesanan, ${r.catatan} catatan` : r.tertinggal?.length ? `Data demo dihapus. Kamar yang masih punya pesanan asli dibiarkan: ${r.tertinggal.join(", ")}` : "Data demo dihapus");
      muat();
      selesai?.();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "galat");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Kartu
      judul={<span className="flex items-center gap-2">Data demo {s.aktif && <Pil nada="kuning">Terpasang</Pil>}</span>}
      ket={s.aktif ? `Dipasang ${new Date(s.dibuat!).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}. Hapus sebelum mulai memakai data asli.` : "Untuk mencoba situs dan dashboard sebelum data asli siap."}
      aksi={s.aktif ? <Tombol kecil varian="garis" onClick={() => jalan("DELETE")} disabled={sibuk}>{sibuk ? "Menghapus…" : "Hapus data demo"}</Tombol> : <Tombol kecil onClick={() => jalan("POST")} disabled={sibuk}>{sibuk ? "Memasang…" : "Isi data demo"}</Tombol>}
    >
      <p className="text-sm text-panel-redup">
        {s.aktif
          ? "Semua yang dibuat oleh tombol ini tercatat, jadi tombol hapus hanya menghapus data demo. Kamar, tamu, dan catatan yang Anda tambahkan sendiri tetap aman."
          : "Memasang 4 cottage (2 Cottage Double dan 2 Cottage Single, harga promo Rp 1.450.000 dari Rp 1.980.000), 9 tamu dan 10 pesanan contoh di kalender beserta pembayarannya, serta contoh catatan keuangan, aset, pegawai, absensi, dan stok gudang. Hanya bisa dipasang saat belum ada kamar."}
      </p>
    </Kartu>
  );
}
