import { writeFileSync } from "node:fs";
import path from "node:path";
import { fetchAllDeals } from "../src/lib/scrapers";

const outFile = path.resolve(process.cwd(), "deals-cache.json");

async function main(): Promise<void> {
  const payload = await fetchAllDeals(undefined, {
    bypassCache: true,
    forceLive: true,
    skipStamps: true,
  });
  writeFileSync(outFile, `${JSON.stringify(payload)}\n`, "utf8");
  const byChain = payload.deals.reduce<Record<string, number>>((acc, deal) => {
    acc[deal.chainId] = (acc[deal.chainId] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`Wrote ${payload.deals.length} deals to ${outFile}`);
  console.log(JSON.stringify(byChain, null, 2));
  if (payload.errors.length) {
    console.log("errors", payload.errors);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
