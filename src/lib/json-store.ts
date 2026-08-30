import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

function filePath(name: string): string {
  return path.join(DATA_DIR, name);
}

export function readJsonFile<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(filePath(name), "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJsonFile(name: string, value: unknown): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(filePath(name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
