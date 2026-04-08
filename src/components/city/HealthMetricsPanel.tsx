/**
 * HealthMetricsPanel — Server Component
 *
 * Displays the top-level health summary for a city:
 *   • Annual PM2.5 median + band badge
 *   • Cigarette equivalence with disclaimer
 *   • Life expectancy impact with comparison anchors
 *   • Best / worst month badges
 *   • AQI distribution bar
 */

import type { CityProfile } from "@/lib/types";
import { classifyBand, getBandColor, getBandLabel, getBandTextColor } from "@/lib/constants";

interface Props {
  profile: CityProfile;
}

/** Returns a display label for a comparison anchor, replacing generic "this city" text. */
function anchorLabel(label: string, cityName: string): string {
  if (label.toLowerCase().includes("this city") || label.toLowerCase().includes("city's air")) {
    return `${cityName}'s air`;
  }
  return label;
}

function BandBadge({ pm25 }: { pm25: number }) {
  const band  = classifyBand(pm25);
  const color = getBandColor(band);
  const label = getBandLabel(band);
  const text  = getBandTextColor(band);
  return (
    <span
      className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
      style={{ background: color, color: text }}
    >
      {label}
    </span>
  );
}

function AqiBar({ dist }: { dist: CityProfile["healthMetrics"]["aqiDistribution"] }) {
  const bands = [
    { key: "good",                pct: dist.good,                color: "#4CAF50" },
    { key: "moderate",            pct: dist.moderate,            color: "#FFEB3B" },
    { key: "unhealthy_sensitive", pct: dist.unhealthy_sensitive, color: "#FF9800" },
    { key: "unhealthy",           pct: dist.unhealthy,           color: "#F44336" },
    { key: "hazardous",           pct: dist.hazardous,           color: "#9C27B0" },
  ] as const;

  return (
    <div className="mt-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {bands.map(({ key, pct, color }) =>
          pct > 0 ? (
            <div
              key={key}
              className="transition-all duration-300"
              style={{ width: `${pct}%`, background: color }}
              aria-label={`${key}: ${pct.toFixed(1)}%`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {bands.map(({ key, pct, color }) => (
          <div key={key} className="flex items-center gap-1 text-[10px] text-ink-muted">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span>{pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HealthMetricsPanel({ profile }: Props) {
  const hm = profile.healthMetrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      {/* ── Annual PM2.5 ── */}
      <div className="motion-card rounded-xl bg-surface-2 border border-surface-3 p-5 hover:border-ink-faint/45">
        <div className="text-sm text-ink-faint font-mono mb-1">Annual median PM2.5</div>
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-3xl font-bold text-ink tabular-nums">
            {hm.annualMedianPm25.toFixed(1)}
          </span>
          <span className="text-base text-ink-muted">µg/m³</span>
          <BandBadge pm25={hm.annualMedianPm25} />
        </div>
        <div className="text-sm text-ink-faint">
          WHO 2021 guideline: 5 µg/m³ annual mean
        </div>

        {/* WHO 2019 cross-reference */}
        {profile.whoData?.available && profile.whoData.pm25Estimate?.value != null && (
          <div className="mt-4 pt-4 border-t border-surface-3">
            <div className="text-xs text-ink-faint font-mono mb-1">WHO 2019 modelled estimate</div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold text-ink-muted tabular-nums">
                {profile.whoData.pm25Estimate.value.toFixed(1)} µg/m³
              </span>
              <span className="text-[10px] text-ink-faint font-mono">annual mean · {profile.whoData.pm25Estimate.year}</span>
            </div>
            <p className="text-[10px] text-ink-muted mt-1 leading-relaxed">
              Independent modelled estimate for reference. Our data uses station sensors
              which may cover different years and locations.{" "}
                <a href="/about" className="link-underline-reveal transition-colors hover:text-ink">
                Methodology →
              </a>
            </p>
          </div>
        )}

        {/* AQI distribution bar */}
        <div className="mt-4">
          <div className="text-sm text-ink-faint mb-1">Days by air quality band</div>
          <AqiBar dist={hm.aqiDistribution} />
        </div>
      </div>

      {/* ── Cigarette equivalence ── */}
      <div className="motion-card rounded-xl bg-surface-2 border border-surface-3 p-5 hover:border-ink-faint/45">
        <div className="text-sm text-ink-faint font-mono mb-1">Cigarette equivalence</div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold text-ink tabular-nums">
            {hm.cigarettesPerDay.toFixed(2)}
          </span>
          <span className="text-base text-ink-muted">cigs / day</span>
        </div>
        <div className="text-sm text-ink-muted leading-relaxed">
          Breathing this air year-round is estimated equivalent to smoking{" "}
          <strong className="text-ink">{hm.cigarettesPerDay.toFixed(1)}</strong> cigarettes
          daily.
        </div>
        <p className="mt-3 text-xs text-ink-muted leading-relaxed border-t border-surface-3 pt-3">
          {hm.cigMethodologyNote}
        </p>
      </div>

      {/* ── Life expectancy ── */}
      <div className="motion-card rounded-xl bg-surface-2 border border-surface-3 p-5 hover:border-ink-faint/45">
        <div className="text-sm text-ink-faint font-mono mb-1">Estimated life years at risk</div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold text-ink tabular-nums">
            {hm.yearsLost.toFixed(1)}
          </span>
          <span className="text-base text-ink-muted">years</span>
        </div>

        {/* Comparison anchors */}
        <div className="space-y-2">
          {hm.lifeExpectancyContext.comparisonAnchors.map((anchor) => {
            const isCity   = anchor.label.toLowerCase().includes("this city") ||
                             anchor.label.toLowerCase().includes("city's air");
            const maxYears = Math.max(...hm.lifeExpectancyContext.comparisonAnchors.map((a) => a.yearsLost));
            const pct      = maxYears > 0 ? (anchor.yearsLost / maxYears) * 100 : 0;
            const display  = anchorLabel(anchor.label, profile.cityName);
            return (
              <div key={anchor.label}>
                <div className="flex justify-between text-sm mb-0.5">
                  <span className={isCity ? "text-ink font-semibold" : "text-ink-muted"}>
                    {display}
                  </span>
                  <span className={isCity ? "text-ink font-semibold tabular-nums" : "text-ink-faint tabular-nums"}>
                    {anchor.yearsLost.toFixed(1)} yr
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: isCity ? "#E87040" : "#4a4a4a",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-ink-muted leading-relaxed border-t border-surface-3 pt-3">
          {hm.aqliMethodologyNote}
        </p>
      </div>

      {/* ── Best / Worst months ── */}
      <div className="motion-card rounded-xl bg-surface-2 border border-surface-3 p-5 hover:border-ink-faint/45">
        <div className="text-sm text-ink-faint font-mono mb-3">Seasonal range</div>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-ink-faint mb-1">Best month (lowest PM2.5)</div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-lg font-bold text-ink">{hm.bestMonthName}</span>
              {hm.bestMonthMedian != null && (
                <>
                  <span className="text-base text-ink-muted tabular-nums">
                    {hm.bestMonthMedian.toFixed(1)} µg/m³
                  </span>
                  <BandBadge pm25={hm.bestMonthMedian} />
                </>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm text-ink-faint mb-1">Worst month (highest PM2.5)</div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-lg font-bold text-ink">{hm.worstMonthName}</span>
              {hm.worstMonthMedian != null && (
                <>
                  <span className="text-base text-ink-muted tabular-nums">
                    {hm.worstMonthMedian.toFixed(1)} µg/m³
                  </span>
                  <BandBadge pm25={hm.worstMonthMedian} />
                </>
              )}
            </div>
          </div>

          {hm.bestVisitMonthName && (
            <div className="pt-3 border-t border-surface-3">
              <div className="text-sm text-ink-faint mb-1">Lower-risk month window</div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-aqi-good">{hm.bestVisitMonthName}</span>
                <span className="text-sm text-ink-faint">lowest median + lowest variance</span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
