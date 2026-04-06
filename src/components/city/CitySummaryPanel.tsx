"use client";

/**
 * CitySummaryPanel — Tier 2 city narrative
 *
 * Renders the `narrativeSummary` field from a Tier 2 city's profile.json
 * alongside key data callouts derived from the same profile.
 * Paragraphs separated by double-newline (\n\n) in the JSON string.
 */

import { getBandColor, classifyBand } from "@/lib/constants";
import type { CityProfile } from "@/lib/types";

interface Props {
  profile: CityProfile;
}

function buildFallbackParagraphs(profile: CityProfile): string[] {
  const { cityName, healthMetrics, monthlyProfiles, seasonalEvents } = profile;
  const pm25 = healthMetrics.annualMedianPm25;
  const bestM = monthlyProfiles.find((m) => m.month === healthMetrics.bestMonth);
  const worstM = monthlyProfiles.find((m) => m.month === healthMetrics.worstMonth);
  const event = seasonalEvents[0];

  const p1 = `${cityName} has an annual median PM2.5 of ${pm25.toFixed(1)} µg/m³ (${(pm25 / 5).toFixed(1)}× the WHO clean-air baseline). The lowest-risk month is ${healthMetrics.bestMonthName}${bestM?.p50 != null ? ` at ${bestM.p50.toFixed(1)} µg/m³` : ""}, while the highest-risk month is ${healthMetrics.worstMonthName}${worstM?.p50 != null ? ` at ${worstM.p50.toFixed(1)} µg/m³` : ""}.`;

  const p2 = event
    ? `A key local pattern is ${event.event.toLowerCase()} (${event.months.map((m) => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]).join(", ")}), typically linked to ${event.cause.toLowerCase()}. Use the seasonal calendar to choose lower-risk months and the Lung Clock to find safer outdoor hours.`
    : `Seasonal and hourly conditions can vary significantly across the year. Use the seasonal calendar to choose lower-risk months and the Lung Clock to find safer outdoor hours for activity.`;

  return [p1, p2];
}

export function CitySummaryPanel({ profile }: Props) {
  const { narrativeSummary, healthMetrics, monthlyProfiles } = profile;
  const paragraphs = (narrativeSummary ?? "").split(/\n\n+/).filter(Boolean);
  const hasNarrative = paragraphs.length > 0;
  const displayParagraphs = hasNarrative ? paragraphs : buildFallbackParagraphs(profile);

  const pm25      = healthMetrics.annualMedianPm25;
  const pm25Color = getBandColor(classifyBand(pm25));

  const bestM  = monthlyProfiles.find((m) => m.month === healthMetrics.bestMonth);
  const worstM = monthlyProfiles.find((m) => m.month === healthMetrics.worstMonth);

  return (
    <div>
      {/* ── Key stats callout row ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat
          label="Annual median PM2.5"
          value={`${pm25.toFixed(1)} µg/m³`}
          color={pm25Color}
          sub={`${(pm25 / 5).toFixed(1)}× WHO limit`}
        />
        <Stat
          label="Cigarette equiv."
          value={`${healthMetrics.cigarettesPerDay.toFixed(2)} / day`}
          sub="if lived here year-round"
        />
        <Stat
          label="Life expectancy"
          value={`−${healthMetrics.yearsLost.toFixed(2)} yr`}
          color="#F44336"
          sub="vs. WHO clean-air baseline"
        />
        <Stat
          label="Best month"
          value={healthMetrics.bestMonthName}
          color={bestM ? getBandColor(classifyBand(bestM.p50 ?? 0)) : undefined}
          sub={bestM ? `${(bestM.p50 ?? 0).toFixed(1)} µg/m³ median` : ""}
        />
      </div>

      {/* ── Worst / best month contrast ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div
          className="rounded-lg p-4 border"
          style={{
            borderColor: worstM ? `${getBandColor(classifyBand(worstM.p50 ?? 0))}40` : undefined,
            background:  worstM ? `${getBandColor(classifyBand(worstM.p50 ?? 0))}08` : undefined,
          }}
        >
          <div className="text-xs font-mono text-ink-muted uppercase tracking-widest mb-1">Worst month</div>
          <div
            className="font-editorial text-3xl font-bold"
            style={{
              color: worstM ? getBandColor(classifyBand(worstM.p50 ?? 0)) : undefined,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {healthMetrics.worstMonthName}
          </div>
          <div className="text-sm text-ink-muted mt-1">
            {worstM ? `${(worstM.p50 ?? 0).toFixed(1)} µg/m³ · ${(worstM.cigarettesPerDay ?? 0).toFixed(1)} cigs/day` : ""}
          </div>
        </div>

        <div
          className="rounded-lg p-4 border"
          style={{
            borderColor: bestM ? `${getBandColor(classifyBand(bestM.p50 ?? 0))}40` : undefined,
            background:  bestM ? `${getBandColor(classifyBand(bestM.p50 ?? 0))}08` : undefined,
          }}
        >
          <div className="text-xs font-mono text-ink-muted uppercase tracking-widest mb-1">Best month</div>
          <div
            className="font-editorial text-3xl font-bold"
            style={{
              color: bestM ? getBandColor(classifyBand(bestM.p50 ?? 0)) : undefined,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {healthMetrics.bestMonthName}
          </div>
          <div className="text-sm text-ink-muted mt-1">
            {bestM ? `${(bestM.p50 ?? 0).toFixed(1)} µg/m³ · ${(bestM.cigarettesPerDay ?? 0).toFixed(1)} cigs/day` : ""}
          </div>
        </div>
      </div>

      {!hasNarrative && (
        <div className="mb-4 rounded-lg border border-surface-3 bg-surface-3/35 px-3 py-2 text-xs text-ink-muted">
          City-specific long-form narrative is being refreshed. This summary is generated from current city data.
        </div>
      )}

      {/* ── Narrative text ────────────────────────────────────────────── */}
      <div className="prose prose-sm prose-invert max-w-none">
        {displayParagraphs.map((para, i) => (
          <p key={i} className="text-base text-ink-muted leading-relaxed mb-4 last:mb-0">
            {para}
          </p>
        ))}
      </div>

      {/* ── Source note ───────────────────────────────────────────────── */}
      <p className="mt-6 text-xs text-ink-muted font-mono border-t border-surface-3 pt-4">
        Data: OpenAQ API v3 · WHO 2021 AQI Guidelines · Berkeley Earth ·{" "}
        <a href="/about" className="underline hover:text-ink">Methodology →</a>
      </p>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-surface-3 p-3">
      <div className="text-xs text-ink-muted font-mono mb-1">{label}</div>
      <div
        className="text-base font-bold leading-tight"
        style={{ color: color ?? "var(--color-ink)", fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-ink-muted mt-0.5">{sub}</div>}
    </div>
  );
}
