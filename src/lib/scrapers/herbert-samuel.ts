import axios from "axios";
import * as cheerio from "cheerio";
import { CHAIN_BY_ID } from "../chains";
import { parseDealText } from "../parse-deal";
import type { Deal } from "../types";

export const HS_HOME_URL = "https://herbertsamuel.com/";
const CHAIN = CHAIN_BY_ID["herbert-samuel"];

const SEEDED_OFFER_PAGES = [
  "https://herbertsamuel.com/herbert-samuel-jerusalem-hotel/special-offers/",
  "https://herbertsamuel.com/hod-dead-sea-hotel/special-offers/",
  "https://herbertsamuel.com/milos-dead-sea-hotel/special-offers/",
  "https://herbertsamuel.com/opera-tel-aviv-hotel/special-offers/",
  "https://herbertsamuel.com/the-herbert-tel-aviv-hotel/special-offers/",
  "https://herbertsamuel.com/the-reef-eilat-hotel/special-offers/",
  "https://herbertsamuel.com/okeanos-suites-herzliya-hotel/special-offers/",
  "https://herbertsamuel.com/royal-shangri-la-eilat-hotel/special-offers/",
  "https://herbertsamuel.com/the-herbert-eilat-hotel/special-offers/",
];

const HOTEL_PAGES: { pattern: RegExp; name: string; location: string }[] = [
  { pattern: /jerusalem/, name: "הרברט סמואל ירושלים", location: "ירושלים" },
  { pattern: /hod-dead-sea|הוד/, name: "הרברט סמואל הוד ים המלח", location: "ים המלח" },
  { pattern: /milos/, name: "הרברט סמואל מילוס ים המלח", location: "ים המלח" },
  { pattern: /opera/, name: "הרברט סמואל אופרה תל אביב", location: "תל אביב" },
  { pattern: /the-herbert-tel-aviv|דה הרברט תל/, name: "דה הרברט תל אביב", location: "תל אביב" },
  { pattern: /reef|הריף/, name: "הרברט סמואל הריף אילת", location: "אילת" },
  { pattern: /shangri|שנגרי/, name: "הרברט סמואל רויאל שנגרילה אילת", location: "אילת" },
  { pattern: /the-herbert-eilat|דה הרברט אילת/, name: "דה הרברט אילת", location: "אילת" },
  { pattern: /okeanos|אוקיינ/, name: "הרברט סמואל אוקיינוס סוויטס הרצליה", location: "הרצליה" },
];

const SKIP_HEADING =
  /תפריט|שמרו על קשר|מיקום מושלם|מבצעים חמים מחכים|^מבצעים בלעדיים$|^מבצעים מיוחדים|^הצעות מיוחדות|^אילת$|^ים המלח$|^תל אביב$|^הרצליה$|^ירושלים$|^סגירה$|^כותרת$|^חבילות$|^חבילת$|^טקסט$/;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "he-IL,he;q=0.9,en;q=0.6",
};

function cleanText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function hotelFromUrl(url: string, pageTitle: string): { name: string; location: string } {
  const haystack = `${url} ${pageTitle}`;
  for (const hotel of HOTEL_PAGES) {
    if (hotel.pattern.test(haystack)) return { name: hotel.name, location: hotel.location };
  }
  return { name: CHAIN.nameHe, location: "" };
}

function isDealHeading(title: string): boolean {
  if (!title || SKIP_HEADING.test(title) || title.length > 120) return false;
  return /הנחה|מבצע|חבילת/.test(title);
}

function normalizeOfferUrl(href: string, base = HS_HOME_URL): string | null {
  try {
    const url = new URL(href, base);
    if (!/herbertsamuel\.com$/i.test(url.hostname.replace(/^www\./, ""))) return null;
    if (url.pathname.includes("/en/")) return null;
    if (!/special-offers/i.test(url.pathname)) return null;
    url.hash = "";
    url.search = "";
    const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
    return `${url.origin}${path}`;
  } catch {
    return null;
  }
}

function cleanBookingUrl(href: string, fallback: string): string {
  try {
    const url = new URL(href);
    if (!/booking\.herbertsamuel\.com/i.test(url.hostname) || !/\/Deal/i.test(url.pathname)) {
      return fallback;
    }
    const cleaned = new URL(`${url.origin}${url.pathname}`);
    for (const key of ["s", "chainid", "hotid", "lang", "agent"]) {
      const value = url.searchParams.get(key);
      if (value) cleaned.searchParams.set(key, value);
    }
    return cleaned.toString();
  } catch {
    return fallback;
  }
}

function dealKey(bookingUrl: string, title: string): string {
  try {
    const url = new URL(bookingUrl);
    const sale = url.searchParams.get("s") ?? "";
    const hotel = url.searchParams.get("hotid") ?? "";
    if (sale || hotel) return `${hotel}-${sale}`;
  } catch {
    // Fall through.
  }
  return title.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40);
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await axios.get<string>(url, {
      timeout: 18000,
      headers: BROWSER_HEADERS,
      maxRedirects: 3,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    return response.data;
  } catch {
    return null;
  }
}

function collectOfferPages(html: string, base: string): string[] {
  const $ = cheerio.load(html);
  const urls = new Set<string>();
  $("a[href*='special-offers']").each((_, node) => {
    const url = normalizeOfferUrl($(node).attr("href") ?? "", base);
    if (url) urls.add(url);
  });
  return [...urls];
}

function parseOfferPage(html: string, pageUrl: string): Deal[] {
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, footer, form").remove();
  const pageTitle = cleanText($("h1").first().text() || $("title").text());
  const hotel = hotelFromUrl(pageUrl, pageTitle);
  const deals: Deal[] = [];
  const seen = new Set<string>();

  $("h2.elementor-heading-title, h2, h3").each((_, node) => {
    const heading = $(node);
    const title = cleanText(heading.text());
    if (!isDealHeading(title)) return;

    const chunks: string[] = [];
    let bookingHref = "";
    const cursor = heading.closest(".elementor-widget, .elementor-element").length
      ? heading.closest(".elementor-widget, .elementor-element")
      : heading;
    let next = cursor.next();
    let steps = 0;
    while (next.length && steps < 12) {
      const nextHeading = cleanText(next.find("h2, h3").first().text() || (next.is("h2, h3") ? next.text() : ""));
      if (nextHeading && (isDealHeading(nextHeading) || SKIP_HEADING.test(nextHeading))) break;
      const text = cleanText(next.text());
      if (text && text !== title && !/Cookies|מדיניות הפרטיות/.test(text)) chunks.push(text);
      if (!bookingHref) {
        bookingHref = next.find("a[href*='booking.herbertsamuel.com'][href*='Deal']").first().attr("href") ?? "";
      }
      next = next.next();
      steps += 1;
    }

    const body = chunks.join(" ").slice(0, 400);
    if (/^טקסט\b/.test(body) || body === "טקסט") return;

    const combined = `${title} ${body}`;
    const parsed = parseDealText(combined);
    if (parsed.validTo && parsed.validTo < todayIso()) return;
    if (/2024|2025/.test(combined) && !/2026/.test(combined) && !parsed.validTo) return;

    const bookingUrl = cleanBookingUrl(bookingHref, pageUrl);
    const hasLiveBooking = /booking\.herbertsamuel\.com/i.test(bookingUrl);
    if (!hasLiveBooking && !parsed.discountValue && !parsed.validTo) return;
    const id = `hs-live-${dealKey(bookingUrl, title)}`;
    if (seen.has(id)) return;
    seen.add(id);

    deals.push({
      id,
      chainId: "herbert-samuel",
      chainName: CHAIN.nameHe,
      hotelName: hotel.name,
      title: title.slice(0, 90),
      description: (body || title).slice(0, 280),
      discountPercent: parsed.discountPercent,
      discountValue: parsed.discountValue,
      pricePerNight: parsed.pricePerNight,
      minNights: parsed.minNights,
      validFrom: parsed.validFrom,
      validTo: parsed.validTo,
      bookingUrl,
      location: hotel.location || null,
      source: "live",
    });
  });

  return deals;
}

export async function scrapeHerbertSamuelDeals(dealsUrl = HS_HOME_URL): Promise<Deal[]> {
  const discovered = new Set<string>(SEEDED_OFFER_PAGES);
  const homeHtml = await fetchHtml(dealsUrl.startsWith("http") ? dealsUrl : HS_HOME_URL);
  if (homeHtml) {
    for (const url of collectOfferPages(homeHtml, HS_HOME_URL)) discovered.add(url);
  }

  const deals: Deal[] = [];
  const seen = new Set<string>();

  for (const url of discovered) {
    const html = await fetchHtml(url);
    if (!html) continue;
    for (const deal of parseOfferPage(html, url)) {
      if (seen.has(deal.id)) continue;
      seen.add(deal.id);
      deals.push(deal);
    }
  }

  return deals;
}
