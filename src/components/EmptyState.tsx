import { SearchX } from "lucide-react";

export function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-black/10 bg-white px-6 py-16 text-center">
      <SearchX className="mx-auto mb-3 h-8 w-8 text-ink-soft" />
      <h3 className="text-lg font-semibold">לא נמצאו דילים מתאימים</h3>
      <p className="mt-1 text-sm text-ink-soft">נסו לשנות את החיפוש או לבחור רשת מלונות אחרת.</p>
    </div>
  );
}
