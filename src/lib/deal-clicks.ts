import { readJsonFile, writeJsonFile } from "./json-store";

export interface DealClick {
  userId: string;
  dealId: string;
  hotelName: string;
  chainId: string;
  chainName: string;
  bookingUrl: string;
  discountPercent: number | null;
  idfFilterOn: boolean;
  weekendFilterOn: boolean;
  clubFilterOn: boolean;
  message: string;
  createdAt: string;
}

const FILE = "deal-clicks.json";
const USER_ID = /^[\w-]{8,128}$/;

function asBool(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function asDiscount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function flag(on: boolean): string {
  return on ? "כן" : "לא";
}

export function addDealClick(input: {
  userId?: string;
  dealId?: string;
  hotelName?: string;
  chainId?: string;
  chainName?: string;
  bookingUrl?: string;
  discountPercent?: number | null;
  idfFilterOn?: boolean;
  weekendFilterOn?: boolean;
  clubFilterOn?: boolean;
  message?: string;
}): { ok: true; entry: DealClick } | { ok: false; message: string } {
  const userId = (input.userId ?? "").trim();
  const dealId = (input.dealId ?? "").trim();
  const hotelName = (input.hotelName ?? "").trim();
  const chainId = (input.chainId ?? "").trim();
  const chainName = (input.chainName ?? "").trim();
  const bookingUrl = (input.bookingUrl ?? "").trim();
  const discountPercent = asDiscount(input.discountPercent);
  const idfFilterOn = asBool(input.idfFilterOn);
  const weekendFilterOn = asBool(input.weekendFilterOn);
  const clubFilterOn = asBool(input.clubFilterOn);
  if (!USER_ID.test(userId)) return { ok: false, message: "חסר מזהה משתמש." };
  if (!dealId && !bookingUrl) return { ok: false, message: "חסר מזהה דיל." };

  const discountLabel = discountPercent == null ? "—" : `${discountPercent}%`;
  const message =
    (input.message ?? "").trim() ||
    `${userId}, תפוס את הדיל: ${hotelName || dealId || bookingUrl}, ${discountLabel}, מילואים: ${flag(idfFilterOn)}, סוף שבוע: ${flag(weekendFilterOn)}, מועדון: ${flag(clubFilterOn)}`;

  const entry: DealClick = {
    userId,
    dealId,
    hotelName,
    chainId,
    chainName,
    bookingUrl,
    discountPercent,
    idfFilterOn,
    weekendFilterOn,
    clubFilterOn,
    message,
    createdAt: new Date().toISOString(),
  };
  const list = readJsonFile<DealClick[]>(FILE, []);
  list.push(entry);
  writeJsonFile(FILE, list);
  return { ok: true, entry };
}
