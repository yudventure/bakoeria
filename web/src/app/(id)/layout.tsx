import { SKRIP_PERAMBAN_LAMA } from "@/lib/peramban-lama";
import type { Metadata, Viewport } from "next";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL?.trim() || "http://localhost:3000"),
  title: { default: "Bakoeria Dive Resort", template: "%s · Bakoeria Dive Resort" },
  description: "Resor selam butik dengan cottage kayu besi di tepi pantai. Menyelam siang, bermalam di bawah bintang.",
  /* ?v= dinaikkan tiap kali ikon berganti: browser menyimpan favicon sangat lama dan tidak mengambil ulang bila alamatnya sama. */
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "48x48" },
      { url: "/brand/favicon-32.png?v=3", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-192.png?v=3", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=3",
    apple: "/brand/apple-touch-icon.png?v=3",
  },
  openGraph: {
    type: "website",
    siteName: "Bakoeria Dive Resort",
    title: "Bakoeria Dive Resort · Raja Ampat",
    description: "Resort selam kecil dengan cottage kayu besi di tepi pantai Raja Ampat. Menyelam siang, bermalam di bawah bintang.",
    url: "/id",
    locale: "id_ID",
    alternateLocale: ["en_GB"],
    /* JPEG kecil (< 200 KB): WhatsApp tidak menampilkan gambar yang besar. ?v= memaksa pratinjau lama diperbarui. */
    images: [{ url: "/img/og-id.jpg?v=3", width: 1200, height: 630, alt: "Bakoeria Dive Resort, cottage kayu besi di bawah langit malam", type: "image/jpeg" }],
  },
  twitter: { card: "summary_large_image", title: "Bakoeria Dive Resort · Raja Ampat", description: "Resort selam kecil dengan cottage kayu besi di tepi pantai Raja Ampat. Menyelam siang, bermalam di bawah bintang.", images: ["/img/og-id.jpg?v=3"] },
  alternates: { canonical: "/id", languages: { en: "/", id: "/id" } },
};

export const viewport: Viewport = { themeColor: "#133250", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: SKRIP_PERAMBAN_LAMA }} /></head>
      <body>{children}</body>
    </html>
  );
}
