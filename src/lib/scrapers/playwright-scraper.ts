import type { HotelChain, Deal } from "../types";
import { parseDealText } from "../parse-deal";

/**
 * Optional Playwright adapter for JS-rendered deal pages.
 * Install `playwright` and run `npx playwright install chromium` to enable.
 * Dedicated chain scrapers are preferred; this adapter is unused by default.
 */
export async function scrapeChainWithPlaywright(chain: HotelChain): Promise<Deal[]> {
  let playwright: typeof import("playwright");
  try {
    playwright = await import("playwright");
  } catch {
    throw new Error("Playwright is not installed. Run `npm i playwright` and `npx playwright install chromium`.");
  }

  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      locale: "he-IL",
      userAgent: "VacationSalesDealBot/0.1",
    });
    await page.goto(chain.dealsUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    const texts = await page.$$eval("h2, h3, article, [class*='deal'], [class*='offer']", (nodes) =>
      nodes
        .map((node) => (node.textContent || "").replace(/\s+/g, " ").trim())
        .filter((text) => text.length > 12)
        .slice(0, 12),
    );

    return texts.map((text, index) => {
      const parsed = parseDealText(text);
      return {
        id: `${chain.id}-pw-${index}`,
        chainId: chain.id,
        chainName: chain.nameHe,
        hotelName: chain.nameHe,
        title: text.slice(0, 90),
        description: text.slice(0, 220),
        bookingUrl: chain.dealsUrl,
        location: null,
        source: "live" as const,
        ...parsed,
      };
    });
  } finally {
    await browser.close();
  }
}
