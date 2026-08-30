const HEBREW_MONTHS = [
  "ינו׳",
  "פבר׳",
  "מרץ",
  "אפר׳",
  "מאי",
  "יוני",
  "יולי",
  "אוג׳",
  "ספט׳",
  "אוק׳",
  "נוב׳",
  "דצמ׳",
];

export function israelToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(now);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "לא צוין";
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "לא צוין";
  const day = Number(match[3]);
  const month = Number(match[2]);
  return `${day} ב${HEBREW_MONTHS[month - 1]} ${match[1]}`;
}

export function formatDateRange(from: string | null, to: string | null): string {
  if (!from && !to) return "תוקף לא צוין";
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`;
  return from ? `מ-${formatDate(from)}` : `עד ${formatDate(to)}`;
}

export function daysUntil(iso: string | null, asOf = israelToday()): number | null {
  if (!iso) return null;
  const start = Date.parse(`${asOf}T00:00:00+03:00`);
  const end = Date.parse(`${iso}T23:59:59+03:00`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

export function formatPricePerNight(amount: number | null): string {
  if (amount == null || !Number.isFinite(amount)) return "מחיר לא צוין";
  return `${amount.toLocaleString("he-IL")} ₪`;
}

export function formatMinNights(nights: number | null): string {
  if (!nights) return "ללא מינימום לילות";
  if (nights === 1) return "מינימום לילה אחד";
  return `מינימום ${nights} לילות`;
}

export function formatPublishedAgo(iso: string | undefined, now = Date.now()): string {
  if (!iso) return "עודכן לאחרונה";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "עודכן לאחרונה";
  const minutes = Math.max(0, Math.floor((now - then) / 60_000));
  if (minutes < 1) return "עודכן לפני פחות מדקה";
  if (minutes === 1) return "עודכן לפני דקה";
  if (minutes < 60) return `עודכן לפני ${minutes} דקות`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "עודכן לפני שעה";
  if (hours < 24) return `עודכן לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "עודכן לפני יום";
  return `עודכן לפני ${days} ימים`;
}

export function formatDateTime(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("day")}.${get("month")}, ${get("hour")}:${get("minute")}`;
}
