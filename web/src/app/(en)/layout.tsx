import { bacaPengaturan } from "@/lib/server/simpanan";
import { SKRIP_PERAMBAN_LAMA } from "@/lib/peramban-lama";
import type { Metadata, Viewport } from "next";
import "../globals.css";

const METADATA: Metadata = {
  metadataBase: new URL(process.env.SITE_URL?.trim() || "http://localhost:3000"),
  title: { default: "Bakoeria Dive Resort", template: "%s · Bakoeria Dive Resort" },
  description: "A small dive resort with ironwood cottages by the beach. Dive by day, sleep under the stars.",
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
    description: "A small dive resort with ironwood cottages by the beach in Raja Ampat. Dive by day, sleep under the stars.",
    url: "/",
    locale: "en_GB",
    alternateLocale: ["id_ID"],
    /* JPEG kecil (< 200 KB): WhatsApp tidak menampilkan gambar yang besar. ?v= memaksa pratinjau lama diperbarui. */
    images: [{ url: "/img/og-en.jpg?v=3", width: 1200, height: 630, alt: "Bakoeria Dive Resort, ironwood cottages under the night sky", type: "image/jpeg" }],
  },
  twitter: { card: "summary_large_image", title: "Bakoeria Dive Resort · Raja Ampat", description: "A small dive resort with ironwood cottages by the beach in Raja Ampat. Dive by day, sleep under the stars.", images: ["/img/og-en.jpg?v=3"] },
  alternates: { canonical: "/", languages: { en: "/", id: "/id" } },
};

/** Kode verifikasi Google Search Console dan domain Meta dari dashboard (Pengaturan, Promosi). */
export async function generateMetadata(): Promise<Metadata> {
  const i = (await bacaPengaturan()).iklan;
  return { ...METADATA, verification: { ...(i.googleVerifikasi ? { google: i.googleVerifikasi } : {}), ...(i.metaVerifikasi ? { other: { "facebook-domain-verification": i.metaVerifikasi } } : {}) } };
}

export const viewport: Viewport = { themeColor: "#133250", width: "device-width", initialScale: 1 };

/** Root layout bahasa Inggris (alamat /). Bahasa Indonesia dan dashboard memakai layout (id). */
export default function RootLayoutEn({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: SKRIP_PERAMBAN_LAMA }} /></head>
      <body>{children}</body>
    </html>
  );
}
