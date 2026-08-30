import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import axios from "axios";
import * as cheerio from "cheerio";
import { hotelImageKey, officialHotelPageUrls } from "./hotel-pages";
import { readJsonFile, writeJsonFile } from "./json-store";
import type { Deal } from "./types";

const MANIFEST = "hotel-images.json";
const PUBLIC_DIR = path.join(process.cwd(), "public", "hotels");
const MAX_FETCH_PER_RUN = 40;
const CONCURRENCY = 4;
const PAGE_TIMEOUT_MS = 8000;
const IMAGE_TIMEOUT_MS = 8000;
const MIN_BYTES = 16_000;
const MAX_BYTES = 4_000_000;
const MISS_TTL_MS = 24 * 60 * 60 * 1000;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,image/avif,image/webp,image/*;q=0.8,*/*;q=0.5",
  "Accept-Language": "he-IL,he;q=0.9,en;q=0.6",
};

interface ManifestEntry {
  path: string | null;
  sourceUrl?: string;
  fetchedAt: string;
}

type Manifest = Record<string, ManifestEntry>;

function publicUrl(fileName: string): string {
  return `/hotels/${fileName}`;
}

function fileOnDisk(fileName: string): string {
  return path.join(PUBLIC_DIR, fileName);
}

function hasUsableImage(entry: ManifestEntry | undefined): entry is ManifestEntry & { path: string } {
  if (!entry?.path) return false;
  const name = entry.path.replace(/^\/hotels\//, "");
  return existsSync(fileOnDisk(name));
}

function recentMiss(entry: ManifestEntry | undefined): boolean {
  if (!entry || entry.path) return false;
  const then = Date.parse(entry.fetchedAt);
  return !Number.isNaN(then) && Date.now() - then < MISS_TTL_MS;
}

function fileBase(key: string): string {
  const chain = key.split(":")[0] ?? "hotel";
  const hash = createHash("sha1").update(key).digest("hex").slice(0, 16);
  return `${chain}-${hash}`;
}

function extensionFor(contentType: string, sourceUrl: string): string {
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("avif")) return "avif";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  const fromUrl = sourceUrl.match(/\.(jpe?g|png|webp|avif)(?:$|\?)/i)?.[1]?.toLowerCase();
  if (fromUrl === "jpeg") return "jpg";
  return fromUrl ?? "jpg";
}

function resolveCandidate(raw: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const push = (value: string) => {
    try {
      urls.push(new URL(value, baseUrl).toString());
    } catch {
      // ignore
    }
  };
  push(raw);
  if (!/^https?:\/\//i.test(raw)) {
    try {
      push(new URL(raw, new URL(baseUrl).origin).toString());
    } catch {
      // ignore
    }
  }
  const isrotelMedia = raw.match(/(\d+)\/([^/?]+\.(?:jpe?g|png|webp))/i);
  if (isrotelMedia) {
    urls.push(`https://media.isrotel.co.il/umb/${isrotelMedia[1]}/${isrotelMedia[2]}`);
  }
  return urls;
}

function extractPageImages(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const found: string[] = [];
  const consider = (raw: string | undefined, requirePhotoHint = false) => {
    if (!raw || raw.startsWith("data:")) return;
    if (/logo|icon|sprite|pixel|1x1|\.svg|\.gif/i.test(raw)) return;
    if (
      requirePhotoHint &&
      !/\.(jpe?g|png|webp|avif)(?:$|\?)/i.test(raw) &&
      !/media\.isrotel|cdn\.speedsize|\/sites\/default\/files|octopus\/Upload|fattal\.co\.il|assets\./i.test(raw)
    ) {
      return;
    }
    found.push(...resolveCandidate(raw, baseUrl));
  };

  consider($('meta[property="og:image"]').attr("content"));
  consider($('meta[property="og:image:url"]').attr("content"));
  consider($('meta[name="twitter:image"]').attr("content"));
  consider($('link[rel="image_src"]').attr("href"));

  $("img[src]").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    const width = Number($(el).attr("width") || 0);
    if (width && width < 400) return;
    consider(src, true);
  });

  return [...new Set(found)];
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await axios.get<string>(url, {
      timeout: PAGE_TIMEOUT_MS,
      headers: BROWSER_HEADERS,
      maxRedirects: 3,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    if (typeof response.data !== "string") return null;
    return response.data;
  } catch {
    return null;
  }
}

async function downloadImage(sourceUrl: string, key: string): Promise<string | null> {
  try {
    const response = await axios.get<ArrayBuffer>(sourceUrl, {
      timeout: IMAGE_TIMEOUT_MS,
      responseType: "arraybuffer",
      headers: { ...BROWSER_HEADERS, Accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
      maxRedirects: 3,
      maxContentLength: MAX_BYTES,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    const bytes = Buffer.from(response.data);
    if (bytes.length < MIN_BYTES || bytes.length > MAX_BYTES) return null;
    const contentType = String(response.headers["content-type"] ?? "");
    if (contentType && !contentType.startsWith("image/")) return null;
    const ext = extensionFor(contentType, sourceUrl);
    const fileName = `${fileBase(key)}.${ext}`;
    mkdirSync(PUBLIC_DIR, { recursive: true });
    writeFileSync(fileOnDisk(fileName), bytes);
    return publicUrl(fileName);
  } catch {
    return null;
  }
}

async function resolveHotelImage(chainId: Deal["chainId"], hotelName: string, bookingUrl: string): Promise<ManifestEntry> {
  const now = new Date().toISOString();
  const pages = officialHotelPageUrls(chainId, hotelName, bookingUrl);
  const key = hotelImageKey(chainId, hotelName);
  for (const pageUrl of pages) {
    const html = await fetchHtml(pageUrl);
    if (!html) continue;
    for (const imageUrl of extractPageImages(html, pageUrl).slice(0, 5)) {
      const stored = await downloadImage(imageUrl, key);
      if (stored) return { path: stored, sourceUrl: imageUrl, fetchedAt: now };
    }
  }
  return { path: null, fetchedAt: now };
}

async function mapLimit<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (queue.length) {
        const item = queue.shift();
        if (item !== undefined) await worker(item);
      }
    }),
  );
}

let fillInFlight: Promise<void> | null = null;

function attachCachedImages(deals: Deal[], manifest: Manifest): Deal[] {
  return deals.map((deal) => {
    const entry = manifest[hotelImageKey(deal.chainId, deal.hotelName)];
    return { ...deal, imageUrl: hasUsableImage(entry) ? entry.path : null };
  });
}

function queueBackgroundFill(deals: Deal[], manifest: Manifest): void {
  if (fillInFlight) return;

  const unique = new Map<string, { deal: Deal; count: number }>();
  for (const deal of deals) {
    const key = hotelImageKey(deal.chainId, deal.hotelName);
    const existing = unique.get(key);
    if (existing) existing.count += 1;
    else unique.set(key, { deal, count: 1 });
  }

  const missing = [...unique.entries()]
    .filter(([key]) => {
      const entry = manifest[key];
      return !hasUsableImage(entry) && !recentMiss(entry);
    })
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, MAX_FETCH_PER_RUN);

  if (missing.length === 0) return;

  fillInFlight = mapLimit(missing, CONCURRENCY, async ([key, { deal }]) => {
    const next = readJsonFile<Manifest>(MANIFEST, manifest);
    if (hasUsableImage(next[key]) || recentMiss(next[key])) return;
    next[key] = await resolveHotelImage(deal.chainId, deal.hotelName, deal.bookingUrl);
    writeJsonFile(MANIFEST, next);
  }).finally(() => {
    fillInFlight = null;
  });
}

export async function stampHotelImages(deals: Deal[]): Promise<Deal[]> {
  const manifest = readJsonFile<Manifest>(MANIFEST, {});
  const attached = attachCachedImages(deals, manifest);
  queueBackgroundFill(deals, manifest);
  return attached;
}
