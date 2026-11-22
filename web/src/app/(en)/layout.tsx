import type { Metadata, Viewport } from "next";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL?.trim() || "http://localhost:3000"),
  title: { default: "Bakoeria Dive Resort", template: "%s · Bakoeria Dive Resort" },
  description: "A small dive resort with teak cottages by the beach. Dive by day, sleep under the stars.",
  icons: { icon: [{ url: "/favicon.ico", sizes: "48x48" }, { url: "/brand/icon.svg", type: "image/svg+xml" }], apple: "/brand/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    siteName: "Bakoeria Dive Resort",
    title: "Bakoeria Dive Resort · Raja Ampat",
    description: "A small dive resort with teak cottages by the beach in Raja Ampat. Dive by day, sleep under the stars.",
    url: "/",
    locale: "en_GB",
    alternateLocale: ["id_ID"],
    /* JPEG kecil (< 200 KB): WhatsApp tidak menampilkan gambar yang besar. ?v= memaksa pratinjau lama diperbarui. */
    images: [{ url: "/img/og-en.jpg?v=3", width: 1200, height: 630, alt: "Bakoeria Dive Resort, teak cottages under the night sky", type: "image/jpeg" }],
  },
  twitter: { card: "summary_large_image", title: "Bakoeria Dive Resort · Raja Ampat", description: "A small dive resort with teak cottages by the beach in Raja Ampat. Dive by day, sleep under the stars.", images: ["/img/og-en.jpg?v=3"] },
  alternates: { canonical: "/", languages: { en: "/", id: "/id" } },
};

export const viewport: Viewport = { themeColor: "#133250", width: "device-width", initialScale: 1 };

/** Root layout bahasa Inggris (alamat /). Bahasa Indonesia dan dashboard memakai layout (id). */
export default function RootLayoutEn({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
