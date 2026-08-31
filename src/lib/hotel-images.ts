import { lookupHotelPhoto } from "./hotel-photo-fallbacks";
import { hotelImageKey, normalizeHotelKey } from "./hotel-pages";
import type { Deal } from "./types";

function usablePhoto(value: string | null | undefined): value is string {
  return Boolean(value && (/^https?:\/\//i.test(value) || value.startsWith("/hotels/")));
}

function groupKey(deal: Deal): string | null {
  if (!normalizeHotelKey(deal.hotelName)) return null;
  return hotelImageKey(deal.chainId, deal.hotelName);
}

function mostCommonPhoto(urls: string[]): string | null {
  if (urls.length === 0) return null;
  const counts = new Map<string, number>();
  let best = urls[0];
  let bestCount = 0;
  for (const url of urls) {
    const next = (counts.get(url) ?? 0) + 1;
    counts.set(url, next);
    if (next > bestCount) {
      best = url;
      bestCount = next;
    }
  }
  return best;
}

function pickHotelPhoto(group: Deal[]): string | null {
  const sample = group[0];
  if (!sample) return null;
  return (
    lookupHotelPhoto(sample.chainId, sample.hotelName) ||
    mostCommonPhoto(group.map((deal) => deal.imageUrl).filter(usablePhoto))
  );
}

export async function stampHotelImages(deals: Deal[]): Promise<Deal[]> {
  const filled = deals.map((deal) => {
    if (usablePhoto(deal.imageUrl)) return deal;
    const fallback = lookupHotelPhoto(deal.chainId, deal.hotelName);
    return fallback ? { ...deal, imageUrl: fallback } : deal;
  });

  const groups = new Map<string, Deal[]>();
  for (const deal of filled) {
    const key = groupKey(deal);
    if (!key) continue;
    const list = groups.get(key);
    if (list) list.push(deal);
    else groups.set(key, [deal]);
  }

  const chosen = new Map<string, string>();
  for (const [key, group] of groups) {
    const photo = pickHotelPhoto(group);
    if (photo) chosen.set(key, photo);
  }

  return filled.map((deal) => {
    const key = groupKey(deal);
    const photo = key ? chosen.get(key) : undefined;
    return photo && deal.imageUrl !== photo ? { ...deal, imageUrl: photo } : deal;
  });
}
