import type { Browser, Page } from "playwright";
import { CHAIN_BY_ID } from "../chains";
import { parseDealText, parsePriceIls } from "../parse-deal";
import type { Deal } from "../types";
import { launchBrowser, loadPlaywright } from "./playwright-browser";

export const AFI_DEALS_URL = "https://www.afi-hotels.co.il/deals";
const AFI_HOME = "https://www.afi-hotels.co.il/";
const CHAIN = CHAIN_BY_ID["africa-israel"];
const GOTO_TIMEOUT_MS = 30_000;

const EXTRA_LISTING_URLS = ["https://www.afi-hotels.co.il/best-holidays-deals"];

const LOCATION_HINTS: [RegExp, string][] = [
  [/ים המלח/, "ים המלח"],
  [/אילת/, "אילת"],
  [/ירושלים/, "ירושלים"],
  [/נתניה|לגון/, "נתניה"],
  [/תל אביב|אורבן|אינדיגו|פולי|קראון|סינט|סיטי/, "תל אביב"],
];

interface AfiRawCard {
  hotelName: string;
  title: string;
  dateText: string;
  priceText: string;
  description: string;
  bookingUrl: string;
  imageUrl: string;
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
    // Fall through.
  }
  return bookingUrl.replace(/[^\w-]+/g, "-").slice(-40);
}

function toDeal(raw: AfiRawCard): Deal | null {
  const hotelName = cleanText(raw.hotelName);
  const title = cleanText(raw.title);
  if (!raw.bookingUrl.includes("deal?") || (!hotelName && !title)) return null;

  const combined = [title, hotelName, raw.dateText, raw.description, raw.priceText].filter(Boolean).join(" ");
  const parsed = parseDealText(combined);
  const priceIls = parsePriceIls(raw.priceText) ?? parsed.pricePerNight;
  const description = cleanText(raw.description) || title;
  const descriptionWithPrice =
    priceIls && !description.includes(String(priceIls))
      ? `${description} מחיר באתר החל מ-${priceIls.toLocaleString("he-IL")} ₪ לזוג ללילה.`
      : description;

  return {
    id: `afi-live-${dealKey(raw.bookingUrl)}`,
    chainId: "africa-israel",
    chainName: CHAIN.nameHe,
    hotelName: hotelName || CHAIN.nameHe,
    title: title || "מבצע אפריקה ישראל",
    description: descriptionWithPrice.slice(0, 280),
    discountPercent: parsed.discountPercent,
    discountValue: parsed.discountValue ?? (/ארוחת בוקר מתנה/.test(combined) ? "ארוחת בוקר מתנה" : null),
    pricePerNight: priceIls,
    minNights: parsed.minNights,
    validFrom: parsed.validFrom,
    validTo: parsed.validTo,
    bookingUrl: raw.bookingUrl,
    location: inferLocation(`${hotelName} ${title}`),
    source: "live",
    imageUrl: raw.imageUrl || null,
  };
}

function isChallengeTitle(title: string): boolean {
  return /just a moment|attention required|cloudflare|denied/i.test(title);
}

async function gotoListing(page: Page, url: string): Promise<boolean> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: GOTO_TIMEOUT_MS });
    if (isChallengeTitle(await page.title())) {
      await page
        .waitForFunction(
          () => !/just a moment|attention required|cloudflare|denied/i.test(document.title),
          null,
          { timeout: 12_000 },
        )
        .catch(() => undefined);
    }
    if (isChallengeTitle(await page.title())) return false;
    await page.waitForSelector(".deal-box, a[href*='deal?']", { timeout: 12_000 }).catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}

async function extractCards(page: Page): Promise<AfiRawCard[]> {
  return page.evaluate(() => {
    const clean = (value: string) => value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
    return [...document.querySelectorAll(".deal-box")]
      .filter((el) => !el.classList.contains("slick-cloned"))
      .map((el) => {
        const texts = [...el.querySelectorAll("h3, h4, h5, p, span, div")]
          .map((node) => clean(node.textContent || ""))
          .filter((text) => text.length > 2 && text.length < 180);
        const dateText = texts.find((text) => /\d{1,2}\.\d{1,2}\.\d{2,4}/.test(text)) ?? "";
        const priceText = texts.find((text) => /₪/.test(text) && text.length < 50) ?? "";
        const hotelName =
          clean(el.querySelector(".deal-hotel-name, .hotel-name, .deal-hotel")?.textContent || "") ||
          texts.find((text) => /מלון|פולי|אינדיגו|וורט|קראון|סינט|vert|poli|indigo|crowne/i.test(text) && text.length < 55) ||
          "";
        const title =
          clean(el.querySelector(".deal-name, .deal-title")?.textContent || "") ||
          texts.find(
            (text) =>
              text !== hotelName &&
              text !== dateText &&
              text !== priceText &&
              !/לפרטים|הזמנה|כל המבצעים/.test(text),
          ) ||
          "";
        const href = (el.querySelector("a[href*='deal?']") as HTMLAnchorElement | null)?.href ?? "";
        const imageRaw =
          [...el.querySelectorAll("img")]
            .map((img) => {
              const node = img as HTMLImageElement;
              return (
                node.getAttribute("data-src") ||
                node.getAttribute("data-lazy") ||
                node.getAttribute("src") ||
                node.currentSrc ||
                ""
              );
            })
            .find((src) => src && !src.startsWith("data:") && !/logo|icon|sprite|pixel|1x1|\.svg/i.test(src)) ??
          (el.getAttribute("style") || "").match(/url\(["']?([^"')]+)["']?\)/)?.[1] ??
          "";
        let imageUrl = "";
        try {
          imageUrl = imageRaw ? new URL(imageRaw, location.origin).toString() : "";
        } catch {
          imageUrl = "";
        }
        return {
          hotelName,
          title,
          dateText,
          priceText,
          description: clean(el.textContent || ""),
          bookingUrl: href,
          imageUrl,
        };
      })
      .filter((card) => card.bookingUrl.includes("deal?"));
  });
}

export async function scrapeAfricaIsraelDeals(dealsUrl = AFI_DEALS_URL): Promise<Deal[]> {
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

    const listingUrls = [AFI_HOME, dealsUrl, ...EXTRA_LISTING_URLS].filter(
      (url, index, all) => all.indexOf(url) === index,
    );
    const rawCards: AfiRawCard[] = [];

    for (const url of listingUrls) {
      const ok = await gotoListing(page, url);
      if (!ok) continue;
      rawCards.push(...(await extractCards(page)));
    }

    const deals: Deal[] = [];
    const seen = new Set<string>();
    for (const raw of rawCards) {
      const deal = toDeal(raw);
      if (!deal || seen.has(deal.id)) continue;
      seen.add(deal.id);
      deals.push(deal);
    }

    return deals;
  } finally {
    await browser?.close();
  }
}
