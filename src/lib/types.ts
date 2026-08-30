export type HotelChainId =
  | "isrotel"
  | "fattal"
  | "brown"
  | "atlas"
  | "dan"
  | "africa-israel"
  | "herbert-samuel";

export type SortKey = "expiration" | "discount" | "price" | "hotel";

export type AudienceTag = "idf" | "club";

export interface HotelChain {
  id: HotelChainId;
  nameHe: string;
  nameEn: string;
  dealsUrl: string;
  color: string;
}

export interface Deal {
  id: string;
  chainId: HotelChainId;
  chainName: string;
  hotelName: string;
  title: string;
  description: string;
  discountPercent: number | null;
  discountValue: string | null;
  pricePerNight: number | null;
  minNights: number | null;
  validFrom: string | null;
  validTo: string | null;
  bookingUrl: string;
  location: string | null;
  source: "live";
  firstSeenAt?: string;
  imageUrl?: string | null;
  cityImageUrl?: string | null;
}

export interface ParsedDealFields {
  discountPercent: number | null;
  discountValue: string | null;
  pricePerNight: number | null;
  minNights: number | null;
  validFrom: string | null;
  validTo: string | null;
}

export interface DealsResponse {
  deals: Deal[];
  source: "live";
  fetchedAt: string;
  asOf: string;
  errors: { chainId: HotelChainId; message: string }[];
}

export interface DealFilters {
  chains: HotelChainId[];
  cities: string[];
  weekendOnly: boolean;
  audiences: AudienceTag[];
  query: string;
  sort: SortKey;
}
