import { parseNightSpecificDiscount } from "./discount";
import type { ParsedDealFields } from "./types";

const HEBREW_MONTHS: Record<string, number> = {
  ינואר: 1,
  פברואר: 2,
  מרץ: 3,
  אפריל: 4,
  מאי: 5,
  יוני: 6,
  יולי: 7,
  אוגוסט: 8,
  ספטמבר: 9,
  אוקטובר: 10,
  נובמבר: 11,
  דצמבר: 12,
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toIsoDate(day: number, month: number, year: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const fullYear = year < 100 ? 2000 + year : year;
  return `${fullYear}-${pad(month)}-${pad(day)}`;
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseNumericDate(raw: string): string | null {
  const match = raw.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = match[3] ? Number(match[3]) : new Date().getFullYear();
  return toIsoDate(day, month, year);
}

function extractNightSpecificDiscount(
  text: string,
  minNights: number | null,
): Pick<ParsedDealFields, "discountPercent" | "discountValue"> | null {
  return parseNightSpecificDiscount(text, minNights);
}

function shekelOffLabel(text: string): string | null {
  const match = text.match(/(\d{2,4})\s*(?:₪|ש["״]?ח)\s*הנחה/);
  return match ? `${match[1]} ₪ הנחה` : null;
}

function withShekelOff(
  text: string,
  fields: Pick<ParsedDealFields, "discountPercent" | "discountValue">,
): Pick<ParsedDealFields, "discountPercent" | "discountValue"> {
  const shekelOff = shekelOffLabel(text);
  if (!shekelOff || fields.discountValue?.includes(shekelOff)) return fields;
  if (!fields.discountValue) return { discountPercent: null, discountValue: shekelOff };
  return { ...fields, discountValue: `${fields.discountValue} + ${shekelOff}` };
}

function extractDiscount(
  text: string,
  minNights: number | null,
): Pick<ParsedDealFields, "discountPercent" | "discountValue"> {
  const nightSpecific = extractNightSpecificDiscount(text, minNights);
  if (nightSpecific) return withShekelOff(text, nightSpecific);

  const percentMatch = text.match(/(?:עד\s*)?(\d{1,2})\s*%/);
  if (percentMatch) {
    return withShekelOff(text, {
      discountPercent: Number(percentMatch[1]),
      discountValue: `${percentMatch[1]}%`,
    });
  }

  const hebrewPercent = text.match(/(?:הנחה\s+של\s+)?(\d{1,2})\s*אחוז/);
  if (hebrewPercent) {
    return withShekelOff(text, {
      discountPercent: Number(hebrewPercent[1]),
      discountValue: `${hebrewPercent[1]}%`,
    });
  }

  const shekelOnly = shekelOffLabel(text);
  if (shekelOnly) return { discountPercent: null, discountValue: shekelOnly };

  if (/ארוחת\s*בוקר\s*(חינם|חינםית|חינם)/.test(text) || /free breakfast/i.test(text)) {
    return { discountPercent: null, discountValue: "ארוחת בוקר חינם" };
  }

  return { discountPercent: null, discountValue: null };
}

const DISCOUNT_AMOUNT =
  /\d{1,5}\s*(?:₪|ש["״]?ח)\s*הנחה(?:\s+ללילה)?|הנחה\s+(?:של\s+)?\d{1,5}\s*(?:₪|ש["״]?ח)/g;

function stripDiscountAmounts(text: string): string {
  return text.replace(DISCOUNT_AMOUNT, " ");
}

export function parsePriceIls(raw: string | number | null | undefined): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 50 && raw <= 50_000) {
    return Math.round(raw);
  }
  if (raw == null) return null;
  const normalized = stripDiscountAmounts(String(raw).replace(/,/g, "").trim());
  const bare = Number(normalized);
  if (Number.isFinite(bare) && bare >= 50 && bare <= 50_000) return Math.round(bare);
  const match = normalized.match(
    /(?:₪\s*)(\d{2,5})|(?:החל מ-?\s*)(\d{2,5})\s*(?:₪|ש["״]?ח)|(\d{2,5})\s*₪/,
  );
  if (!match) return null;
  const index = match.index ?? 0;
  const around = normalized.slice(Math.max(0, index - 12), index + match[0].length + 12);
  if (/הנחה/.test(around)) return null;
  const value = Number(match[1] ?? match[2] ?? match[3]);
  return Number.isFinite(value) && value >= 50 && value <= 50_000 ? value : null;
}

function extractPrice(text: string): number | null {
  return parsePriceIls(stripDiscountAmounts(text));
}

function extractMinNights(text: string): number | null {
  const patterns = [
    /מינימום\s*(\d+)\s*לילו(?:ת|ת)/,
    /(\d+)\s*לילו(?:ת|ת)\s*לפחות/,
    /לפחות\s*(\d+)\s*לילו(?:ת|ת)/,
    /(\d+)\s*nights?/i,
    /minimum\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }

  return null;
}

function extractDates(text: string): Pick<ParsedDealFields, "validFrom" | "validTo"> {
  const numericRange = text.match(
    /(\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)\s*[-–—]\s*(\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)/,
  );
  if (numericRange) {
    return {
      validFrom: parseNumericDate(numericRange[1]),
      validTo: parseNumericDate(numericRange[2]),
    };
  }

  const daySpan = text.match(/(\d{1,2})\s*[-–—]\s*(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/);
  if (daySpan) {
    const year = daySpan[4] ? Number(daySpan[4]) : new Date().getFullYear();
    const month = Number(daySpan[3]);
    return {
      validFrom: toIsoDate(Number(daySpan[1]), month, year),
      validTo: toIsoDate(Number(daySpan[2]), month, year),
    };
  }

  const fromUntil = text.match(
    /מ-?\s*(\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)\s*ו?עד\s*(?:ה-?)?\s*(\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)/,
  );
  if (fromUntil) {
    return {
      validFrom: parseNumericDate(fromUntil[1]),
      validTo: parseNumericDate(fromUntil[2]),
    };
  }

  const untilOnly = text.match(/עד(?:\s+ה-?)?\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})/);
  if (untilOnly) {
    return {
      validFrom: null,
      validTo: parseNumericDate(untilOnly[1]),
    };
  }

  const monthNames = Object.keys(HEBREW_MONTHS).join("|");
  const hebrewRange = text.match(new RegExp(`(${monthNames})\\s*[-–—]\\s*(${monthNames})(?:\\s+(\\d{4}))?`));
  if (hebrewRange) {
    const year = hebrewRange[3] ? Number(hebrewRange[3]) : new Date().getFullYear();
    const fromMonth = HEBREW_MONTHS[hebrewRange[1]];
    const toMonth = HEBREW_MONTHS[hebrewRange[2]];
    return {
      validFrom: toIsoDate(1, fromMonth, year),
      validTo: toIsoDate(lastDayOfMonth(year, toMonth), toMonth, year),
    };
  }

  const singleMonth = text.match(new RegExp(`(?:בחודש\\s+)?(${monthNames})(?:\\s+(\\d{4}))?`));
  if (singleMonth) {
    const year = singleMonth[2] ? Number(singleMonth[2]) : new Date().getFullYear();
    const month = HEBREW_MONTHS[singleMonth[1]];
    return {
      validFrom: toIsoDate(1, month, year),
      validTo: toIsoDate(lastDayOfMonth(year, month), month, year),
    };
  }

  return { validFrom: null, validTo: null };
}

export function isDiscountAmountUsedAsPrice(text: string, price: number): boolean {
  return new RegExp(`${price}\\s*(?:₪|ש["״]?ח)\\s*הנחה`).test(text);
}

export function parseDealText(text: string): ParsedDealFields {
  const normalized = text.replace(/\s+/g, " ").trim();
  const minNights = extractMinNights(normalized);
  return {
    ...extractDiscount(normalized, minNights),
    pricePerNight: extractPrice(normalized),
    minNights,
    ...extractDates(normalized),
  };
}

export function mergeParsedFields(
  explicit: Partial<ParsedDealFields>,
  parsed: ParsedDealFields,
): ParsedDealFields {
  return {
    discountPercent: explicit.discountPercent ?? parsed.discountPercent,
    discountValue: explicit.discountValue ?? parsed.discountValue,
    pricePerNight: explicit.pricePerNight ?? parsed.pricePerNight,
    minNights: explicit.minNights ?? parsed.minNights,
    validFrom: explicit.validFrom ?? parsed.validFrom,
    validTo: explicit.validTo ?? parsed.validTo,
  };
}
