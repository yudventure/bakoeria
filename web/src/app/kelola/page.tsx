import type { Metadata } from "next";

import Dasbor from "@/components/admin/dasbor";
import Masuk from "@/components/admin/masuk";
import { akunMasuk } from "@/lib/server/akses";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Dashboard resort. Tanpa sesi yang sah, HTML dashboard tidak pernah dikirim. */
export default async function Kelola() {
  const a = await akunMasuk();
  if (!a) return <Masuk />;
  return <Dasbor akun={{ email: a.email, nama: a.nama, peran: a.peran }} />;
}
