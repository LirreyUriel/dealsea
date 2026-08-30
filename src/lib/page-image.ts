import * as cheerio from "cheerio";

function toAbsolute(raw: string, baseUrl: string): string | null {
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return null;
  }
}

export function extractOgImage(html: string, baseUrl: string): string | null {
  const $ = cheerio.load(html);
  const candidates = [
    $('meta[property="og:image"]').attr("content"),
    $('meta[property="og:image:url"]').attr("content"),
    $('meta[name="twitter:image"]').attr("content"),
    $('link[rel="image_src"]').attr("href"),
  ];

  for (const raw of candidates) {
    if (!raw || raw.startsWith("data:")) continue;
    if (/logo|icon|sprite|pixel|1x1|\.svg|\.gif/i.test(raw)) continue;
    const url = toAbsolute(raw, baseUrl);
    if (url && /^https?:\/\//i.test(url)) return url;
  }
  return null;
}

export function firstCardImageUrl(
  raw: string | null | undefined,
  baseUrl?: string,
): string | null {
  if (!raw || raw.startsWith("data:")) return null;
  if (/logo|icon|sprite|pixel|1x1|\.svg|\.gif/i.test(raw)) return null;
  if (baseUrl) return toAbsolute(raw, baseUrl);
  return /^https?:\/\//i.test(raw) ? raw : null;
}
