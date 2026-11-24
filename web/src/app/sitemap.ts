import type { MetadataRoute } from "next";

/** Peta situs untuk Google Search Console: halaman Inggris (/) dan Indonesia (/id). */
export const dynamic = "force-dynamic";
export default function sitemap(): MetadataRoute.Sitemap {
  const asal = (process.env.SITE_URL?.trim() || "https://bakoeria.com").replace(/\/+$/, "");
  const bahasa = { languages: { en: `${asal}/`, id: `${asal}/id` } };
  return [
    { url: `${asal}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1, alternates: bahasa },
    { url: `${asal}/id`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9, alternates: bahasa },
  ];
}
