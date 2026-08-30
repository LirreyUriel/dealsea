import type { Deal } from "./types";

const HE_NIGHT: Record<string, number> = {
  ראשון: 1,
  שני: 2,
  שלישי: 3,
  רביעי: 4,
  חמישי: 5,
};

const HE_ORDINAL = "ראשון|שני(?:יה)?|שלישי(?:ת)?|רביעי(?:ת)?|חמישי(?:ת)?";
const EN_ORDINALS: [RegExp, string, number][] = [
  [/(?:1st|first)/i, "ראשון", 1],
  [/(?:2nd|second)/i, "שני", 2],
  [/(?:3rd|third)/i, "שלישי", 3],
  [/(?:4th|fourth)/i, "רביעי", 4],
  [/(?:5th|fifth)/i, "חמישי", 5],
];

function heNightIndex(raw: string): { label: string; index: number } | null {
  const label = raw.replace(/יה$|ת$/, "");
  const index = HE_NIGHT[label];
  return index ? { label, index } : null;
}

/** One discounted night averaged over the stay needed to use it. 50% off night 2 → 25. */
export function stayDiscountPercent(nightIndex: number, nightOffPercent: number, minNights?: number | null): number {
  const nights = Math.max(nightIndex, minNights && minNights > 0 ? minNights : nightIndex);
  return Math.round((nightOffPercent / nights) * 100) / 100;
}

function nightDeal(
  nightIndex: number,
  nightOffPercent: number,
  label: string,
  minNights?: number | null,
): { discountPercent: number; discountValue: string } {
  return {
    discountPercent: stayDiscountPercent(nightIndex, nightOffPercent, minNights),
    discountValue: nightOffPercent >= 100 ? `לילה ${label} מתנה` : `לילה ${label} ב-${nightOffPercent}%`,
  };
}

export function parseNightSpecificDiscount(
  text: string,
  minNights?: number | null,
): { discountPercent: number; discountValue: string } | null {
  const labeled = text.match(/לילה\s+(ראשון|שני|שלישי|רביעי|חמישי)\s+ב-(\d{1,2})%/);
  if (labeled) {
    const night = heNightIndex(labeled[1]);
    if (night) return nightDeal(night.index, Number(labeled[2]), night.label, minNights);
  }

  const labeledFree = text.match(/לילה\s+(ראשון|שני|שלישי|רביעי|חמישי)\s+(?:מתנה|חינם)/);
  if (labeledFree) {
    const night = heNightIndex(labeledFree[1]);
    if (night) return nightDeal(night.index, 100, night.label, minNights);
  }

  const hebrew = text.match(
    new RegExp(
      `(?:ה)?ליל(?:ה|ות)\\s+(?:ה)?(${HE_ORDINAL})\\s+(?:ב-?\\s*)?(?:הנחה\\s+(?:של\\s+)?)?(?:של\\s+)?(\\d{1,2})\\s*%`,
    ),
  );
  if (hebrew) {
    const night = heNightIndex(hebrew[1]);
    if (night) return nightDeal(night.index, Number(hebrew[2]), night.label, minNights);
  }

  const hebrewReverse = text.match(
    new RegExp(
      `(\\d{1,2})\\s*%\\s*(?:הנחה\\s+)?(?:על\\s+|ב|ל)?(?:ה)?ליל(?:ה|ות)\\s+(?:ה)?(${HE_ORDINAL})`,
    ),
  );
  if (hebrewReverse) {
    const night = heNightIndex(hebrewReverse[2]);
    if (night) return nightDeal(night.index, Number(hebrewReverse[1]), night.label, minNights);
  }

  const hebrewHalf = text.match(
    new RegExp(`(?:ה)?ליל(?:ה|ות)\\s+(?:ה)?(${HE_ORDINAL})\\s+(?:ב-?\\s*)?חצי(?:\\s+מחיר)?`),
  );
  if (hebrewHalf) {
    const night = heNightIndex(hebrewHalf[1]);
    if (night) return nightDeal(night.index, 50, night.label, minNights);
  }

  const hebrewFree = text.match(
    new RegExp(`(?:ה)?ליל(?:ה|ות)\\s+(?:ה)?(${HE_ORDINAL})\\s+(?:חינם|מתנה|במתנה)`),
  );
  if (hebrewFree) {
    const night = heNightIndex(hebrewFree[1]);
    if (night) return nightDeal(night.index, 100, night.label, minNights);
  }

  const hebrewFreeReverse = text.match(
    new RegExp(`(?:חינם|מתנה)\\s+(?:ב|על\\s+)?(?:ה)?ליל(?:ה|ות)\\s+(?:ה)?(${HE_ORDINAL})`),
  );
  if (hebrewFreeReverse) {
    const night = heNightIndex(hebrewFreeReverse[1]);
    if (night) return nightDeal(night.index, 100, night.label, minNights);
  }

  for (const [pattern, label, index] of EN_ORDINALS) {
    const english = text.match(
      new RegExp(`(?:${pattern.source})\\s+night(?:\\s+(?:at|for|free))?\\s+(\\d{1,2})\\s*%`, "i"),
    );
    if (english) return nightDeal(index, Number(english[1]), label, minNights);

    const englishReverse = text.match(
      new RegExp(`(\\d{1,2})\\s*%\\s*(?:off\\s+)?(?:on\\s+|the\\s+)?(?:${pattern.source})\\s+night`, "i"),
    );
    if (englishReverse) return nightDeal(index, Number(englishReverse[1]), label, minNights);

    if (new RegExp(`(?:${pattern.source})\\s+night\\s+free|(?:free|complimentary)\\s+(?:the\\s+)?(?:${pattern.source})\\s+night`, "i").test(text)) {
      return nightDeal(index, 100, label, minNights);
    }
  }

  if (/לילה\s+רביעי\s+מתנה|fourth night(?:\s+free)?/i.test(text)) {
    return nightDeal(4, 100, "רביעי", minNights);
  }

  return null;
}

export function effectiveDiscountPercent(deal: Deal): number {
  const fromLabel = parseNightSpecificDiscount(
    [deal.discountValue, deal.title, deal.description].filter(Boolean).join(" "),
    deal.minNights,
  );
  if (fromLabel) return fromLabel.discountPercent;
  return deal.discountPercent ?? -1;
}
