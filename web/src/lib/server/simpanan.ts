import "server-only";
import { rapikanKonten, type Konten } from "@/lib/konten";
import { rapikanPengaturan, type Pengaturan } from "@/lib/pengaturan";
import { bacaJson, ubahJson } from "./gudang";

export const bacaKonten = async (): Promise<Konten> => rapikanKonten(await bacaJson<Partial<Konten> | null>("konten.json", null));
export const simpanKonten = (k: unknown) => ubahJson("konten.json", null, () => rapikanKonten(k as Partial<Konten>), 0o644).then(rapikanKonten);

export const bacaPengaturan = async (): Promise<Pengaturan> => rapikanPengaturan(await bacaJson<Partial<Pengaturan> | null>("pengaturan.json", null));
export const simpanPengaturan = (p: unknown) => ubahJson("pengaturan.json", null, () => rapikanPengaturan(p as Partial<Pengaturan>)).then(rapikanPengaturan);
