import type { Browser } from "playwright";

type PlaywrightModule = typeof import("playwright");

export async function loadPlaywright(): Promise<PlaywrightModule> {
  try {
    return await import("playwright");
  } catch {
    throw new Error("Playwright is not installed. Run `npm i playwright` and `npx playwright install chromium`.");
  }
}

export async function launchBrowser(playwright: PlaywrightModule): Promise<Browser> {
  const args = ["--disable-dev-shm-usage", "--no-sandbox"];
  try {
    return await playwright.chromium.launch({
      headless: true,
      channel: "chrome",
      args,
    });
  } catch {
    return await playwright.chromium.launch({
      headless: true,
      args,
    });
  }
}
