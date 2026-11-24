import type { MetadataRoute } from "next";

/**
 * robots.txt. Dashboard (/kelola) tidak diblokir di sini: alamat yang diblokir robots tetap
 * bisa terindeks tanpa tanda noindex-nya terbaca. Dashboard keluar dari Google lewat noindex.
 */
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  const asal = (process.env.SITE_URL?.trim() || "https://bakoeria.com").replace(/\/+$/, "");
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }], sitemap: `${asal}/sitemap.xml`, host: asal };
}
