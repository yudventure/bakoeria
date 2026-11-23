import { test } from "node:test";
import assert from "node:assert/strict";
import { hitungKupon, rapikanKode, terapkan, type Kupon } from "./tarif";

test("perubahan harga massal", () => {
  assert.equal(terapkan(1450000, { mode: "tetap", nilai: 1980000 }), 1980000);
  assert.equal(terapkan(1450000, { mode: "persen", nilai: 20 }), 1740000);
  assert.equal(terapkan(1450000, { mode: "persen", nilai: 15 }), 1668000); // 1.667.500 dibulatkan ke ribuan
  assert.equal(terapkan(1450000, { mode: "persen", nilai: -10 }), 1305000);
  assert.equal(terapkan(1450000, { mode: "rupiah", nilai: -2000000 }), 0);
});

const dasar: Kupon = { id: "1", kode: "HEMAT10", jenis: "PERSEN", nilai: 10, maksPotongan: null, minMalam: 1, berlakuSampai: null, tibaDari: null, tibaSampai: null, tipeKamar: [], maksPakai: null, aktif: true, catatan: null, terpakai: 0 };
const p = { masuk: "2027-01-10", malam: 3, tipe: "Cottage Double", total: 4350000, hariIni: "2026-11-23" };

test("kupon persen, batas potongan, nominal", () => {
  assert.deepEqual(hitungKupon(dasar, p), { ok: true, potongan: 435000 });
  assert.deepEqual(hitungKupon({ ...dasar, maksPotongan: 300000 }, p), { ok: true, potongan: 300000 });
  assert.deepEqual(hitungKupon({ ...dasar, jenis: "NOMINAL", nilai: 9000000 }, p), { ok: true, potongan: 4350000 });
});

test("kupon ditolak sesuai syarat", () => {
  assert.equal(hitungKupon(null, p).ok, false);
  const alasan = (k: Partial<Kupon>) => { const r = hitungKupon({ ...dasar, ...k }, p); return r.ok ? "ok" : r.alasan; };
  assert.equal(alasan({ aktif: false }), "nonaktif");
  assert.equal(alasan({ berlakuSampai: "2026-11-22" }), "kedaluwarsa");
  assert.equal(alasan({ berlakuSampai: "2026-11-23" }), "ok");
  assert.equal(alasan({ maksPakai: 5, terpakai: 5 }), "habis");
  assert.equal(alasan({ minMalam: 4 }), "minMalam");
  assert.equal(alasan({ tibaDari: "2027-02-01" }), "tanggal");
  assert.equal(alasan({ tibaSampai: "2027-01-09" }), "tanggal");
  assert.equal(alasan({ tipeKamar: ["Cottage Single"] }), "kamar");
  assert.equal(alasan({ tipeKamar: ["Cottage Double"] }), "ok");
});

test("kode kupon dirapikan", () => {
  assert.equal(rapikanKode(" early bird-10 "), "EARLYBIRD-10");
});
