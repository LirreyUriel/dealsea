import { NextRequest, NextResponse } from "next/server";
import { addDealClick } from "@/lib/deal-clicks";

export async function POST(request: NextRequest) {
  const raw = await request.text().catch(() => "");
  let body: {
    userId?: string;
    dealId?: string;
    hotelName?: string;
    chainId?: string;
    chainName?: string;
    bookingUrl?: string;
    discountPercent?: number | null;
    idfFilterOn?: boolean;
    weekendFilterOn?: boolean;
    clubFilterOn?: boolean;
    message?: string;
  } | null = null;
  try {
    body = raw ? (JSON.parse(raw) as typeof body) : null;
  } catch {
    return NextResponse.json({ ok: false, message: "גוף הבקשה אינו תקין." }, { status: 400 });
  }

  const result = addDealClick(body ?? {});
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }
  console.log("[deal-click]", result.entry.message, JSON.stringify(result.entry));
  return NextResponse.json({ ok: true });
}
