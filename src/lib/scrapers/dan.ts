import axios from "axios";
import { saleStayDates, withDanStayDates } from "../booking-url";
import { CHAIN_BY_ID } from "../chains";
import { lookupHotelPhoto } from "../hotel-photo-fallbacks";
import { parseDealText } from "../parse-deal";
import type { Deal } from "../types";

export const DAN_DEALS_URL = "https://www.danhotels.co.il/IsraelHotels/Deals";
const DAN_ORIGIN = "https://www.danhotels.co.il";
const DAN_GRAPHQL = "https://api.danhotels.co.il/apinew/graphql";
const CHAIN = CHAIN_BY_ID.dan;

function seedHotel(id: string, name: string, dealsPath: string): DanHotel {
  return { id, name, dealsPath, imageUrl: lookupHotelPhoto("dan", name) ?? undefined };
}

const SEEDED_HOTELS: DanHotel[] = [
  seedHotel("10118", "המלך דוד ירושלים", "/JerusalemHotels/KingDavidJerusalemHotel/Deals"),
  seedHotel("10121", "דן ירושלים", "/JerusalemHotels/DanJerusalemHotel/Deals"),
  seedHotel("10119", "דן פנורמה ירושלים", "/JerusalemHotels/DanPanoramaJerusalemHotel/Deals"),
  seedHotel("10120", "דן בוטיק ירושלים", "/JerusalemHotels/DanBoutiqueJerusalemHotel/Deals"),
  seedHotel("10122", "דן תל אביב", "/TelAvivHotels/DanTelAvivHotel/Deals"),
  seedHotel("10123", "דן פנורמה תל אביב", "/TelAvivHotels/DanPanoramaTelAvivHotel/Deals"),
  seedHotel("10537", "לינק תל אביב", "/TelAvivHotels/LinkHotelHubHotel/Deals"),
  seedHotel("10124", "דן אילת", "/EilatHotels/DanEilatHotel/Deals"),
  seedHotel("10125", "דן פנורמה אילת", "/EilatHotels/DanPanoramaEilatHotel/Deals"),
  seedHotel("10706", "נפטון אילת", "/EilatHotels/NeptuneEilatHotel/Deals"),
  seedHotel("10126", "דן כרמל חיפה", "/HaifaHotels/DanCarmelHaifaHotel/Deals"),
  seedHotel("10127", "דן פנורמה חיפה", "/HaifaHotels/DanPanoramaHaifaHotel/Deals"),
  seedHotel("10129", "דן אכדיה ריזורט", "/TelAvivHotels/DanAccadiaHerzliyaHotel/Deals"),
  seedHotel("10130", "דן קיסריה ריזורט", "/CaesareaHotels/DanCaesareaHotel/Deals"),
  seedHotel("10698", "רות צפת", "/NorthHotels/RuthSafedHotel/Deals"),
  seedHotel("10697", "המעיין נצרת", "/NorthHotels/MarysWellNazarethHotel/Deals"),
];

const LOCATION_HINTS: [RegExp, string][] = [
  [/ירושלים|המלך דוד/, "ירושלים"],
  [/אילת|נפטון/, "אילת"],
  [/חיפה|כרמל/, "חיפה"],
  [/הרצליה|אכדיה/, "הרצליה"],
  [/קיסריה/, "קיסריה"],
  [/צפת|רות/, "צפת"],
  [/נצרת|המעיין/, "נצרת"],
  [/תל אביב|לינק/, "תל אביב"],
];

const PACKAGES_QUERY = `
  fragment PackageFields on Package {
    hotelID
    packageID
    name
    description
    startDate
    endDate
    minLOS
    maxLOS
    isG4Package
    showBook
    parameters
    weight
  }
  query getPackagesToShow($hotelIDList: [ID], $lang: String) {
    packagesToShow(hotelIDList: $hotelIDList, lang: $lang) {
      ...PackageFields
      hotel { name }
    }
  }
`;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/json",
  "Accept-Language": "he-IL,he;q=0.9,en;q=0.6",
};

interface DanHotel {
  id: string;
  name: string;
  dealsPath: string;
  imageUrl?: string;
}

interface DanPackage {
  hotelID: string;
  packageID: string;
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  minLOS?: number | null;
  isG4Package?: boolean | null;
  showBook?: boolean | null;
  hotel?: { name?: string | null } | null;
}

function cleanText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? null;
}

function inferLocation(hotelName: string): string | null {
  for (const [pattern, location] of LOCATION_HINTS) {
    if (pattern.test(hotelName)) return location;
  }
  return null;
}

function shekelDiscount(text: string): string | null {
  const match = text.match(/(\d{2,4})\s*ש["״]?ח\s*הנחה/);
  return match ? `${match[1]} ₪ הנחה` : null;
}

function bookingUrl(
  hotel: DanHotel | undefined,
  pkg: DanPackage,
  validFrom: string | null,
  validTo: string | null,
  minNights: number | null,
): string {
  const hotelId = pkg.hotelID || hotel?.id;
  if (pkg.isG4Package && hotelId && pkg.packageID) {
    const url = new URL("/Booking/SearchResults", DAN_ORIGIN);
    url.searchParams.set("fr", "hp");
    url.searchParams.set("com", "box");
    url.searchParams.set("ttl", "ChooseYourRoom");
    url.searchParams.set("SelectedHotelID", hotelId);
    url.searchParams.set("ListHotelIds", hotelId);
    url.searchParams.set("packageID", pkg.packageID);
    url.searchParams.set("Lang", "heb");
    url.searchParams.set("site", "dan");
    return withDanStayDates(url.toString(), saleStayDates({ validFrom, validTo, minNights }));
  }
  if (hotel?.dealsPath) return new URL(hotel.dealsPath, DAN_ORIGIN).toString();
  return DAN_DEALS_URL;
}

function toDeal(pkg: DanPackage, hotelsById: Map<string, DanHotel>): Deal | null {
  const title = cleanText(pkg.name ?? "");
  if (!title) return null;

  const validFrom = toIsoDate(pkg.startDate);
  const validTo = toIsoDate(pkg.endDate);
  if (validTo && validTo < todayIso()) return null;

  const hotel = hotelsById.get(pkg.hotelID);
  const hotelName = cleanText(pkg.hotel?.name || hotel?.name || CHAIN.nameHe);
  const description = cleanText(pkg.description || "") || title;
  const parsed = parseDealText(`${title} ${description}`);
  const discountValue = parsed.discountValue ?? shekelDiscount(`${title} ${description}`);

  return {
    id: `dan-live-${pkg.hotelID}-${pkg.packageID}`,
    chainId: "dan",
    chainName: CHAIN.nameHe,
    hotelName,
    title: title.slice(0, 90),
    description: description.slice(0, 280),
    discountPercent: parsed.discountPercent,
    discountValue,
    pricePerNight: parsed.pricePerNight,
    minNights: pkg.minLOS && pkg.minLOS > 0 ? pkg.minLOS : parsed.minNights,
    validFrom,
    validTo,
    bookingUrl: bookingUrl(hotel, pkg, validFrom, validTo, pkg.minLOS && pkg.minLOS > 0 ? pkg.minLOS : parsed.minNights),
    location: inferLocation(hotelName),
    source: "live",
    imageUrl: hotel?.imageUrl || null,
  };
}

function hotelsFromDrupal(html: string): DanHotel[] {
  const match = html.match(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return [];
  try {
    const settings = JSON.parse(match[1]) as {
      danHotels?: {
        hotelsData?: {
          field_g4_hotel_id?: string;
          field_name?: string;
          field_offers_image?: string;
          field_mobile_image?: string;
          links?: { deals?: string };
        }[];
      };
    };
    return (settings.danHotels?.hotelsData ?? [])
      .map((hotel) => {
        const rawImage = hotel.field_offers_image || hotel.field_mobile_image || "";
        let imageUrl = "";
        try {
          imageUrl = rawImage ? new URL(rawImage, DAN_ORIGIN).toString() : "";
        } catch {
          imageUrl = "";
        }
        return {
          id: String(hotel.field_g4_hotel_id ?? ""),
          name: hotel.field_name ?? "",
          dealsPath: hotel.links?.deals ?? "",
          imageUrl,
        };
      })
      .filter((hotel) => hotel.id);
  } catch {
    return [];
  }
}

async function fetchHotelCatalog(dealsUrl: string): Promise<DanHotel[]> {
  try {
    const response = await axios.get<string>(dealsUrl, {
      timeout: 18000,
      headers: BROWSER_HEADERS,
      maxRedirects: 3,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    const live = hotelsFromDrupal(response.data);
    if (live.length > 0) return live;
  } catch {
    // Fall back to seeded hotels.
  }
  return SEEDED_HOTELS;
}

async function fetchPackages(hotelIds: string[]): Promise<DanPackage[]> {
  const response = await axios.post<{
    data?: { packagesToShow?: DanPackage[] };
    errors?: { message: string }[];
  }>(
    DAN_GRAPHQL,
    { query: PACKAGES_QUERY, variables: { hotelIDList: hotelIds, lang: "heb" } },
    {
      timeout: 25000,
      headers: {
        ...BROWSER_HEADERS,
        "Content-Type": "application/json",
        Origin: DAN_ORIGIN,
        Referer: DAN_DEALS_URL,
      },
      validateStatus: (status) => status >= 200 && status < 400,
    },
  );
  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0]?.message ?? "Dan GraphQL error");
  }
  return response.data.data?.packagesToShow ?? [];
}

export async function scrapeDanDeals(dealsUrl = DAN_DEALS_URL): Promise<Deal[]> {
  const hotels = await fetchHotelCatalog(dealsUrl.startsWith("http") ? dealsUrl : DAN_DEALS_URL);
  const hotelsById = new Map(hotels.map((hotel) => [hotel.id, hotel]));
  const packages = await fetchPackages(hotels.map((hotel) => hotel.id));

  const deals: Deal[] = [];
  const seen = new Set<string>();
  for (const pkg of packages) {
    const deal = toDeal(pkg, hotelsById);
    if (!deal || seen.has(deal.id)) continue;
    seen.add(deal.id);
    deals.push(deal);
  }
  return deals;
}
