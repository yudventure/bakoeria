import type { Metadata, Viewport } from "next";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL?.trim() || "http://localhost:3000"),
  title: { default: "Bakoeria Dive Resort", template: "%s · Bakoeria Dive Resort" },
  description: "Resor selam butik dengan cottage kayu jati di tepi pantai. Menyelam siang, bermalam di bawah bintang.",
  icons: { icon: [{ url: "/favicon.ico", sizes: "48x48" }, { url: "/brand/icon.svg", type: "image/svg+xml" }], apple: "/brand/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    siteName: "Bakoeria Dive Resort",
    title: "Bakoeria Dive Resort · Raja Ampat",
    description: "Resort selam kecil dengan cottage kayu jati di tepi pantai Raja Ampat. Menyelam siang, bermalam di bawah bintang.",
    url: "/id",
    locale: "id_ID",
    alternateLocale: ["en_GB"],
    /* JPEG kecil (< 200 KB): WhatsApp tidak menampilkan gambar yang besar. ?v= memaksa pratinjau lama diperbarui. */
    images: [{ url: "/img/og-id.jpg?v=2", width: 1200, height: 630, alt: "Bakoeria Dive Resort, cottage kayu jati di bawah langit malam", type: "image/jpeg" }],
  },
  twitter: { card: "summary_large_image", title: "Bakoeria Dive Resort · Raja Ampat", description: "Resort selam kecil dengan cottage kayu jati di tepi pantai Raja Ampat. Menyelam siang, bermalam di bawah bintang.", images: ["/img/og-id.jpg?v=2"] },
  alternates: { canonical: "/id", languages: { en: "/", id: "/id" } },
};

export const viewport: Viewport = { themeColor: "#041C3E", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
