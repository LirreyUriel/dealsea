import { NextRequest, NextResponse } from "next/server";
import { addSubscriber } from "@/lib/subscribers";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    userId?: string;
  } | null;
  const result = addSubscriber(body ?? {});
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }
  console.log("[club-subscribe]", result.entry.message, JSON.stringify(result.entry));
  return NextResponse.json({ ok: true });
}
