import "server-only";
import { rupiah, tglPanjang } from "@/lib/booking";
import { nomorWa } from "@/lib/konten";
import { tglBahasa } from "@/lib/kamus";
import { deretTombol, kepala, kerangka, kotak, ringkasan, tombol, WARNA, type KontakEmail } from "./email-kerangka";

/**
 * Email "pesanan baru" untuk admin: rincian pesanan dan tiga tombol, yaitu buka dan
 * konfirmasi di dashboard (#pesanan=<id> membuka laci pesanan), balas tamu lewat WhatsApp
 * dengan pesan yang sudah terisi dalam bahasa tamu, dan balas lewat email.
 */
export interface IsiEmailPesanan {
  asal: string;
  id: string;
  kode: string;
  nama: string;
  telepon: string;
  email: string;
  cottage: string;
  masuk: string;
  keluar: string;
  malam: number;
  tamu: string;
  total: number;
  baris: string[];
  catatan: string;
  en: boolean;
  jamTahanan: number;
  kontak: KontakEmail;
}


export function emailPesananAdmin(d: IsiEmailPesanan) {
  const dashboard = `${d.asal}/kelola#pesanan=${d.id}`;
  const tb = (s: string) => tglBahasa(s, d.en ? "en" : "id");
  const sapa = d.nama.split(" ")[0];
  const pesanWa = d.en
    ? `Hello ${sapa}, this is Bakoeria Dive Resort. Thank you for your booking request ${d.kode}: ${d.cottage}, ${tb(d.masuk)} to ${tb(d.keluar)} (${d.malam} night${d.malam === 1 ? "" : "s"}), ${d.tamu}. Good news, the cottage is available. Total ${rupiah(d.total)}. `
    : `Halo ${sapa}, kami dari Bakoeria Dive Resort. Terima kasih atas permintaan pesanan ${d.kode}: ${d.cottage}, ${tb(d.masuk)} sampai ${tb(d.keluar)} (${d.malam} malam), ${d.tamu}. Kabar baik, cottage-nya tersedia. Total ${rupiah(d.total)}. `;
  const nomor = d.telepon ? nomorWa(d.telepon) : "";
  const wa = nomor.length >= 8 ? `https://wa.me/${nomor}?text=${encodeURIComponent(pesanWa)}` : "";
  const mail = d.email ? `mailto:${d.email}?subject=${encodeURIComponent(`${d.en ? "Your booking" : "Pesanan Anda"} ${d.kode} · Bakoeria Dive Resort`)}` : "";
  const subjek = `Pesanan baru ${d.kode}: ${d.nama}, ${tglPanjang(d.masuk)} (${d.cottage})`;

  const teks = [
    `Pesanan baru dari website: ${d.kode}`,
    `${d.nama} · ${d.cottage}, ${tglPanjang(d.masuk)} sampai ${tglPanjang(d.keluar)} (${d.malam} malam) · ${d.tamu}`,
    `Total ${rupiah(d.total)}`,
    ...d.baris,
    d.catatan ? `Catatan tamu: ${d.catatan}` : "",
    "",
    `Konfirmasi di dashboard: ${dashboard}`,
    wa ? `Balas lewat WhatsApp: ${wa}` : "Tamu tidak mengisi nomor WhatsApp.",
    d.email ? `Balas lewat email: balas email ini (langsung ke ${d.email}).` : "",
    `Tahanan berlaku ${d.jamTahanan} jam, lalu batal sendiri bila belum dikonfirmasi.`,
  ].filter((x) => x !== "").join("\n");

  const isi = `${kepala("Pesanan baru dari website", `${d.kode} · ${d.nama}`, `${d.cottage}, ${tglPanjang(d.masuk)} sampai ${tglPanjang(d.keluar)} (${d.malam} malam)`)}
          ${deretTombol(`${tombol(dashboard, "Buka dan konfirmasi di dashboard", WARNA.malam)}${wa ? tombol(wa, "Balas lewat WhatsApp", WARNA.wa) : ""}${mail ? tombol(mail, "Balas lewat email", WARNA.laut) : ""}`)}
          ${ringkasan([
            ["Tamu", d.tamu],
            ["Total", rupiah(d.total)],
            ["WhatsApp", d.telepon || "-"],
            ["Email", d.email || "-"],
            ...d.baris.map((x): [string, string] => { const i = x.indexOf(":"); return i > 0 ? [x.slice(0, i), x.slice(i + 1).trim()] : ["", x]; }),
            ...(d.catatan ? [["Catatan tamu", d.catatan] as [string, string]] : []),
          ])}
          ${kotak(`Tombol WhatsApp membuka chat dengan pesan konfirmasi yang sudah terisi dalam bahasa tamu. Periksa dan ubah dulu sebelum dikirim. Tahanan berlaku <b>${d.jamTahanan} jam</b>, lalu batal sendiri bila belum dikonfirmasi di dashboard. Setelah dikonfirmasi, tamu otomatis menerima email konfirmasi.`, WARNA.kertas)}`;
  const html = kerangka({ asal: d.asal, en: false, pratinjau: `${d.nama}, ${d.cottage}, ${tglPanjang(d.masuk)}`, isi, kontak: d.kontak });
  return { subjek, teks, html };
}
