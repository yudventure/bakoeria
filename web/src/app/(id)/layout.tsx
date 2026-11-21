import type { Metadata, Viewport } from "next";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL?.trim() || "http://localhost:3000"),
  title: { default: "Bakoeria Dive Resort", template: "%s · Bakoeria Dive Resort" },
  description: "Resor selam butik dengan cottage kayu jati di tepi pantai. Menyelam siang, bermalam di bawah bintang.",
  icons: { icon: "/brand/icon.svg", apple: "/brand/apple-touch-icon.png" },
  openGraph: { title: "Bakoeria Dive Resort", description: "Menyelam siang, bermalam di bawah bintang.", images: ["/img/og.png"], type: "website", locale: "id_ID" },
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
