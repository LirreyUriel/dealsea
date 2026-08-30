import * as cheerio from "cheerio";
import type { Browser, Page } from "playwright";
import { CHAIN_BY_ID } from "../chains";
import { extractOgImage, firstCardImageUrl } from "../page-image";
import { parseDealText, parsePriceIls } from "../parse-deal";
import type { Deal } from "../types";
import { launchBrowser, loadPlaywright } from "./playwright-browser";

export const ATLAS_DEALS_URL = "https://www.atlas.co.il/deals/";
const ATLAS_ORIGIN = "https://www.atlas.co.il";
const ATLAS_HOME = "https://www.atlas.co.il/";

const CHAIN = CHAIN_BY_ID.atlas;
const MAX_DEAL_PAGES = 12;
const GOTO_TIMEOUT_MS = 25_000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const SKIP_PAGE =
  /תקנון|about-us|my-account|checkout|cart\/?$|\/shop|our-hotels|בואו לעבוד|קולנוע|rooftop|check-in-chill|יום כיף|הופעות הקיץ|privet-rooftop|שוברי מתנה|חבילת כלה/;

const DEAL_HINT = /מבצע|הנחה|last.?call|מילוא|סליחות|חגים|חבילה|קיץ|ספטמבר|אוקטובר|דיל/;

const IGNORE_HEADING =
  /חיפוש חופשה|join us|הרשמו|תנאי|תקנון|התניות|our hotels|המלונות שלנו|מגזין|instagram|אירועים פרטיים|בתי הקפה|welcome|atlas magazine/i;

interface AtlasHotel {
  name: string;
  location: string;
  pattern: RegExp;
}

const ATLAS_HOTELS: AtlasHotel[] = [
  { name: "נווה אילת", location: "אילת", pattern: /נווה\s*אילת|neve\s*eilat/i },
  { name: "ארטיסט", location: "תל אביב", pattern: /ארטיסט|artist\s*hotel/i },
  { name: "סינמה", location: "תל אביב", pattern: /סינמה|cinema\s*hotel/i },
  { name: "מלון ים", location: "תל אביב", pattern: /מלון\s*ים|(?:\/\s*)ים(?:\s*\/)|yam\s*hotel/i },
  { name: "מלודי", location: "תל אביב", pattern: /מלודי|melody/i },
  { name: "פבריק", location: "תל אביב", pattern: /פבריק|fabrik/i },
  { name: "בקסטייג'", location: "תל אביב", pattern: /בקסטייג|backstage/i },
  { name: "מרקט האוס", location: "תל אביב", pattern: /מרקט\s*האוס|market\s*house/i },
  { name: "מלון 65", location: "תל אביב", pattern: /מלון\s*65|65\s*hotel|\b65\b/ },
  { name: "שלום & רילקס", location: "תל אביב", pattern: /שלום\s*[&ו]\s*רילקס|shalom/i },
  { name: "בצלאל", location: "ירושלים", pattern: /בצלאל|bezalel/i },
  { name: "ארתור", location: "ירושלים", pattern: /ארתור|arthur/i },
  { name: "מלון טל", location: "ירושלים", pattern: /מלון\s*טל|(?:\/\s*)טל(?:\s*\/)|tal\s*hotel/i },
  { name: "שדות", location: "נתב״ג", pattern: /שדות|sadot/i },
];

const LOCATION_HINTS: [RegExp, string][] = [
  [/אילת|נווה/, "אילת"],
  [/ירושלים/, "ירושלים"],
  [/תל[\s-]?אביב|ת["״]א|TLV/i, "תל אביב"],
  [/נתב["״]?ג|אסף|שדות/, "נתב״ג"],
];

const FEATURED_FALLBACK_URLS = [
  "https://www.atlas.co.il/deals/atlas_last_call/",
  "https://www.atlas.co.il/deals/23-%d7%94%d7%a0%d7%97%d7%94-%d7%9c%d7%9e%d7%a9%d7%a8%d7%aa%d7%99-%d7%94%d7%9e%d7%99%d7%9c%d7%95%d7%90%d7%99%d7%9d/",
  "https://www.atlas.co.il/%d7%9e%d7%91%d7%a6%d7%a2%d7%99-%d7%97%d7%92%d7%99%d7%9d-%d7%91%d7%9e%d7%9c%d7%95%d7%a0%d7%95%d7%aa-%d7%90%d7%99%d7%9c%d7%aa-%d7%aa%d7%90-%d7%95%d7%99%d7%a8%d7%95%d7%a9%d7%9c%d7%99%d7%9d/",
  "https://www.atlas.co.il/%d7%9e%d7%91%d7%a6%d7%a2%d7%99-%d7%a1%d7%a4%d7%98%d7%9e%d7%91%d7%a8-%d7%90%d7%95%d7%a7%d7%98%d7%95%d7%91%d7%a8-%d7%91%d7%99%d7%a8%d7%95%d7%a9%d7%9c%d7%99%d7%9d/",
  "https://www.atlas.co.il/%d7%9e%d7%91%d7%a6%d7%a2%d7%99-%d7%a1%d7%a4%d7%98%d7%9e%d7%91%d7%a8-%d7%90%d7%95%d7%a7%d7%98%d7%95%d7%91%d7%a8-%d7%91%d7%aa%d7%9c-%d7%90%d7%91%d7%99%d7%91/",
  "https://www.atlas.co.il/%d7%9e%d7%91%d7%a6%d7%a2%d7%99-%d7%a1%d7%a4%d7%98%d7%9e%d7%91%d7%a8-%d7%90%d7%95%d7%a7%d7%98%d7%95%d7%91%d7%a8-%d7%91%d7%a0%d7%95%d7%95%d7%94-%d7%90%d7%99%d7%9c%d7%aa/",
  "https://www.atlas.co.il/%d7%9e%d7%91%d7%a6%d7%a2%d7%99-%d7%a7%d7%99%d7%a5-%d7%91%d7%aa%d7%9c-%d7%90%d7%91%d7%99%d7%91/",
  "https://www.atlas.co.il/%d7%9e%d7%91%d7%a6%d7%a2%d7%99-%d7%a7%d7%99%d7%a5-%d7%91%d7%99%d7%a8%d7%95%d7%a9%d7%9c%d7%99%d7%9d/",
  "https://www.atlas.co.il/%d7%9e%d7%91%d7%a6%d7%a2%d7%99-%d7%a7%d7%99%d7%a5-%d7%91%d7%a0%d7%95%d7%95%d7%94-%d7%90%d7%99%d7%9c%d7%aa/",
  "https://www.atlas.co.il/20-%d7%94%d7%a0%d7%97%d7%94-%d7%aa%d7%90-%d7%95%d7%99%d7%a8%d7%95%d7%a9%d7%9c%d7%99%d7%9d-%d7%99%d7%95%d7%9c%d7%99-%d7%90%d7%95%d7%92%d7%95%d7%a1%d7%98/",
];

interface HeadingGroup {
  heading: string;
  body: string;
}

function cleanText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\n+/g, "\n").trim();
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function decodePath(url: string): string {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

function normalizeUrl(href: string, base = ATLAS_ORIGIN): string | null {
  try {
    const url = new URL(href, base);
    if (!/(^|\.)atlas\.co\.il$/i.test(url.hostname)) return null;
    url.hash = "";
    url.search = "";
    const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
    if (path === "/" || path === "/deals/") return null;
    if (/\.(jpg|jpeg|png|gif|webp|pdf|css|js)$/i.test(path)) return null;
    return `${url.origin}${path}`;
  } catch {
    return null;
  }
}

function isDealPage(title: string, url: string): boolean {
  const decoded = decodePath(url);
  const haystack = `${title} ${decoded}`;
  if (SKIP_PAGE.test(haystack)) return false;
  if (/\/deals\/.+/i.test(decoded)) return true;
  return DEAL_HINT.test(haystack);
}

function inferLocation(text: string): string | null {
  for (const [pattern, location] of LOCATION_HINTS) {
    if (pattern.test(text)) return location;
  }
  return null;
}

function findHotels(text: string): AtlasHotel[] {
  return ATLAS_HOTELS.filter((hotel) => hotel.pattern.test(text));
}

function hotelLabel(hotels: AtlasHotel[], fallbackLocation: string | null): string {
  if (hotels.length === 1) return hotels[0].name;
  if (hotels.length >= 2 && hotels.length <= 4) return hotels.map((hotel) => hotel.name).join(", ");
  if (hotels.length > 4) {
    const cities = [...new Set(hotels.map((hotel) => hotel.location))];
    if (cities.length === 1) return `מלונות אטלס ${cities[0]}`;
    return "מלונות אטלס";
  }
  if (fallbackLocation) return `מלונות אטלס ${fallbackLocation}`;
  return "מלונות אטלס";
}

function pageSlug(url: string): string {
  try {
    const path = decodePath(new URL(url).pathname).replace(/\/+$/, "");
    const leaf = path.split("/").filter(Boolean).pop() ?? "deal";
    return leaf.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 48);
  } catch {
    return "deal";
  }
}

function parseLooseDayRange(text: string): { validFrom: string | null; validTo: string | null } | null {
  const match = text.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/);
  if (!match) return null;
  const year = match[4] ? Number(match[4]) : new Date().getFullYear();
  const fullYear = year < 100 ? 2000 + year : year;
  const month = Number(match[3]);
  const fromDay = Number(match[1]);
  const toDay = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    validFrom: `${fullYear}-${pad(month)}-${pad(fromDay)}`,
    validTo: `${fullYear}-${pad(month)}-${pad(toDay)}`,
  };
}

function pageScope($: cheerio.CheerioAPI) {
  const content = $("article, .entry-content, .elementor-widget-theme-post-content, main").first();
  return content.length ? content : $("body");
}

function extractGroups($: cheerio.CheerioAPI): HeadingGroup[] {
  const scope = pageScope($);
  const headings = scope.find("h2, h3").toArray();
  const groups: HeadingGroup[] = [];

  for (const node of headings) {
    const heading = cleanText($(node).text());
    if (!heading || IGNORE_HEADING.test(heading) || heading.length > 120) continue;

    const chunks: string[] = [];
    let sibling = $(node).next();
    while (sibling.length) {
      const tag = sibling.prop("tagName")?.toLowerCase() ?? "";
      if (tag === "h2" || tag === "h3") break;
      const text = cleanText(sibling.text());
      if (text && !IGNORE_HEADING.test(text)) chunks.push(text);
      sibling = sibling.next();
    }

    groups.push({ heading, body: chunks.join(" ").slice(0, 400) });
  }

  return groups.filter((group) => DEAL_HINT.test(`${group.heading} ${group.body}`));
}

function toDeal(input: {
  title: string;
  description: string;
  pageTitle: string;
  url: string;
  index: number;
  imageUrl?: string | null;
}): Deal | null {
  const title = cleanText(input.title);
  const description = cleanText(input.description);
  if (!title || IGNORE_HEADING.test(title)) return null;

  const combined = [input.pageTitle, title, description].filter(Boolean).join(" ");
  const parsed = parseDealText(combined);
  const looseDates = !parsed.validFrom && !parsed.validTo ? parseLooseDayRange(combined) : null;
  const hotels = findHotels(combined);
  const location =
    (hotels.length ? [...new Set(hotels.map((hotel) => hotel.location))][0] : null) ??
    inferLocation(combined);
  const extras = [/ילד ראשון/.test(combined) ? "ילד ראשון חינם" : "", /ארוחה במתנה/.test(combined) ? "ארוחה במתנה" : ""]
    .filter(Boolean)
    .join(" · ");

  let discountValue = parsed.discountValue;
  if (extras) {
    discountValue = discountValue ? `${discountValue} · ${extras}` : extras;
  }

  const minNights = /לילה אחד בלבד/.test(combined) ? 1 : parsed.minNights;
  const validFrom = parsed.validFrom ?? looseDates?.validFrom ?? null;
  const validTo = parsed.validTo ?? looseDates?.validTo ?? null;
  if (validTo && validTo < todayIso()) return null;

  return {
    id: `atlas-live-${pageSlug(input.url)}-${input.index}-${hotels[0]?.name ?? title}`.replace(
      /[^\p{L}\p{N}-]+/gu,
      "-",
    ),
    chainId: "atlas",
    chainName: CHAIN.nameHe,
    hotelName: hotelLabel(hotels, location),
    title: title.slice(0, 90),
    description: (description || title).slice(0, 280),
    discountPercent: parsed.discountPercent,
    discountValue,
    pricePerNight: parsePriceIls(combined) ?? parsed.pricePerNight,
    minNights,
    validFrom,
    validTo,
    bookingUrl: input.url,
    location,
    source: "live",
    imageUrl: input.imageUrl || null,
  };
}

function cardImageCandidate($: cheerio.CheerioAPI, card: cheerio.Cheerio<cheerio.Element>): string {
  const wrap = card.closest("a, article, .card, .elementor-column, .elementor-widget, .elementor-element");
  const img = wrap.find("img").first().add(card.parent().find("img").first());
  return (
    img.attr("src") ||
    img.attr("data-src") ||
    img.attr("data-lazy-src") ||
    img.attr("data-srcset")?.split(",")[0]?.trim().split(/\s+/)[0] ||
    wrap.find("[style*='background']").first().attr("style")?.match(/url\(["']?([^"')]+)["']?\)/)?.[1] ||
    ""
  );
}

function parseHomepageCards(html: string): Deal[] {
  const $ = cheerio.load(html);
  const pageImage = extractOgImage(html, ATLAS_HOME);
  const deals: Deal[] = [];
  const seen = new Set<string>();

  $(".card-info").each((_, node) => {
    const card = $(node);
    const title = cleanText(card.find("h3, h2, .card-title").first().text());
    const description = cleanText(card.find("p, h4").first().text());
    const href =
      card.find("a[href]").first().attr("href") ??
      card.closest("a[href]").attr("href") ??
      card.parent().find("a[href]").first().attr("href") ??
      card.closest(".card, article, .elementor-widget").find("a[href]").first().attr("href") ??
      "";
    const url = normalizeUrl(href, ATLAS_ORIGIN);
    if (!title || !url || !isDealPage(title, url)) return;

    const deal = toDeal({
      title,
      description: description || title,
      pageTitle: title,
      url,
      index: 0,
      imageUrl: firstCardImageUrl(cardImageCandidate($, card), ATLAS_ORIGIN) || pageImage,
    });
    if (!deal || seen.has(deal.id)) return;
    seen.add(deal.id);
    deals.push(deal);
  });

  return deals;
}

function parseDealPage(html: string, pageUrl: string): Deal[] {
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, footer, form").remove();

  const title = cleanText($("h1").first().text()) || cleanText($("title").text()).split("|")[0]?.trim();
  if (!title || !isDealPage(title, pageUrl)) return [];
  const pageImage = extractOgImage(html, pageUrl);

  const scope = pageScope($);
  const groups = extractGroups($);
  const paragraphs = scope
    .find("p")
    .toArray()
    .map((node) => cleanText($(node).text()))
    .filter((text) => text.length > 40 && !IGNORE_HEADING.test(text) && !/תקנון|ניוזלטר/.test(text));

  if (groups.length >= 2) {
    return groups
      .map((group, index) =>
        toDeal({
          title: group.heading,
          description: group.body || paragraphs[0] || title,
          pageTitle: title,
          url: pageUrl,
          index,
          imageUrl: pageImage,
        }),
      )
      .filter((deal): deal is Deal => Boolean(deal));
  }

  const single = toDeal({
    title,
    description: paragraphs[0] || groups[0]?.body || cleanText(scope.text()).slice(0, 280),
    pageTitle: title,
    url: pageUrl,
    index: 0,
    imageUrl: pageImage,
  });
  return single ? [single] : [];
}

function collectLinksFromHtml(html: string, base: string): string[] {
  const $ = cheerio.load(html);
  const urls = new Set<string>();

  $("a[href], .card-title a").each((_, node) => {
    const href = $(node).attr("href") ?? "";
    const text = cleanText($(node).text());
    const parentText = cleanText($(node).closest("article, .card, .elementor-widget").text()).slice(0, 160);
    const url = normalizeUrl(href, base);
    if (!url) return;
    if (isDealPage(`${text} ${parentText}`, url)) urls.add(url);
  });

  return [...urls];
}

function isChallengeTitle(title: string): boolean {
  return /just a moment|attention required|cloudflare|denied/i.test(title);
}

async function gotoHtml(page: Page, url: string): Promise<string | null> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: GOTO_TIMEOUT_MS });
    if (isChallengeTitle(await page.title())) {
      await page.waitForFunction(
        () => !/just a moment|attention required|cloudflare|denied/i.test(document.title),
        null,
        { timeout: 12_000 },
      ).catch(() => undefined);
    }
    if (isChallengeTitle(await page.title())) return null;
    await page.waitForSelector("h1, h2, h3, .card-title", { timeout: 8000 }).catch(() => undefined);
    return await page.content();
  } catch {
    return null;
  }
}

function mergeDealUrls(...groups: string[][]): string[] {
  const urls = new Set<string>();
  for (const group of groups) {
    for (const url of group) urls.add(url);
  }
  if (urls.size === 0) {
    for (const url of FEATURED_FALLBACK_URLS) urls.add(url);
  }
  return [...urls].slice(0, MAX_DEAL_PAGES);
}

export async function scrapeAtlasDeals(dealsUrl = ATLAS_DEALS_URL): Promise<Deal[]> {
  const playwright = await loadPlaywright();
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser(playwright);
    const page = await browser.newPage({
      locale: "he-IL",
      userAgent: USER_AGENT,
      extraHTTPHeaders: { "Accept-Language": "he-IL,he;q=0.9,en;q=0.6" },
    });
    page.setDefaultTimeout(GOTO_TIMEOUT_MS);

    const listingHtml = (await gotoHtml(page, ATLAS_HOME)) ?? (await gotoHtml(page, dealsUrl));
    const deals: Deal[] = [];
    const seen = new Set<string>();
    const addDeals = (items: Deal[]) => {
      for (const deal of items) {
        if (seen.has(deal.id)) continue;
        seen.add(deal.id);
        deals.push(deal);
      }
    };

    if (listingHtml) addDeals(parseHomepageCards(listingHtml));

    if (deals.length === 0) {
      const pageUrls = mergeDealUrls(
        listingHtml ? collectLinksFromHtml(listingHtml, ATLAS_ORIGIN) : [],
        FEATURED_FALLBACK_URLS,
      ).filter((url) => /חגים|ספטמבר|קיץ|last.?call|מילוא/i.test(decodePath(url)));

      for (const url of pageUrls.slice(0, 4)) {
        const html = await gotoHtml(page, url);
        if (!html) continue;
        addDeals(parseDealPage(html, url));
      }
    }

    return deals;
  } finally {
    await browser?.close();
  }
}
