"use client";

/**
 * ScrollyTelling — Tier 1 city biography (6 sections)
 *
 * Blueprint §Week 6/8: scrollytelling for Bangkok, Chiang Mai, Delhi.
 * City-specific narrative in sections 3, 5, 6 comes from
 * profile.scrollyContent (CityScrollyContent). Sections 1, 2, 4 are
 * fully data-driven from healthMetrics / monthlyProfiles.
 *
 * Sections:
 *   1 — Every breath        : Annual PM2.5 + WHO comparison bar
 *   2 — The invisible toll   : Cigarettes + life-years
 *   3 — The seasonal spike   : Monthly bar chart + city-specific narrative
 *   4 — When to visit        : 12-month risk grid, safe-exercise days
 *   5 — Two seasons          : Best vs worst month side-by-side
 *   6 — Your window          : Year timeline + traveler recommendations
 *
 * Hook pattern: every section's animated content lives in its own named
 * component so useCountUp is always called at a real component top-level,
 * never inside a render-prop closure.
 */

import { useEffect, useRef, useState } from "react";
import { ScrollySection } from "@/components/city/ScrollySection";
import { classifyBand, getBandColor, getBandLabel } from "@/lib/constants";
import type { CityProfile, MonthlyProfile } from "@/lib/types";

interface Props {
  profile: CityProfile;
}

// ── Month metadata ────────────────────────────────────────────────────────────

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Fallback scrolly content (generic) ───────────────────────────────────────

const FALLBACK_SECTION3 = {
  title: "The seasonal rhythm of pollution.",
  narrative: "Air quality varies dramatically across the year. Some months bring hazardous spikes driven by local or regional sources.",
  causeMonths: [] as number[],
  causeLabel: "peak pollution season",
};
const FALLBACK_SECTION5_NARRATIVE = "The best and worst months reveal just how much the air quality can swing — driven by weather, fires, and human activity.";
const FALLBACK_SECTION6 = {
  title: "Plan your visit around the air quality calendar.",
  intro: "Seasonal patterns repeat year after year. Use the risk timeline below to choose the right window for your trip.",
  bestWindow: { months: "Low-risk months", detail: "Air quality is at its annual best. Outdoor activities are safest during this window." },
  caution:    { months: "Transitional months", detail: "Air quality is improving or deteriorating. Monitor conditions and limit prolonged outdoor exertion." },
  highRisk:   { months: "High-risk months", detail: "Pollution peaks during this period. N95 mask recommended outdoors. Sensitive groups should reconsider travel." },
};

// ── RAF counter hook ──────────────────────────────────────────────────────────

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function useCountUp(target: number, active: boolean, duration = 1400) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!active) { setValue(0); return; }
    // Skip animation for users who prefer reduced motion
    if (reduced) { setValue(target); return; }

    const startTs = performance.now();

    function tick(now: number) {
      const t    = Math.min((now - startTs) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(target * ease);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else        setValue(target);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, target, duration, reduced]);

  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Every breath
// ─────────────────────────────────────────────────────────────────────────────

function EveryBreathContent({ profile, visible }: { profile: CityProfile; visible: boolean }) {
  const pm25     = profile.healthMetrics.annualMedianPm25;
  const band     = classifyBand(pm25);
  const color    = getBandColor(band);
  const animated = useCountUp(pm25, visible);

  const WHO_SCALE = 80;
  const whoPct    = (5 / WHO_SCALE) * 100;
  const cityPct   = Math.min((pm25 / WHO_SCALE) * 100, 100);

  return (
    <div className={[
      "max-w-xl text-center transition-all duration-700",
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
    ].join(" ")}>
      <p className="text-xs text-ink-muted font-mono uppercase tracking-widest mb-6">
        Section 1 of 6 · Air quality story
      </p>

      <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-8 leading-tight">
        Every breath you take in{" "}
        <span style={{ color }}>{profile.cityName}</span>{" "}
        carries invisible cost.
      </h2>

      <div className="relative inline-flex flex-col items-center mb-6">
        <div className="inline-flex items-baseline">
          <span
            className="text-7xl sm:text-8xl font-bold"
            style={{ color, fontVariantNumeric: "tabular-nums" }}
          >
            {animated.toFixed(1)}
          </span>
          <span className="text-xl text-ink-muted ml-2">µg/m³</span>
        </div>
        <div className="mt-3 inline-block px-3 py-1 rounded-full text-sm font-semibold"
          style={{ background: color, color: "#000" }}>
          {getBandLabel(band)}
        </div>
      </div>

      <div className="mt-8 text-left max-w-sm mx-auto">
        <div className="flex justify-between text-xs text-ink-muted font-mono mb-2">
          <span>WHO guideline</span>
          <span>{profile.cityName}</span>
        </div>
        <div
          className="relative h-2 w-full rounded-full bg-surface-3 overflow-hidden"
          role="meter"
          aria-label={`${profile.cityName} PM2.5: ${pm25.toFixed(1)} µg/m³, ${(pm25 / 5).toFixed(1)}× over the WHO 5 µg/m³ guideline`}
          aria-valuenow={pm25}
          aria-valuemin={0}
          aria-valuemax={WHO_SCALE}
        >
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: visible ? `${cityPct}%` : "0%", background: color }}
          />
          <div className="absolute top-0 bottom-0 w-px bg-white/70" style={{ left: `${whoPct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-ink-muted mt-1">
          <span>0 — WHO 5 µg/m³</span>
          <span>{pm25.toFixed(1)} µg/m³ — {(pm25 / 5).toFixed(1)}× over limit</span>
        </div>
      </div>

      <p className="mt-10 text-sm text-ink-muted leading-relaxed max-w-md mx-auto">
        The WHO 2021 annual PM2.5 guideline is 5 µg/m³.
        Long-term exposure above this threshold is linked to cardiovascular
        and respiratory disease.
      </p>
    </div>
  );
}

function SectionEveryBreath({ profile }: { profile: CityProfile }) {
  return (
    <ScrollySection threshold={0.4} className="min-h-[80vh] flex items-center justify-center py-20">
      {(visible) => <EveryBreathContent profile={profile} visible={visible} />}
    </ScrollySection>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — The invisible toll
// ─────────────────────────────────────────────────────────────────────────────

function InvisibleTollContent({ profile, visible }: { profile: CityProfile; visible: boolean }) {
  const cigs     = profile.healthMetrics.cigarettesPerDay;
  const yrsLost  = profile.healthMetrics.yearsLost;
  const maxYears = 20;
  const animCigs = useCountUp(cigs,    visible, 1600);
  const animYrs  = useCountUp(yrsLost, visible, 1800);

  return (
    <div className={[
      "max-w-xl text-center transition-all duration-700",
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
    ].join(" ")}>
      <p className="text-xs text-ink-muted font-mono uppercase tracking-widest mb-6">
        Section 2 of 6 · Health toll
      </p>

      <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-4 leading-tight">
        Breathing here year-round is like smoking{" "}
        <span className="text-aqi-sensitive">{cigs.toFixed(1)} cigarettes</span>{" "}
        a day.
      </h2>

      <p className="text-sm text-ink-muted mb-10 max-w-md mx-auto">Even if you never light one.</p>

      <div
        className="text-6xl sm:text-7xl font-bold text-ink mb-2"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {animCigs.toFixed(2)}
      </div>
      <div className="text-ink-muted text-sm mb-12">cigarette equivalents per day</div>

      <div className="text-left max-w-sm mx-auto">
        <div className="text-xs text-ink-muted font-mono mb-2">Estimated life-years at risk (AQLI)</div>
        <div className="h-3 w-full rounded-full bg-surface-3 overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-aqi-unhealthy transition-all duration-[1200ms]"
            style={{ width: visible ? `${Math.min((yrsLost / maxYears) * 100, 100)}%` : "0%" }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-ink-muted">
          <span>0 yr</span>
          <span className="text-ink font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
            {animYrs.toFixed(1)} years
          </span>
          <span>{maxYears} yr</span>
        </div>
      </div>

      <p className="mt-10 text-[11px] text-ink-muted leading-relaxed max-w-sm mx-auto">
        Berkeley Earth cigarette equivalence: 22 µg/m³ PM2.5 ≈ 1 cigarette/day.
        AQLI life-years: statistical population-level estimate, not individual prediction.{" "}
        <a href="/about" className="underline hover:text-ink-muted">Methodology →</a>
      </p>
    </div>
  );
}

function SectionInvisibleToll({ profile }: { profile: CityProfile }) {
  return (
    <ScrollySection threshold={0.4} className="min-h-[80vh] flex items-center justify-center py-20">
      {(visible) => <InvisibleTollContent profile={profile} visible={visible} />}
    </ScrollySection>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — The seasonal spike
// ─────────────────────────────────────────────────────────────────────────────

function BurningSeasonContent({ profile, visible }: { profile: CityProfile; visible: boolean }) {
  const months  = profile.monthlyProfiles;
  const s3      = profile.scrollyContent?.section3 ?? FALLBACK_SECTION3;
  const causeSet = new Set(s3.causeMonths);

  const maxPm25 = Math.max(...months.map((m) => m.p50 ?? 0), 60); // dynamic scale
  const barH    = 140; // max bar height in px

  return (
    <div className={[
      "max-w-2xl w-full transition-all duration-700",
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
    ].join(" ")}>
      <p className="text-xs text-ink-muted font-mono uppercase tracking-widest mb-6 text-center">
        Section 3 of 6 · Seasonal rhythm
      </p>

      <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-4 leading-tight text-center">
        {s3.title}
      </h2>

      <p className="text-sm sm:text-base text-ink-muted mb-10 text-left max-w-lg mx-auto leading-relaxed">
        {s3.narrative}
      </p>

      {/* Monthly bar chart */}
      <div className="flex items-end justify-center gap-1 sm:gap-1.5 mb-3" style={{ height: barH + 32 }}>
        {months.map((m: MonthlyProfile, i: number) => {
          const isSpike   = causeSet.has(m.month);
          const color     = getBandColor(classifyBand(m.p50));
          const heightPct = Math.min((m.p50 ?? 0) / maxPm25, 1);
          const heightPx  = visible ? Math.round(heightPct * barH) : 0;

          return (
            <div key={m.month} className="flex flex-col items-center gap-1" style={{ minWidth: 0, flex: "1 1 0" }}>
              {/* Spike marker */}
              <div className="text-[10px] leading-none mb-0.5" style={{ opacity: isSpike ? 1 : 0 }}>
                🔥
              </div>

              {/* Bar */}
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: heightPx,
                  background: color,
                  transition: `height ${600 + i * 40}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                  outline: isSpike ? "1px solid rgba(255,120,0,0.6)" : "none",
                  outlineOffset: 1,
                  boxShadow: isSpike ? "0 0 8px rgba(255,100,0,0.25)" : "none",
                }}
                title={`${m.monthName}: ${(m.p50 ?? 0).toFixed(1)} µg/m³`}
              />

              {/* Month label */}
              <span className={[
                "text-[10px] sm:text-[11px] font-mono",
                isSpike ? "text-orange-400 font-bold" : "text-ink-muted",
              ].join(" ")}>
                {MONTH_SHORT[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-[10px] text-ink-muted font-mono mb-6 px-0.5">
        <span>↑ PM2.5 (µg/m³)</span>
        <span>Scale: 0 – {Math.round(maxPm25)} µg/m³</span>
      </div>

      {/* Spike season stats */}
      {s3.causeMonths.length > 0 && (
        <div
          className="grid gap-3 max-w-md mx-auto"
          style={{ gridTemplateColumns: `repeat(${Math.min(s3.causeMonths.length, 4)}, minmax(0, 1fr))` }}
        >
          {s3.causeMonths.map((monthNum) => {
            const m = months[monthNum - 1];
            if (!m) return null;
            return (
              <div key={monthNum} className="rounded-lg bg-surface-3 p-3 text-center border border-orange-400/20">
                <div className="text-[10px] text-orange-400 font-mono font-bold mb-1">
                  {MONTH_SHORT[monthNum - 1]}
                </div>
                <div
                  className="text-xl font-bold"
                  style={{ color: getBandColor(classifyBand(m.p50)), fontVariantNumeric: "tabular-nums" }}
                >
                  {(m.p50 ?? 0).toFixed(0)}
                </div>
                <div className="text-[10px] text-ink-muted mt-0.5">µg/m³</div>
                <div className="text-[10px] text-ink-muted mt-1">
                  {(m.cigarettesPerDay ?? 0).toFixed(1)} cigs/day
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-[11px] text-ink-muted text-center max-w-md mx-auto">
        🔥 = {s3.causeLabel} · Bars show monthly median PM2.5
      </p>
    </div>
  );
}

function SectionBurningSeason({ profile }: { profile: CityProfile }) {
  return (
    <ScrollySection threshold={0.3} className="min-h-[80vh] flex items-center justify-center py-20 px-4">
      {(visible) => <BurningSeasonContent profile={profile} visible={visible} />}
    </ScrollySection>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Seasonal risk profile
// ─────────────────────────────────────────────────────────────────────────────

function WhenToVisitContent({ profile, visible }: { profile: CityProfile; visible: boolean }) {
  const months = profile.monthlyProfiles;
  const best   = profile.healthMetrics.bestMonth;    // 7 (July)
  const worst  = profile.healthMetrics.worstMonth;   // 1 (January)

  return (
    <div className={[
      "max-w-2xl w-full transition-all duration-700",
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
    ].join(" ")}>
      <p className="text-xs text-ink-muted font-mono uppercase tracking-widest mb-6 text-center">
        Section 4 of 6 · Seasonal risk profile
      </p>

      <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-4 leading-tight text-center">
        The difference between months is the difference between
        breathing freely and holding your breath.
      </h2>

      <p className="text-sm sm:text-base text-ink-muted mb-10 text-left max-w-lg mx-auto leading-relaxed">
        Each card shows the monthly median PM2.5 and the share of days safe for outdoor jogging.
      </p>

      {/* 12-month grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-8">
        {months.map((m: MonthlyProfile, i: number) => {
          const band      = classifyBand(m.p50);
          const color     = getBandColor(band);
          const isBest    = m.month === best;
          const isWorst   = m.month === worst;
          const jogSafe   = m.safeDays?.jog ?? 0;

          return (
            <div
              key={m.month}
              className={[
                "rounded-lg p-2.5 text-center border transition-all",
                isBest  ? "border-green-400/60 bg-green-400/5"  : "",
                isWorst ? "border-red-400/40 bg-red-400/5"      : "",
                !isBest && !isWorst ? "border-surface-3 bg-surface-3" : "",
              ].join(" ")}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0.92)",
                transition: `opacity 400ms ${i * 40}ms, transform 400ms ${i * 40}ms`,
              }}
            >
              {/* Badge */}
              <div className="text-[10px] font-bold mb-1 h-3">
                {isBest  && <span className="text-green-400">BEST</span>}
                {isWorst && <span className="text-red-400">WORST</span>}
              </div>

              {/* Month */}
              <div className="text-[11px] font-bold text-ink-muted mb-1">
                {MONTH_SHORT[i]}
              </div>

              {/* PM2.5 dot + value */}
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span
                  className="text-xs font-bold"
                  style={{ color, fontVariantNumeric: "tabular-nums" }}
                >
                  {(m.p50 ?? 0).toFixed(0)}
                </span>
              </div>

              {/* Safe jog % */}
              <div className="text-[10px] text-ink-muted">
                {jogSafe.toFixed(0)}% jog
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-[10px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
          Lower-risk month
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
          Higher-risk month
        </span>
        <span>Numbers = median PM2.5 (µg/m³)</span>
      </div>
    </div>
  );
}

function SectionWhenToVisit({ profile }: { profile: CityProfile }) {
  return (
    <ScrollySection threshold={0.3} className="min-h-[80vh] flex items-center justify-center py-20 px-4">
      {(visible) => <WhenToVisitContent profile={profile} visible={visible} />}
    </ScrollySection>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Two seasons
// ─────────────────────────────────────────────────────────────────────────────

function TwoBangkoksContent({ profile, visible }: { profile: CityProfile; visible: boolean }) {
  const months   = profile.monthlyProfiles;
  const bestIdx  = ((profile.healthMetrics.bestMonth  ?? 1) - 1 + 12) % 12;
  const worstIdx = ((profile.healthMetrics.worstMonth ?? 1) - 1 + 12) % 12;
  const bestM    = months[bestIdx];
  const worstM   = months[worstIdx];

  const animBest  = useCountUp(bestM.p50  ?? 0, visible, 1400);
  const animWorst = useCountUp(worstM.p50 ?? 0, visible, 1400);

  const bestColor  = getBandColor(classifyBand(bestM.p50));
  const worstColor = getBandColor(classifyBand(worstM.p50));

  return (
    <div className={[
      "max-w-xl w-full text-center transition-all duration-700",
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
    ].join(" ")}>
      <p className="text-xs text-ink-muted font-mono uppercase tracking-widest mb-6">
        Section 5 of 6 · The contrast
      </p>

      <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-4 leading-tight">
        The same city. Six months apart.
      </h2>

      <p className="text-sm text-ink-muted mb-12 max-w-md mx-auto leading-relaxed">
        {profile.scrollyContent?.section5.narrative ?? FALLBACK_SECTION5_NARRATIVE}
      </p>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Best month */}
        <div className="rounded-xl border p-5" style={{ borderColor: `${bestColor}40`, background: `${bestColor}08` }}>
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: bestColor }}>
            {bestM.monthName} — best
          </div>
          <div
            className="text-5xl sm:text-6xl font-bold mb-1"
            style={{ color: bestColor, fontVariantNumeric: "tabular-nums" }}
          >
            {animBest.toFixed(1)}
          </div>
          <div className="text-xs text-ink-muted mb-4">µg/m³</div>

          <div className="space-y-2 text-left text-[11px] text-ink-muted">
            <div className="flex justify-between">
              <span>Band</span>
              <span className="font-semibold" style={{ color: bestColor }}>{getBandLabel(classifyBand(bestM.p50))}</span>
            </div>
            <div className="flex justify-between">
              <span>Safe to jog</span>
              <span className="font-semibold text-green-400">{bestM.safeDays?.jog?.toFixed(0) ?? "—"}%</span>
            </div>
            <div className="flex justify-between">
              <span>Cigs/day</span>
              <span className="font-semibold">{(bestM.cigarettesPerDay ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Worst month */}
        <div className="rounded-xl border p-5" style={{ borderColor: `${worstColor}40`, background: `${worstColor}08` }}>
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: worstColor }}>
            {worstM.monthName} — worst
          </div>
          <div
            className="text-5xl sm:text-6xl font-bold mb-1"
            style={{ color: worstColor, fontVariantNumeric: "tabular-nums" }}
          >
            {animWorst.toFixed(1)}
          </div>
          <div className="text-xs text-ink-muted mb-4">µg/m³</div>

          <div className="space-y-2 text-left text-[11px] text-ink-muted">
            <div className="flex justify-between">
              <span>Band</span>
              <span className="font-semibold" style={{ color: worstColor }}>{getBandLabel(classifyBand(worstM.p50))}</span>
            </div>
            <div className="flex justify-between">
              <span>Safe to jog</span>
              <span className="font-semibold" style={{ color: worstColor }}>{worstM.safeDays?.jog?.toFixed(0) ?? "—"}%</span>
            </div>
            <div className="flex justify-between">
              <span>Cigs/day</span>
              <span className="font-semibold">{(worstM.cigarettesPerDay ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ratio callout */}
      <div className="mt-8 rounded-lg bg-surface-3 border border-surface-3 px-5 py-4 text-sm text-ink-muted">
        {worstM.monthName}&apos;s air is{" "}
        <span className="text-ink font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
          {((worstM.p50 ?? 1) / (bestM.p50 ?? 1)).toFixed(1)}×
        </span>{" "}
        worse than {bestM.monthName}&apos;s — yet both are the same city, the same streets, the same people.
      </div>
    </div>
  );
}

function SectionTwoBangkoks({ profile }: { profile: CityProfile }) {
  return (
    <ScrollySection threshold={0.3} className="min-h-[80vh] flex items-center justify-center py-20 px-4">
      {(visible) => <TwoBangkoksContent profile={profile} visible={visible} />}
    </ScrollySection>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — Your window of clean air
// ─────────────────────────────────────────────────────────────────────────────

// Risk colour for the year timeline bar
function riskBg(riskLevel: string): string {
  if (riskLevel === "high")   return "rgba(244,67,54,0.75)";
  if (riskLevel === "medium") return "rgba(255,152,0,0.75)";
  return "rgba(76,175,80,0.75)";
}

function YourWindowContent({ profile, visible }: { profile: CityProfile; visible: boolean }) {
  const riskIndex = profile.monthlyRiskIndex ?? [];
  const s6 = profile.scrollyContent?.section6 ?? FALLBACK_SECTION6;

  return (
    <div className={[
      "max-w-xl w-full text-center transition-all duration-700",
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
    ].join(" ")}>
      <p className="text-xs text-ink-muted font-mono uppercase tracking-widest mb-6">
        Section 6 of 6 · Your window
      </p>

      <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-4 leading-tight">
        {s6.title}
      </h2>

      <p className="text-sm text-ink-muted mb-10 max-w-md mx-auto leading-relaxed">
        {s6.intro}
      </p>

      {/* Year timeline */}
      <div className="mb-3">
        <div className="flex rounded-lg overflow-hidden h-8 mb-2">
          {riskIndex.map((r, i) => (
            <div
              key={r.month}
              className="flex-1"
              style={{
                background: riskBg(r.riskLevel),
                transition: `opacity 500ms ${i * 50}ms`,
                opacity: visible ? 1 : 0,
              }}
              title={`${MONTH_SHORT[i]}: ${r.riskLevel} risk`}
            />
          ))}
        </div>
        <div className="flex text-[10px] text-ink-muted font-mono">
          {MONTH_SHORT.map((s) => (
            <div key={s} className="flex-1 text-center">{s}</div>
          ))}
        </div>
      </div>

      {/* Risk legend */}
      <div className="flex justify-center gap-4 text-[10px] text-ink-muted mb-10">
        {[
          { label: "Low risk",  color: "rgba(76,175,80,0.75)"  },
          { label: "Medium",    color: "rgba(255,152,0,0.75)"  },
          { label: "High risk", color: "rgba(244,67,54,0.75)"  },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* Recommendations */}
      <div className="space-y-3 text-left">
        <div className="rounded-xl bg-surface-3 border border-green-400/20 p-4">
          <div className="text-xs font-bold text-green-400 mb-2">✓ Best time to visit</div>
          <div className="text-sm text-ink">{s6.bestWindow.months}</div>
          <div className="text-xs text-ink-muted mt-1">{s6.bestWindow.detail}</div>
        </div>

        <div className="rounded-xl bg-surface-3 border border-yellow-400/20 p-4">
          <div className="text-xs font-bold text-yellow-400 mb-2">⚠ Proceed with care</div>
          <div className="text-sm text-ink">{s6.caution.months}</div>
          <div className="text-xs text-ink-muted mt-1">{s6.caution.detail}</div>
        </div>

        <div className="rounded-xl bg-surface-3 border border-red-400/20 p-4">
          <div className="text-xs font-bold text-red-400 mb-2">✗ High-risk season</div>
          <div className="text-sm text-ink">{s6.highRisk.months}</div>
          <div className="text-xs text-ink-muted mt-1">{s6.highRisk.detail}</div>
        </div>
      </div>

      <p className="mt-8 text-[11px] text-ink-muted leading-relaxed">
        Risk levels derived from historical seasonal medians ·{" "}
        <a href="/about" className="underline hover:text-ink">Methodology →</a>
      </p>
    </div>
  );
}

function SectionYourWindow({ profile }: { profile: CityProfile }) {
  return (
    <ScrollySection threshold={0.3} className="min-h-[80vh] flex items-center justify-center py-20 px-4">
      {(visible) => <YourWindowContent profile={profile} visible={visible} />}
    </ScrollySection>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function ScrollyTelling({ profile }: Props) {
  return (
    <div className="divide-y divide-surface-3">
      <SectionEveryBreath    profile={profile} />
      <SectionInvisibleToll  profile={profile} />
      <SectionBurningSeason  profile={profile} />
      <SectionWhenToVisit    profile={profile} />
      <SectionTwoBangkoks    profile={profile} />
      <SectionYourWindow     profile={profile} />
    </div>
  );
}
