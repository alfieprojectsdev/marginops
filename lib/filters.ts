// Shared filter vocabulary for the dashboard. Used by the server page (to query
// the right slice) and the client FilterBar (to drive the URL). One source of
// truth so the two never drift.
import type { AdPlatform } from "./mockData";

export const ALL_PLATFORMS: AdPlatform[] = ["META", "GOOGLE", "TIKTOK"];

export const PLATFORM_LABEL: Record<AdPlatform, string> = {
  META: "Meta",
  GOOGLE: "Google",
  TIKTOK: "TikTok",
};

// Identity colors (OKLCH, mirror tailwind.config.ts). Used for spend allocation
// and the toggle dots — keep in sync with the `meta`/`google`/`tiktok` tokens.
export const PLATFORM_DOT: Record<AdPlatform, string> = {
  META: "oklch(0.58 0.16 265)",
  GOOGLE: "oklch(0.62 0.13 150)",
  TIKTOK: "oklch(0.62 0.17 12)",
};

// The mock window is May 2026; ranges count back from the last day of data.
export const DATA_END = "2026-05-30";

export const RANGES = [7, 14, 30] as const;
export type RangeDays = (typeof RANGES)[number];

export const RANGE_LABEL: Record<RangeDays, string> = {
  7: "7 days",
  14: "14 days",
  30: "30 days",
};

export interface Filters {
  range: RangeDays;
  platforms: AdPlatform[]; // empty array = nothing selected (empty state)
}

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseFilters(params: RawParams): Filters {
  const rawRange = Number(first(params.range));
  const range: RangeDays = (RANGES as readonly number[]).includes(rawRange)
    ? (rawRange as RangeDays)
    : 30;

  const rawPlatforms = first(params.platforms);
  let platforms: AdPlatform[];
  if (rawPlatforms === undefined) {
    platforms = [...ALL_PLATFORMS]; // default: everything on
  } else {
    const set = new Set(rawPlatforms.split(",").map((s) => s.trim().toUpperCase()));
    platforms = ALL_PLATFORMS.filter((p) => set.has(p));
  }

  return { range, platforms };
}

// Inclusive [start, end] ISO dates for a range ending at DATA_END.
export function rangeWindow(range: RangeDays): { start: string; end: string } {
  const end = new Date(DATA_END + "T00:00:00Z");
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (range - 1));
  return { start: start.toISOString().slice(0, 10), end: DATA_END };
}
