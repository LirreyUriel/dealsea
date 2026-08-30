"use client";

import { track } from "@vercel/analytics";
import { createContext, useContext, type ReactNode } from "react";
import { dealBookingUrl } from "@/lib/booking-url";
import type { Deal } from "@/lib/types";
import { getOrCreateUserId } from "@/lib/user-id";

export interface DealClickFilters {
  idfFilterOn: boolean;
  weekendFilterOn: boolean;
  clubFilterOn: boolean;
}

const DEFAULT_FILTERS: DealClickFilters = {
  idfFilterOn: false,
  weekendFilterOn: false,
  clubFilterOn: false,
};

const DealClickFiltersContext = createContext<DealClickFilters>(DEFAULT_FILTERS);

export function DealClickFiltersProvider({
  value,
  children,
}: {
  value: DealClickFilters;
  children: ReactNode;
}) {
  return <DealClickFiltersContext.Provider value={value}>{children}</DealClickFiltersContext.Provider>;
}

function logDealClick(deal: Deal, bookingUrl: string, filters: DealClickFilters) {
  const userId = getOrCreateUserId();
  if (!userId) return;

  const body = JSON.stringify({
    userId,
    dealId: deal.id,
    hotelName: deal.hotelName,
    chainId: deal.chainId,
    chainName: deal.chainName,
    bookingUrl,
    discountPercent: deal.discountPercent,
    idfFilterOn: filters.idfFilterOn,
    weekendFilterOn: filters.weekendFilterOn,
    clubFilterOn: filters.clubFilterOn,
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
  const filters = useContext(DealClickFiltersContext);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={() => {
        const userId = getOrCreateUserId();
        track("grab_deal", {
          dealId: deal.id,
          chain: deal.chainId,
          hotelName: deal.hotelName,
          userId,
          discountPercent: deal.discountPercent,
          idfFilterOn: filters.idfFilterOn,
          weekendFilterOn: filters.weekendFilterOn,
          clubFilterOn: filters.clubFilterOn,
        });
        logDealClick(deal, href, filters);
      }}
    >
      {children}
    </a>
  );
}
