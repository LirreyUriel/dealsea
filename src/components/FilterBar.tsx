"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownWideNarrow, LayoutGrid, Search, SlidersHorizontal, Table2, X } from "lucide-react";
import { HOTEL_CHAINS } from "@/lib/chains";
import type { AudienceTag, HotelChainId, SortKey } from "@/lib/types";
import { MultiSelect } from "./MultiSelect";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "discount", label: "מיון לפי גובה הנחה (מהגבוה לנמוך)" },
  { value: "expiration", label: "מיון לפי תאריך תפוגה" },
  { value: "price", label: "מיון לפי מחיר ללילה" },
  { value: "hotel", label: "מיון לפי שם מלון" },
];

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
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition ${
        active
          ? "border-sea bg-sea text-white shadow-sm"
          : "border-black/10 bg-white text-ink hover:border-sea/40"
      }`}
    >
      {label}
    </button>
  );
}

function ViewToggle({
  view,
  onViewChange,
}: Pick<FilterBarProps, "view" | "onViewChange">) {
  return (
    <div className="flex h-12 shrink-0 items-center rounded-2xl border border-black/8 bg-sand p-1">
      <button
        type="button"
        onClick={() => onViewChange("grid")}
        className={`flex h-full items-center justify-center rounded-xl px-3 ${view === "grid" ? "bg-white shadow-sm" : "text-ink-soft"}`}
        aria-label="תצוגת כרטיסים"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onViewChange("table")}
        className={`flex h-full items-center justify-center rounded-xl px-3 ${view === "table" ? "bg-white shadow-sm" : "text-ink-soft"}`}
        aria-label="תצוגת טבלה"
      >
        <Table2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function ChainCitySelects({
  selectedChains,
  cities,
  selectedCities,
  onToggleChain,
  onClearChains,
  onToggleCity,
  onClearCities,
  expandSelects = false,
  compact = false,
}: Pick<
  FilterBarProps,
  | "selectedChains"
  | "cities"
  | "selectedCities"
  | "onToggleChain"
  | "onClearChains"
  | "onToggleCity"
  | "onClearCities"
> & { expandSelects?: boolean; compact?: boolean }) {
  return (
    <div className={expandSelects ? "grid grid-cols-1 gap-3" : "flex gap-2"}>
      <MultiSelect
        label="רשת"
        allLabel="כל הרשתות"
        options={HOTEL_CHAINS.map((chain) => ({ id: chain.id, label: chain.nameHe }))}
        selected={selectedChains}
        onToggle={onToggleChain}
        onClear={onClearChains}
        expandInline={expandSelects}
        compact={compact}
      />
      <MultiSelect
        label="יעד"
        allLabel="כל היעדים"
        options={cities.map((city) => ({ id: city, label: city }))}
        selected={selectedCities}
        onToggle={onToggleCity}
        onClear={onClearCities}
        expandInline={expandSelects}
        compact={compact}
      />
    </div>
  );
}

function QuickChips({
  weekendOnly,
  audiences,
  selectedCities,
  onWeekendOnlyChange,
  onToggleAudience,
  onToggleCity,
  className = "",
}: Pick<
  FilterBarProps,
  | "weekendOnly"
  | "audiences"
  | "selectedCities"
  | "onWeekendOnlyChange"
  | "onToggleAudience"
  | "onToggleCity"
> & { className?: string }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      <Chip
        active={selectedCities.includes("אילת")}
        label="🌴 אילת"
        onClick={() => onToggleCity("אילת")}
      />
      <Chip
        active={audiences.includes("club")}
        label="✨ חברי מועדון"
        onClick={() => onToggleAudience("club")}
      />
      <Chip
        active={audiences.includes("idf")}
        label="🛡️ מילואים וכוחות הביטחון"
        onClick={() => onToggleAudience("idf")}
      />
      <Chip
        active={weekendOnly}
        label="🌊 סוף שבוע"
        onClick={() => onWeekendOnlyChange(!weekendOnly)}
      />
    </div>
  );
}

function SortControl({
  sort,
  onSortChange,
}: Pick<FilterBarProps, "sort" | "onSortChange">) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <label className="hidden h-12 w-[17.5rem] items-center gap-2 rounded-2xl border border-black/8 bg-sand px-3 lg:flex">
        <ArrowDownWideNarrow className="h-4 w-4 shrink-0 text-ink-soft" />
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
          className="h-full w-full min-w-0 bg-transparent outline-none"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="inline-flex h-12 items-center justify-center gap-1.5 rounded-2xl border border-black/8 bg-sand px-3 text-sm font-medium lg:hidden"
      >
        <ArrowDownWideNarrow className="h-4 w-4" />
        מיון
      </button>
      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 min-w-[16rem] rounded-2xl border border-black/8 bg-white p-1 shadow-lg lg:hidden">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onSortChange(option.value);
                setOpen(false);
              }}
              className={`block w-full rounded-xl px-3 py-2.5 text-right text-sm ${
                sort === option.value ? "bg-sea/10 font-medium text-sea" : "text-ink hover:bg-sand/70"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
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

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <section className="space-y-3 rounded-3xl border border-black/5 bg-white p-3 shadow-sm sm:p-5 lg:space-y-4">
      <div className="flex items-stretch gap-2 lg:hidden">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            name="q"
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            placeholder='חיפוש מלון, יעד או "הרודס"'
            className="h-12 w-full rounded-2xl border border-black/8 bg-sand py-0 pr-10 pl-4 outline-none ring-sea/20 transition focus:bg-white focus:ring-4"
          />
        </label>
        <SortControl sort={props.sort} onSortChange={props.onSortChange} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`relative inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-semibold ${
            extraCount > 0
              ? "border-sea bg-sea text-white"
              : "border-black/8 bg-sand text-ink"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          סינון
          {extraCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-semibold text-sea">
              {extraCount}
            </span>
          )}
        </button>
      </div>
      <QuickChips {...props} className="lg:hidden" />

      <div className="hidden lg:flex lg:flex-col lg:gap-4">
        <div className="flex items-stretch gap-3">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-ink-soft" />
            <input
              name="q"
              value={props.query}
              onChange={(event) => props.onQueryChange(event.target.value)}
              placeholder='חיפוש חופשי, למשל שם מלון, "אילת" או "הרודס"'
              className="h-12 w-full rounded-2xl border border-black/8 bg-sand py-0 pr-12 pl-4 text-base outline-none ring-sea/20 transition focus:bg-white focus:ring-4"
            />
          </label>
          <div className="flex shrink-0 items-stretch gap-2">
            <SortControl sort={props.sort} onSortChange={props.onSortChange} />
            <ViewToggle view={props.view} onViewChange={props.onViewChange} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <QuickChips {...props} className="min-w-0 flex-1" />
          <ChainCitySelects {...props} compact />
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-label="סגור סינון" />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[70dvh] min-h-[50dvh] flex-col rounded-t-3xl bg-white shadow-xl">
            <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-black/15" />
            <div className="flex shrink-0 items-center justify-between px-5 pt-3 pb-3">
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
            <div className="min-h-0 flex-1 space-y-5 overflow-auto px-5 pb-8">
              <ChainCitySelects {...props} expandSelects />
              <div>
                <p className="mb-2 text-sm font-medium text-ink-soft">תצוגה</p>
                <ViewToggle view={props.view} onViewChange={props.onViewChange} />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
