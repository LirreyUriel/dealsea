"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { uniqueCities } from "@/lib/deal-tags";
import { filterAndSortDeals } from "@/lib/filter-deals";
import { HERO_H1, SITE_URL } from "@/lib/site";
import type { AudienceTag, Deal, DealFilters, DealsResponse, HotelChainId, SortKey } from "@/lib/types";
import type { CardTag } from "./DealCard";
import { DealClickFiltersProvider } from "./DealCtaLink";
import { DealJsonLd } from "./DealJsonLd";
import { DealSections } from "./DealSections";
import { EmptyState } from "./EmptyState";
import { FilterBar } from "./FilterBar";
import { Header } from "./Header";
import { HeroHeading } from "./HeroHeading";

interface DashboardProps {
  initialData?: DealsResponse;
  pagePath?: string;
  initialFilters?: Partial<DealFilters>;
}

export function Dashboard({
  initialData,
  pagePath = "/",
  initialFilters,
}: DashboardProps) {
  const [deals, setDeals] = useState<Deal[]>(initialData?.deals ?? []);
  const [source, setSource] = useState<DealsResponse["source"] | null>(initialData?.source ?? null);
  const [fetchedAt, setFetchedAt] = useState(initialData?.fetchedAt ?? null);
  const [asOf, setAsOf] = useState(initialData?.asOf ?? "");
  const [query, setQuery] = useState(initialFilters?.query ?? "");
  const [selectedChains, setSelectedChains] = useState<HotelChainId[]>(initialFilters?.chains ?? []);
  const [selectedCities, setSelectedCities] = useState<string[]>(initialFilters?.cities ?? []);
  const [weekendOnly, setWeekendOnly] = useState(initialFilters?.weekendOnly ?? false);
  const [audiences, setAudiences] = useState<AudienceTag[]>(initialFilters?.audiences ?? []);
  const [sort, setSort] = useState<SortKey>(initialFilters?.sort ?? "expiration");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(!initialData);

  const cities = useMemo(() => uniqueCities(deals), [deals]);
  const visibleDeals = useMemo(
    () =>
      filterAndSortDeals(deals, {
        chains: selectedChains,
        cities: selectedCities,
        weekendOnly,
        audiences,
        query,
        sort,
      }),
    [audiences, deals, query, selectedChains, selectedCities, sort, weekendOnly],
  );
  const hiddenTags = useMemo<CardTag[]>(() => {
    const tags: CardTag[] = [...audiences];
    if (weekendOnly) tags.push("weekend");
    return tags;
  }, [audiences, weekendOnly]);

  useEffect(() => {
    setPage(1);
  }, [audiences, query, selectedChains, selectedCities, sort, weekendOnly, view]);

  const loadDeals = useCallback(async (refresh = false) => {
    setRefreshing(true);
    try {
      const response = await fetch(refresh ? "/api/deals?refresh=1" : "/api/deals", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load deals");
      const payload = (await response.json()) as DealsResponse;
      setDeals(payload.deals);
      setSource(payload.source);
      setFetchedAt(payload.fetchedAt);
      setAsOf(payload.asOf);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) void loadDeals();
  }, [initialData, loadDeals]);

  function toggleChain(chainId: HotelChainId) {
    setSelectedChains((current) =>
      current.includes(chainId) ? current.filter((id) => id !== chainId) : [...current, chainId],
    );
  }

  function toggleCity(city: string) {
    setSelectedCities((current) =>
      current.includes(city) ? current.filter((item) => item !== city) : [...current, city],
    );
  }

  function toggleAudience(audience: AudienceTag) {
    setAudiences((current) =>
      current.includes(audience) ? current.filter((item) => item !== audience) : [...current, audience],
    );
  }

  return (
    <div className="relative min-h-screen">
      <Header
        fetchedAt={fetchedAt}
        source={source}
        refreshing={refreshing}
        liveCount={visibleDeals.length}
        onRefresh={() => void loadDeals(true)}
      />
      <div className="relative isolate">
        <div className="page-sun" aria-hidden />
        {visibleDeals.length > 0 && (
          <DealJsonLd deals={visibleDeals} pageUrl={`${SITE_URL}${pagePath}`} name={HERO_H1} />
        )}
        <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10">
          <HeroHeading />

          <div className="sticky top-0 z-20">
            <FilterBar
              query={query}
              selectedChains={selectedChains}
              cities={cities}
              selectedCities={selectedCities}
              weekendOnly={weekendOnly}
              audiences={audiences}
              sort={sort}
              view={view}
              onQueryChange={setQuery}
              onToggleChain={toggleChain}
              onClearChains={() => setSelectedChains([])}
              onToggleCity={toggleCity}
              onClearCities={() => setSelectedCities([])}
              onWeekendOnlyChange={setWeekendOnly}
              onToggleAudience={toggleAudience}
              onSortChange={setSort}
              onViewChange={setView}
            />
          </div>

          {visibleDeals.length === 0 && refreshing ? (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white px-6 py-16 text-center">
              <p className="text-lg font-semibold">דילסי יצא לסריקה!</p>
            </div>
          ) : visibleDeals.length === 0 ? (
            <EmptyState />
          ) : (
            <DealClickFiltersProvider
              value={{
                idfFilterOn: audiences.includes("idf"),
                weekendFilterOn: weekendOnly,
                clubFilterOn: audiences.includes("club"),
              }}
            >
              <DealSections
                deals={visibleDeals}
                asOf={asOf}
                view={view}
                page={page}
                onPageChange={setPage}
                hiddenTags={hiddenTags}
              />
            </DealClickFiltersProvider>
          )}
        </main>
      </div>
    </div>
  );
}
