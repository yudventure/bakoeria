"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { Bidang, masukan, Tombol } from "./ui";

/** Halaman masuk, sekaligus penyiapan akun developer pertama bila belum ada akun. */
export default function Masuk() {
  const [mode, setMode] = useState<"muat" | "masuk" | "siap">("muat");
  const [kunciAda, setKunciAda] = useState(true);
  const [f, setF] = useState({ email: "", sandi: "", nama: "", kunci: "" });
  const [galat, setGalat] = useState("");
  const [kirim, setKirim] = useState(false);

  useEffect(() => {
    api<{ perlu: boolean; kunciAda: boolean }>("/api/penyiapan")
      .then((r) => {
        setKunciAda(r.kunciAda);
        setMode(r.perlu ? "siap" : "masuk");
      })
      .catch(() => setMode("masuk"));
  }, []);

  async function lanjut(e: React.FormEvent) {
    e.preventDefault();
    setGalat("");
    setKirim(true);
    try {
      if (mode === "siap") await api("/api/penyiapan", { body: f });
      else await api("/api/masuk", { body: { email: f.email, sandi: f.sandi } });
      window.location.reload();
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal.");
      setKirim(false);
    }
  }

  const ubah = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <main className="grid min-h-svh bg-panel-latar lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-malam lg:block">
        <div className="bintang absolute inset-0" />
        <img src="/img/resort-night.jpg" alt="" className="absolute inset-x-0 bottom-0 w-full [mask-image:linear-gradient(transparent,#000_30%)]" />
        <div className="relative flex h-full flex-col items-center px-10 pt-[14vh] text-center">
          <img src="/brand/bakoeria-logo-stacked-terbalik.svg" alt="Bakoeria Dive Resort" className="w-[300px]" />
          <p className="mt-6 font-display text-xl italic text-pasir">Menyelam siang, bermalam di bawah bintang.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-12">
        <form onSubmit={lanjut} className="w-full max-w-sm">
          <img src="/brand/bakoeria-logo-horizontal-warna.svg" alt="Bakoeria Dive Resort" className="mb-10 w-56 lg:hidden" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emas-tua">Dashboard resort</p>
          <h1 className="mt-2 text-3xl font-bold text-panel-tinta">{mode === "siap" ? "Buat akun pertama" : "Masuk"}</h1>
          <p className="mt-2 text-sm text-panel-redup">
            {mode === "siap"
              ? "Belum ada akun di server ini. Akun pertama menjadi developer dan bisa menambahkan akun lain."
              : "Gunakan email dan kata sandi akun Anda."}
          </p>
          {mode === "muat" ? (
            <p className="mt-8 text-sm text-panel-redup">Memeriksa…</p>
          ) : (
            <div className="mt-8 grid gap-4">
              {mode === "siap" && (
                <>
                  {!kunciAda && <p className="rounded-xl bg-panel-kuning-lembut px-4 py-3 text-sm text-panel-kuning">PENYIAPAN_KUNCI belum diisi di panel Node.js Hostinger. Isi dulu, lalu muat ulang halaman ini.</p>}
                  <Bidang label="Kunci penyiapan" ket="Nilai PENYIAPAN_KUNCI dari panel server.">
                    <input className={masukan} type="password" value={f.kunci} onChange={ubah("kunci")} required autoComplete="off" />
                  </Bidang>
                  <Bidang label="Nama">
                    <input className={masukan} value={f.nama} onChange={ubah("nama")} required autoComplete="name" />
                  </Bidang>
                </>
              )}
              <Bidang label="Email">
                <input className={masukan} type="email" value={f.email} onChange={ubah("email")} required autoComplete="email" />
              </Bidang>
              <Bidang label="Kata sandi" ket={mode === "siap" ? "Minimal 10 karakter." : undefined}>
                <input className={masukan} type="password" value={f.sandi} onChange={ubah("sandi")} required autoComplete={mode === "siap" ? "new-password" : "current-password"} />
              </Bidang>
              {galat && <p role="alert" className="rounded-xl bg-panel-merah-lembut px-4 py-3 text-sm font-bold text-panel-merah">{galat}</p>}
              <Tombol type="submit" disabled={kirim} className="mt-2 w-full py-3">
                {kirim ? "Memproses…" : mode === "siap" ? "Buat akun dan masuk" : "Masuk"}
              </Tombol>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
