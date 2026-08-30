import type { Browser } from "playwright";

type PlaywrightModule = typeof import("playwright");

export function playwrightSupported(): boolean {
  return !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME;
}

export async function loadPlaywright(): Promise<PlaywrightModule> {
  if (!playwrightSupported()) {
    throw new Error("Playwright is not available on this host.");
  }
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
