# PRD — DealSea (דילסי)

**Role:** You are the full-stack developer for DealSea (דילסי).  
**Owner:** VP Product  
**Audience:** Young Israeli couples and families who want a fast, cheap vacation without hunting ten hotel sites.  
**Stack:** Next.js 15, TypeScript, Tailwind, Hebrew RTL. Live scrapers only.

Implement this PRD end to end. Verify in the browser (desktop ~1280 and mobile ~375). Do not commit unless asked.

---

## 1. Product

DealSea is a high-speed, clean, real-time hotel-deal aggregator for Israel. It crawls official chain sites (ישרוטל, פתאל, בראון, אטלס, דן, אפריקה ישראל, הרברט סמואל), drops expired offers, and shows only active deals.

Tone: breezy, trustworthy, unhurried Mediterranean vacation — not a flash-sale marketplace. Copy is Hebrew-first, tight, and action-oriented.

---

## 2. Do not break

| Area | Rule |
| --- | --- |
| Live-only catalog | No mock fallback. Empty scrape stays empty. |
| Search | Free search includes hotel name. Strip leading `מלון` / `מלונות`. Fold Hebrew spelling (optional י, final letters) so `דיזינגוף 99` matches `דיזנגוף 99`. |
| Weekend | Deal is usable on Fri/Sat, including all-week sales. Exclude midweek-only / `לא כולל שישי–שבת`. |
| Filters | City + chain multi-select. IDF and club chips. AND across groups. |
| Urgency | `עודכן לפני X דקות` from `firstSeenAt` (`data/first-seen.json` via `stampFirstSeen`). Never reset on browser refresh or `/api/deals` without `refresh=1`. |
| Booking | Existing `dealBookingUrl()` / Dan date+pax rewrite. |
| SEO | `/deals/[slug]` landings, JSON-LD, sitemap. |
| Subscribe API | `POST /api/subscribe` — **שם** + **אימייל** only → `data/subscribers.json`. |

Do not rewrite scrapers unless a thin adapter is required for a visual/data-contract change.

---

## 3. Visual system

| Token | Hex | Use |
| --- | --- | --- |
| Canvas | `#F8F9FA` | Page |
| Surface | `#FFFFFF` | Cards, header, inputs |
| Ink | `#0A2540` | Titles |
| Soft ink | `#3D5A64` | Meta |
| Sea | `#007791` | Primary actions, selected chips, links |
| Navy | `#0A2540` | Dark text |

- **Font everywhere:** Assistant (Hebrew + Latin). No Heebo, no Varela, no second family.
- **Page background:** repeating subtle palm pattern (`/palm-pattern.svg`) on the canvas. Cards and header stay solid white so copy stays readable.
- No `#FF5A36` / coral primary. No KPI metric tiles.
- Selected chips: sea. Unselected: white + light border.

---

## 4. Header & branding

RTL header, one row on desktop.

**Right (start in RTL):** pelican mascot (`/logo.jpg`) + the single Hebrew word **דילסי**.  
Do **not** show “DealSea” in the header, hero eyebrow, or next to the logo.

**Left (end in RTL):** live counter badge, then actions.

- Badge: `X דילים חיים ברשת` — dynamic count of the **currently visible / filtered** catalog (or total live deals if no filter). Quiet, not a dashboard widget.
- Buttons: **רענן דילים** (existing refresh), optional compact community link that scrolls to the inline banner.
- Optional tiny “סריקה אחרונה …” may sit under the badge; do not let it compete with the live count.

Document / tab title may still use `דילסי | DealSea` for SEO. Header UI is Hebrew brand only.

---

## 5. Hero (Hebrew, exact copy)

Remove any English eyebrow (`DealSea`, `VacationSales`).

**H1:** דילסי סורק בשבילכם את הרשת בזמן אמת  

**Subtitle:** תופסים חופשה בלי להתאמץ – רק הדילים הכי זולים, ישירות מהאתרים הרשמיים

No second live-count line in the hero — the header badge owns that.

Landing pages (`/deals/[slug]`) keep their SEO H1/description from `seo-routes.ts` instead of this default hero.

---

## 6. Action labels

| Surface | Copy |
| --- | --- |
| Card / table CTA | **תפוס את הדיל** (replaces `הזמן עכשיו`) |
| Refresh | **רענן דילים** |
| Urgency | **עודכן לפני X דקות** (and hour/day variants already in `formatPublishedAgo`) |
| Subscribe submit | **להרשמה** |
| Placeholders | **שם**, **אימייל** |

---

## 7. Pagination & content flow

### 7.1 Grid: 30 deals per page

After filters/sort, paginate the result set:

- **Exactly 30 deals per page** (page 1 = items 0–29, page 2 = 30–59, …).
- Reset to page 1 when query, city, chain, weekend, audience, or sort changes.
- Page controls below the grid: previous / next + current page. Hebrew, sea for the active page.
- Table view: same page size (30 rows).
- Do not fetch a new scrape on page change — paginate the already-loaded, already-filtered list on the client.

### 7.2 Community banner after the 9th card

On **grid** view, insert the signup banner **directly after the 9th deal card** in the current page’s flow.

- If the page has fewer than 9 cards, put the banner after the last card.
- Banner title: **הרשמה לקהילת המבצעים**
- Fields: **שם**, **אימייל** only. Same `POST /api/subscribe`.
- Stretch the banner across the grid (full row), then continue cards 10–30.
- Remove the duplicate subscribe block from the bottom of the page (header may still jump to `#subscribe`).
- `id="subscribe"` stays on this banner.

Suggested supporting line (keep the vibe, do not invent a sales pitch):  
שם ואימייל בלבד — נעדכן על דילים חיים, בלי ספאם.

---

## 8. Deal cards

Light, spacious, equal height.

1. Photo (or palm placeholder — never a blank navy hole).
2. Hotel name (primary).
3. Chain · destination.
4. Price / discount (sea for ₪, restrained %).
5. Clamped sale title + 2-line description.
6. `עודכן לפני X דקות`.
7. Min nights + dates.
8. CTA: **תפוס את הדיל**.

At most one contextual chip (מילואים / מועדון / סוף שבוע highlight). Hide the chip if that filter is already on. Do not badge every all-week deal as סוף שבוע.

---

## 9. Hotel images (fast catalog, no empty holes)

**Cache once per hotel on the server** (`data/hotel-images.json` + `public/hotels/{hash}.ext`).  
Never fetch hotel photos from the client on render or refresh.

| Rule | Why |
| --- | --- |
| Attach cached paths synchronously | Catalog stays fast |
| Fill missing hotels in the **background** after the API returns | Does not block `/api/deals` |
| One download per hotel; skip if file exists | No repeat load, no hammering chains |
| Cap concurrent downloads; miss TTL ~24h | Protects the app |
| Palm placeholder when no file yet | Card never looks empty |

Do not add Unsplash / random stock as that hotel.

---

## 10. Code map

| File | Change |
| --- | --- |
| `src/components/Header.tsx` | Pelican + **דילסי** only; live badge on the left |
| `src/components/Dashboard.tsx` | Exact hero copy; pass deal count into header; drop bottom subscribe; page state |
| `src/components/DealGrid.tsx` | 30 per page; banner after card 9 |
| `src/components/DealCard.tsx` / `DealTable.tsx` | CTA **תפוס את הדיל** |
| `src/components/SubscribeForm.tsx` | Inline full-width banner; `id="subscribe"` |
| `src/app/layout.tsx` | Assistant only (already) |
| `src/lib/hotel-images.ts` | Cache + background fill (already); do not regress |

---

## 11. Acceptance criteria

- [ ] Header shows pelican + **דילסי** only — no “DealSea” next to the logo.
- [ ] Left side of the header shows `X דילים חיים ברשת` and updates with filters.
- [ ] Default homepage H1 and subtitle match section 5 **exactly**.
- [ ] Card CTA is **תפוס את הדיל**. Refresh is **רענן דילים**.
- [ ] Filtered list is paginated at **30** deals per page.
- [ ] Community banner (שם + אימייל) appears after the **9th** card on the page.
- [ ] `עודכן לפני X דקות` does not reset on refresh.
- [ ] Search `דיזינגוף 99` still finds דיזנגוף 99. Weekend still includes all-week deals that cover Fri/Sat.
- [ ] Hotel images are not re-fetched on every page view; missing photos show the palm placeholder.
- [ ] Assistant + palm background remain. RTL holds on mobile and desktop.

---

## 12. Out of scope

- New chains or mock data.
- Changing weekend / search / IDF semantics beyond what is already shipped.
- Email sending (store subscribers only).
- Git commit unless asked.

---

## 13. Developer prompt (execute this)

> Ship the DealSea (דילסי) header and content flow. Header: pelican + **דילסי** only on the right; `X דילים חיים ברשת` on the left. Hero copy exactly: «דילסי סורק בשבילכם את הרשת בזמן אמת» / «תופסים חופשה בלי להתאמץ – רק הדילים הכי זולים, ישירות מהאתרים הרשמיים». CTA «תפוס את הדיל», refresh «רענן דילים». Paginate 30 deals per page. Insert the שם+אימייל community banner after the 9th card. Keep live scrapers, Hebrew search folding, weekend-includes-weekdays, firstSeen urgency, and one-time hotel image cache. Verify in the browser.
