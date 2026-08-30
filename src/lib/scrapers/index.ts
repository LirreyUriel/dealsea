import { HOTEL_CHAINS } from "../chains";
import { loadRemoteDealsCache, shouldUseRemoteDealsCache } from "../deals-cache";
import { stampFirstSeen } from "../first-seen";
import { israelToday } from "../format";
import { stampCityImages } from "../city-images";
import { stampHotelImages } from "../hotel-images";
import { isDiscountAmountUsedAsPrice } from "../parse-deal";
import type { Deal, DealsResponse, HotelChainId } from "../types";
import { scrapeAfricaIsraelDeals } from "./africa-israel";
import { scrapeAtlasDeals } from "./atlas";
import { scrapeBrownDeals } from "./brown";
import { scrapeChainWithCheerio } from "./cheerio-scraper";
import { scrapeDanDeals } from "./dan";
import { scrapeFattalDeals } from "./fattal";
import { scrapeHerbertSamuelDeals } from "./herbert-samuel";
import { scrapeIsrotelDeals } from "./isrotel";

function sanitizeDeal(deal: Deal): Deal {
  if (
    deal.pricePerNight &&
    isDiscountAmountUsedAsPrice(`${deal.title} ${deal.description}`, deal.pricePerNight)
  ) {
    return { ...deal, pricePerNight: null };
  }
  return deal;
}

const CHAIN_TIMEOUT_MS = 90_000;
const CACHE_TTL_MS = 5 * 60_000;
const PLAYWRIGHT_CHAINS = new Set<HotelChainId>(["isrotel", "fattal", "atlas", "africa-israel"]);
const LIVE_CONCURRENCY = process.env.CI ? 2 : HOTEL_CHAINS.length;

let playwrightLock = Promise.resolve();

function withPlaywrightLock<T>(work: () => Promise<T>): Promise<T> {
  const run = playwrightLock.then(work, work);
  playwrightLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export interface FetchDealsOptions {
  bypassCache?: boolean;
  forceLive?: boolean;
  skipStamps?: boolean;
}

const dealCache = new Map<string, { expires: number; payload: DealsResponse }>();

function cacheKey(chainIds?: HotelChainId[]): string {
  return chainIds?.length ? [...chainIds].sort().join(",") : "all";
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out`)), CHAIN_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function scrapePrimary(chainId: HotelChainId, dealsUrl: string): Promise<Deal[]> {
  if (chainId === "isrotel") return scrapeIsrotelDeals(dealsUrl);
  if (chainId === "fattal") return scrapeFattalDeals(dealsUrl);
  if (chainId === "brown") return scrapeBrownDeals(dealsUrl);
  if (chainId === "atlas") return scrapeAtlasDeals(dealsUrl);
  if (chainId === "dan") return scrapeDanDeals(dealsUrl);
  if (chainId === "africa-israel") return scrapeAfricaIsraelDeals(dealsUrl);
  if (chainId === "herbert-samuel") return scrapeHerbertSamuelDeals(dealsUrl);
  return [];
}

async function scrapeChain(chainId: HotelChainId): Promise<Deal[]> {
  const chain = HOTEL_CHAINS.find((item) => item.id === chainId);
  if (!chain) return [];

  try {
    const deals = await scrapePrimary(chainId, chain.dealsUrl);
    if (deals.length > 0) return deals;
  } catch {
    // Fall through to Cheerio so a Playwright/host failure still returns live cards.
  }

  return scrapeChainWithCheerio(chain);
}

export async function fetchChainDeals(chainId: HotelChainId): Promise<Deal[]> {
  if (process.env.CI && PLAYWRIGHT_CHAINS.has(chainId)) {
    return withPlaywrightLock(() => scrapeChain(chainId));
  }
  return scrapeChain(chainId);
}

async function stampDeals(deals: Deal[], skipStamps?: boolean): Promise<Deal[]> {
  if (skipStamps) return deals;
  let stamped = deals;
  try {
    stamped = stampFirstSeen(stamped);
    stamped = await stampHotelImages(stamped);
    stamped = await stampCityImages(stamped);
  } catch {
    // Image/cache stamping must never fail the deals API.
  }
  return stamped;
}

async function mapPool<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next;
        next += 1;
        results[index] = await worker(items[index]);
      }
    }),
  );
  return results;
}

export async function fetchAllDeals(
  chainIds?: HotelChainId[],
  options?: FetchDealsOptions,
): Promise<DealsResponse> {
  const key = cacheKey(chainIds);
  const cached = dealCache.get(key);
  if (!options?.bypassCache && cached && cached.expires > Date.now()) {
    return {
      ...cached.payload,
      deals: await stampDeals(cached.payload.deals.map(sanitizeDeal), options?.skipStamps),
    };
  }

  if (shouldUseRemoteDealsCache() && !options?.forceLive) {
    const remote = await loadRemoteDealsCache({
      bustCache: options?.bypassCache,
      chainIds,
    });
    if (remote) {
      const payload: DealsResponse = {
        ...remote,
        deals: await stampDeals(remote.deals.map(sanitizeDeal), options?.skipStamps),
      };
      dealCache.set(key, { expires: Date.now() + CACHE_TTL_MS, payload });
      return payload;
    }
  }

  const targets = chainIds?.length
    ? HOTEL_CHAINS.filter((chain) => chainIds.includes(chain.id))
    : HOTEL_CHAINS;

  const errors: DealsResponse["errors"] = [];
  const batches = await mapPool(targets, LIVE_CONCURRENCY, async (chain) => {
    try {
      return await withTimeout(fetchChainDeals(chain.id), chain.nameHe);
    } catch (error) {
      errors.push({
        chainId: chain.id,
        message: error instanceof Error ? error.message : "שגיאה לא ידועה בשליפת דילים",
      });
      return [];
    }
  });

  const deals = batches
    .flat()
    .filter((deal) => deal.source === "live")
    .map(sanitizeDeal);

  const payload: DealsResponse = {
    deals: await stampDeals(deals, options?.skipStamps),
    source: "live",
    fetchedAt: new Date().toISOString(),
    asOf: israelToday(),
    errors,
  };
  dealCache.set(key, { expires: Date.now() + CACHE_TTL_MS, payload });
  return payload;
}
