"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ALL_PLATFORMS,
  PLATFORM_DOT,
  PLATFORM_LABEL,
  RANGES,
  RANGE_LABEL,
  type Filters,
} from "@/lib/filters";
import type { AdPlatform } from "@/lib/mockData";

// Date-range presets + per-platform toggles. State lives in the URL so the
// server page is the single source of truth and links are shareable; the bar
// only pushes params. Pending navigation dims the controls (skeleton handles
// the panels via loading.tsx).
export default function FilterBar({ filters }: { filters: Filters }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function commit(next: Partial<Filters>) {
    const range = next.range ?? filters.range;
    const platforms = next.platforms ?? filters.platforms;
    const sp = new URLSearchParams(params.toString());
    sp.set("range", String(range));
    sp.set("platforms", platforms.join(","));
    startTransition(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }));
  }

  function togglePlatform(p: AdPlatform) {
    const on = filters.platforms.includes(p);
    commit({
      platforms: on
        ? filters.platforms.filter((x) => x !== p)
        : ALL_PLATFORMS.filter((x) => filters.platforms.includes(x) || x === p),
    });
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-x-6 gap-y-4 transition-opacity duration-150 ${
        pending ? "opacity-60" : "opacity-100"
      }`}
      aria-busy={pending}
    >
      {/* Date range — segmented control */}
      <div className="inline-flex rounded-lg border border-edge bg-surface p-0.5" role="group" aria-label="Date range">
        {RANGES.map((r) => {
          const active = filters.range === r;
          return (
            <button
              key={r}
              type="button"
              aria-pressed={active}
              onClick={() => commit({ range: r })}
              className={`rounded-[7px] px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                active
                  ? "bg-accent text-white"
                  : "text-muted hover:text-ink hover:bg-sunken"
              }`}
            >
              {RANGE_LABEL[r]}
            </button>
          );
        })}
      </div>

      {/* Platform toggles */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Ad platforms">
        {ALL_PLATFORMS.map((p) => {
          const active = filters.platforms.includes(p);
          return (
            <button
              key={p}
              type="button"
              aria-pressed={active}
              onClick={() => togglePlatform(p)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                active
                  ? "border-accent/30 bg-accent/10 text-ink"
                  : "border-edge bg-surface text-faint hover:text-muted hover:border-edge"
              }`}
            >
              <span
                aria-hidden
                className={`h-2 w-2 rounded-full transition-colors duration-150 ${
                  active ? "" : "bg-edge"
                }`}
                style={active ? { backgroundColor: PLATFORM_DOT[p] } : undefined}
              />
              {PLATFORM_LABEL[p]}
            </button>
          );
        })}

        {/* Shopify — the storefront source, always on. A status pill, not a
            toggle: distinct solid styling + check to signal tracking is live. */}
        <span
          className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-positive/10 px-3 py-1.5 text-sm font-medium text-positive ring-1 ring-inset ring-positive/25"
          title="Shopify storefront tracking is active"
        >
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
          Shopify
          <span className="sr-only">connected</span>
        </span>
      </div>
    </div>
  );
}
