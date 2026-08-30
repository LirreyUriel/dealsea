import { readJsonFile, writeJsonFile } from "./json-store";

export interface DealClick {
  userId: string;
  dealId: string;
  hotelName: string;
  chainId: string;
  chainName: string;
  bookingUrl: string;
  message: string;
  createdAt: string;
}

const FILE = "deal-clicks.json";
const USER_ID = /^[\w-]{8,128}$/;

export function addDealClick(input: {
  userId?: string;
  dealId?: string;
  hotelName?: string;
  chainId?: string;
  chainName?: string;
  bookingUrl?: string;
  message?: string;
}): { ok: true } | { ok: false; message: string } {
  const userId = (input.userId ?? "").trim();
  const dealId = (input.dealId ?? "").trim();
  const hotelName = (input.hotelName ?? "").trim();
  const chainId = (input.chainId ?? "").trim();
  const chainName = (input.chainName ?? "").trim();
  const bookingUrl = (input.bookingUrl ?? "").trim();
  if (!USER_ID.test(userId)) return { ok: false, message: "חסר מזהה משתמש." };
  if (!dealId && !bookingUrl) return { ok: false, message: "חסר מזהה דיל." };

  const message =
    (input.message ?? "").trim() || `תפוס את הדיל: ${hotelName || dealId || bookingUrl}`;

  const list = readJsonFile<DealClick[]>(FILE, []);
  list.push({
    userId,
    dealId,
    hotelName,
    chainId,
    chainName,
    bookingUrl,
    message,
    createdAt: new Date().toISOString(),
  });
  writeJsonFile(FILE, list);
  return { ok: true };
}
