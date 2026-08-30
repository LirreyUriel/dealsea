import axios from "axios";
import * as cheerio from "cheerio";
import { CHAIN_BY_ID } from "../chains";
import { parseDealText, parsePriceIls } from "../parse-deal";
import type { Deal } from "../types";

export const BROWN_DEALS_URL = "https://brownhotels.co.il/all-deals";
const BROWN_ORIGIN = "https://brownhotels.co.il";

const EXTRA_LISTING_URLS = [
  "https://brownhotels.co.il/weekend-sale",
  "https://brownhotels.co.il/beach-resort-deals",
  "https://brownhotels.co.il/deals-israel",
];

const CHAIN = CHAIN_BY_ID.brown;

const LOCATION_HINTS: [RegExp, string][] = [
  [/ים המלח/, "ים המלח"],
  [/אילת/, "אילת"],
  [/ירושלים|מחנה יהודה|ממילא|מושבה/, "ירושלים"],
  [/תל אביב|TLV|לבונטין|מידטאון|סי פורט|ביץ|הצוק|בובו|דברה|ביץ['’] האוס/i, "תל אביב"],
  [/כנרת|לייקהאוס|גלי כנרת/, "כנרת"],
  [/אשדוד|ווסט/, "אשדוד"],
  [/גונן|ורד הגליל|גליליון|כפר גלעדי|צפון/, "צפון"],
];

interface BrownRawCard {
  hotelName: string;
  title: string;
  dateText: string;
  description: string;
  priceText: string;
  bookingUrl: string;
  fromWeekendSale?: boolean;
}

function cleanText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function inferLocation(hotelName: string): string | null {
  for (const [pattern, location] of LOCATION_HINTS) {
    if (pattern.test(hotelName)) return location;
  }
  return null;
}

function dealKey(bookingUrl: string): string {
  try {
    const url = new URL(bookingUrl);
    const ro = url.searchParams.get("ro") ?? "";
    const sale = url.searchParams.get("s") ?? "";
    if (ro || sale) return `${ro}-${sale}`;
  } catch {
    // Fall through to slug.
  }
  return bookingUrl.replace(/[^\w-]+/g, "-").slice(-40);
}

function toDeal(raw: BrownRawCard): Deal | null {
  const hotelName = cleanText(raw.hotelName);
  const title = cleanText(raw.title);
  if (!hotelName && !title) return null;

  const weekendHint = raw.fromWeekendSale ? "סוף שבוע" : "";
  const combined = [title, hotelName, raw.dateText, raw.description, raw.priceText, weekendHint]
    .filter(Boolean)
    .join(" ");
  const parsed = parseDealText(combined);
  const priceMatch = raw.priceText.match(/([\d,]+)\s*₪/);
  const priceIls = priceMatch?.[1]?.replace(/,/g, "");
  const description = [cleanText(raw.description) || title, weekendHint].filter(Boolean).join(" ");
  const descriptionWithPrice =
    priceIls && !description.includes(priceIls)
      ? `${description} מחיר באתר החל מ-${Number(priceIls).toLocaleString("he-IL")} ₪ לזוג ללילה.`
      : description;

  return {
    id: `brown-live-${dealKey(raw.bookingUrl)}`,
    chainId: "brown",
    chainName: CHAIN.nameHe,
    hotelName: hotelName || CHAIN.nameHe,
    title: title || "מבצע בראון",
    description: descriptionWithPrice.slice(0, 280),
    discountPercent: parsed.discountPercent,
    discountValue: parsed.discountValue,
    pricePerNight: parsePriceIls(priceIls) ?? parsed.pricePerNight,
    minNights: parsed.minNights,
    validFrom: parsed.validFrom,
    validTo: parsed.validTo,
    bookingUrl: raw.bookingUrl,
    location: inferLocation(hotelName),
    source: "live",
  };
}

function parseListingHtml(html: string, fromWeekendSale = false): BrownRawCard[] {
  const $ = cheerio.load(html);
  return $(".deal-wrap")
    .toArray()
    .map((node) => {
      const card = $(node);
      const href = card.find("a.btn-deal, a[href*='deal?']").first().attr("href") ?? "";
      let bookingUrl = "";
      try {
        bookingUrl = href ? new URL(href, BROWN_ORIGIN).toString() : "";
      } catch {
        bookingUrl = "";
      }
      return {
        hotelName: cleanText(card.find(".deal-hotel-name").first().text()),
        title: cleanText(card.find(".deal-name").first().text()),
        dateText: cleanText(card.find(".deals-dates").first().text()),
        description: cleanText(card.find(".deal-description").first().text()),
        priceText: cleanText(card.find(".new-price").first().text() || card.find(".deal-price").first().text()),
        bookingUrl,
        fromWeekendSale,
      };
    })
    .filter((card) => card.bookingUrl.includes("deal?") && (card.title || card.hotelName));
}

async function fetchHtml(url: string): Promise<string> {
  const response = await axios.get<string>(url, {
    timeout: 15000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "he-IL,he;q=0.9,en;q=0.6",
    },
    maxRedirects: 3,
    validateStatus: (status) => status >= 200 && status < 400,
  });
  return response.data;
}

export async function scrapeBrownDeals(dealsUrl = BROWN_DEALS_URL): Promise<Deal[]> {
  const listingUrls = [dealsUrl, ...EXTRA_LISTING_URLS.filter((url) => url !== dealsUrl)];
  const pages = await Promise.allSettled(listingUrls.map((url) => fetchHtml(url)));

  const rawCards: BrownRawCard[] = [];
  pages.forEach((page, index) => {
    if (page.status !== "fulfilled") return;
    const fromWeekendSale = listingUrls[index]?.includes("weekend-sale") ?? false;
    rawCards.push(...parseListingHtml(page.value, fromWeekendSale));
  });

  const deals: Deal[] = [];
  const seen = new Set<string>();
  for (const raw of rawCards) {
    const deal = toDeal(raw);
    if (!deal || seen.has(deal.id)) continue;
    seen.add(deal.id);
    deals.push(deal);
  }

  return deals;
}
