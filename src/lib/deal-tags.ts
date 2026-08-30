import type { AudienceTag, Deal } from "./types";

const CITY_HINTS: [RegExp, string][] = [
  [/אילת/, "אילת"],
  [/ים המלח/, "ים המלח"],
  [/ירושלים/, "ירושלים"],
  [/תל[\s-]?אביב|ת["״]א/, "תל אביב"],
  [/הרצליה/, "הרצליה"],
  [/חיפה|כרמל/, "חיפה"],
  [/קיסריה/, "קיסריה"],
  [/טבריה/, "טבריה"],
  [/כנרת/, "כנרת"],
  [/נתניה/, "נתניה"],
  [/אשדוד/, "אשדוד"],
  [/נצרת/, "נצרת"],
  [/צפת/, "צפת"],
  [/מצפה רמון/, "מצפה רמון"],
  [/נתב["״]?ג/, "נתב״ג"],
  [/הנגב|קדמה/, "הנגב"],
  [/צפון|גליל/, "צפון"],
];

const CITY_ORDER = [
  "אילת",
  "ים המלח",
  "תל אביב",
  "ירושלים",
  "הרצליה",
  "חיפה",
  "קיסריה",
  "כנרת",
  "טבריה",
  "נתניה",
  "אשדוד",
  "נצרת",
  "צפת",
  "מצפה רמון",
  "הנגב",
  "נתב״ג",
  "צפון",
];

const WEEKEND =
  /סופ["״']?ש(?:ים)?|סוף\s*שבוע|סופי\s*שבוע|וויק.?אנד|weekend|שישי(?:\s*[-–ו]|\s+)\s*שבת/i;
const MIDWEEK_ONLY =
  /לא כולל\s*(?:ימי\s*)?(?:שישי|שבת|סופ)|ללא\s*(?:ימי\s*)?(?:שישי|שבת|סופ)|אמצע שבוע בלבד|ימי חול בלבד|רק ימי חול|רק באמצע השבוע|ראשון\s*עד\s*חמישי/i;
const IDF = /מילוא|חייל|כוחות\s*הביטחון|צה["״]?ל|\bidf\b|reservist/i;
const CLUB = /חברי\s+מועדון|מועדון\s+(?:the\s+)?club|e-?dan|the club|club brown|לחברי\s/i;

function dealText(deal: Deal): string {
  return [deal.title, deal.description, deal.discountValue, deal.hotelName].filter(Boolean).join(" ");
}

function headlineText(deal: Deal): string {
  return [deal.title, deal.discountValue].filter(Boolean).join(" ");
}

function isoUtc(iso: string | null): Date | null {
  const match = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function dateRangeIncludesWeekend(deal: Deal): boolean | null {
  const start = isoUtc(deal.validFrom);
  const end = isoUtc(deal.validTo);
  if (!start || !end) return null;
  const spanDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (spanDays < 0) return null;
  if (spanDays >= 6) return true;
  for (let time = start.getTime(); time <= end.getTime(); time += 86_400_000) {
    const weekday = new Date(time).getUTCDay();
    if (weekday === 5 || weekday === 6) return true;
  }
  return false;
}

export function dealCity(deal: Deal): string | null {
  if (deal.location?.trim()) return deal.location.trim();
  const haystack = `${deal.hotelName} ${deal.title}`;
  for (const [pattern, city] of CITY_HINTS) {
    if (pattern.test(haystack)) return city;
  }
  return null;
}

/** True when the deal can be used on Friday/Saturday, even if it also covers weekdays. */
export function isWeekendDeal(deal: Deal): boolean {
  if (MIDWEEK_ONLY.test(dealText(deal))) return false;
  return dateRangeIncludesWeekend(deal) !== false;
}

/** Weekend-focused copy, for the card badge only. */
export function isWeekendHighlight(deal: Deal): boolean {
  return isWeekendDeal(deal) && WEEKEND.test(headlineText(deal));
}

export function isIdfDeal(deal: Deal): boolean {
  return IDF.test(dealText(deal));
}

export function isClubDeal(deal: Deal): boolean {
  return CLUB.test(dealText(deal));
}

export function dealMatchesAudience(deal: Deal, audiences: AudienceTag[]): boolean {
  if (audiences.length === 0) return true;
  return audiences.some((audience) => (audience === "idf" ? isIdfDeal(deal) : isClubDeal(deal)));
}

export function uniqueCities(deals: Deal[]): string[] {
  const found = new Set<string>();
  for (const deal of deals) {
    const city = dealCity(deal);
    if (city) found.add(city);
  }
  const ranked = CITY_ORDER.filter((city) => found.has(city));
  const extra = [...found].filter((city) => !CITY_ORDER.includes(city)).sort((a, b) => a.localeCompare(b, "he"));
  return [...ranked, ...extra];
}
