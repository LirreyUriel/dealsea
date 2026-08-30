import { CalendarRange, ExternalLink, MoonStar } from "lucide-react";
import { isClubDeal, isIdfDeal, isWeekendHighlight } from "@/lib/deal-tags";
import { daysUntil, formatDateRange, formatMinNights, formatPricePerNight, formatPublishedAgo } from "@/lib/format";
import type { Deal } from "@/lib/types";
import { DealCtaLink } from "./DealCtaLink";
import { HotelPhoto } from "./HotelPhoto";

export type CardTag = "idf" | "club" | "weekend";

interface DealCardProps {
  deal: Deal;
  asOf: string;
  hiddenTags?: CardTag[];
}

function visibleTag(deal: Deal, hidden: CardTag[]): CardTag | null {
  const candidates: { id: CardTag; match: boolean }[] = [
    { id: "idf", match: isIdfDeal(deal) },
    { id: "club", match: isClubDeal(deal) },
    { id: "weekend", match: isWeekendHighlight(deal) },
  ];
  return candidates.find((item) => item.match && !hidden.includes(item.id))?.id ?? null;
}

const TAG_LABEL: Record<CardTag, string> = {
  idf: "מילואים",
  club: "מועדון",
  weekend: "סוף שבוע",
};

export function DealCard({ deal, asOf, hiddenTags = [] }: DealCardProps) {
  const remaining = daysUntil(deal.validTo, asOf);
  const expiringSoon = remaining !== null && remaining <= 14;
  const tag = visibleTag(deal, hiddenTags);
  const meta = [deal.chainName, deal.location].filter(Boolean).join(" · ");
  const showPrice = deal.pricePerNight != null && deal.pricePerNight > 0;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm content-visibility-auto transition hover:-translate-y-0.5 hover:shadow-md">
      <HotelPhoto
        src={deal.imageUrl}
        fallbackSrc={deal.cityImageUrl}
        alt={deal.hotelName}
        className="aspect-[3/2] w-full"
      />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-semibold leading-snug text-ink">{deal.hotelName}</h3>
            <p className="mt-1 text-xs font-medium tracking-wide text-sea">{meta}</p>
            <p className="mt-2 line-clamp-2 text-sm font-medium text-ink">{deal.title}</p>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-soft">{deal.description}</p>
          </div>
          <div className="shrink-0 text-left">
            {showPrice && (
              <p className="font-display text-xl font-semibold tabular-nums text-sea">
                {formatPricePerNight(deal.pricePerNight)}
              </p>
            )}
            {showPrice && <p className="text-[11px] text-ink-soft">לזוג ללילה</p>}
            {deal.discountValue && (
              <p className={`text-sm font-semibold text-ink ${showPrice ? "mt-1" : "font-display text-lg"}`}>
                {deal.discountValue}
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          <span className="rounded-full bg-sand px-2 py-0.5">{formatPublishedAgo(deal.firstSeenAt)}</span>
          {tag && <span className="rounded-full bg-sea/10 px-2 py-0.5 font-medium text-sea">{TAG_LABEL[tag]}</span>}
        </div>

        <div className="space-y-1.5 text-sm text-ink-soft">
          <p className="flex items-center gap-2">
            <MoonStar className="h-4 w-4 text-sea" />
            {formatMinNights(deal.minNights)}
          </p>
          <p className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-sea" />
            {formatDateRange(deal.validFrom, deal.validTo)}
          </p>
          {expiringSoon && remaining !== null && remaining >= 0 && (
            <p className="text-xs text-alert">פג תוקף בעוד {remaining} ימים</p>
          )}
        </div>

        <DealCtaLink
          deal={deal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sea px-4 py-3 text-sm font-semibold text-white transition hover:bg-sea-dark"
        >
          תפוס את הדיל
          <ExternalLink className="h-4 w-4" />
        </DealCtaLink>
      </div>
    </article>
  );
}
