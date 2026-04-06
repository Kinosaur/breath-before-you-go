/**
 * CityGrid — Server Component
 *
 * Renders all 15 cities as clickable cards sorted by tier, then by PM2.5.
 * Each card shows: band color dot, city name, country, annual median PM2.5,
 * best-visit month badge, and tier label.
 *
 * Clicking navigates to /cities/[id] (city page built in Week 4).
 */

import Link from "next/link";
import type { CityIndexEntry } from "@/lib/types";
import { classifyBand, getBandColor, getBandLabel } from "@/lib/constants";

interface Props {
  cities: CityIndexEntry[];
}

export function CityGrid({ cities }: Props) {
  const sorted = [...cities].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return b.annualMedianPm25 - a.annualMedianPm25;   // worst air first within tier
  });

  return (
    <section>
      <div className="flex items-baseline gap-3 mb-5">
        <h2 className="font-editorial text-2xl font-semibold text-ink">15 Cities</h2>
        <span className="text-base text-ink-muted">sorted by tier · click to explore</span>
      </div>

      {/* Tier legend */}
      <div className="flex gap-4 mb-4 text-[11px] font-mono text-ink-muted">
        <span><span className="text-ink">T1</span> Deep — full story</span>
        <span><span className="text-ink">T2</span> Standard — data + summary</span>
        <span><span className="text-ink">T3</span> Dashboard — data only</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {sorted.map((city) => {
          const band  = classifyBand(city.annualMedianPm25);
          const color = getBandColor(band);
          const label = getBandLabel(band);

          return (
            <Link
              key={city.id}
              href={`/cities/${city.id}`}
              className="group block p-4 rounded-lg border border-surface-3 bg-surface-2
                         hover:bg-surface-3 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.22)]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-faint focus-visible:ring-offset-2 focus-visible:ring-offset-surface
                         transition-all duration-200"
              style={{ "--band": color } as React.CSSProperties}
            >
              {/* Top row: band dot + tier tag */}
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex items-center">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: color }}
                    aria-label={`AQI: ${label}`}
                  />
                </div>
                <span className="text-[10px] font-mono text-ink-muted">
                  T{city.tier}
                </span>
              </div>

              <div className="-mt-1 mb-3 text-[11px] text-ink-muted touch-tooltip transition-all duration-150">
                {label}
              </div>

              {/* City name + country */}
              <div className="font-semibold text-base text-ink leading-tight mb-0.5">
                {city.name}
              </div>
              <div className="text-sm text-ink-muted mb-3">
                {city.country}
              </div>

              {/* Annual PM2.5 */}
              <div
                className="font-mono text-base font-bold leading-none"
                style={{ color }}
              >
                {city.annualMedianPm25}
              </div>
              <div className="text-xs text-ink-muted mt-0.5 mb-3">
                µg/m³ annual median
              </div>

              {/* Best visit month badge */}
              {city.bestVisitMonth.name ? (
                <div className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-aqi-good/10 text-aqi-good">
                  <span aria-hidden="true">✓</span>
                  <span>{city.bestVisitMonth.name}</span>
                </div>
              ) : (
                <div className="h-5" />  /* spacer to keep card heights consistent */
              )}

              {/* Worst month hint — appears on hover */}
              <div className="mt-2 text-[11px] text-ink-muted touch-tooltip transition-all duration-200">
                Worst: {city.worstMonth.name} ({city.worstMonth.median} µg/m³)
              </div>
            </Link>
          );
        })}
      </div>

      {/* Attribution */}
      <p className="mt-4 text-sm text-ink-muted">
        Source: OpenAQ API v3 · WHO 2021 PM2.5 guidelines ·{" "}
        <span className="font-mono">5-year historical daily data</span>
      </p>
    </section>
  );
}
