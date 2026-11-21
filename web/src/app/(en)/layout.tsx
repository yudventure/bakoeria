import type { Metadata, Viewport } from "next";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL?.trim() || "http://localhost:3000"),
  title: { default: "Bakoeria Dive Resort", template: "%s · Bakoeria Dive Resort" },
  description: "A small dive resort with teak cottages by the beach. Dive by day, sleep under the stars.",
  icons: { icon: "/brand/icon.svg", apple: "/brand/apple-touch-icon.png" },
  openGraph: { title: "Bakoeria Dive Resort", description: "Dive by day, sleep under the stars.", images: ["/img/og.png"], type: "website", locale: "en_GB" },
  alternates: { canonical: "/", languages: { en: "/", id: "/id" } },
};

export const viewport: Viewport = { themeColor: "#041C3E", width: "device-width", initialScale: 1 };

/** Root layout bahasa Inggris (alamat /). Bahasa Indonesia dan dashboard memakai layout (id). */
export default function RootLayoutEn({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
