import { NextRequest, NextResponse } from "next/server";
import { isHotelChainId } from "@/lib/chains";
import { filterAndSortDeals } from "@/lib/filter-deals";
import { israelToday } from "@/lib/format";
import { fetchAllDeals } from "@/lib/scrapers";
import type { AudienceTag, HotelChainId, SortKey } from "@/lib/types";

export const maxDuration = 60;

function parseSort(value: string | null): SortKey {
  if (value === "discount" || value === "price" || value === "hotel" || value === "expiration") return value;
  return "discount";
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

  try {
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
  } catch (error) {
    return NextResponse.json(
      {
        deals: [],
        source: "live" as const,
        fetchedAt: new Date().toISOString(),
        asOf: israelToday(),
        errors: [
          {
            chainId: "isrotel" as const,
            message: error instanceof Error ? error.message : "Failed to load deals",
          },
        ],
      },
      { status: 200 },
    );
  }
}
