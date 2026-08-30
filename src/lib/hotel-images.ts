import { lookupHotelPhoto } from "./hotel-photo-fallbacks";
import type { Deal } from "./types";

function usablePhoto(value: string | null | undefined): value is string {
  return Boolean(value && (/^https?:\/\//i.test(value) || value.startsWith("/hotels/")));
}

export async function stampHotelImages(deals: Deal[]): Promise<Deal[]> {
  return deals.map((deal) => {
    if (usablePhoto(deal.imageUrl)) return deal;
    const fallback = lookupHotelPhoto(deal.chainId, deal.hotelName);
    return fallback ? { ...deal, imageUrl: fallback } : deal;
  });
}
