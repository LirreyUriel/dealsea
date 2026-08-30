import axios from "axios";
import { saleStayDates, withDanStayDates } from "../booking-url";
import { CHAIN_BY_ID } from "../chains";
import { parseDealText } from "../parse-deal";
import type { Deal } from "../types";

export const DAN_DEALS_URL = "https://www.danhotels.co.il/IsraelHotels/Deals";
const DAN_ORIGIN = "https://www.danhotels.co.il";
const DAN_GRAPHQL = "https://api.danhotels.co.il/apinew/graphql";
const CHAIN = CHAIN_BY_ID.dan;

const SEEDED_HOTELS: DanHotel[] = [
  { id: "10118", name: "המלך דוד ירושלים", dealsPath: "/JerusalemHotels/KingDavidJerusalemHotel/Deals" },
  { id: "10121", name: "דן ירושלים", dealsPath: "/JerusalemHotels/DanJerusalemHotel/Deals" },
  { id: "10119", name: "דן פנורמה ירושלים", dealsPath: "/JerusalemHotels/DanPanoramaJerusalemHotel/Deals" },
  { id: "10120", name: "דן בוטיק ירושלים", dealsPath: "/JerusalemHotels/DanBoutiqueJerusalemHotel/Deals" },
  { id: "10122", name: "דן תל אביב", dealsPath: "/TelAvivHotels/DanTelAvivHotel/Deals" },
  { id: "10123", name: "דן פנורמה תל אביב", dealsPath: "/TelAvivHotels/DanPanoramaTelAvivHotel/Deals" },
  { id: "10537", name: "לינק תל אביב", dealsPath: "/TelAvivHotels/LinkHotelHubHotel/Deals" },
  { id: "10124", name: "דן אילת", dealsPath: "/EilatHotels/DanEilatHotel/Deals" },
  { id: "10125", name: "דן פנורמה אילת", dealsPath: "/EilatHotels/DanPanoramaEilatHotel/Deals" },
  { id: "10706", name: "נפטון אילת", dealsPath: "/EilatHotels/NeptuneEilatHotel/Deals" },
  { id: "10126", name: "דן כרמל חיפה", dealsPath: "/HaifaHotels/DanCarmelHaifaHotel/Deals" },
  { id: "10127", name: "דן פנורמה חיפה", dealsPath: "/HaifaHotels/DanPanoramaHaifaHotel/Deals" },
  { id: "10129", name: "דן אכדיה ריזורט", dealsPath: "/TelAvivHotels/DanAccadiaHerzliyaHotel/Deals" },
  { id: "10130", name: "דן קיסריה ריזורט", dealsPath: "/CaesareaHotels/DanCaesareaHotel/Deals" },
  { id: "10698", name: "רות צפת", dealsPath: "/NorthHotels/RuthSafedHotel/Deals" },
  { id: "10697", name: "המעיין נצרת", dealsPath: "/NorthHotels/MarysWellNazarethHotel/Deals" },
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
          links?: { deals?: string };
        }[];
      };
    };
    return (settings.danHotels?.hotelsData ?? [])
      .map((hotel) => ({
        id: String(hotel.field_g4_hotel_id ?? ""),
        name: hotel.field_name ?? "",
        dealsPath: hotel.links?.deals ?? "",
      }))
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
