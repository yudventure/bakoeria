import type { Channel, PaymentKind, PaymentMethod, Status } from "@/lib/booking";
import type { Peran } from "@/lib/peran";

export interface AkunSaya {
  email: string;
  nama: string;
  peran: Peran;
}
export interface Kamar {
  id: string;
  name: string;
  roomType: string | null;
  capAdult: number;
  capChild: number;
  baseRate: number;
  isActive: boolean;
  inactiveReason: string | null;
  sortOrder: number;
  sizeM2: number | null;
  descEn: string;
  descId: string;
  featuresEn: string[];
  featuresId: string[];
  musim: { id: string; dateFrom: string; dateTo: string; rate: number; label: string | null }[];
}
export interface Pesanan {
  id: string;
  code: string;
  roomId: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  channel: Channel;
  status: Status;
  source: "MANUAL" | "ICAL" | "WEBSITE";
  pax: number | null;
  dives: number | null;
  totalAmount: number | null;
  otaCommissionEst: number | null;
  notes: string | null;
  holdExpiresAt: string | null;
  conflictGroup: string | null;
  createdBy: string | null;
  createdAt: string;
  guest: { id: string; name: string; phone: string | null; email: string | null; origin: string | null; diveCert: string | null } | null;
  payments: { id: string; amount: number; kind: PaymentKind; method: PaymentMethod; paidAt: string; reference: string | null; recordedBy: string | null }[];
}
