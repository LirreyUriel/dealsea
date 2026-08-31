import { HOTEL_CHAINS } from "./chains";
import { uniqueCities } from "./deal-tags";
import type { AudienceTag, Deal, DealFilters, HotelChainId } from "./types";

export type SeoKind = "city" | "chain" | "audience" | "weekend";

export interface SeoRoute {
  slug: string;
  aliases: string[];
  kind: SeoKind;
  title: string;
  h1: string;
  description: string;
  filters: Partial<DealFilters>;
}

const CITY_ALIASES: Record<string, string[]> = {
  אילת: ["eilat"],
  "ים המלח": ["dead-sea", "yam-hamelach"],
  "תל אביב": ["tel-aviv", "tlv"],
  ירושלים: ["jerusalem"],
  הרצליה: ["herzliya"],
  חיפה: ["haifa"],
  קיסריה: ["caesarea"],
  כנרת: ["kinneret"],
  טבריה: ["tiberias"],
  נתניה: ["netanya"],
  אשדוד: ["ashdod"],
  נצרת: ["nazareth"],
  צפת: ["safed"],
  "מצפה רמון": ["mitzpe-ramon"],
  הנגב: ["negev"],
  "נתב״ג": ["airport", "natbag"],
  צפון: ["north"],
};

function citySlug(city: string): string {
  return city.replace(/\s+/g, "-");
}

function cityRoute(city: string): SeoRoute {
  return {
    slug: citySlug(city),
    aliases: CITY_ALIASES[city] ?? [],
    kind: "city",
    title: `מבצעי מלונות ב${city}`,
    h1: `מבצעי מלונות ב${city}`,
    description: `דילים חיים למלונות ב${city}. דילסי סורק בזמן אמת את ישרוטל, פתאל, בראון, דן ועוד — מחירים בשקלים ישירות מהאתרים הרשמיים.`,
    filters: { cities: [city] },
  };
}

function chainRoute(chainId: HotelChainId, nameHe: string): SeoRoute {
  return {
    slug: `מלונות-${nameHe.replace(/\s+/g, "-")}`,
    aliases: [chainId, `hotels-${chainId}`],
    kind: "chain",
    title: `מבצעי מלונות ${nameHe}`,
    h1: `מבצעי מלונות ${nameHe}`,
    description: `כל המבצעים החיים של רשת ${nameHe}. דילסי משווה הנחות, מחירי לילה וחבילות נופש בישראל ישירות מהאתר הרשמי.`,
    filters: { chains: [chainId] },
  };
}

const STATIC_ROUTES: SeoRoute[] = [
  {
    slug: "מילואים",
    aliases: ["idf", "reservists", "כוחות-הביטחון"],
    kind: "audience",
    title: "מבצעי מילואים וכוחות הביטחון",
    h1: "מבצעי מילואים וכוחות הביטחון",
    description: "דילים למשרתי מילואים, חיילים וכוחות הביטחון במלונות בישראל. דילסי מרכז הטבות חיילים ומילואים מרשתות המלונאות המובילות.",
    filters: { audiences: ["idf" as AudienceTag] },
  },
  {
    slug: "חברי-מועדון",
    aliases: ["club", "club-members", "מועדון"],
    kind: "audience",
    title: "מבצעים לחברי מועדון",
    h1: "מבצעים לחברי מועדון",
    description: "מבצעי מועדון חיים — The Club, Club Brown, E-DAN ועוד. דילסי מציג הנחות לחברי מועדוני המלונות בישראל.",
    filters: { audiences: ["club" as AudienceTag] },
  },
  {
    slug: "סוף-שבוע",
    aliases: ["weekend"],
    kind: "weekend",
    title: "מבצעי סוף שבוע במלונות",
    h1: "מבצעי סוף שבוע במלונות",
    description: "דילים לסוף שבוע במלונות בישראל — שישי–שבת וחבילות weekend. דילסי סורק בזמן אמת את הרשתות הרשמיות.",
    filters: { weekendOnly: true },
  },
  ...HOTEL_CHAINS.map((chain) => chainRoute(chain.id, chain.nameHe)),
];

const FALLBACK_CITIES = Object.keys(CITY_ALIASES);

export function allSeoRoutes(deals: Deal[] = []): SeoRoute[] {
  const cities = uniqueCities(deals);
  const cityNames = cities.length > 0 ? cities : FALLBACK_CITIES;
  return [...cityNames.map(cityRoute), ...STATIC_ROUTES];
}

export function resolveSeoRoute(slug: string, deals: Deal[] = []): SeoRoute | null {
  const decoded = decodeURIComponent(slug).trim();
  const routes = allSeoRoutes(deals);
  return (
    routes.find((route) => route.slug === decoded || route.aliases.includes(decoded.toLowerCase())) ?? null
  );
}

export function filtersFromRoute(route: SeoRoute): DealFilters {
  return {
    chains: route.filters.chains ?? [],
    cities: route.filters.cities ?? [],
    weekendOnly: route.filters.weekendOnly ?? false,
    audiences: route.filters.audiences ?? [],
    query: "",
    sort: "discount",
  };
}
