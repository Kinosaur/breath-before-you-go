/**
 * DataFreshnessBadge — Server Component
 *
 * Shows data recency with 3 states (blueprint §Data Freshness UX):
 *   🟢 Live      — pipeline ran < 2h ago
 *   🟡 Delayed   — pipeline ran 2–24h ago
 *   🔴 Historical — pipeline hasn't run in > 24h; showing seasonal trends only
 *
 * Receives a generatedAt ISO string (from index.json or hourly-latest.json)
 * and computes status server-side — no client polling needed here.
 */

import { computeFreshness } from "@/lib/data";
import type { FreshnessStatus } from "@/lib/types";

interface Props {
  generatedAt: string;
  className?:  string;
}

const DOT_STYLES: Record<FreshnessStatus, string> = {
  live:       "bg-aqi-good",
  delayed:    "bg-yellow-500",
  historical: "bg-red-500",
};

const MESSAGES: Record<FreshnessStatus, (label: string) => string> = {
  live:       (label) => `Live — ${label}`,
  delayed:    (label) => `Delayed — ${label}`,
  historical: ()      => "Historical — last pipeline update was over 24h ago",
};

export function DataFreshnessBadge({ generatedAt, className = "" }: Props) {
  const { status, label } = computeFreshness(generatedAt);
  const dotClass = DOT_STYLES[status];
  const message  = MESSAGES[status](label);

  return (
    <div
      className={`inline-flex items-center gap-2 text-xs font-mono text-ink-muted ${className}`}
      title={
        status === "historical"
          ? "Using historical seasonal trends because the latest pipeline run is older than 24 hours."
          : undefined
      }
    >
      {/* Animated ping for live status */}
      <span className="relative flex h-2 w-2 flex-shrink-0">
        {status === "live" && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotClass} opacity-60`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`} />
      </span>

      <span>{message}</span>
    </div>
  );
}
