# DealSea (דילסי) — מבצעי מלונות בישראל

Hebrew RTL dashboard that aggregates hotel deals from major Israeli chains: Isrotel, Fattal, Brown, Atlas, Dan, Africa Israel, and Herbert Samuel.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Lucide React icons
- Next.js API routes + Cheerio scraper scaffold
- Optional Playwright adapter for JavaScript-rendered deal pages

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard loads live deals from the hotel sites.

## Data layer

- `GET /api/deals` — aggregated deals, with `chains`, `q`, and `sort` query params
- `POST /api/scrape` — trigger a refresh
- `src/lib/parse-deal.ts` — extracts discount, min nights, and validity dates from Hebrew/English offer text
- `src/lib/scrapers/` — Cheerio fetchers per public offers URL, plus a Playwright stub

The app scrapes public deal pages only. Empty or failed scrapes stay empty — there is no mock fallback.
