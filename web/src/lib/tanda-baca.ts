/**
 * Pemilik, November 2026: tanda baca yang terasa seperti tulisan AI (titik dua di tengah
 * kalimat, titik koma, tanda pisah panjang) dihapus dari teks situs. Pasangan teks lama dan
 * baru ini juga dipakai sekali untuk isi yang tersimpan (hanya bagian yang masih sama).
 */
export const VERSI_TANDA_BACA = "tanda-baca-2026-11-26";
export const GANTI_TANDA_BACA: [string, string][] = [
 [
  "Real coastlines; route lines are approximate. A: private speedboat from Sorong. B: ferry to Waisai, then the resort boat.",
  "Real coastlines, route lines are approximate. Route A is the private speedboat from Sorong. Route B is the ferry to Waisai, then the resort boat."
 ],
 [
  "Garis pantai asli; garis jalur perkiraan. A: speedboat privat dari Sorong. B: feri ke Waisai, lalu perahu resort.",
  "Garis pantai asli, garis jalur perkiraan. Jalur A adalah speedboat privat dari Sorong. Jalur B adalah feri ke Waisai, lalu perahu resort."
 ],
 [
  "Pay the full amount securely with Midtrans: bank transfer, QRIS, e-wallet and other available methods. Your booking is confirmed as soon as the payment arrives.",
  "Pay the full amount securely with Midtrans by bank transfer, QRIS, e-wallet or another available method. Your booking is confirmed as soon as the payment arrives."
 ],
 [
  "Bayar penuh dengan aman lewat Midtrans: transfer bank, QRIS, e-wallet, dan metode lain yang tersedia. Pesanan langsung terkonfirmasi begitu pembayaran masuk.",
  "Bayar penuh dengan aman lewat Midtrans dengan transfer bank, QRIS, e-wallet, atau metode lain yang tersedia. Pesanan langsung terkonfirmasi begitu pembayaran masuk."
 ],
 [
  "Or pay later: our team will send the payment details.",
  "Or pay later, and our team will send the payment details."
 ],
 [
  "Atau bayar nanti: tim kami akan mengirim cara pembayarannya.",
  "Atau bayar nanti, tim kami akan mengirim cara pembayarannya."
 ],
 [
  "Still available on these dates:",
  "Still available on these dates"
 ],
 [
  "Yang masih tersedia di tanggal itu:",
  "Yang masih tersedia di tanggal itu"
 ],
 [
  "Bird watching, kayaking, island trip: video dan galeri.",
  "Bird watching, kayaking, dan island trip, dengan video dan galeri."
 ],
 [
  "Terbang ke Sorong, lalu pilih satu dari dua jalur: speedboat privat langsung ke resort, atau feri ke Waisai dan lanjut dengan perahu kami.",
  "Terbang ke Sorong, lalu pilih satu dari dua jalur. Speedboat privat langsung ke resort, atau feri ke Waisai dan lanjut dengan perahu kami."
 ],
 [
  "Fly to Sorong, then choose one of two routes: a private speedboat straight to the resort, or the ferry to Waisai and our boat from there.",
  "Fly to Sorong, then choose one of two routes. Take a private speedboat straight to the resort, or the ferry to Waisai and our boat from there."
 ],
 [
  "Sehari naik perahu ke pulau-pulau di sekitar resort: laguna karst Piaynemo, Batanta, Kali Biru, dan tempat lain sesuai cuaca.",
  "Sehari naik perahu ke pulau-pulau di sekitar resort, seperti laguna karst Piaynemo, Batanta, Kali Biru, dan tempat lain sesuai cuaca."
 ],
 [
  "A day by boat to the islands around the resort: the karst lagoons of Piaynemo, Batanta, Kali Biru, and more, depending on the weather.",
  "A day by boat to the islands around the resort, such as the karst lagoons of Piaynemo, Batanta and Kali Biru, depending on the weather."
 ],
 [
  "Terbang ke Sorong. Dari Sorong ada dua pilihan: speedboat privat kami langsung ke resort sekitar 1,5 jam, atau kapal cepat umum ke Waisai sekitar 2 jam lalu dijemput perahu resort.",
  "Terbang ke Sorong. Dari Sorong ada dua pilihan, yaitu speedboat privat kami langsung ke resort sekitar 1,5 jam, atau kapal cepat umum ke Waisai sekitar 2 jam lalu dijemput perahu resort."
 ],
 [
  "Fly to Sorong. From there you have two options: our private speedboat straight to the resort in about 1.5 hours, or the public fast ferry to Waisai in about 2 hours, where our boat picks you up.",
  "Fly to Sorong. From there you can take our private speedboat straight to the resort in about 1.5 hours, or the public fast ferry to Waisai in about 2 hours, where our boat picks you up."
 ],
 [
  "menurut Peraturan Bupati Nomor 34 Tahun 2025: wisatawan mancanegara Rp 1.000.000 per orang dan WNI Rp 300.000, anak di bawah 12 tahun gratis.",
  "menurut Peraturan Bupati Nomor 34 Tahun 2025. Wisatawan mancanegara membayar Rp 1.000.000 per orang dan WNI Rp 300.000, anak di bawah 12 tahun gratis."
 ],
 [
  "under Regent Regulation 34 of 2025: Rp 1,000,000 per person for foreign visitors and Rp 300,000 for Indonesian citizens, free for children under 12.",
  "under Regent Regulation 34 of 2025. Foreign visitors pay Rp 1,000,000 per person and Indonesian citizens Rp 300,000, and children under 12 are free."
 ],
 [
  "Bawa juga uang tunai secukupnya dari Sorong atau Waisai: di kampung tidak ada ATM dan pembayaran nontunai belum tentu bisa.",
  "Bawa juga uang tunai secukupnya dari Sorong atau Waisai, karena di kampung tidak ada ATM dan pembayaran nontunai belum tentu bisa."
 ],
 [
  "Also bring enough cash from Sorong or Waisai: there are no ATMs in the villages and card payment may not work.",
  "Also bring enough cash from Sorong or Waisai, because there are no ATMs in the villages and card payment may not work."
 ],
 [
  "Kenangan itu kini ia abadikan: nama sang nenek menjadi nama resort",
  "Kenangan itu kini ia abadikan dengan menjadikan nama sang nenek sebagai nama resort"
 ],
 [
  "That memory lives on: her name is now the name of the resort,",
  "That memory lives on in the resort, which now carries her name,"
 ]
];
export const rapikanTandaBaca = (s: string) => GANTI_TANDA_BACA.reduce((x, [a, b]) => x.split(a).join(b), s);
