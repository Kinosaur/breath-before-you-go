"use client";

/**
 * LungClock — Client Component (D3)
 *
 * Blueprint §Week 5: "D3 radial chart (fixed 400px SVG), 24 arcs,
 * WHO color bands, sunrise overlay."
 *
 * Layout (polar, 12 o'clock = midnight):
 *   • 24 arcs — one per hour, colored by WHO PM2.5 band
 *   • Sunrise / sunset golden wedge overlay
 *   • Activity selector (walk / cycle / jog) dims unsafe hours
 *   • Current-hour pointer
 *   • Center: live PM2.5 + band label
 *   • < 400px container → linear bar fallback (horizontal scrollable list)
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

const SVG_SIZE   = 400;
const CX         = SVG_SIZE / 2;           // 200
const CY         = SVG_SIZE / 2;           // 200
const INNER_R    = 88;
const OUTER_R    = 160;
const PAD_ANGLE  = 0.028;                  // ~1.6° gap between arcs
const LABEL_R    = 178;                    // hour-label orbit radius
const SAFE_RING  = OUTER_R + 8;           // outer safety ring radius

type Activity = "none" | "walk" | "cycle" | "jog";

const ACTIVITY_LABELS: Record<Activity, string> = {
  none:  "No filter",
  walk:  "Walking",
  cycle: "Cycling",
  jog:   "Jogging",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert hour (0–24) to SVG angle (radians, 0 at top = midnight). */
function hourToAngle(h: number): number {
  return (h / 24) * 2 * Math.PI - Math.PI / 2;
}

function isSafeForActivity(entry: HourlyEntry, activity: Activity): boolean {
  if (activity === "none") return true;
  if (activity === "walk")  return entry.value <= EXERCISE_THRESHOLDS.walk;
  if (activity === "cycle") return entry.value <= EXERCISE_THRESHOLDS.cycle;
  if (activity === "jog")   return entry.value <= EXERCISE_THRESHOLDS.jog;
  return true;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  typicalDay: HourlyEntry[];
  lat:        number;
  cityName:   string;
}

export function LungClock({ typicalDay, lat, cityName }: Props) {
  const svgRef       = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activity, setActivity]     = useState<Activity>("none");
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [isNarrow, setIsNarrow]     = useState(false);

  // Sunrise / sunset computed once on the client
  const { sunrise, sunset } = useMemo(
    () => computeSunriseSunset(lat, dayOfYear()),
    [lat],
  );

  const currentHour = new Date().getHours();

  // Responsive: swap to linear if container < 400px
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < 400);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // ── D3 render ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current || isNarrow) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // ── Sunrise / sunset background wedge ──
    const sunriseA = hourToAngle(sunrise);
    const sunsetA  = hourToAngle(sunset);
    const sunArc   = d3.arc<unknown>()
      .innerRadius(INNER_R - 6)
      .outerRadius(OUTER_R + 6)
      .startAngle(sunriseA)
      .endAngle(sunsetA);

    svg.append("path")
      .attr("transform", `translate(${CX},${CY})`)
      .attr("d", sunArc(null)!)
      .attr("fill", "rgba(255,200,80,0.08)")
      .attr("stroke", "rgba(255,200,80,0.22)")
      .attr("stroke-width", 1);

    // Sunrise / sunset tick marks
    [{ h: sunrise, label: "🌅" }, { h: sunset, label: "🌇" }].forEach(({ h, label }) => {
      const a = hourToAngle(h);
      const rx = CX + Math.cos(a) * (OUTER_R + 18);
      const ry = CY + Math.sin(a) * (OUTER_R + 18);
      svg.append("text")
        .attr("x", rx).attr("y", ry)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", 11)
        .text(label);
    });

    // ── 24 arcs ──
    typicalDay.forEach((entry) => {
      const h      = entry.hour;
      const startA = hourToAngle(h);
      const endA   = hourToAngle(h + 1);
      const color  = getBandColor(classifyBand(entry.value));
      const safe   = isSafeForActivity(entry, activity);
      const isCur  = h === currentHour;

      const outerR = isCur ? OUTER_R + 4 : OUTER_R;

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
        .attr("opacity", activity !== "none" && !safe ? 0.18 : isCur ? 1 : 0.82)
        .attr("stroke", isCur ? "#fff" : "none")
        .attr("stroke-width", isCur ? 0.8 : 0)
        .style("cursor", "pointer")
        .on("mouseenter", () => setHoveredHour(h))
        .on("mouseleave", () => setHoveredHour(null));

      // Safe-activity outer ring dot
      if (activity !== "none" && safe) {
        const midA = (startA + endA) / 2;
        const rx   = CX + Math.cos(midA) * SAFE_RING;
        const ry   = CY + Math.sin(midA) * SAFE_RING;
        svg.append("circle")
          .attr("cx", rx).attr("cy", ry)
          .attr("r", 2.5)
          .attr("fill", "#4CAF50")
          .attr("opacity", 0.85);
      }
    });

    // ── Hour labels (0, 6, 12, 18) ──
    [0, 6, 12, 18].forEach((h) => {
      const a  = hourToAngle(h);
      const rx = CX + Math.cos(a) * LABEL_R;
      const ry = CY + Math.sin(a) * LABEL_R;
      svg.append("text")
        .attr("x", rx).attr("y", ry)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", 10)
        .attr("fill", "#5a5a5a")
        .attr("font-family", "monospace")
        .text(`${h.toString().padStart(2, "0")}:00`);
    });

    // ── Center ──
    const hovered = hoveredHour !== null ? typicalDay[hoveredHour] : typicalDay[currentHour];
    const centerBand  = classifyBand(hovered?.value);
    const centerColor = getBandColor(centerBand);

    svg.append("circle")
      .attr("cx", CX).attr("cy", CY)
      .attr("r", INNER_R - 2)
      .attr("fill", "#0a0a0a");

    svg.append("text")
      .attr("x", CX).attr("y", CY - 14)
      .attr("text-anchor", "middle")
      .attr("font-size", 22)
      .attr("font-weight", "700")
      .attr("fill", centerColor)
      .attr("font-family", "monospace")
      .text(hovered ? `${hovered.value.toFixed(1)}` : "–");

    svg.append("text")
      .attr("x", CX).attr("y", CY + 5)
      .attr("text-anchor", "middle")
      .attr("font-size", 9)
      .attr("fill", "#9e9e9e")
      .text("µg/m³");

    svg.append("text")
      .attr("x", CX).attr("y", CY + 20)
      .attr("text-anchor", "middle")
      .attr("font-size", 8)
      .attr("fill", centerColor)
      .attr("font-weight", "600")
      .text(getBandLabel(centerBand));

    // ── "Now" label below center ──
    const nowA = hourToAngle(currentHour + 0.5);
    svg.append("line")
      .attr("x1", CX + Math.cos(nowA) * (INNER_R + 2))
      .attr("y1", CY + Math.sin(nowA) * (INNER_R + 2))
      .attr("x2", CX + Math.cos(nowA) * (INNER_R - 14))
      .attr("y2", CY + Math.sin(nowA) * (INNER_R - 14))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("stroke-linecap", "round");

  }, [typicalDay, activity, hoveredHour, sunrise, sunset, currentHour, isNarrow]);

  // ── Linear fallback ───────────────────────────────────────────────────────
  if (isNarrow) {
    return (
      <div ref={containerRef}>
        <ActivitySelector activity={activity} onChange={setActivity} />
        <div className="overflow-x-auto mt-3">
          <div className="flex gap-1 min-w-max px-1 pb-2">
            {typicalDay.map((entry) => {
              const safe  = isSafeForActivity(entry, activity);
              const color = getBandColor(classifyBand(entry.value));
              const isCur = entry.hour === currentHour;
              return (
                <div key={entry.hour} className="flex flex-col items-center gap-1">
                  <div
                    className="w-6 rounded-sm"
                    style={{
                      height: 40,
                      background: color,
                      opacity: activity !== "none" && !safe ? 0.2 : 1,
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

  // ── Radial chart ─────────────────────────────────────────────────────────
  const displayed = hoveredHour !== null ? typicalDay[hoveredHour] : null;

  return (
    <div ref={containerRef}>
      <ActivitySelector activity={activity} onChange={setActivity} />

      <div className="relative mt-3 flex justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          width="100%"
          style={{ maxWidth: SVG_SIZE }}
          aria-label={`Lung Clock for ${cityName} — 24-hour air quality radial chart`}
        />

        {/* Hover tooltip */}
        {displayed && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none
                          rounded-lg bg-surface-2 border border-surface-3 px-3 py-1.5 text-xs text-center">
            <span className="font-mono font-bold text-ink">
              {displayed.hour.toString().padStart(2, "0")}:00 — {displayed.value.toFixed(1)} µg/m³
            </span>
            <span
              className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold"
              style={{
                background: getBandColor(classifyBand(displayed.value)),
                color: getBandTextColor(classifyBand(displayed.value)),
              }}
            >
              {getBandLabel(classifyBand(displayed.value))}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[10px] text-ink-faint">
        <span>🌅 Sunrise · 🌇 Sunset</span>
        <span>White outline = current hour</span>
        {activity !== "none" && (
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-aqi-good mr-1" />
            Green dots = safe for {ACTIVITY_LABELS[activity].toLowerCase()}
          </span>
        )}
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
  const options: Activity[] = ["none", "walk", "cycle", "jog"];
  return (
    <div>
      <div className="text-[10px] text-ink-faint font-mono mb-2">
        Activity safety filter
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Activity filter">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={activity === opt}
            onClick={() => onChange(opt)}
            className={[
              "px-3 py-1 rounded-full text-xs border transition-colors",
              activity === opt
                ? "bg-ink text-[#0a0a0a] border-ink font-semibold"
                : "bg-surface-3 text-ink-muted border-surface-3 hover:text-ink hover:border-ink-faint/50",
            ].join(" ")}
          >
            {opt === "none" ? "All hours" : ACTIVITY_LABELS[opt]}
            {opt !== "none" && (
              <span className="ml-1.5 text-ink-faint text-[10px]">
                {"< "}{EXERCISE_THRESHOLDS[opt as Exclude<Activity, "none">]} µg
              </span>
            )}
          </button>
        ))}
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
          <span className="text-[10px] text-ink-faint">{label}</span>
        </div>
      ))}
    </div>
  );
}
