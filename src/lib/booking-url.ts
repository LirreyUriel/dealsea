import { israelToday } from "./format";
import type { Deal } from "./types";

function addDaysIso(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function toDanDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}`;
}

export function saleStayDates(
  deal: Pick<Deal, "validFrom" | "validTo" | "minNights">,
): { checkIn: string; checkOut: string } | null {
  const first = deal.validFrom ?? deal.validTo;
  if (!first) return null;
  const today = israelToday();
  const checkIn = first < today && deal.validTo && deal.validTo >= today ? today : first;
  const nights = deal.minNights && deal.minNights > 0 ? deal.minNights : 1;
  return { checkIn, checkOut: addDaysIso(checkIn, nights) };
}

export function withDanStayDates(
  bookingUrl: string,
  stay: { checkIn: string; checkOut: string } | null,
): string {
  if (!stay) return bookingUrl;
  try {
    const url = new URL(bookingUrl);
    if (!url.pathname.includes("/Booking/SearchResults")) return bookingUrl;
    url.searchParams.set("CheckIn", toDanDate(stay.checkIn));
    url.searchParams.set("CheckOut", toDanDate(stay.checkOut));
    if (![...url.searchParams.keys()].some((key) => key.startsWith("Pax"))) {
      url.searchParams.set("Pax[0].Adults", "2");
      url.searchParams.set("Pax[0].Children", "0");
      url.searchParams.set("Pax[0].Infants", "0");
    }
    return url.toString();
  } catch {
    return bookingUrl;
  }
}

export function dealBookingUrl(deal: Deal): string {
  if (deal.chainId !== "dan") return deal.bookingUrl;
  return withDanStayDates(deal.bookingUrl, saleStayDates(deal));
}
