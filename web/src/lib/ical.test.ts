import { test } from "node:test";
import assert from "node:assert/strict";
import { bacaIcal, tulisIcal } from "./ical";

test("membaca event DATE dan DATE-TIME, termasuk baris lanjutan", () => {
  const ics = "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:abc@booking\r\nDTSTART;VALUE=DATE:20261201\r\nDTEND;VALUE=DATE:20261204\r\nSUMMARY:CLOSED - Not av\r\n ailable\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART:20261210T140000Z\r\nDTEND:20261210T150000Z\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n";
  const e = bacaIcal(ics);
  assert.equal(e.length, 2);
  assert.deepEqual([e[0].uid, e[0].mulai, e[0].selesai, e[0].ringkasan], ["abc@booking", "2026-12-01", "2026-12-04", "CLOSED - Not available"]);
  assert.deepEqual([e[1].mulai, e[1].selesai], ["2026-12-10", "2026-12-11"]);
});

test("ekspor menggabung malam yang bersambung", () => {
  const out = tulisIcal("Cottage 1", [{ mulai: "2026-12-01", selesai: "2026-12-03" }, { mulai: "2026-12-03", selesai: "2026-12-05" }, { mulai: "2026-12-10", selesai: "2026-12-11" }]);
  assert.equal((out.match(/BEGIN:VEVENT/g) ?? []).length, 2);
  assert.match(out, /DTSTART;VALUE=DATE:20261201\r\nDTEND;VALUE=DATE:20261205/);
});
