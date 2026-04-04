"use client";

/**
 * LungClock — Client Component (D3)
 *
 * Blueprint §Week 5: "D3 radial chart (fixed 400px SVG), 24 arcs,
 * WHO color bands, sunrise overlay."
 *
 * Layout redesign (overlap-proof):
 *   • All text lives in HTML/React — ZERO text in the SVG
 *   • 18:00 / 06:00 labels are HTML flex items beside the SVG
 *   • 00:00 / 12:00 labels are HTML above / below
 *   • Center panel is a React absolute overlay — no D3 text at all
 *   • SVG draws only graphical primitives: arcs, wedge, dots, pointer
 *   • Sunrise/sunset times shown in a clean annotation row below the clock
 *   • < 400px container → horizontal bar fallback
 */

import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import type { HourlyEntry } from "@/lib/types";
import {
  classifyBand,
  getBandColor,
  getBandLabel,
  getBandTextColor,
  EXERCISE_THRESHOLDS,
} from "@/lib/constants";
import { computeSunriseSunset, dayOfYear } from "@/lib/sun";

// ── Constants ─────────────────────────────────────────────────────────────────

const SVG_SIZE  = 400;
const CX        = SVG_SIZE / 2;   // 200
const CY        = SVG_SIZE / 2;   // 200
const INNER_R   = 88;
const OUTER_R   = 160;
const PAD_ANGLE = 0.028;
const SAFE_RING = OUTER_R + 18;  // cleared above the taller current-hour arc
const TOOLTIP_W  = 220;
const TOOLTIP_H  = 42;
const TOOLTIP_GAP = 14;

type Activity = "none" | "walk" | "cycle" | "jog";

const ACTIVITY_LABELS: Record<Activity, string> = {
  none:  "No filter",
  walk:  "Walking",
  cycle: "Cycling",
  jog:   "Jogging",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function hourToAngle(h: number): number {
  // D3 arc angle 0 is already at 12 o'clock, positive clockwise.
  // Keep 00:00 at top, 06:00 right, 12:00 bottom, 18:00 left.
  return (h / 24) * 2 * Math.PI;
}

function isSafeForActivity(entry: HourlyEntry, activity: Activity): boolean {
  if (activity === "none")  return true;
  // Prefer pipeline-computed flags so UI always matches exported data logic.
  if (activity === "walk") {
    return entry.safeForWalk ?? entry.value <= EXERCISE_THRESHOLDS.walk;
  }
  if (activity === "cycle") {
    return entry.safeForCycle ?? entry.value <= EXERCISE_THRESHOLDS.cycle;
  }
  if (activity === "jog") {
    return entry.safeForJog ?? entry.value <= EXERCISE_THRESHOLDS.jog;
  }
  return true;
}

/** Format a decimal hour (e.g. 6.2) as "6:12 am" */
function formatHour(h: number): string {
  const totalMin = Math.round(h * 60) % (24 * 60);
  const hours    = Math.floor(totalMin / 60);
  const mins     = totalMin % 60;
  const ampm     = hours < 12 ? "am" : "pm";
  const disp     = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${disp}:${mins.toString().padStart(2, "0")} ${ampm}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  typicalDay: HourlyEntry[];
  lat:        number;
  cityName:   string;
  timezone:   string;
}

type ClockEntry = HourlyEntry & { isMissing?: boolean };

function getCityNow(timezone: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hourStr = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minStr  = parts.find((p) => p.type === "minute")?.value ?? "00";

  return {
    hour: Number.parseInt(hourStr, 10),
    minute: Number.parseInt(minStr, 10),
  };
}

export function LungClock({ typicalDay, lat, cityName, timezone }: Props) {
  const svgRef       = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activity,    setActivity]    = useState<Activity>("none");
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [tooltipPos,  setTooltipPos]  = useState({ x: 0, y: 0, flip: false });
  const [isNarrow,    setIsNarrow]    = useState(false);
  const [cityNow,     setCityNow]     = useState(() => getCityNow(timezone));

  const { sunrise, sunset } = useMemo(
    () => computeSunriseSunset(lat, dayOfYear()),
    [lat],
  );

  // Normalize by hour so all visual layers (arcs, dots, center, fallback)
  // read the exact same hour-indexed source of truth.
  const dayByHour = useMemo<ClockEntry[]>(() => {
    const byHour = new Map<number, HourlyEntry>();
    for (const entry of typicalDay) {
      if (entry.hour >= 0 && entry.hour <= 23) byHour.set(entry.hour, entry);
    }
    return Array.from({ length: 24 }, (_, hour) => {
      const entry = byHour.get(hour);
      if (entry) return entry;
      return {
        hour,
        value: Number.NaN,
        band: "unknown",
        color: "#707070",
        safeForWalk: false,
        safeForCycle: false,
        safeForJog: false,
        isMissing: true,
      };
    });
  }, [typicalDay]);

  useEffect(() => {
    setCityNow(getCityNow(timezone));
    const timer = window.setInterval(() => {
      setCityNow(getCityNow(timezone));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [timezone]);

  const currentHour   = cityNow.hour;
  const currentMinute = cityNow.minute;

  // Responsive: swap to linear fallback if container < 400px
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < 400);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // ── D3 render — ONLY graphical primitives, ZERO text ──────────────────────
  // hoveredHour is NOT in the dep array, so hover won't rebuild the D3 chart.
  useEffect(() => {
    if (!svgRef.current || isNarrow) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // ── Daylight wedge ──────────────────────────────────────────────────────
    const sunriseA = hourToAngle(sunrise);
    const sunsetA  = hourToAngle(sunset);
    const sunArc   = d3.arc<unknown>()
      .innerRadius(INNER_R - 4)
      .outerRadius(OUTER_R + 4)
      .startAngle(sunriseA)
      .endAngle(sunsetA);

    svg.append("path")
      .attr("transform", `translate(${CX},${CY})`)
      .attr("d", sunArc(null)!)
      .attr("fill", "rgba(255,200,80,0.18)")
      .attr("stroke", "rgba(255,200,80,0.55)")
      .attr("stroke-width", 1.5);

    // ── 24 arcs ─────────────────────────────────────────────────────────────
    dayByHour.forEach((entry) => {
      const h      = entry.hour;
      // Center each hourly arc on the integer hour label.
      const startA = hourToAngle(h - 0.5);
      const endA   = hourToAngle(h + 0.5);
      const color  = entry.isMissing ? "#5a5a5a" : getBandColor(classifyBand(entry.value));
      const safe   = !entry.isMissing && isSafeForActivity(entry, activity);
      const isCur  = !entry.isMissing && h === currentHour;
      const outerR = isCur ? OUTER_R + 10 : OUTER_R;

      const arcGen = d3.arc<unknown>()
        .innerRadius(INNER_R)
        .outerRadius(outerR)
        .startAngle(startA)
        .endAngle(endA)
        .padAngle(PAD_ANGLE)
        .cornerRadius(2);

      svg.append("path")
        .attr("transform", `translate(${CX},${CY})`)
        .attr("d", arcGen(null)!)
        .attr("fill", color)
        .attr("opacity", entry.isMissing ? 0.35 : activity !== "none" && !safe ? 0.15 : isCur ? 1 : 0.82)
        .attr("stroke", isCur ? "#ffffff" : "none")
        .attr("stroke-width", isCur ? 2 : 0)
        .style("cursor", "pointer")
        .on("mouseenter", (event: PointerEvent) => {
          setHoveredHour(h);
          updateTooltipPosition(event.clientX, event.clientY);
        })
        .on("pointermove", (event: PointerEvent) => {
          setHoveredHour(h);
          updateTooltipPosition(event.clientX, event.clientY);
        })
        .on("mouseleave", () => setHoveredHour(null));

      // Safe-activity outer dot
      if (activity !== "none" && safe) {
        const midA = (startA + endA) / 2;
        const plotA = midA - Math.PI / 2;
        svg.append("circle")
          .attr("cx", CX + Math.cos(plotA) * SAFE_RING)
          .attr("cy", CY + Math.sin(plotA) * SAFE_RING)
          .attr("r", 2.5)
          .attr("fill", "#4CAF50")
          .attr("opacity", 0.85);
      }
    });

  }, [dayByHour, activity, sunrise, sunset, isNarrow, currentHour]);

  // ── Center display data (React state — no D3 involvement) ─────────────────
  const currentEntry = dayByHour.find((entry) => entry.hour === currentHour) ?? dayByHour[0];
  const hoveredEntry = hoveredHour !== null
    ? dayByHour.find((entry) => entry.hour === hoveredHour)
    : null;
  const displayEntry = hoveredHour !== null
    ? hoveredEntry
    : currentEntry;
  const displayBand  = classifyBand(displayEntry?.value);
  const displayColor = getBandColor(displayBand);
  const isHovering   = hoveredHour !== null;
  const safeHours = activity === "none"
    ? dayByHour.filter((entry) => !entry.isMissing).length
    : dayByHour.filter((entry) => !entry.isMissing && isSafeForActivity(entry, activity)).length;

  function updateTooltipPosition(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const flip = localY < rect.height * 0.38;

    let x = localX + TOOLTIP_GAP;
    let y = flip ? localY + TOOLTIP_GAP : localY - TOOLTIP_H - TOOLTIP_GAP;

    if (x + TOOLTIP_W > rect.width - 8) x = localX - TOOLTIP_W - TOOLTIP_GAP;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    if (y + TOOLTIP_H > rect.height - 8) y = rect.height - TOOLTIP_H - 8;

    setTooltipPos({ x, y, flip });
  }

  // ── Linear fallback (narrow containers) ───────────────────────────────────
  if (isNarrow) {
    return (
      <div ref={containerRef}>
        <ActivitySelector activity={activity} onChange={setActivity} />
        <div className="overflow-x-auto mt-3">
          <div className="flex gap-1 min-w-max px-1 pb-2">
            {dayByHour.map((entry) => {
              const safe  = !entry.isMissing && isSafeForActivity(entry, activity);
              const color = entry.isMissing ? "#5a5a5a" : getBandColor(classifyBand(entry.value));
              const isCur = !entry.isMissing && entry.hour === currentHour;
              return (
                <div key={entry.hour} className="flex flex-col items-center gap-1">
                  <div
                    className="w-6 rounded-sm"
                    style={{
                      height: 40,
                      background: color,
                      opacity: entry.isMissing ? 0.35 : activity !== "none" && !safe ? 0.2 : 1,
                      outline: isCur ? "2px solid #fff" : "none",
                    }}
                  />
                  <span className="text-[9px] text-ink-faint font-mono">
                    {entry.hour.toString().padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <LinearLegend />
      </div>
    );
  }

  // ── Radial clock ──────────────────────────────────────────────────────────
  return (
    <div ref={containerRef}>
      <ActivitySelector activity={activity} onChange={setActivity} />
      {activity !== "none" && (
        <div className="mt-2 text-[10px] text-ink-muted font-mono">
          Safe windows for {ACTIVITY_LABELS[activity].toLowerCase()}: {safeHours}/{dayByHour.length} hours
        </div>
      )}

      {/* ── 00:00 label above ─────────────────────────────────────────── */}
      <div className="text-center mt-1 mb-0">
        <span className="text-xs font-bold text-ink-muted font-mono">00:00</span>
      </div>

      {/* ── Middle row: 18:00 | clock | 06:00 ────────────────────────── */}
      <div className="flex items-center justify-center gap-0">

        {/* Left label */}
        <div className="flex-none w-12 text-right pr-0.5">
          <span className="text-xs font-bold text-ink-muted font-mono leading-none">18:00</span>
        </div>

        {/* Clock + overlays */}
        <div className="relative w-full max-w-[400px]">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            width="100%"
            style={{ display: "block" }}
            aria-label={`Lung Clock for ${cityName} — 24-hour air quality radial chart`}
          />

          {/* ── Center overlay (React state, zero D3 rebuilds on hover) ── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center select-none">
              {displayEntry ? (
                <>
                  <div
                    className="text-2xl font-bold leading-none"
                    style={{ color: displayColor, fontVariantNumeric: "tabular-nums" }}
                  >
                    {displayEntry.isMissing ? "--" : displayEntry.value.toFixed(1)}
                  </div>
                  <div className="text-[9px] text-ink-faint mt-0.5">µg/m³</div>
                  <div
                    className="text-[9px] font-semibold mt-1"
                    style={{ color: displayColor }}
                  >
                    {displayEntry.isMissing ? "No Data" : getBandLabel(displayBand)}
                  </div>
                  <div className="text-[8px] font-mono mt-1.5" style={{ color: "#505050" }}>
                    {isHovering
                      ? `${hoveredHour!.toString().padStart(2, "0")}:00`
                      : `now · ${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`}
                  </div>
                </>
              ) : (
                <div className="text-[9px] text-ink-faint">—</div>
              )}
            </div>
          </div>

          {/* ── Arc hover tooltip ─────────────────────────────────────── */}
          {isHovering && displayEntry && (
            <div
              className="absolute pointer-events-none rounded-lg bg-surface-2 border border-surface-3 px-3 py-1.5 text-xs
                          text-center shadow-lg whitespace-nowrap transition-all duration-100 ease-out"
              style={{
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
                transform: tooltipPos.flip ? "translateY(0)" : "none",
              }}
            >
              <span className="font-mono font-bold text-ink">
                {hoveredHour!.toString().padStart(2, "0")}:00
                {" — "}
                {displayEntry.isMissing ? "No hourly data" : `${displayEntry.value.toFixed(1)} µg/m³`}
              </span>
              {!displayEntry.isMissing && (
                <span
                  className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{
                    background: getBandColor(classifyBand(displayEntry.value)),
                    color: getBandTextColor(classifyBand(displayEntry.value)),
                  }}
                >
                  {getBandLabel(classifyBand(displayEntry.value))}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right label */}
        <div className="flex-none w-12 pl-0.5">
          <span className="text-xs font-bold text-ink-muted font-mono leading-none">06:00</span>
        </div>
      </div>

      {/* ── 12:00 label below ─────────────────────────────────────────── */}
      <div className="text-center mt-0 mb-1">
        <span className="text-xs font-bold text-ink-muted font-mono">12:00</span>
      </div>

      {/* ── Sunrise / sunset annotation ───────────────────────────────── */}
      <div className="mt-3 space-y-1.5">
        {/* Daylight window legend */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-1 text-[10px] font-mono text-ink-muted">
          <div className="flex items-center gap-1.5">
            <span>☀️ Sunrise {formatHour(sunrise)}</span>
            <span className="text-ink-faint/60">·</span>
            <span>🌇 Sunset {formatHour(sunset)}</span>
            <span className="text-ink-faint/60">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-1.5 rounded-sm flex-shrink-0"
                style={{ background: "rgba(255,200,80,0.55)", border: "1px solid rgba(255,200,80,0.7)" }}
              />
              <span className="text-ink-faint/80">daylight window</span>
            </span>
          </div>
        </div>
        
        {/* Current hour and activity legends */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-1 text-[10px] font-mono text-ink-muted">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-2.5 h-2.5 border-2 border-white/75 rounded flex-shrink-0"
              style={{ background: "transparent" }}
            />
            <span className="text-ink-faint/80">white outline = current hour</span>
          </div>
          {activity !== "none" && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-aqi-good flex-shrink-0" />
              <span className="text-ink-faint/80">dots = safe for {ACTIVITY_LABELS[activity].toLowerCase()}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0 bg-[#5a5a5a]/80 border border-surface-3" />
            <span className="text-ink-faint/80">gray arc = missing hourly data</span>
          </div>
        </div>
      </div>

      <LinearLegend />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ActivitySelector({
  activity,
  onChange,
}: {
  activity: Activity;
  onChange: (a: Activity) => void;
}) {
  return (
    <div>
      <div className="text-[10px] text-ink-muted font-mono mb-2">
        Activity safety filter
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Activity filter">
        {(["none", "walk", "cycle", "jog"] as Activity[]).map((opt) => {
          const isActive = activity === opt;

          return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={activity === opt}
            onClick={() => onChange(opt)}
            className={[
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-all duration-200",
              isActive
                ? "bg-ink text-[#080B12] border-ink font-semibold"
                : "bg-surface-3 text-ink-muted border-surface-3 hover:text-ink hover:border-ink-faint/50",
            ].join(" ")}
          >
            {opt === "none" ? "All hours" : ACTIVITY_LABELS[opt]}
            {opt !== "none" && (
              <span className={isActive ? "text-[#080B12]/80 text-[10px]" : "text-ink-muted text-[10px]"}>
                {"≤ "}{EXERCISE_THRESHOLDS[opt as Exclude<Activity, "none">]} µg
              </span>
            )}
          </button>
          );
        })}
      </div>
    </div>
  );
}

function LinearLegend() {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
      {[
        { label: "Good",      color: "#4CAF50" },
        { label: "Moderate",  color: "#FFEB3B" },
        { label: "Sensitive", color: "#FF9800" },
        { label: "Unhealthy", color: "#F44336" },
        { label: "Hazardous", color: "#9C27B0" },
      ].map(({ label, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
          <span className="text-[10px] text-ink-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}
