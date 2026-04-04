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

export function CitySummaryPanel({ profile }: Props) {
  const { narrativeSummary, healthMetrics, monthlyProfiles } = profile;
  const paragraphs = (narrativeSummary ?? "").split(/\n\n+/).filter(Boolean);

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

      {/* ── Narrative text ────────────────────────────────────────────── */}
      <div className="prose prose-sm prose-invert max-w-none">
        {paragraphs.map((para, i) => (
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
