"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { Bidang, masukan, Tombol } from "./ui";

/** Halaman masuk, sekaligus penyiapan akun developer pertama bila belum ada akun. */
export default function Masuk() {
  const [mode, setMode] = useState<"muat" | "masuk" | "siap" | "lupa" | "kode">("muat");
  /* Lupa kata sandi: kode dari email dan kata sandi baru. */
  const [r, setR] = useState({ kode: "", sandi: "", ulang: "" });
  const [info, setInfo] = useState("");
  const [jeda, setJeda] = useState(0);
  useEffect(() => {
    if (jeda <= 0) return;
    const t = setTimeout(() => setJeda(jeda - 1), 1000);
    return () => clearTimeout(t);
  }, [jeda]);
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

  async function mintaKode() {
    setGalat("");
    setInfo("");
    setKirim(true);
    try {
      await api("/api/lupa-sandi", { body: { email: f.email } });
      setMode("kode");
      setJeda(60);
      setInfo(`Bila ${f.email} terdaftar, kode 6 angka sudah dikirim ke email itu. Periksa juga folder spam.`);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal.");
    } finally {
      setKirim(false);
    }
  }

  async function lanjut(e: React.FormEvent) {
    e.preventDefault();
    setGalat("");
    if (mode === "lupa") return mintaKode();
    if (mode === "kode" && r.sandi !== r.ulang) return setGalat("Ulangi kata sandi baru dengan sama persis.");
    setKirim(true);
    try {
      if (mode === "kode") await api("/api/lupa-sandi/reset", { body: { email: f.email, kode: r.kode, sandi: r.sandi } });
      else if (mode === "siap") await api("/api/penyiapan", { body: f });
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
        <img aria-hidden="true" alt="" src="/brand/bakoeria-ukiran-sayap-putih.svg" className="pointer-events-none absolute left-1/2 -top-6 w-[1100px] max-w-none -translate-x-1/2 opacity-[0.07]" />
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
          <h1 className="mt-2 text-3xl font-bold text-panel-tinta">{mode === "siap" ? "Buat akun pertama" : mode === "lupa" ? "Lupa kata sandi" : mode === "kode" ? "Buat kata sandi baru" : "Masuk"}</h1>
          <p className="mt-2 text-sm text-panel-redup">
            {mode === "siap"
              ? "Belum ada akun di server ini. Akun pertama menjadi developer dan bisa menambahkan akun lain."
              : mode === "lupa"
                ? "Masukkan email akun Anda. Kami kirim kode 6 angka ke email itu untuk membuat kata sandi baru."
                : mode === "kode"
                  ? "Masukkan kode dari email dan kata sandi baru Anda."
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
              {mode !== "kode" && <Bidang label="Email">
                <input className={masukan} type="email" value={f.email} onChange={ubah("email")} required autoComplete="email" />
              </Bidang>}
              {(mode === "masuk" || mode === "siap") && <Bidang label="Kata sandi" ket={mode === "siap" ? "Minimal 10 karakter." : undefined}>
                <input className={masukan} type="password" value={f.sandi} onChange={ubah("sandi")} required autoComplete={mode === "siap" ? "new-password" : "current-password"} />
              </Bidang>}
              {mode === "masuk" && <button type="button" data-lupa onClick={() => { setMode("lupa"); setGalat(""); }} className="-mt-2 justify-self-start text-sm font-bold text-emas-tua underline underline-offset-4">Lupa kata sandi?</button>}
              {mode === "kode" && (
                <>
                  {info && <p role="status" className="rounded-xl bg-panel-hijau-lembut px-4 py-3 text-sm text-panel-hijau">{info}</p>}
                  <Bidang label="Kode dari email">
                    <input className={`${masukan} text-center font-mono text-2xl tracking-[0.5em]`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={r.kode} onChange={(e) => setR({ ...r, kode: e.target.value.replace(/\D/g, "").slice(0, 6) })} required />
                  </Bidang>
                  <Bidang label="Kata sandi baru" ket="Minimal 10 karakter.">
                    <input className={masukan} type="password" autoComplete="new-password" minLength={10} value={r.sandi} onChange={(e) => setR({ ...r, sandi: e.target.value })} required />
                  </Bidang>
                  <Bidang label="Ulangi kata sandi baru">
                    <input className={masukan} type="password" autoComplete="new-password" value={r.ulang} onChange={(e) => setR({ ...r, ulang: e.target.value })} required />
                  </Bidang>
                </>
              )}
              {galat && <p role="alert" className="rounded-xl bg-panel-merah-lembut px-4 py-3 text-sm font-bold text-panel-merah">{galat}</p>}
              <Tombol type="submit" disabled={kirim} className="mt-2 w-full py-3">
                {kirim ? "Memproses…" : mode === "siap" ? "Buat akun dan masuk" : mode === "lupa" ? "Kirim kode ke email" : mode === "kode" ? "Simpan kata sandi dan masuk" : "Masuk"}
              </Tombol>
              {mode === "kode" && <button type="button" disabled={jeda > 0 || kirim} onClick={mintaKode} className="justify-self-center text-sm font-bold text-emas-tua underline underline-offset-4 disabled:text-panel-redup disabled:no-underline">{jeda > 0 ? `Kirim ulang kode dalam ${jeda} detik` : "Kirim ulang kode"}</button>}
              {(mode === "lupa" || mode === "kode") && <button type="button" onClick={() => { setMode("masuk"); setGalat(""); setInfo(""); setR({ kode: "", sandi: "", ulang: "" }); }} className="justify-self-center text-sm text-panel-redup underline underline-offset-4 hover:text-panel-tinta">Kembali ke Masuk</button>}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
