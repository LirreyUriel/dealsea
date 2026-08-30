"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MultiSelectOption<T extends string> {
  id: T;
  label: string;
}

interface MultiSelectProps<T extends string> {
  label: string;
  options: MultiSelectOption<T>[];
  selected: T[];
  allLabel: string;
  onToggle: (id: T) => void;
  onClear: () => void;
}

export function MultiSelect<T extends string>({
  label,
  options,
  selected,
  allLabel,
  onToggle,
  onClear,
}: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const selectedLabels = options.filter((option) => selected.includes(option.id)).map((option) => option.label);
  const summary =
    selectedLabels.length === 0
      ? allLabel
      : selectedLabels.length <= 2
        ? selectedLabels.join(", ")
        : `${selectedLabels.length} נבחרו`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex h-12 w-full min-w-0 items-center gap-2 rounded-2xl border border-black/8 bg-sand px-3 outline-none ring-sea/20 transition hover:bg-white focus:bg-white focus:ring-4 lg:min-w-[11rem]"
      >
        <span className="text-ink-soft">{label}</span>
        <span className="max-w-[10rem] truncate font-medium">{summary}</span>
        <ChevronDown className={`mr-auto h-4 w-4 text-ink-soft transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-30 mt-1 max-h-72 min-w-[14rem] overflow-auto rounded-2xl border border-black/8 bg-white p-2 shadow-lg">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-sand/70">
            <input
              type="checkbox"
              checked={selected.length === 0}
              onChange={onClear}
              className="accent-sea"
            />
            {allLabel}
          </label>
          {options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-sand/70"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.id)}
                onChange={() => onToggle(option.id)}
                className="accent-sea"
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
