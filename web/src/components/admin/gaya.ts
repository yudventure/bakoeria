import type { Channel, Status } from "@/lib/booking";

/** Warna chip status di kalender dan daftar. */
export const WARNA_STATUS: Record<Status, { pil: "netral" | "hijau" | "kuning" | "merah" | "biru" | "emas"; chip: string }> = {
  TENTATIVE: { pil: "kuning", chip: "bg-panel-kuning-lembut text-panel-kuning ring-1 ring-inset ring-panel-kuning/30 border-dashed" },
  CONFIRMED: { pil: "biru", chip: "bg-panel-utama text-white" },
  CHECKED_IN: { pil: "hijau", chip: "bg-panel-hijau text-white" },
  CHECKED_OUT: { pil: "netral", chip: "bg-panel-lembut text-panel-redup" },
  CANCELLED: { pil: "netral", chip: "bg-panel-latar text-panel-redup line-through" },
  NO_SHOW: { pil: "netral", chip: "bg-panel-latar text-panel-redup line-through" },
  CONFLICT: { pil: "merah", chip: "bg-panel-merah text-white" },
  BLOCKED: { pil: "netral", chip: "bg-[repeating-linear-gradient(135deg,#e5e2da_0_6px,#f4f3ef_6px_12px)] text-panel-redup" },
};

export const WARNA_CHANNEL: Record<Channel, string> = {
  WEBSITE: "#E2B05E",
  WHATSAPP: "#2F7A4F",
  BOOKING_COM: "#1E4E9C",
  AGODA: "#C2410C",
  TRAVELOKA: "#0EA5E9",
  AIRBNB: "#E11D48",
  AGEN: "#6B4A1E",
  WALK_IN: "#7E9A3A",
  BLOCK: "#9CA3AF",
};
