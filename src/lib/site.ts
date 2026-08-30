export const SITE_NAME = "DealSea";
export const SITE_NAME_HE = "דילסי";
export const SITE_DESCRIPTION =
  "דילסי סורק בזמן אמת מבצעי מלונות בישראל — ישרוטל, פתאל, בראון, אטלס, דן, אפריקה ישראל והרברט סמואל. רק הדילים הכי זולים, ישירות מהאתרים הרשמיים.";
export const HERO_H1 = "דילסי סורק בשבילכם את הרשת בזמן אמת";
export const HERO_SUBTITLE =
  "תופסים חופשה בלי להתאמץ – רק הדילים הכי זולים, ישירות מהאתרים הרשמיים";

function resolvedSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel =
    process.env.VERCEL_ENV === "production" ? process.env.VERCEL_PROJECT_PRODUCTION_URL : undefined;
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolvedSiteUrl();

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
