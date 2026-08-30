import type { Browser, Page } from "playwright";
import { CHAIN_BY_ID } from "../chains";
import { parseDealText, parsePriceIls } from "../parse-deal";
import type { Deal } from "../types";
import { launchBrowser, loadPlaywright } from "./playwright-browser";

export const FATTAL_DEALS_URL = "https://www.fattal.co.il/deals";

const CHAIN = CHAIN_BY_ID.fattal;
const GOTO_TIMEOUT_MS = 45_000;
const CARD_TIMEOUT_MS = 25_000;
const MAX_LOAD_MORE_CLICKS = 6;

const LOCATION_HINTS: [RegExp, string][] = [
  [/ים המלח/, "ים המלח"],
  [/אילת/, "אילת"],
  [/ירושלים/, "ירושלים"],
  [/תל אביב|סיטי טאוו?ר|גורדון|רוטשילד|ניקס תל|NYX ניקס תל/, "תל אביב"],
  [/טבריה|כנרת/, "טבריה"],
  [/אשדוד/, "אשדוד"],
  [/נתניה/, "נתניה"],
  [/חיפה/, "חיפה"],
  [/הרצליה/, "הרצליה"],
  [/רחובות/, "רחובות"],
  [/באר שבע|נגב/, "באר שבע"],
  [/נוצ['׳']?ה|nucha/i, "תל אביב"],
  [/בזאר|bazaar/i, "תל אביב"],
  [/סאם ובלונדי/, "תל אביב"],
  [/בכר האוס/, "ירושלים"],
  [/reception/i, "תל אביב"],
  [/נורדוי/, "תל אביב"],
];

interface FattalRawCard {
  dealId: string | null;
  hotelId: string | null;
  title: string;
  hotelName: string;
  dateText: string;
  board: string;
  highlights: string;
  priceText: string;
  bookingUrl: string;
}

function cleanText(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function parseFattalDate(raw: string): string | null {
  const match = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]) < 100 ? 2000 + Number(match[3]) : Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseFattalDateRange(text: string): { validFrom: string | null; validTo: string | null } {
  const dates = [...text.matchAll(/(\d{1,2}\.\d{1,2}\.\d{2,4})/g)].map((match) => match[1]);
  return {
    validFrom: dates[0] ? parseFattalDate(dates[0]) : null,
    validTo: dates[1] ? parseFattalDate(dates[1]) : parseFattalDate(dates[0] ?? ""),
  };
}

function inferLocation(hotelName: string): string | null {
  for (const [pattern, location] of LOCATION_HINTS) {
    if (pattern.test(hotelName)) return location;
  }
  return null;
}

function toDeal(raw: FattalRawCard): Deal | null {
  const title = cleanText(raw.title);
  const hotelName = cleanText(raw.hotelName) || CHAIN.nameHe;
  if (!title) return null;

  const board = cleanText(raw.board);
  const highlights = cleanText(raw.highlights);
  const combinedText = [title, hotelName, raw.dateText, board, highlights, raw.priceText].filter(Boolean).join(" ");
  const parsed = parseDealText(combinedText);
  const dates = parseFattalDateRange(raw.dateText);
  const priceMatch = raw.priceText.match(/₪\s*([\d,]+)/);
  const priceIls = priceMatch?.[1]?.replace(/,/g, "");

  const details = [board, highlights].filter(Boolean).join(". ");
  const descriptionWithPrice =
    priceIls && !details.includes(priceIls)
      ? `${details || title} מחיר באתר החל מ-${Number(priceIls).toLocaleString("he-IL")} ₪ לזוג ללילה.`
      : details || title;

  const dealKey = [raw.dealId, raw.hotelId].filter(Boolean).join("-") || title.slice(0, 40);

  return {
    id: `fattal-live-${dealKey}`,
    chainId: "fattal",
    chainName: CHAIN.nameHe,
    hotelName,
    title,
    description: descriptionWithPrice.slice(0, 280),
    discountPercent: parsed.discountPercent,
    discountValue: parsed.discountValue,
    pricePerNight: parsePriceIls(priceIls) ?? parsed.pricePerNight,
    minNights: parsed.minNights,
    validFrom: dates.validFrom ?? parsed.validFrom,
    validTo: dates.validTo ?? parsed.validTo,
    bookingUrl: raw.bookingUrl,
    location: inferLocation(hotelName),
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

async function blockNoise(page: Page): Promise<void> {
  await page.route("**/*", (route) => {
    const url = route.request().url();
    const type = route.request().resourceType();
    if (
      /google|doubleclick|taboola|facebook|tiktok|poptin|hotjar|gbqofs|creativecdn|outbrain|bazak\.ai/i.test(
        url,
      )
    ) {
      return route.abort();
    }
    if (type === "image" || type === "media" || type === "font") {
      return route.abort();
    }
    return route.continue();
  });
}

async function countDealLinks(page: Page): Promise<number> {
  return page.locator('a[href*="/deals/"]').evaluateAll((anchors) =>
    anchors.filter((anchor) => /\/deals\/\d+/.test((anchor as HTMLAnchorElement).href)).length,
  );
}

async function loadMoreDeals(page: Page): Promise<void> {
  const button = page.getByRole("button", { name: /טען דילים נוספים/ });

  for (let i = 0; i < MAX_LOAD_MORE_CLICKS; i++) {
    const visible = await button.isVisible().catch(() => false);
    if (!visible) break;

    const before = await countDealLinks(page);
    await button.click({ timeout: 4000 }).catch(() => undefined);

    try {
      await page.waitForFunction(
        (previous) =>
          [...document.querySelectorAll("a[href*='/deals/']")].filter((anchor) =>
            /\/deals\/\d+/.test((anchor as HTMLAnchorElement).href),
          ).length > previous,
        before,
        { timeout: 8000 },
      );
    } catch {
      break;
    }
  }
}

async function extractRawCards(page: Page): Promise<FattalRawCard[]> {
  return page.evaluate(() => {
    const headings = [...document.querySelectorAll("h3")];
    const cards: FattalRawCard[] = [];

    for (const heading of headings) {
      let card: HTMLElement | null = heading;
      for (let i = 0; i < 8 && card?.parentElement; i++) {
        card = card.parentElement;
        const dealLinks = [...card.querySelectorAll("a[href]")].filter((anchor) =>
          /\/deals\/\d+/.test((anchor as HTMLAnchorElement).href || anchor.getAttribute("href") || ""),
        );
        if (card.querySelectorAll("h3").length === 1 && dealLinks.length >= 1) break;
      }
      if (!card) continue;

      const href =
        [...card.querySelectorAll("a[href]")]
          .map((anchor) => (anchor as HTMLAnchorElement).href)
          .find((value) => /\/deals\/\d+/.test(value)) ?? "";
      if (!href) continue;

      const parsedUrl = new URL(href, "https://www.fattal.co.il");
      const dealId = parsedUrl.pathname.match(/\/deals\/(\d+)/)?.[1] ?? null;
      const hotelId = parsedUrl.searchParams.get("hotelId");
      const hotelName =
        card.querySelector("button p")?.textContent ||
        card.querySelector("button")?.textContent ||
        "";
      const dateText =
        [...card.querySelectorAll("p")]
          .map((node) => (node.textContent || "").trim())
          .find((text) => /\d{1,2}\.\d{1,2}\.\d{2}/.test(text)) ?? "";
      const board =
        [...card.querySelectorAll("div, span, p")]
          .map((node) => (node.textContent || "").replace(/\s+/g, " ").trim())
          .find((text) => /^לינה/.test(text) && text.length < 40) ?? "";
      const highlights = [...card.querySelectorAll("li")]
        .map((node) => (node.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(" · ");
      const priceText =
        [...card.querySelectorAll("div, span")]
          .map((node) => (node.textContent || "").replace(/\s+/g, " ").trim())
          .find((text) => /₪\s*\d/.test(text) && text.length < 40) ?? "";

      cards.push({
        dealId,
        hotelId,
        title: (heading.textContent || "").replace(/\s+/g, " ").trim(),
        hotelName: hotelName.replace(/\s+/g, " ").trim(),
        dateText,
        board,
        highlights,
        priceText,
        bookingUrl: parsedUrl.toString(),
      });
    }

    return cards;
  });
}

export async function scrapeFattalDeals(dealsUrl = FATTAL_DEALS_URL): Promise<Deal[]> {
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
    await blockNoise(page);

    const response = await page.goto(dealsUrl, { waitUntil: "domcontentloaded", timeout: GOTO_TIMEOUT_MS });
    if (response && response.status() >= 400) {
      throw new Error(`Fattal returned HTTP ${response.status()} for ${dealsUrl}`);
    }

    await dismissConsent(page);

    try {
      await page.waitForSelector("h3", { timeout: CARD_TIMEOUT_MS });
    } catch {
      throw new Error("Fattal deal cards did not render in time.");
    }

    await page.waitForFunction(() =>
      [...document.querySelectorAll("a[href*='/deals/']")].some((anchor) =>
        /\/deals\/\d+/.test((anchor as HTMLAnchorElement).href),
      ),
    );

    await loadMoreDeals(page);
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
    const message = error instanceof Error ? error.message : "Unknown Fattal scrape error";
    throw new Error(`Fattal Playwright scrape failed: ${message}`);
  } finally {
    await browser?.close().catch(() => undefined);
  }
}
