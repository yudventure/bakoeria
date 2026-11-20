import { test } from "node:test";
import assert from "node:assert/strict";
import { jumlahMalam, malam, rincianHarga, sisaTagihan, tambahHari, tumpang, kodeBooking, tanggalSah } from "./booking";

test("malam dihitung setengah terbuka", () => {
  assert.equal(jumlahMalam("2026-12-30", "2027-01-02"), 3);
  assert.deepEqual(malam("2026-02-27", "2026-03-01"), ["2026-02-27", "2026-02-28"]);
  assert.equal(tambahHari("2028-02-28", 1), "2028-02-29");
});

test("check-out hari ini tidak bentrok dengan check-in hari ini", () => {
  assert.equal(tumpang("2026-12-01", "2026-12-03", "2026-12-03", "2026-12-05"), false);
  assert.equal(tumpang("2026-12-01", "2026-12-04", "2026-12-03", "2026-12-05"), true);
});

test("tarif musiman menimpa tarif dasar pada hari yang dicakup, inklusif", () => {
  const r = rincianHarga("2026-12-23", "2026-12-27", 1000, [{ dateFrom: "2026-12-24", dateTo: "2026-12-25", rate: 2000 }]);
  assert.deepEqual(r.baris.map((b) => b.tarif), [1000, 2000, 2000, 1000]);
  assert.equal(r.total, 6000);
});

test("sisa tagihan memperhitungkan pengembalian", () => {
  assert.deepEqual(sisaTagihan(1000, [{ amount: 600, kind: "DEPOSIT" }, { amount: 100, kind: "REFUND" }]), { dibayar: 500, sisa: 500 });
  assert.equal(sisaTagihan(null, []).sisa, null);
});

test("kode booking tanpa huruf yang membingungkan", () => {
  assert.match(kodeBooking(), /^BK-[A-HJ-NP-Z2-9]{5}$/);
  assert.equal(tanggalSah("2026-02-30"), true === Number.isNaN(Date.parse("2026-02-30T00:00:00Z")) ? false : true);
  assert.equal(tanggalSah("20-1-1"), false);
});
