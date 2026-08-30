interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

function pageWindow(page: number, pageCount: number): number[] {
  const start = Math.max(1, page - 2);
  const end = Math.min(pageCount, page + 2);
  const pages: number[] = [];
  for (let value = start; value <= end; value += 1) pages.push(value);
  if (!pages.includes(1)) pages.unshift(1);
  if (!pages.includes(pageCount)) pages.push(pageCount);
  return [...new Set(pages)].sort((a, b) => a - b);
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = pageWindow(page, pageCount);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="עמודי דילים">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
      >
        הקודם
      </button>
      {pages.map((value, index) => {
        const prev = pages[index - 1];
        return (
          <span key={value} className="flex items-center gap-2">
            {prev !== undefined && value - prev > 1 && <span className="text-ink-soft">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(value)}
              className={`min-w-9 rounded-full px-3 py-1.5 text-sm ${
                value === page ? "bg-sea text-white" : "border border-black/10 bg-white text-ink"
              }`}
            >
              {value}
            </button>
          </span>
        );
      })}
      <button
        type="button"
        disabled={page === pageCount}
        onClick={() => onPageChange(page + 1)}
        className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
      >
        הבא
      </button>
    </nav>
  );
}
