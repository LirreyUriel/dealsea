import { dealCity, dealMatchesAudience, isWeekendDeal } from "./deal-tags";
import { effectiveDiscountPercent } from "./discount";
import type { Deal, DealFilters } from "./types";

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/['׳`״"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function foldHebrew(value: string): string {
  return normalizeSearch(value)
    .replace(/י/g, "")
    .replace(/ך/g, "כ")
    .replace(/ם/g, "מ")
    .replace(/ן/g, "נ")
    .replace(/ף/g, "פ")
    .replace(/ץ/g, "צ");
}

function queryTokens(query: string): string[] {
  return normalizeSearch(query)
    .replace(/^(ה)?מלונות?\s+/, "")
    .split(" ")
    .filter(Boolean);
}

function tokensMatch(tokens: string[], haystack: string): boolean {
  const foldedHay = foldHebrew(haystack);
  return tokens.every((token) => haystack.includes(token) || foldedHay.includes(foldHebrew(token)));
}

function matchesQuery(deal: Deal, query: string): boolean {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return true;
  const haystack = normalizeSearch(
    [deal.hotelName, deal.chainName, deal.title, deal.description, deal.location ?? "", deal.discountValue ?? ""].join(
      " ",
    ),
  );
  if (tokensMatch(tokens, haystack)) return true;
  return tokensMatch(tokens, normalizeSearch(deal.hotelName));
}

function compareDeals(a: Deal, b: Deal, sort: DealFilters["sort"]): number {
  if (sort === "discount") {
    return effectiveDiscountPercent(b) - effectiveDiscountPercent(a);
  }
  if (sort === "price") {
    const aPrice = a.pricePerNight && a.pricePerNight > 0 ? a.pricePerNight : Number.POSITIVE_INFINITY;
    const bPrice = b.pricePerNight && b.pricePerNight > 0 ? b.pricePerNight : Number.POSITIVE_INFINITY;
    return aPrice - bPrice;
  }
  if (sort === "hotel") {
    return a.hotelName.localeCompare(b.hotelName, "he");
  }
  const aDate = a.validTo ? Date.parse(a.validTo) : Number.POSITIVE_INFINITY;
  const bDate = b.validTo ? Date.parse(b.validTo) : Number.POSITIVE_INFINITY;
  return aDate - bDate;
}

export function filterAndSortDeals(deals: Deal[], filters: DealFilters): Deal[] {
  const chains = filters.chains ?? [];
  const cities = filters.cities ?? [];
  return deals
    .filter((deal) => (chains.length === 0 ? true : chains.includes(deal.chainId)))
    .filter((deal) => {
      if (cities.length === 0) return true;
      const city = dealCity(deal);
      return city ? cities.includes(city) : false;
    })
    .filter((deal) => (filters.weekendOnly ? isWeekendDeal(deal) : true))
    .filter((deal) => dealMatchesAudience(deal, filters.audiences ?? []))
    .filter((deal) => matchesQuery(deal, filters.query))
    .sort((a, b) => compareDeals(a, b, filters.sort));
}
