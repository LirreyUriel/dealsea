import { readJsonFile, writeJsonFile } from "./json-store";
import type { Deal } from "./types";

const FILE = "first-seen.json";

export function stampFirstSeen(deals: Deal[]): Deal[] {
  const map = readJsonFile<Record<string, string>>(FILE, {});
  const now = new Date().toISOString();
  let changed = false;

  const stamped = deals.map((deal) => {
    const existing = map[deal.id] ?? deal.firstSeenAt;
    if (!map[deal.id]) {
      map[deal.id] = existing || now;
      changed = true;
    }
    return { ...deal, firstSeenAt: map[deal.id] };
  });

  if (changed) writeJsonFile(FILE, map);
  return stamped;
}
