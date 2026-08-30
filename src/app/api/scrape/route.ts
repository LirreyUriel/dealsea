import { NextResponse } from "next/server";
import { fetchAllDeals } from "@/lib/scrapers";

export async function POST() {
  const payload = await fetchAllDeals();
  return NextResponse.json({
    ...payload,
    message: "סריקה חיה הושלמה.",
  });
}
