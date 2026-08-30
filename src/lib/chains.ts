import type { HotelChain, HotelChainId } from "./types";

export const HOTEL_CHAINS: HotelChain[] = [
  {
    id: "isrotel",
    nameHe: "ישרוטל",
    nameEn: "Isrotel",
    dealsUrl: "https://www.isrotel.com/special_offers/main/",
    color: "#0f6b6b",
  },
  {
    id: "fattal",
    nameHe: "פתאל",
    nameEn: "Fattal",
    dealsUrl: "https://www.fattal.co.il/deals",
    color: "#1d4ed8",
  },
  {
    id: "brown",
    nameHe: "בראון",
    nameEn: "Brown",
    dealsUrl: "https://brownhotels.co.il/all-deals",
    color: "#9a3412",
  },
  {
    id: "atlas",
    nameHe: "אטלס",
    nameEn: "Atlas",
    dealsUrl: "https://www.atlas.co.il/deals/",
    color: "#6d28d9",
  },
  {
    id: "dan",
    nameHe: "דן",
    nameEn: "Dan",
    dealsUrl: "https://www.danhotels.co.il/IsraelHotels/Deals",
    color: "#be123c",
  },
  {
    id: "africa-israel",
    nameHe: "אפריקה ישראל",
    nameEn: "Africa Israel",
    dealsUrl: "https://www.afi-hotels.co.il/deals",
    color: "#047857",
  },
  {
    id: "herbert-samuel",
    nameHe: "הרברט סמואל",
    nameEn: "Herbert Samuel",
    dealsUrl: "https://herbertsamuel.com/",
    color: "#b45309",
  },
];

export const CHAIN_BY_ID: Record<HotelChainId, HotelChain> = HOTEL_CHAINS.reduce(
  (acc, chain) => {
    acc[chain.id] = chain;
    return acc;
  },
  {} as Record<HotelChainId, HotelChain>,
);

export function isHotelChainId(value: string): value is HotelChainId {
  return value in CHAIN_BY_ID;
}
