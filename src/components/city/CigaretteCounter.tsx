"use client";

/**
 * CigaretteCounter — Client Component
 *
 * Blueprint §Week 4: "Cigarette Counter odometer + Trip Calculator
 * (multi-city date range input)"
 *
 * Two panels:
 *   1. Odometer — animates to the city's annual cigs/day figure on mount
 *   2. Trip Calculator — pick start/end date → shows total cig equivalence
 *      for that stay, with a per-month breakdown using monthlyProfiles data
 */

import { useEffect, useRef, useState } from "react";
import type { CityProfile } from "@/lib/types";
import { classifyBand, getBandColor, cigEquiv, MONTH_NAMES } from "@/lib/constants";

interface Props {
  profile: CityProfile;
}

type MaskOption = "none" | "surgical" | "kn95" | "n95";

interface MaskScenario {
  label: string;
  low: number;
  mid: number;
  high: number;
}

const MASK_SCENARIOS: Record<MaskOption, MaskScenario> = {
  none: { label: "No mask", low: 0, mid: 0, high: 0 },
  surgical: { label: "Surgical", low: 0.25, mid: 0.4, high: 0.5 },
  kn95: { label: "KN95", low: 0.4, mid: 0.6, high: 0.75 },
  n95: { label: "N95", low: 0.7, mid: 0.85, high: 0.95 },
};

const MASK_ORDER: MaskOption[] = ["none", "surgical", "kn95", "n95"];

function applyMask(cigs: number, efficacy: number): number {
  return cigs * (1 - efficacy);
}

function getMaskRange(cigs: number, mask: MaskOption) {
  const scenario = MASK_SCENARIOS[mask];
  const mid = applyMask(cigs, scenario.mid);
  const lower = applyMask(cigs, scenario.high);
  const upper = applyMask(cigs, scenario.low);
  return { mid, lower, upper };
}

function formatPct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

// ── Odometer digits ───────────────────────────────────────────────────────────

function OdometerDigit({ value, prevValue }: { value: number; prevValue: number }) {
  const [display, setDisplay] = useState(prevValue);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start    = prevValue;
    const end      = value;
    const duration = 1200;
    const startTs  = performance.now();

    function animate(now: number) {
      const elapsed = now - startTs;
      const t       = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const ease    = 1 - Math.pow(1 - t, 3);
      setDisplay(start + (end - start) * ease);
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, prevValue]);

  return <>{display.toFixed(2)}</>;
}

// ── Trip Calculator ───────────────────────────────────────────────────────────

function TripCalculator({
  profile,
  mask,
}: {
  profile: CityProfile;
  mask: MaskOption;
}) {
  const today      = new Date();
  const inTwoWeeks = new Date(today.getTime() + 14 * 86400000);

  const [startDate, setStartDate] = useState(today.toISOString().slice(0, 10));
  const [endDate,   setEndDate]   = useState(inTwoWeeks.toISOString().slice(0, 10));

  // Build month → median PM2.5 lookup from monthlyProfiles
  const monthPm25 = new Map<number, number>();
  profile.monthlyProfiles.forEach((mp) => {
    if (mp.p50 != null) monthPm25.set(mp.month, mp.p50);
  });

  // Compute trip breakdown
  interface DayEntry { date: Date; month: number; pm25: number }
  const days: DayEntry[] = [];

  const start = new Date(startDate + "T12:00:00");
  const end   = new Date(endDate   + "T12:00:00");

  if (end > start) {
    const cur = new Date(start);
    while (cur <= end) {
      const m   = cur.getMonth() + 1;          // 1-based
      const pm25 = monthPm25.get(m) ?? profile.healthMetrics.annualMedianPm25;
      days.push({ date: new Date(cur), month: m, pm25 });
      cur.setDate(cur.getDate() + 1);
    }
  }

  const totalCigs = days.reduce((sum, d) => sum + cigEquiv(d.pm25), 0);
  const scenario = MASK_SCENARIOS[mask];
  const adjusted = getMaskRange(totalCigs, mask);
  const displayTotal = mask === "none" ? totalCigs : adjusted.mid;

  // Group by calendar month for breakdown
  const byMonth: Map<number, { count: number; pm25: number }> = new Map();
  days.forEach(({ month, pm25 }) => {
    const existing = byMonth.get(month);
    if (existing) existing.count++;
    else byMonth.set(month, { count: 1, pm25 });
  });

  const today10 = today.toISOString().slice(0, 10);

  return (
    <div className="rounded-xl bg-surface-2 border border-surface-3 p-5">
      <div className="text-xs text-ink-faint font-mono mb-4">Trip calculator</div>

      {/* Date inputs */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-ink-faint font-mono">Arrival</label>
          <input
            type="date"
            value={startDate}
            min={today10}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-surface-3 border border-surface-3 text-ink text-xs rounded-lg px-3 py-2
                       transition-colors focus:outline-none focus:border-ink-faint hover:border-ink-faint/60 font-mono"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-ink-faint font-mono">Departure</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-surface-3 border border-surface-3 text-ink text-xs rounded-lg px-3 py-2
                       transition-colors focus:outline-none focus:border-ink-faint hover:border-ink-faint/60 font-mono"
          />
        </div>
      </div>

      {days.length === 0 ? (
        <p className="text-xs text-ink-faint">Select a valid date range.</p>
      ) : (
        <>
          {/* Summary */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold text-ink tabular-nums">
              {displayTotal.toFixed(1)}
            </span>
            <span className="text-sm text-ink-muted">
              {mask === "none" ? "cigarette equivalents" : `${scenario.label} adjusted estimate`}
            </span>
            <span className="text-xs text-ink-faint">over {days.length} days</span>
          </div>

          {mask === "none" ? (
            <p className="-mt-2 mb-4 text-[10px] text-ink-faint leading-relaxed">
              Planning estimate from monthly median PM2.5 values, not a personal clinical dose.
            </p>
          ) : (
            <p className="-mt-2 mb-4 text-[10px] text-ink-faint leading-relaxed">
              Unmasked baseline: {totalCigs.toFixed(1)} cigs. With {scenario.label}, estimated range: {" "}
              {adjusted.lower.toFixed(1)}-{adjusted.upper.toFixed(1)} cigs.
            </p>
          )}

          {/* Per-month breakdown */}
          {byMonth.size > 0 && (
            <div className="space-y-2">
              {Array.from(byMonth.entries()).map(([month, { count, pm25 }]) => {
                const baseCigs = cigEquiv(pm25) * count;
                const cigs = mask === "none" ? baseCigs : applyMask(baseCigs, scenario.mid);
                const band = classifyBand(pm25);
                const color = getBandColor(band);
                return (
                  <div
                    key={month}
                    className="group flex items-center gap-3 text-xs rounded-md px-1.5 py-1 transition-colors hover:bg-surface-3/60"
                    aria-label={`${MONTH_NAMES[month - 1]}: ${pm25.toFixed(1)} µg/m³ median PM2.5`}
                  >
                    <span className="w-8 text-ink-faint font-mono text-right tabular-nums">
                      {MONTH_NAMES[month - 1].slice(0, 3)}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((cigs / Math.max(displayTotal, 0.01)) * 100, 100)}%`,
                          background: color,
                        }}
                      />
                    </div>
                    <span className="w-24 text-ink-muted tabular-nums text-right">
                      {cigs.toFixed(1)} cigs · {count}d
                    </span>
                    <span className="hidden sm:inline text-[10px] text-ink-faint opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      {pm25.toFixed(1)} µg/m³
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-4 text-[10px] text-ink-faint leading-relaxed border-t border-surface-3 pt-3">
            Based on monthly median PM2.5 values. Actual exposure varies by fit, wear time,
            location, activity, and daily conditions.{" "}
            <a href="/about" className="underline hover:text-ink-muted">Methodology →</a>
          </p>
        </>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function CigaretteCounter({ profile }: Props) {
  const targetCigs = profile.healthMetrics.cigarettesPerDay;
  const [animating, setAnimating] = useState(false);
  const [mask, setMask] = useState<MaskOption>("none");

  const scenario = MASK_SCENARIOS[mask];
  const dailyAdjusted = getMaskRange(targetCigs, mask);

  useEffect(() => {
    // Trigger odometer animation after a short delay on mount
    const t = setTimeout(() => setAnimating(true), 300);
    return () => clearTimeout(t);
  }, []);

  function onMaskKeyDown(current: MaskOption, key: string) {
    const idx = MASK_ORDER.indexOf(current);
    if (idx === -1) return;
    if (key === "ArrowRight" || key === "ArrowDown") {
      setMask(MASK_ORDER[(idx + 1) % MASK_ORDER.length]);
    }
    if (key === "ArrowLeft" || key === "ArrowUp") {
      setMask(MASK_ORDER[(idx - 1 + MASK_ORDER.length) % MASK_ORDER.length]);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-surface-2 border border-surface-3 p-4">
        <div className="text-xs text-ink-faint font-mono mb-2">
          Exposure scenario (optional)
        </div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Mask exposure scenario">
          {MASK_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={mask === key}
              tabIndex={mask === key ? 0 : -1}
              aria-label={`${MASK_SCENARIOS[key].label} mask scenario`}
              onClick={() => setMask(key)}
              onKeyDown={(e) => onMaskKeyDown(key, e.key)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-faint focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2
                active:scale-[0.98] ${
                mask === key
                  ? "bg-ink text-surface border-ink shadow-sm"
                  : "bg-surface-3 text-ink-muted border-surface-3 hover:text-ink hover:border-ink-faint/70 hover:bg-surface"
              }`}
            >
              {MASK_SCENARIOS[key].label}
            </button>
          ))}
        </div>
        {mask !== "none" && (
          <p className="mt-2 text-[10px] text-ink-faint leading-relaxed">
            Estimated filtration: {formatPct(scenario.mid)} typical (range {formatPct(scenario.low)}-{formatPct(scenario.high)}).
          </p>
        )}
        <p className="mt-3 text-[10px] text-ink-faint leading-relaxed">
          Baseline remains unmasked. Mask options are scenario estimates and include uncertainty.
        </p>
      </div>

      {/* Odometer card */}
      <div className="rounded-xl bg-surface-2 border border-surface-3 p-5">
        <div className="text-xs text-ink-faint font-mono mb-1">
          Daily cigarette equivalence (annual average)
        </div>

        <div className="flex items-baseline gap-3 my-3">
          <span className="text-5xl font-bold text-ink tabular-nums font-mono">
            <OdometerDigit
              value={animating ? targetCigs : 0}
              prevValue={0}
            />
          </span>
          <span className="text-lg text-ink-muted">cigs / day</span>
        </div>

        {/* Cigarette visual — one icon per whole cigarette, up to 10 */}
        <div className="flex flex-wrap gap-1 my-3" aria-hidden="true">
          {Array.from({ length: Math.min(Math.ceil(targetCigs), 10) }).map((_, i) => {
            const filled = i < targetCigs;
            return (
              <div
                key={i}
                className="h-5 w-2.5 rounded-sm"
                style={{
                  background: filled ? "#e0c89a" : "#2a2a2a",
                  opacity: filled ? (i + 1 <= Math.floor(targetCigs) ? 1 : targetCigs % 1) : 0.3,
                }}
              />
            );
          })}
          {targetCigs > 10 && (
            <span className="text-xs text-ink-faint self-center ml-1">
              +{(targetCigs - 10).toFixed(1)} more
            </span>
          )}
        </div>

        <p className="text-[10px] text-ink-faint leading-relaxed">
          Berkeley Earth conversion: 22 µg/m³ PM2.5 ≈ 1 cigarette/day.
          Statistical communication tool — not a clinical diagnosis.
        </p>

        {mask !== "none" && (
          <p className="mt-2 text-[10px] text-ink-faint leading-relaxed">
            If consistently wearing {scenario.label}, indicative estimate: {dailyAdjusted.mid.toFixed(2)} cigs/day
            (range {dailyAdjusted.lower.toFixed(2)}-{dailyAdjusted.upper.toFixed(2)}).
          </p>
        )}
      </div>

      {/* Trip calculator */}
      <TripCalculator profile={profile} mask={mask} />
    </div>
  );
}
