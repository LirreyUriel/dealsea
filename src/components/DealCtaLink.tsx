"use client";

import { track } from "@vercel/analytics";
import type { ReactNode } from "react";
import { dealBookingUrl } from "@/lib/booking-url";
import type { Deal } from "@/lib/types";
import { getOrCreateUserId } from "@/lib/user-id";

function logDealClick(deal: Deal, bookingUrl: string) {
  const userId = getOrCreateUserId();
  if (!userId) return;

  const body = JSON.stringify({
    userId,
    dealId: deal.id,
    hotelName: deal.hotelName,
    chainId: deal.chainId,
    chainName: deal.chainName,
    bookingUrl,
    message: `תפוס את הדיל: ${deal.hotelName}`,
  });

  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon("/api/deal-click", new Blob([body], { type: "application/json" }));
      if (sent) return;
    }
  } catch {
    // fall through to fetch
  }

  void fetch("/api/deal-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function DealCtaLink({
  deal,
  className,
  children,
}: {
  deal: Deal;
  className?: string;
  children: ReactNode;
}) {
  const href = dealBookingUrl(deal);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={() => {
        // grab_deal: click on תפוס את הדיל booking CTA
        track("grab_deal", {
          dealId: deal.id,
          chain: deal.chainId,
          hotelName: deal.hotelName,
        });
        logDealClick(deal, href);
      }}
    >
      {children}
    </a>
  );
}
