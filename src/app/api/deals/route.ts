import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;
import { isHotelChainId } from "@/lib/chains";
import { filterAndSortDeals } from "@/lib/filter-deals";
import { fetchAllDeals } from "@/lib/scrapers";
import type { AudienceTag, HotelChainId, SortKey } from "@/lib/types";

function parseSort(value: string | null): SortKey {
  if (value === "discount" || value === "price" || value === "hotel" || value === "expiration") return value;
  return "expiration";
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const chains = (params.get("chains") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(isHotelChainId) as HotelChainId[];
  const query = params.get("q") ?? "";
  const sort = parseSort(params.get("sort"));
  const cities = (params.get("cities") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const weekendOnly = params.get("weekend") === "1";
  const audiences = (params.get("audience") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is AudienceTag => value === "idf" || value === "club");

  const payload = await fetchAllDeals(chains.length ? chains : undefined, {
    bypassCache: params.get("refresh") === "1",
  });
  const deals = filterAndSortDeals(payload.deals, {
    chains,
    cities,
    weekendOnly,
    audiences,
    query,
    sort,
  });

  return NextResponse.json({ ...payload, deals });
}
