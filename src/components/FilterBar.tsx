"use client";

import { useState } from "react";
import { ArrowDownWideNarrow, LayoutGrid, Search, SlidersHorizontal, Table2, X } from "lucide-react";
import { HOTEL_CHAINS } from "@/lib/chains";
import type { AudienceTag, HotelChainId, SortKey } from "@/lib/types";
import { MultiSelect } from "./MultiSelect";

interface FilterBarProps {
  query: string;
  selectedChains: HotelChainId[];
  cities: string[];
  selectedCities: string[];
  weekendOnly: boolean;
  audiences: AudienceTag[];
  sort: SortKey;
  view: "grid" | "table";
  onQueryChange: (value: string) => void;
  onToggleChain: (chainId: HotelChainId) => void;
  onClearChains: () => void;
  onToggleCity: (city: string) => void;
  onClearCities: () => void;
  onWeekendOnlyChange: (value: boolean) => void;
  onToggleAudience: (audience: AudienceTag) => void;
  onSortChange: (value: SortKey) => void;
  onViewChange: (value: "grid" | "table") => void;
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-sea bg-sea text-white shadow-sm"
          : "border-black/10 bg-white text-ink hover:border-sea/40"
      }`}
    >
      {label}
    </button>
  );
}

function ChainCityView({
  selectedChains,
  cities,
  selectedCities,
  view,
  onToggleChain,
  onClearChains,
  onToggleCity,
  onClearCities,
  onViewChange,
}: Pick<
  FilterBarProps,
  | "selectedChains"
  | "cities"
  | "selectedCities"
  | "view"
  | "onToggleChain"
  | "onClearChains"
  | "onToggleCity"
  | "onClearCities"
  | "onViewChange"
>) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-none lg:flex-nowrap">
      <MultiSelect
        label="רשת"
        allLabel="כל הרשתות"
        options={HOTEL_CHAINS.map((chain) => ({ id: chain.id, label: chain.nameHe }))}
        selected={selectedChains}
        onToggle={onToggleChain}
        onClear={onClearChains}
      />
      {cities.length > 0 && (
        <MultiSelect
          label="יעד"
          allLabel="כל היעדים"
          options={cities.map((city) => ({ id: city, label: city }))}
          selected={selectedCities}
          onToggle={onToggleCity}
          onClear={onClearCities}
        />
      )}
      <div className="col-span-2 flex h-12 items-center rounded-2xl border border-black/8 bg-sand p-1 lg:col-span-1">
        <button
          type="button"
          onClick={() => onViewChange("grid")}
          className={`flex h-full flex-1 items-center justify-center rounded-xl px-3 ${view === "grid" ? "bg-white shadow-sm" : "text-ink-soft"}`}
          aria-label="תצוגת כרטיסים"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onViewChange("table")}
          className={`flex h-full flex-1 items-center justify-center rounded-xl px-3 ${view === "table" ? "bg-white shadow-sm" : "text-ink-soft"}`}
          aria-label="תצוגת טבלה"
        >
          <Table2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AudienceChips({
  weekendOnly,
  audiences,
  onWeekendOnlyChange,
  onToggleAudience,
}: Pick<FilterBarProps, "weekendOnly" | "audiences" | "onWeekendOnlyChange" | "onToggleAudience">) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip
        active={audiences.includes("idf")}
        label="מבצעי מילואים וכוחות הביטחון"
        onClick={() => onToggleAudience("idf")}
      />
      <Chip active={weekendOnly} label="סוף שבוע" onClick={() => onWeekendOnlyChange(!weekendOnly)} />
      <Chip active={audiences.includes("club")} label="חברי מועדון" onClick={() => onToggleAudience("club")} />
    </div>
  );
}

export function FilterBar(props: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const extraCount =
    props.selectedChains.length +
    props.selectedCities.length +
    props.audiences.length +
    (props.weekendOnly ? 1 : 0);

  return (
    <section className="space-y-3 rounded-3xl border border-black/5 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            name="q"
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            placeholder='חיפוש חופשי, למשל שם מלון, "אילת" או "ים המלח"'
            className="h-12 w-full rounded-2xl border border-black/8 bg-sand py-0 pr-10 pl-4 outline-none ring-sea/20 transition focus:bg-white focus:ring-4"
          />
        </label>
        <div className="flex gap-2 lg:contents">
          <div className="hidden lg:block">
            <ChainCityView {...props} />
          </div>
          <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-black/8 bg-sand px-3 lg:flex-none">
            <ArrowDownWideNarrow className="h-4 w-4 shrink-0 text-ink-soft" />
            <select
              value={props.sort}
              onChange={(event) => props.onSortChange(event.target.value as SortKey)}
              className="h-full w-full min-w-0 bg-transparent outline-none"
            >
              <option value="expiration">מיון לפי תאריך תפוגה</option>
              <option value="discount">מיון לפי גובה הנחה</option>
              <option value="price">מיון לפי מחיר ללילה</option>
              <option value="hotel">מיון לפי שם מלון</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-black/8 bg-sand px-3 text-sm font-medium lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            סינון
            {extraCount > 0 && (
              <span className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sea px-1 text-[11px] font-semibold text-white">
                {extraCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="hidden lg:block">
        <AudienceChips {...props} />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-label="סגור סינון" />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-3xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">סינון</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-ink-soft hover:bg-sand"
                aria-label="סגור"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <ChainCityView {...props} />
              <AudienceChips {...props} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
