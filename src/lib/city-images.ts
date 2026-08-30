import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import axios from "axios";
import { dealCity, uniqueCities } from "./deal-tags";
import { readJsonFile, writeJsonFile } from "./json-store";
import type { Deal } from "./types";

const MANIFEST = "city-images.json";
const PUBLIC_DIR = path.join(process.cwd(), "public", "cities");
const CONCURRENCY = 2;
const IMAGE_TIMEOUT_MS = 12_000;
const MIN_BYTES = 20_000;
const MAX_BYTES = 5_000_000;
const MISS_TTL_MS = 24 * 60 * 60 * 1000;

const BROWSER_HEADERS = {
  "User-Agent": "DealSeaCityBot/0.1 (hotel-deal aggregator; city fallback photos)",
  Accept: "application/json,image/avif,image/webp,image/*;q=0.8,*/*;q=0.5",
};

function unsplash(id: string): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;
}

const CITY_SOURCES: Record<string, string> = {
  אילת: unsplash("photo-1507525428034-b723cf961d3e"),
  "ים המלח": unsplash("photo-1624396526562-ed82e0d161b4"),
  "תל אביב": unsplash("photo-1646226303063-1e5334284894"),
  ירושלים: unsplash("photo-1552423314-cf29ab68ad73"),
  הרצליה: unsplash("photo-1646226303063-1e5334284894"),
  חיפה: unsplash("photo-1506905925346-21bda4d32df4"),
  קיסריה: unsplash("photo-1515542622106-78bda8ba0e5b"),
  טבריה: unsplash("photo-1469854523086-cc02fe5d8800"),
  כנרת: unsplash("photo-1469854523086-cc02fe5d8800"),
  נתניה: unsplash("photo-1507525428034-b723cf961d3e"),
  אשדוד: unsplash("photo-1507525428034-b723cf961d3e"),
  נצרת: unsplash("photo-1552423314-cf29ab68ad73"),
  צפת: unsplash("photo-1552423314-cf29ab68ad73"),
  "מצפה רמון": unsplash("photo-1596422846543-75c6fc197f07"),
  הנגב: unsplash("photo-1596422846543-75c6fc197f07"),
  "נתב״ג": unsplash("photo-1646226303063-1e5334284894"),
  צפון: unsplash("photo-1506905925346-21bda4d32df4"),
};

const DEFAULT_CITY_PHOTO = unsplash("photo-1646226303063-1e5334284894");

interface ManifestEntry {
  path: string | null;
  sourceUrl?: string;
  fetchedAt: string;
}

type Manifest = Record<string, ManifestEntry>;

function slugFor(city: string): string {
  const named: Record<string, string> = {
    אילת: "eilat",
    "ים המלח": "dead-sea",
    "תל אביב": "tel-aviv",
    ירושלים: "jerusalem",
    הרצליה: "herzliya",
    חיפה: "haifa",
    קיסריה: "caesarea",
    טבריה: "tiberias",
    כנרת: "kinneret",
    נתניה: "netanya",
    אשדוד: "ashdod",
    נצרת: "nazareth",
    צפת: "safed",
    "מצפה רמון": "mitzpe-ramon",
    הנגב: "negev",
    "נתב״ג": "israel-coast",
    צפון: "galilee",
  };
  return named[city] ?? `city-${createHash("sha1").update(city).digest("hex").slice(0, 10)}`;
}

function publicUrl(fileName: string): string {
  return `/cities/${fileName}`;
}

function fileOnDisk(fileName: string): string {
  return path.join(PUBLIC_DIR, fileName);
}

function hasUsableImage(entry: ManifestEntry | undefined): entry is ManifestEntry & { path: string } {
  if (!entry?.path) return false;
  const name = entry.path.replace(/^\/cities\//, "");
  return existsSync(fileOnDisk(name));
}

function recentMiss(entry: ManifestEntry | undefined): boolean {
  if (!entry || entry.path) return false;
  const then = Date.parse(entry.fetchedAt);
  return !Number.isNaN(then) && Date.now() - then < MISS_TTL_MS;
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

async function downloadImage(sourceUrl: string, city: string): Promise<string | null> {
  const response = await axios.get<ArrayBuffer>(sourceUrl, {
    responseType: "arraybuffer",
    timeout: IMAGE_TIMEOUT_MS,
    maxContentLength: MAX_BYTES,
    headers: { ...BROWSER_HEADERS, Accept: "image/avif,image/webp,image/*;q=0.8,*/*;q=0.5" },
    validateStatus: (status) => status >= 200 && status < 400,
  });
  const bytes = Buffer.from(response.data);
  if (bytes.length < MIN_BYTES) return null;
  const type = String(response.headers["content-type"] ?? "");
  if (type.includes("svg") || type.includes("html")) return null;
  mkdirSync(PUBLIC_DIR, { recursive: true });
  const fileName = `${slugFor(city)}.${extensionFor(type, sourceUrl)}`;
  writeFileSync(fileOnDisk(fileName), bytes);
  return publicUrl(fileName);
}

async function resolveCityImage(city: string): Promise<ManifestEntry> {
  const now = new Date().toISOString();
  const imageUrl = CITY_SOURCES[city] ?? DEFAULT_CITY_PHOTO;
  try {
    const stored = await downloadImage(imageUrl, city);
    if (stored) return { path: stored, sourceUrl: imageUrl, fetchedAt: now };
  } catch {
    // miss
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

function attachCachedCityImages(deals: Deal[], manifest: Manifest): Deal[] {
  return deals.map((deal) => {
    const city = dealCity(deal);
    const entry = city ? manifest[city] : undefined;
    return { ...deal, cityImageUrl: hasUsableImage(entry) ? entry.path : null };
  });
}

function queueBackgroundFill(cities: string[], manifest: Manifest): void {
  if (fillInFlight) return;
  const missing = cities.filter((city) => !hasUsableImage(manifest[city]) && !recentMiss(manifest[city]));
  if (missing.length === 0) return;

  fillInFlight = mapLimit(missing, CONCURRENCY, async (city) => {
    const next = readJsonFile<Manifest>(MANIFEST, manifest);
    if (hasUsableImage(next[city]) || recentMiss(next[city])) return;
    next[city] = await resolveCityImage(city);
    writeJsonFile(MANIFEST, next);
  }).finally(() => {
    fillInFlight = null;
  });
}

export async function stampCityImages(deals: Deal[]): Promise<Deal[]> {
  const manifest = readJsonFile<Manifest>(MANIFEST, {});
  const cities = uniqueCities(deals);
  const attached = attachCachedCityImages(deals, manifest);
  queueBackgroundFill(cities, manifest);
  return attached;
}

export async function prefetchKnownCityImages(): Promise<void> {
  await prefetchCityImages(Object.keys(CITY_SOURCES));
}

export async function prefetchCityImages(cities: string[]): Promise<void> {
  const manifest = readJsonFile<Manifest>(MANIFEST, {});
  await mapLimit(
    cities.filter((city) => !hasUsableImage(manifest[city])),
    CONCURRENCY,
    async (city) => {
      const next = readJsonFile<Manifest>(MANIFEST, manifest);
      if (hasUsableImage(next[city])) return;
      next[city] = await resolveCityImage(city);
      writeJsonFile(MANIFEST, next);
    },
  );
}
