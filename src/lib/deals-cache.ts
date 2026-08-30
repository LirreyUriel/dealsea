import type { Deal, DealsResponse, HotelChainId } from "./types";

const DEFAULT_CACHE_URL =
  process.env.DEALS_CACHE_URL ??
  "https://raw.githubusercontent.com/LirreyUriel/dealsea/scrape-cache/deals-cache.json";

function isDeal(value: unknown): value is Deal {
  if (!value || typeof value !== "object") return false;
  const deal = value as Deal;
  return typeof deal.id === "string" && typeof deal.hotelName === "string" && deal.source === "live";
}

function isPayload(value: unknown): value is DealsResponse {
  if (!value || typeof value !== "object") return false;
  const payload = value as DealsResponse;
  return Array.isArray(payload.deals) && payload.deals.every(isDeal) && payload.source === "live";
}

export function remoteDealsCacheUrl(bustCache = false): string {
  const url = DEFAULT_CACHE_URL;
  if (!bustCache) return url;
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}t=${Date.now()}`;
}

export async function loadRemoteDealsCache(options?: {
  bustCache?: boolean;
  chainIds?: HotelChainId[];
}): Promise<DealsResponse | null> {
  try {
    const response = await fetch(remoteDealsCacheUrl(options?.bustCache), {
      cache: "no-store",
      headers: { Accept: "application/json", "User-Agent": "DealSeaCache/1.0" },
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    if (!isPayload(payload) || payload.deals.length === 0) return null;
    const chainIds = options?.chainIds;
    if (!chainIds?.length) return payload;
    return {
      ...payload,
      deals: payload.deals.filter((deal) => chainIds.includes(deal.chainId)),
    };
  } catch {
    return null;
  }
}

export function shouldUseRemoteDealsCache(): boolean {
  return Boolean(process.env.VERCEL) && process.env.DEALS_CACHE_FORCE_LIVE !== "1";
}
