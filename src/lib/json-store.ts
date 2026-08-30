import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function dataDirs(): string[] {
  const local = path.join(process.cwd(), "data");
  if (process.env.VERCEL) return [path.join("/tmp", "dealsea-data"), local];
  return [local];
}

export function readJsonFile<T>(name: string, fallback: T): T {
  for (const dir of dataDirs()) {
    try {
      return JSON.parse(readFileSync(path.join(dir, name), "utf8")) as T;
    } catch {
      // try the next location
    }
  }
  return fallback;
}

export function writeJsonFile(name: string, value: unknown): void {
  const dir = dataDirs()[0];
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
  } catch {
    // Vercel and other read-only hosts must not fail the request on cache writes.
  }
}
