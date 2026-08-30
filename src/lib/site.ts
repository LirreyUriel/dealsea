export const SITE_NAME = "DealSea";
export const SITE_NAME_HE = "דילסי";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const HERO_H1 = "דילסי סורק בשבילכם את הרשת בזמן אמת";
export const HERO_SUBTITLE =
  "תופסים חופשה בלי להתאמץ – רק הדילים הכי זולים, ישירות מהאתרים הרשמיים";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
