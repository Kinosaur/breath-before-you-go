"use client";

/**
 * ScrollyTelling — City story prototype
 *
 * Blueprint §Week 5: "Scrollytelling framework: Intersection Observer +
 * D3 transitions. Build 2 of 6 sections for Bangkok."
 *
 * Section 1 — "Every breath":
 *   Annual PM2.5 animates up from 0 when scrolled into view.
 *   WHO guideline shown as proportional comparison bar (0–80 µg/m³ scale).
 *
 * Section 2 — "The invisible toll":
 *   Cigarette equivalence counter animates up.
 *   Life-years context with animated bar.
 *
 * Hook pattern: each animated section extracts its content into a named
 * child component so hooks are called at the top level of a real component,
 * not inside a render-prop closure.
 */

import { useEffect, useRef, useState } from "react";
import { ScrollySection } from "@/components/city/ScrollySection";
import { classifyBand, getBandColor, getBandLabel } from "@/lib/constants";
import type { CityProfile } from "@/lib/types";

interface Props {
  profile: CityProfile;
}

// ── RAF counter hook ──────────────────────────────────────────────────────────

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!active) { setValue(0); return; }
    const startTs = performance.now();

    function tick(now: number) {
      const t    = Math.min((now - startTs) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);   // cubic ease-out
      setValue(target * ease);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else        setValue(target);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, target, duration]);

  return value;
}

// ── Section 1 content (extracted so hooks are at component top level) ─────────

function EveryBreathContent({
  profile,
  visible,
}: {
  profile: CityProfile;
  visible: boolean;
}) {
  const pm25     = profile.healthMetrics.annualMedianPm25;
  const band     = classifyBand(pm25);
  const color    = getBandColor(band);
  const animated = useCountUp(pm25, visible);

  // WHO comparison bar — fixed scale 0–80 µg/m³ so cities are comparable
  const WHO_SCALE  = 80;
  const whoPct     = (5 / WHO_SCALE) * 100;           // ~6.25%
  const cityPct    = Math.min((pm25 / WHO_SCALE) * 100, 100);

  return (
    <div
      className={[
        "max-w-xl text-center transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].join(" ")}
    >
      <p className="text-xs text-ink-muted font-mono uppercase tracking-widest mb-6">
        Section 1 of 2 · Air quality story
      </p>

      <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-8 leading-tight">
        Every breath you take in{" "}
        <span style={{ color }}>{profile.cityName}</span>{" "}
        carries invisible cost.
      </h2>

      {/* Animated PM2.5 — no font-mono on the big number (avoids "20 . 0" decimal spacing) */}
      <div className="relative inline-block mb-6">
        <span
          className="text-7xl sm:text-8xl font-bold"
          style={{ color, fontVariantNumeric: "tabular-nums" }}
        >
          {animated.toFixed(1)}
        </span>
        <span className="text-xl text-ink-muted ml-2">µg/m³</span>
        <div
          className="mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold"
          style={{ background: color, color: "#000" }}
        >
          {getBandLabel(band)}
        </div>
      </div>

      {/* WHO comparison bar on a 0–80 µg/m³ scale */}
      <div className="mt-8 text-left max-w-sm mx-auto">
        <div className="flex justify-between text-xs text-ink-muted font-mono mb-2">
          <span>WHO guideline</span>
          <span>{profile.cityName}</span>
        </div>
        <div className="relative h-2 w-full rounded-full bg-surface-3 overflow-hidden">
          {/* City fill — proportional to PM2.5 on the fixed scale */}
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: visible ? `${cityPct}%` : "0%",
              background: color,
            }}
          />
          {/* WHO 5 µg/m³ marker */}
          <div
            className="absolute top-0 bottom-0 w-px bg-white/70"
            style={{ left: `${whoPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-ink-muted mt-1">
          <span>0 — WHO 5 µg/m³</span>
          <span>
            {pm25.toFixed(1)} µg/m³ — {(pm25 / 5).toFixed(1)}× over limit
          </span>
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

// ── Section 2 content (extracted so hooks are at component top level) ─────────

function InvisibleTollContent({
  profile,
  visible,
}: {
  profile: CityProfile;
  visible: boolean;
}) {
  const cigs      = profile.healthMetrics.cigarettesPerDay;
  const yrsLost   = profile.healthMetrics.yearsLost;
  const maxYears  = 20;   // scale cap for bar
  const animCigs  = useCountUp(cigs,     visible, 1600);
  const animYrs   = useCountUp(yrsLost,  visible, 1800);

  return (
    <div
      className={[
        "max-w-xl text-center transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].join(" ")}
    >
      <p className="text-xs text-ink-muted font-mono uppercase tracking-widest mb-6">
        Section 2 of 2 · Health toll
      </p>

      <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-4 leading-tight">
        Breathing here year-round is like smoking{" "}
        <span className="text-aqi-sensitive">
          {cigs.toFixed(1)} cigarettes
        </span>{" "}
        a day.
      </h2>

      <p className="text-sm text-ink-muted mb-10 max-w-md mx-auto">
        Even if you never light one.
      </p>

      {/* Cigarette counter */}
      <div
        className="text-6xl sm:text-7xl font-bold text-ink mb-2"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {animCigs.toFixed(2)}
      </div>
      <div className="text-ink-muted text-sm mb-12">cigarette equivalents per day</div>

      {/* Life-years bar */}
      <div className="text-left max-w-sm mx-auto">
        <div className="text-xs text-ink-muted font-mono mb-2">
          Estimated life-years at risk (AQLI)
        </div>
        <div className="h-3 w-full rounded-full bg-surface-3 overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-aqi-unhealthy transition-all duration-[1200ms]"
            style={{
              width: visible
                ? `${Math.min((yrsLost / maxYears) * 100, 100)}%`
                : "0%",
            }}
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

// ── Section wrappers ──────────────────────────────────────────────────────────

function SectionEveryBreath({ profile }: { profile: CityProfile }) {
  return (
    <ScrollySection
      threshold={0.4}
      className="min-h-[80vh] flex items-center justify-center py-20"
    >
      {(visible) => <EveryBreathContent profile={profile} visible={visible} />}
    </ScrollySection>
  );
}

function SectionInvisibleToll({ profile }: { profile: CityProfile }) {
  return (
    <ScrollySection
      threshold={0.4}
      className="min-h-[80vh] flex items-center justify-center py-20"
    >
      {(visible) => <InvisibleTollContent profile={profile} visible={visible} />}
    </ScrollySection>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ScrollyTelling({ profile }: Props) {
  return (
    <div className="divide-y divide-surface-3">
      <SectionEveryBreath   profile={profile} />
      <SectionInvisibleToll profile={profile} />
    </div>
  );
}
