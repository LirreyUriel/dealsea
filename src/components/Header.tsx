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
    <header className="header-beach relative overflow-visible">
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-[14px] sm:px-6">
        <Link href="/" className="relative z-20 -my-10 shrink-0 sm:-my-16">
          <Image
            src="/logo.png"
            alt={SITE_NAME_HE}
            width={320}
            height={320}
            className="h-32 w-32 object-contain sm:h-48 sm:w-48"
            priority
            unoptimized
          />
        </Link>

        <div className="flex min-w-0 flex-col items-end gap-1">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-start">
            <a
              href="#subscribe"
              className="header-action inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full bg-sea px-4 text-white transition hover:bg-sea-dark"
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
