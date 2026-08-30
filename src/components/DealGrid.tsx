import type { Deal } from "@/lib/types";
import { DealCard, type CardTag } from "./DealCard";
import { SubscribeForm } from "./SubscribeForm";

export function DealGrid({
  deals,
  asOf,
  hiddenTags,
}: {
  deals: Deal[];
  asOf: string;
  hiddenTags?: CardTag[];
}) {
  const splitAt = Math.min(9, deals.length);
  const first = deals.slice(0, splitAt);
  const rest = deals.slice(splitAt);

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {first.map((deal) => (
        <DealCard key={deal.id} deal={deal} asOf={asOf} hiddenTags={hiddenTags} />
      ))}
      {deals.length > 0 && (
        <div className="md:col-span-2 xl:col-span-3">
          <SubscribeForm />
        </div>
      )}
      {rest.map((deal) => (
        <DealCard key={deal.id} deal={deal} asOf={asOf} hiddenTags={hiddenTags} />
      ))}
    </div>
  );
}
