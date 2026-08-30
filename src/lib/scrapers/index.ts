import { HOTEL_CHAINS } from "../chains";
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

export async function fetchChainDeals(chainId: HotelChainId): Promise<Deal[]> {
  const chain = HOTEL_CHAINS.find((item) => item.id === chainId);
  if (!chain) return [];

  if (chainId === "isrotel") return scrapeIsrotelDeals(chain.dealsUrl);
  if (chainId === "fattal") return scrapeFattalDeals(chain.dealsUrl);
  if (chainId === "brown") return scrapeBrownDeals(chain.dealsUrl);
  if (chainId === "atlas") return scrapeAtlasDeals(chain.dealsUrl);
  if (chainId === "dan") return scrapeDanDeals(chain.dealsUrl);
  if (chainId === "africa-israel") return scrapeAfricaIsraelDeals(chain.dealsUrl);
  if (chainId === "herbert-samuel") return scrapeHerbertSamuelDeals(chain.dealsUrl);
  return scrapeChainWithCheerio(chain);
}

export async function fetchAllDeals(
  chainIds?: HotelChainId[],
  options?: { bypassCache?: boolean },
): Promise<DealsResponse> {
  const key = cacheKey(chainIds);
  const cached = dealCache.get(key);
  if (!options?.bypassCache && cached && cached.expires > Date.now()) {
    return {
      ...cached.payload,
      deals: await stampCityImages(
        await stampHotelImages(stampFirstSeen(cached.payload.deals.map(sanitizeDeal))),
      ),
    };
  }

  const targets = chainIds?.length
    ? HOTEL_CHAINS.filter((chain) => chainIds.includes(chain.id))
    : HOTEL_CHAINS;

  const errors: DealsResponse["errors"] = [];
  const settled = await Promise.allSettled(
    targets.map(async (chain) => {
      try {
        return await withTimeout(fetchChainDeals(chain.id), chain.nameHe);
      } catch (error) {
        errors.push({
          chainId: chain.id,
          message: error instanceof Error ? error.message : "שגיאה לא ידועה בשליפת דילים",
        });
        return [];
      }
    }),
  );

  const deals = settled
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter((deal) => deal.source === "live")
    .map(sanitizeDeal);

  const payload: DealsResponse = {
    deals: await stampCityImages(await stampHotelImages(stampFirstSeen(deals))),
    source: "live",
    fetchedAt: new Date().toISOString(),
    asOf: israelToday(),
    errors,
  };
  dealCache.set(key, { expires: Date.now() + CACHE_TTL_MS, payload });
  return payload;
}
