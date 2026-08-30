import { ExternalLink } from "lucide-react";
import { formatDateRange, formatPricePerNight, formatPublishedAgo } from "@/lib/format";
import type { Deal } from "@/lib/types";
import { DealCtaLink } from "./DealCtaLink";
import { HotelPhoto } from "./HotelPhoto";

export function DealTable({ deals }: { deals: Deal[] }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-black/5 bg-white shadow-sm">
      <table className="min-w-full text-right text-sm">
        <thead className="bg-sand/80 text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">מלון</th>
            <th className="px-4 py-3 font-medium">הדיל</th>
            <th className="px-4 py-3 font-medium">הנחה</th>
            <th className="px-4 py-3 font-medium">מחיר ללילה</th>
            <th className="px-4 py-3 font-medium">תוקף</th>
            <th className="px-4 py-3 font-medium">הזמנה</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id} className="align-top border-t border-black/5">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <HotelPhoto
                    src={deal.imageUrl}
                    fallbackSrc={deal.cityImageUrl}
                    alt={deal.hotelName}
                    className="h-14 w-20 shrink-0 rounded-xl"
                    sizes="80px"
                  />
                  <div>
                    <p className="text-xs text-ink-soft">{deal.chainName}</p>
                    <p className="font-display font-semibold text-ink">{deal.hotelName}</p>
                    <p className="mt-1 text-[11px] text-ink-soft">{formatPublishedAgo(deal.firstSeenAt)}</p>
                  </div>
                </div>
              </td>
              <td className="max-w-sm px-4 py-4">
                <p className="font-medium text-ink">{deal.title}</p>
                <p className="mt-1 line-clamp-2 text-ink-soft">{deal.description}</p>
              </td>
              <td className="px-4 py-4 font-semibold text-ink">{deal.discountValue ?? "—"}</td>
              <td className="px-4 py-4 font-semibold tabular-nums text-sea">
                {deal.pricePerNight != null && deal.pricePerNight > 0
                  ? formatPricePerNight(deal.pricePerNight)
                  : "—"}
              </td>
              <td className="px-4 py-4 text-ink-soft">{formatDateRange(deal.validFrom, deal.validTo)}</td>
              <td className="px-4 py-4">
                <DealCtaLink
                  deal={deal}
                  className="inline-flex items-center gap-1 font-medium text-sea hover:underline"
                >
                  תפוס את הדיל
                  <ExternalLink className="h-3.5 w-3.5" />
                </DealCtaLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
