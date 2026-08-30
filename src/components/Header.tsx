"use client";

import Image from "next/image";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { SITE_NAME_HE } from "@/lib/site";

interface HeaderProps {
  fetchedAt: string | null;
  source: "live" | null;
  refreshing: boolean;
  liveCount: number;
  onRefresh: () => void;
}

export function Header({ fetchedAt, source, refreshing, liveCount, onRefresh }: HeaderProps) {
  const formatted = fetchedAt ? formatDateTime(fetchedAt) : null;

  return (
    <header className="relative z-20 overflow-visible border-b border-ink/20 bg-canvas">
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-1.5 px-4 py-[14px] ps-0 sm:gap-3 sm:px-6">
        <Link href="/" className="relative z-20 -my-10 -ms-4 shrink-0 sm:-my-16 sm:ms-0">
          <Image
            src="/logo.png"
            alt={SITE_NAME_HE}
            width={320}
            height={320}
            className="h-32 w-32 translate-x-3 object-contain sm:h-48 sm:w-48 sm:translate-x-0"
            priority
            unoptimized
          />
        </Link>

        <div className="flex min-w-0 flex-col items-end gap-1">
          <div className="grid grid-cols-[1.65fr_1fr] gap-1.5 sm:flex sm:items-start sm:gap-2">
            <a
              href="#subscribe"
              className="header-action inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full bg-sea px-5 text-white transition hover:bg-sea-dark sm:px-4"
            >
              הצטרפו לדילסי קלאב
            </a>
            <div className="flex flex-col items-stretch gap-1 sm:items-end">
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="header-action inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-white/85 px-4 text-ink backdrop-blur-sm transition hover:bg-white disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                צא לסריקה
              </button>
              <p className="hidden text-end text-[11px] leading-4 text-ink-soft sm:block">
                <span className="font-medium text-ink">{liveCount} דילים חיים ברשת</span>
                {source === "live" && formatted && (
                  <>
                    <br />
                    סריקה אחרונה {formatted}
                  </>
                )}
              </p>
            </div>
          </div>
          <p className="text-center text-[11px] leading-4 text-ink-soft sm:hidden">
            <span className="font-medium text-ink">{liveCount} דילים חיים ברשת</span>
            {source === "live" && formatted && (
              <>
                <span className="mx-1.5">·</span>
                סריקה אחרונה {formatted}
              </>
            )}
          </p>
        </div>
      </div>
    </header>
  );
}
