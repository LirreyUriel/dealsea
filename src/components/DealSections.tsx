import type { Deal } from "@/lib/types";
import type { CardTag } from "./DealCard";
import { DealGrid } from "./DealGrid";
import { DealTable } from "./DealTable";
import { Pagination } from "./Pagination";
import { SubscribeForm } from "./SubscribeForm";

export const DEALS_PER_PAGE = 30;

interface DealSectionsProps {
  deals: Deal[];
  asOf: string;
  view: "grid" | "table";
  page: number;
  onPageChange: (page: number) => void;
  hiddenTags?: CardTag[];
}

export function DealSections({ deals, asOf, view, page, onPageChange, hiddenTags }: DealSectionsProps) {
  if (deals.length === 0) return null;
  const pageCount = Math.max(1, Math.ceil(deals.length / DEALS_PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const pageDeals = deals.slice((safePage - 1) * DEALS_PER_PAGE, safePage * DEALS_PER_PAGE);

  return (
    <section className="space-y-5">
      {view === "grid" ? (
        <DealGrid deals={pageDeals} asOf={asOf} hiddenTags={hiddenTags} />
      ) : (
        <>
          <DealTable deals={pageDeals} />
          <SubscribeForm />
        </>
      )}
      <Pagination page={safePage} pageCount={pageCount} onPageChange={onPageChange} />
    </section>
  );
}
