import axios from "axios";
import { HOTEL_PHOTO_PAGES } from "../src/lib/hotel-photo-fallbacks";
import { extractOgImage } from "../src/lib/page-image";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "he-IL,he;q=0.9,en;q=0.6",
};

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await axios.get<string>(url, {
      timeout: 15000,
      headers: HEADERS,
      maxRedirects: 3,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    return typeof response.data === "string" ? response.data : null;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const found: { chainId: string; name: string; imageUrl: string }[] = [];
  const missing: { chainId: string; name: string; pageUrl: string }[] = [];

  for (const page of HOTEL_PHOTO_PAGES) {
    const html = await fetchHtml(page.pageUrl);
    const imageUrl = html ? extractOgImage(html, page.pageUrl) : null;
    if (imageUrl) found.push({ chainId: page.chainId, name: page.name, imageUrl });
    else missing.push({ chainId: page.chainId, name: page.name, pageUrl: page.pageUrl });
    console.log(`${imageUrl ? "OK" : "MISS"} ${page.chainId} ${page.name} ${imageUrl ?? page.pageUrl}`);
  }

  console.log("\nFOUND", JSON.stringify(found, null, 2));
  console.log("\nMISSING", JSON.stringify(missing, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
