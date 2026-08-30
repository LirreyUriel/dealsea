import type { Browser, Page } from "playwright";
import { CHAIN_BY_ID } from "../chains";
import { parseDealText, parsePriceIls } from "../parse-deal";
import type { Deal } from "../types";
import { launchBrowser, loadPlaywright } from "./playwright-browser";

export const ISROTEL_DEALS_URL = "https://www.isrotel.com/special_offers/main/";

const CHAIN = CHAIN_BY_ID.isrotel;
const GOTO_TIMEOUT_MS = 45_000;
const CARD_TIMEOUT_MS = 25_000;

interface IsrotelHotel {
  nameHe: string;
  location: string | null;
  pagePath: string;
}

const HOTELS_BY_CODE: Record<string, IsrotelHotel> = {
  OR: { nameHe: "אוריינט ירושלים", location: "ירושלים", pagePath: "/isrotel-hotels/jerusalem/orient/" },
  CR: { nameHe: "כרמים", location: "ירושלים", pagePath: "/isrotel-hotels/jerusalem/cramim/" },
  RT: { nameHe: "רויאל ביץ' תל אביב", location: "תל אביב", pagePath: "/isrotel-hotels/tel-aviv/royal-beach-tel-aviv/" },
  TT: { nameHe: "סי טאואר", location: "תל אביב", pagePath: "/isrotel-hotels/tel-aviv/isrotel-tower/" },
  PT: { nameHe: "פורט טאואר", location: "תל אביב", pagePath: "/isrotel-hotels/tel-aviv/port-tower/" },
  AL: { nameHe: "אלברטו", location: "תל אביב", pagePath: "/isrotel-hotels/tel-aviv/alberto/" },
  DI: { nameHe: "דיזנגוף 99", location: "תל אביב", pagePath: "/isrotel-hotels/tel-aviv/dizengoff/" },
  TLVTX: { nameHe: "גימנסיה", location: "תל אביב", pagePath: "/isrotel-hotels/tel-aviv/gymnasia/" },
  TLVAK: { nameHe: "פאבליקה", location: "הרצליה", pagePath: "/isrotel-hotels/herzliya/publica-isrotel/" },
  RB: { nameHe: "רויאל ביץ' אילת", location: "אילת", pagePath: "/isrotel-hotels/eilat/royal-beach/" },
  KS: { nameHe: "המלך שלמה", location: "אילת", pagePath: "/isrotel-hotels/eilat/isrotel-king-solomon/" },
  RG: { nameHe: "רויאל גארדן", location: "אילת", pagePath: "/isrotel-hotels/eilat/isrotel-royal-garden/" },
  AG: { nameHe: "אגמים", location: "אילת", pagePath: "/isrotel-hotels/eilat/isrotel-agamim/" },
  AM: { nameHe: "ים סוף", location: "אילת", pagePath: "/isrotel-hotels/eilat/isrotel-yam-suf/" },
  SP: { nameHe: "ספורט קלאב", location: "אילת", pagePath: "/isrotel-hotels/eilat/isrotel-sport-club/" },
  LG: { nameHe: "לגונה", location: "אילת", pagePath: "/isrotel-hotels/eilat/isrotel-lagoona/" },
  RI: { nameHe: "ריביירה", location: "אילת", pagePath: "/isrotel-hotels/eilat/isrotel-riviera-club/" },
  RC: { nameHe: "ריביירה", location: "אילת", pagePath: "/isrotel-hotels/eilat/isrotel-riviera-club/" },
  AY: { nameHe: "איילה", location: "צפון", pagePath: "/isrotel-hotels/north-hotels/galilee/ayala/" },
  DS: { nameHe: "נבו", location: "ים המלח", pagePath: "/isrotel-hotels/dead-sea/isrotel-dead-sea/" },
  GA: { nameHe: "נגה", location: "ים המלח", pagePath: "/isrotel-hotels/dead-sea/isrotel-ganim/" },
  KA: { nameHe: "קיימא", location: "ים המלח", pagePath: "/isrotel-hotels/dead-sea/kayma/" },
  BR: { nameHe: "בראשית", location: "מצפה רמון", pagePath: "/isrotel-hotels/negev-desert/beresheet/" },
  KD: { nameHe: "קדמה", location: "הנגב", pagePath: "/isrotel-hotels/negev-desert/isrotel-kedma/" },
  CF: { nameHe: "יערות הכרמל", location: "צפון", pagePath: "/isrotel-hotels/north-hotels/haifa/carmel-forest/" },
  MH: { nameHe: "מצפה הימים", location: "צפון", pagePath: "/isrotel-hotels/north-hotels/galilee/mizpe-hayamim/" },
  YM: { nameHe: "גומה", location: "כנרת", pagePath: "/isrotel-hotels/north-hotels/galilee/gomeh/" },
};

interface IsrotelSaleJson {
  Id?: number;
  SaleName?: string;
  ShortTitle?: string;
  ShortDescription?: string;
  Stamp?: string;
  SaleStartDateStr?: string;
  SaleEndDateStr?: string;
  MinimumDays?: number | null;
  HotelCode?: string;
  AllowedHotels?: string;
  BestPrice?: { Prices?: { ILS?: number } };
}

interface IsrotelRawCard {
  saleId: string | null;
  hotelCode: string | null;
  title: string;
  description: string;
  priceText: string;
  sale: IsrotelSaleJson | null;
}

function cleanText(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

function splitTitleLines(raw: string): string[] {
  return cleanText(raw)
    .split("\n")
    .map((line) => line.replace(/^[בat]\s+/i, "").trim())
    .filter(Boolean);
}

function hotelFromCodeOrTitle(code: string | null | undefined, titleLines: string[]): IsrotelHotel {
  const normalized = (code ?? "").toUpperCase();
  if (normalized && HOTELS_BY_CODE[normalized]) return HOTELS_BY_CODE[normalized];

  const haystack = titleLines.join(" ").toLowerCase();
  const match = Object.values(HOTELS_BY_CODE).find((hotel) =>
    haystack.includes(hotel.nameHe.replace("'", "").toLowerCase()),
  );
  if (match) return match;

  const englishHints: [RegExp, string][] = [
    [/orient/i, "OR"],
    [/gymnasia/i, "TLVTX"],
    [/publica/i, "TLVAK"],
    [/dizengoff/i, "DI"],
    [/alberto/i, "AL"],
    [/port tower/i, "PT"],
    [/sea tower/i, "TT"],
    [/royal beach tel/i, "RT"],
    [/royal beach/i, "RB"],
    [/royal garden/i, "RG"],
    [/king solomon|מלך שלמה/i, "KS"],
    [/lagoona|לגונה/i, "LG"],
    [/sport club|ספורט קלאב/i, "SP"],
    [/beresheet|בראשית/i, "BR"],
    [/cramim|כרמים/i, "CR"],
    [/kayma|קיימא/i, "KA"],
  ];
  for (const [pattern, hotelCode] of englishHints) {
    if (pattern.test(haystack)) return HOTELS_BY_CODE[hotelCode];
  }

  return {
    nameHe: titleLines[1] || titleLines[0] || CHAIN.nameHe,
    location: null,
    pagePath: "/special_offers/main/",
  };
}

function localizeStamp(stamp: string | null | undefined, fallbackTitle: string): string {
  const value = cleanText(stamp || fallbackTitle);
  if (!value) return "מבצע ישרוטל";
  return value
    .replace(/(\d+)\s*%\s*Discount(?:\s+at)?/i, "$1% הנחה")
    .replace(/Free Breakfast Promotion/i, "ארוחת בוקר חינם")
    .replace(/Fourth Night/i, "לילה רביעי")
    .replace(/Third Night/i, "לילה שלישי")
    .replace(/Second Night/i, "לילה שני")
    .replace(/First Night/i, "לילה ראשון");
}

function bookingUrl(hotel: IsrotelHotel, saleId: string, from: string | null, to: string | null): string {
  const url = new URL(hotel.pagePath, "https://www.isrotel.com");
  if (saleId) url.searchParams.set("saleId", saleId);
  if (from) url.searchParams.set("from", from);
  if (to) url.searchParams.set("to", to);
  return url.toString();
}

function toDeal(raw: IsrotelRawCard): Deal | null {
  const sale = raw.sale ?? {};
  const titleLines = splitTitleLines(sale.ShortTitle || sale.SaleName || raw.title);
  const hotelCode = (sale.HotelCode || sale.AllowedHotels || raw.hotelCode || "").split(",")[0]?.trim() ?? "";
  const hotel = hotelFromCodeOrTitle(hotelCode, titleLines);
  const description = cleanText(sale.ShortDescription || raw.description);
  const combinedText = [titleLines.join(" "), description, sale.Stamp, raw.priceText].filter(Boolean).join(" ");
  const parsed = parseDealText(combinedText);

  const validFrom = sale.SaleStartDateStr || parsed.validFrom;
  const validTo = sale.SaleEndDateStr || parsed.validTo;
  const saleId = raw.saleId || (sale.Id != null ? String(sale.Id) : "");
  const title = localizeStamp(sale.Stamp, titleLines[0] || "מבצע ישרוטל");
  const offerDetails = description || titleLines.join(" · ");

  if (!title && !offerDetails) return null;

  const priceIls = parsePriceIls(sale.BestPrice?.Prices?.ILS);
  const descriptionWithPrice =
    priceIls && !offerDetails.includes(String(priceIls))
      ? `${offerDetails} מחיר באתר החל מ-${priceIls.toLocaleString("he-IL")} ₪ לזוג ללילה.`
      : offerDetails;

  return {
    id: saleId ? `isrotel-live-${saleId}` : `isrotel-live-${titleLines.join("-").slice(0, 40)}`,
    chainId: "isrotel",
    chainName: CHAIN.nameHe,
    hotelName: hotel.nameHe,
    title,
    description: descriptionWithPrice.slice(0, 280),
    discountPercent: parsed.discountPercent,
    discountValue: parsed.discountValue ?? (sale.Stamp ? localizeStamp(sale.Stamp, "") : null),
    pricePerNight: priceIls ?? parsed.pricePerNight,
    minNights: sale.MinimumDays ?? parsed.minNights,
    validFrom,
    validTo,
    bookingUrl: bookingUrl(hotel, saleId, validFrom, validTo),
    location: hotel.location || null,
    source: "live",
  };
}

async function dismissConsent(page: Page): Promise<void> {
  const buttons = page.locator(
    'button:has-text("Accept"), button:has-text("I agree"), button:has-text("אישור"), button:has-text("הסכמה")',
  );
  try {
    await buttons.first().click({ timeout: 2500 });
  } catch {
    // Cookie banners are optional; ignore if missing.
  }
}

async function extractRawCards(page: Page): Promise<IsrotelRawCard[]> {
  return page.evaluate(() => {
    const salesById = new Map<string, IsrotelSaleJson>();
    for (const script of document.querySelectorAll('script[id^="sale-json-"]')) {
      try {
        const parsed = JSON.parse(script.textContent || "") as IsrotelSaleJson;
        if (parsed?.Id != null) salesById.set(String(parsed.Id), parsed);
      } catch {
        // Skip malformed embedded payloads.
      }
    }

    const cards = [...document.querySelectorAll<HTMLElement>(".card--deal, article.card")];
    if (cards.length === 0 && salesById.size > 0) {
      return [...salesById.entries()].map(([saleId, sale]) => ({
        saleId,
        hotelCode: sale.HotelCode ?? sale.AllowedHotels ?? null,
        title: sale.ShortTitle ?? sale.SaleName ?? "",
        description: sale.ShortDescription ?? "",
        priceText: sale.BestPrice?.Prices?.ILS != null ? String(sale.BestPrice.Prices.ILS) : "",
        sale,
      }));
    }

    return cards.map((card) => {
      const saleId = card.getAttribute("data-saleid");
      return {
        saleId,
        hotelCode: card.getAttribute("data-hotel"),
        title: card.querySelector(".card__title")?.textContent ?? "",
        description: card.querySelector(".card__description")?.textContent ?? "",
        priceText: card.querySelector(".ux-ui-price, .card__price")?.textContent ?? "",
        sale: saleId ? (salesById.get(saleId) ?? null) : null,
      };
    });
  });
}

export async function scrapeIsrotelDeals(dealsUrl = ISROTEL_DEALS_URL): Promise<Deal[]> {
  const playwright = await loadPlaywright();
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser(playwright);

    const page = await browser.newPage({
      locale: "he-IL",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      extraHTTPHeaders: { "Accept-Language": "he-IL,he;q=0.9,en;q=0.6" },
    });
    page.setDefaultTimeout(GOTO_TIMEOUT_MS);

    const response = await page.goto(dealsUrl, { waitUntil: "domcontentloaded", timeout: GOTO_TIMEOUT_MS });
    if (response && response.status() >= 400) {
      throw new Error(`Isrotel returned HTTP ${response.status()} for ${dealsUrl}`);
    }

    await dismissConsent(page);

    try {
      await page.waitForSelector(".card--deal, script[id^='sale-json-']", { timeout: CARD_TIMEOUT_MS });
    } catch {
      throw new Error("Isrotel deal cards did not render in time.");
    }

    await page.waitForFunction(() => document.querySelectorAll(".card--deal").length > 0).catch(() => undefined);
    const rawCards = await extractRawCards(page);

    const deals: Deal[] = [];
    const seen = new Set<string>();
    for (const raw of rawCards) {
      try {
        const deal = toDeal(raw);
        if (!deal || seen.has(deal.id)) continue;
        seen.add(deal.id);
        deals.push(deal);
      } catch {
        // One bad card should not fail the whole scrape.
      }
    }

    return deals;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Isrotel scrape error";
    throw new Error(`Isrotel Playwright scrape failed: ${message}`);
  } finally {
    await browser?.close().catch(() => undefined);
  }
}
