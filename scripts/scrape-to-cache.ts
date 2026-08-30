import { writeFileSync } from "node:fs";
import path from "node:path";
import { stampHotelImages } from "../src/lib/hotel-images";
import { fetchAllDeals } from "../src/lib/scrapers";

const outFile = path.resolve(process.cwd(), "deals-cache.json");

async function main(): Promise<void> {
  const payload = await fetchAllDeals(undefined, {
    bypassCache: true,
    forceLive: true,
    skipStamps: true,
  });
  const deals = await stampHotelImages(payload.deals, { wait: true });
  const withPhoto = deals.filter((deal) => deal.imageUrl).length;
  writeFileSync(outFile, `${JSON.stringify({ ...payload, deals })}\n`, "utf8");
  const byChain = deals.reduce<Record<string, number>>((acc, deal) => {
    acc[deal.chainId] = (acc[deal.chainId] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`Wrote ${deals.length} deals (${withPhoto} with hotel photos) to ${outFile}`);
  console.log(JSON.stringify(byChain, null, 2));
  if (payload.errors.length) {
    console.log("errors", payload.errors);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
