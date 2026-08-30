import axios from "axios";
import * as cheerio from "cheerio";
import type { HotelChain, Deal } from "../types";
import { mergeParsedFields, parseDealText } from "../parse-deal";

const USER_AGENT =
  "VacationSalesDealBot/0.1 (+https://github.com/vacationsales; public hotel offers aggregator)";

const TITLE_SELECTORS = [
  "article h2",
  "article h3",
  ".deal h2",
  ".deal h3",
  ".offer h2",
  ".offer h3",
  ".promotion h2",
  "[class*='deal'] h2",
  "[class*='offer'] h3",
  "[class*='promo'] h2",
  "h2",
  "h3",
].join(", ");

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function scrapeChainWithCheerio(chain: HotelChain): Promise<Deal[]> {
  const response = await axios.get<string>(chain.dealsUrl, {
    timeout: 12000,
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "he-IL,he;q=0.9,en;q=0.6",
    },
    maxRedirects: 3,
    validateStatus: (status) => status >= 200 && status < 400,
  });

  const $ = cheerio.load(response.data);
  $("script, style, noscript, nav, footer").remove();

  const listingHost = new URL(chain.dealsUrl).host;

  const rawCards = $(TITLE_SELECTORS)
    .toArray()
    .map((node) => {
      const heading = $(node).text().replace(/\s+/g, " ").trim();
      const parent = $(node).closest("article, section, li, .card, [class*='deal'], [class*='offer']");
      const scope = parent.length ? parent : $(node).parent();
      const body = (scope.text() || heading).replace(/\s+/g, " ").trim();
      const href = scope
        .find("a[href]")
        .toArray()
        .map((anchor) => $(anchor).attr("href") ?? "")
        .map((raw) => {
          try {
            return new URL(raw, chain.dealsUrl).toString();
          } catch {
            return "";
          }
        })
        .find((url) => {
          if (!url || url.startsWith("javascript:")) return false;
          const parsed = new URL(url);
          const isSameListing = parsed.href.replace(/\/$/, "") === chain.dealsUrl.replace(/\/$/, "");
          const isHomepage = parsed.pathname === "/" || parsed.pathname === "";
          return parsed.host === listingHost && !isSameListing && !isHomepage;
        });

      return {
        text: body.length > heading.length ? body : heading,
        bookingUrl: href ?? chain.dealsUrl,
      };
    })
    .filter((card) => card.text.length >= 8);

  const uniqueCards: typeof rawCards = [];
  const seen = new Set<string>();
  for (const card of rawCards) {
    if (seen.has(card.text)) continue;
    seen.add(card.text);
    uniqueCards.push(card);
    if (uniqueCards.length >= 12) break;
  }

  return uniqueCards
    .filter((card) => card.bookingUrl !== chain.dealsUrl)
    .map((card, index) => {
      const parsed = parseDealText(card.text);
      const firstLine = card.text.split(/[.!?\n]/)[0]?.trim() || `${chain.nameHe} דיל`;
      const fields = mergeParsedFields({}, parsed);

      return {
        id: `${chain.id}-live-${slugify(firstLine) || index}`,
        chainId: chain.id,
        chainName: chain.nameHe,
        hotelName: chain.nameHe,
        title: firstLine.slice(0, 90),
        description: card.text.slice(0, 220),
        bookingUrl: card.bookingUrl,
        location: null,
        source: "live" as const,
        ...fields,
      };
    });
}
