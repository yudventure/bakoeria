/**
 * Pembaca dan penulis iCal sederhana untuk kalender ketersediaan OTA.
 * Hanya yang dibutuhkan: VEVENT dengan UID, DTSTART, DTEND, SUMMARY, STATUS.
 */
export interface EventIcal {
  uid: string;
  mulai: string;
  selesai: string;
  ringkasan: string;
  batal: boolean;
}

/** Tanggal "YYYY-MM-DD" dari nilai DTSTART/DTEND, baik DATE maupun DATE-TIME. */
function tanggal(v: string): string | null {
  const m = v.trim().match(/^(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

export function bacaIcal(teks: string): EventIcal[] {
  // Baris lanjutan (diawali spasi atau tab) disambung ke baris sebelumnya.
  const baris = teks.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").split("\n");
  const hasil: EventIcal[] = [];
  let ev: Record<string, string> | null = null;
  for (const b of baris) {
    if (b === "BEGIN:VEVENT") ev = {};
    else if (b === "END:VEVENT" && ev) {
      const mulai = ev.DTSTART ? tanggal(ev.DTSTART) : null;
      let selesai = ev.DTEND ? tanggal(ev.DTEND) : null;
      if (mulai && (!selesai || selesai <= mulai)) {
        const d = new Date(mulai + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() + 1);
        selesai = d.toISOString().slice(0, 10);
      }
      if (mulai && selesai) {
        hasil.push({
          uid: ev.UID || `${mulai}-${selesai}-${ev.SUMMARY ?? ""}`,
          mulai,
          selesai,
          ringkasan: (ev.SUMMARY ?? "").replace(/\\([,;\\])/g, "$1").replace(/\\n/gi, " ").slice(0, 200),
          batal: (ev.STATUS ?? "").toUpperCase() === "CANCELLED",
        });
      }
      ev = null;
    } else if (ev) {
      const i = b.indexOf(":");
      if (i > 0) {
        const nama = b.slice(0, i).split(";")[0].toUpperCase();
        if (!(nama in ev)) ev[nama] = b.slice(i + 1);
      }
    }
  }
  return hasil;
}

const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
const tglIcal = (s: string) => s.replace(/-/g, "");

/** Kalender keluar. Malam-malam yang bersambung digabung; tanpa data tamu. */
export function tulisIcal(nama: string, rentang: { mulai: string; selesai: string }[], domain = "bakoeria"): string {
  const urut = [...rentang].sort((a, b) => a.mulai.localeCompare(b.mulai));
  const gabung: { mulai: string; selesai: string }[] = [];
  for (const r of urut) {
    const akhir = gabung[gabung.length - 1];
    if (akhir && r.mulai <= akhir.selesai) akhir.selesai = r.selesai > akhir.selesai ? r.selesai : akhir.selesai;
    else gabung.push({ ...r });
  }
  const sekarang = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const baris = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bakoeria Dive Resort//Kalender//ID", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${esc(nama)}`];
  for (const g of gabung) {
    baris.push(
      "BEGIN:VEVENT",
      `UID:${g.mulai}-${g.selesai}@${domain}`,
      `DTSTAMP:${sekarang}`,
      `DTSTART;VALUE=DATE:${tglIcal(g.mulai)}`,
      `DTEND;VALUE=DATE:${tglIcal(g.selesai)}`,
      "SUMMARY:Tidak tersedia",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }
  baris.push("END:VCALENDAR");
  return baris.join("\r\n") + "\r\n";
}
