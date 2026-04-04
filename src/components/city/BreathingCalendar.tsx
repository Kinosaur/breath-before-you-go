"use client";

/**
 * BreathingCalendar — Client Component (D3)
 *
 * Blueprint §Week 4: "12×31 grid, WHO color scale, year toggle, hover tooltips"
 *
 * Layout:
 *   Rows  = months (Jan → Dec)
 *   Cols  = days   (1 → 31)
 *   Color = PM2.5 WHO band
 *   Empty cells (e.g. Feb 30) rendered as dim placeholder
 *
 * Data: SeasonalHeatmap.aggregated (all-years median) or byYear[year]
 * Year toggle: "All years" + individual year buttons
 */

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import type { SeasonalHeatmap, HeatmapEntry } from "@/lib/types";
import { classifyBand, getBandColor, getBandTextColor, MONTH_SHORT } from "@/lib/constants";

interface Props {
  heatmap: SeasonalHeatmap;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  month: number;
  day: number;
  value: number | null;
  band: string;
}

// Days in each month (non-leap for display; real data uses actual dates)
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const CELL_SIZE  = 14;   // px — each day cell
const CELL_GAP   = 2;    // px — gap between cells
const STEP       = CELL_SIZE + CELL_GAP;
const LABEL_W    = 28;   // left margin for month labels
const HEADER_H   = 18;   // top margin for day-number labels
const EMPTY_COLOR   = "#181D26";  // surface-2: padding cells outside month
const NO_DATA_COLOR = "#222A38";  // surface-3: day exists, no sensor reading
const TOOLTIP_OFFSET_X = 10;
const TOOLTIP_OFFSET_Y = 14;
const TOOLTIP_W = 180;
const TOOLTIP_H = 90;

export function BreathingCalendar({ heatmap }: Props) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const svgRef          = useRef<SVGSVGElement>(null);
  const [activeYear, setActiveYear] = useState<string>("all");
  const [pinnedCellKey, setPinnedCellKey] = useState<string | null>(null);
  // Ref mirrors state so D3 handlers always see latest value (avoids stale closure
  // without adding pinnedCellKey to the main D3 useEffect dependency array).
  const pinnedCellKeyRef = useRef<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, month: 0, day: 0, value: null, band: "",
  });

  const years = ["all", ...heatmap.yearsAvailable.map(String).reverse()];

  const getEntries = useCallback((): HeatmapEntry[] => {
    if (activeYear === "all") return heatmap.aggregated;
    return heatmap.byYear[activeYear] ?? [];
  }, [activeYear, heatmap]);

  // Keep ref in sync with state so D3 handlers always read current value.
  useEffect(() => {
    pinnedCellKeyRef.current = pinnedCellKey;
  }, [pinnedCellKey]);

  // Reset pinned tooltip when switching year scope.
  useEffect(() => {
    setPinnedCellKey(null);
    setTooltip((t) => ({ ...t, visible: false }));
  }, [activeYear]);

  // Dismiss pinned tooltip when tapping outside the calendar block.
  useEffect(() => {
    if (!pinnedCellKey) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setPinnedCellKey(null);
        setTooltip((t) => ({ ...t, visible: false }));
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [pinnedCellKey]);

  useEffect(() => {
    if (!svgRef.current) return;
    const entries = getEntries();

    // Build lookup: "month-day" → entry
    const lookup = new Map<string, HeatmapEntry>();
    entries.forEach((e) => lookup.set(`${e.month}-${e.day}`, e));

    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll("*").remove();

    const svgW = LABEL_W + 31 * STEP;
    const svgH = HEADER_H + 12 * STEP;
    svgEl.attr("viewBox", `0 0 ${svgW} ${svgH}`).attr("width", "100%");

    // Day-number header (1, 5, 10, 15, 20, 25, 31)
    const dayTicks = [1, 5, 10, 15, 20, 25, 31];
    svgEl.append("g")
      .selectAll("text")
      .data(dayTicks)
      .enter()
      .append("text")
      .attr("x", (d) => LABEL_W + (d - 1) * STEP + CELL_SIZE / 2)
      .attr("y", HEADER_H - 4)
      .attr("text-anchor", "middle")
      .attr("font-size", 8)
      .attr("fill", "#5a5a5a")
      .text((d) => d);

    function showTooltip(event: MouseEvent | PointerEvent, month: number, day: number, entry: HeatmapEntry) {
      const rect = containerRef.current?.getBoundingClientRect() ?? svgRef.current!.getBoundingClientRect();
      let rawX = event.clientX - rect.left + TOOLTIP_OFFSET_X;
      let rawY = event.clientY - rect.top - TOOLTIP_OFFSET_Y;

      // Flip the tooltip side near edges to keep it visible and close to the pointer.
      if (rawX + TOOLTIP_W > rect.width - 8) {
        rawX = event.clientX - rect.left - TOOLTIP_W - TOOLTIP_OFFSET_X;
      }
      if (rawY < 8) {
        rawY = event.clientY - rect.top + TOOLTIP_OFFSET_Y;
      }

      const maxX = Math.max(rect.width - TOOLTIP_W - 8, 8);
      const minY = 8;
      const maxY = Math.max(rect.height - TOOLTIP_H - 8, minY);
      setTooltip({
        visible: true,
        x: Math.max(8, Math.min(rawX, maxX)),
        y: Math.max(minY, Math.min(rawY, maxY)),
        month,
        day,
        value: entry.value,
        band: entry.band,
      });
    }

    // Month rows
    for (let m = 1; m <= 12; m++) {
      const y = HEADER_H + (m - 1) * STEP;
      const daysInM = DAYS_IN_MONTH[m - 1];

      // Month label
      svgEl.append("text")
        .attr("x", LABEL_W - 4)
        .attr("y", y + CELL_SIZE / 2 + 3)
        .attr("text-anchor", "end")
        .attr("font-size", 9)
        .attr("fill", "#9e9e9e")
        .text(MONTH_SHORT[m - 1]);

      // Day cells
      for (let d = 1; d <= 31; d++) {
        const x   = LABEL_W + (d - 1) * STEP;
        const key = `${m}-${d}`;
        const entry = lookup.get(key);
        const isValid = d <= daysInM;

        let fill = EMPTY_COLOR;
        if (isValid) {
          fill = entry?.value != null
            ? getBandColor(classifyBand(entry.value))
            : NO_DATA_COLOR;
        }

        svgEl.append("rect")
          .attr("x", x)
          .attr("y", y)
          .attr("width", CELL_SIZE)
          .attr("height", CELL_SIZE)
          .attr("rx", 2)
          .attr("fill", fill)
          .attr("opacity", isValid ? 1 : 0.15)
          .attr("data-cellkey", key)   // used by pin-highlight effect below
          .attr("stroke", "none")
          .attr("stroke-width", 0)
          .style("transform-box", "fill-box")
          .style("transform-origin", "center")
          .style("transition", "opacity 140ms ease, transform 140ms ease, filter 160ms ease, stroke 140ms ease")
          .style("cursor", isValid && entry ? "pointer" : "default")
          .on("pointerenter", function (event: PointerEvent) {
            if (!isValid || !entry) return;
            if (pinnedCellKeyRef.current) return;
            d3.select(this)
              .attr("opacity", 0.9)
              .attr("stroke", "rgba(245,245,245,0.45)")
              .attr("stroke-width", 0.9)
              .style("filter", "drop-shadow(0 0 3px rgba(255,255,255,0.18))")
              .style("transform", "scale(1.06)");
            showTooltip(event, m, d, entry);
          })
          .on("pointermove", function (event: PointerEvent) {
            if (!isValid || !entry) return;
            if (pinnedCellKeyRef.current) return;
            showTooltip(event, m, d, entry);
          })
          .on("pointerleave", function () {
            if (pinnedCellKeyRef.current) return;
            d3.select(this)
              .attr("opacity", isValid ? 1 : 0.15)
              .attr("stroke", "none")
              .attr("stroke-width", 0)
              .style("filter", "none")
              .style("transform", "scale(1)");
            setTooltip((t) => ({ ...t, visible: false }));
          })
          .on("click", function (event: MouseEvent) {
            if (!isValid || !entry) return;
            event.stopPropagation();

            if (pinnedCellKeyRef.current === key) {
              setPinnedCellKey(null);
              setTooltip((t) => ({ ...t, visible: false }));
              return;
            }

            setPinnedCellKey(key);
            showTooltip(event, m, d, entry);
          });
      }
    }
  }, [activeYear, getEntries]);

  // ── Pin highlight — separate effect so pin/unpin never rebuilds the SVG ──────
  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .selectAll<SVGRectElement, unknown>("rect[data-cellkey]")
      .attr("stroke", function () {
        return d3.select(this).attr("data-cellkey") === pinnedCellKey ? "#f5f5f5" : "none";
      })
      .attr("stroke-width", function () {
        return d3.select(this).attr("data-cellkey") === pinnedCellKey ? 1.25 : 0;
      });
  }, [pinnedCellKey]);

  return (
    <div ref={containerRef} className="relative">
      {/* Year toggle */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {years.map((yr) => (
          <button
            key={yr}
            onClick={() => setActiveYear(yr)}
            aria-pressed={activeYear === yr}
            className={[
              "px-2.5 py-1 rounded-full text-xs font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-faint",
              activeYear === yr
                ? "bg-ink text-[#0a0a0a] font-semibold"
                : "bg-surface-3 text-ink-muted hover:bg-surface-2 hover:text-ink",
            ].join(" ")}
          >
            {yr === "all" ? "All years" : yr}
          </button>
        ))}
      </div>

      <p className="mb-3 text-[10px] text-ink-faint">
        Tip: tap a day cell to pin details, tap outside to close.
      </p>

      {/* Calendar SVG — horizontally scrollable on mobile */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div style={{ minWidth: LABEL_W + 31 * STEP }}>
          <svg ref={svgRef} aria-label="Breathing calendar heatmap" />
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg bg-surface-2 border border-surface-3
                     px-3 py-2 text-xs shadow-xl transition-opacity duration-100"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <div className="font-semibold text-ink mb-0.5">
            {MONTH_SHORT[tooltip.month - 1]} {tooltip.day}
          </div>
          {tooltip.value != null ? (
            <>
              <div className="text-ink-muted tabular-nums">
                {tooltip.value.toFixed(1)} µg/m³
              </div>
              <div
                className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{
                  background: getBandColor(classifyBand(tooltip.value)),
                  color: getBandTextColor(classifyBand(tooltip.value)),
                }}
              >
                {tooltip.band}
              </div>
            </>
          ) : (
            <div className="text-ink-faint">No data</div>
          )}
        </div>
      )}

      {/* WHO color legend */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
        {[
          { label: "Good · 0–15",         color: "#4CAF50" },
          { label: "Moderate · 15–25",    color: "#FFEB3B" },
          { label: "Sensitive · 25–50",   color: "#FF9800" },
          { label: "Unhealthy · 50–100",  color: "#F44336" },
          { label: "Hazardous · 100+",    color: "#9C27B0" },
          { label: "No data",             color: NO_DATA_COLOR, border: true },
        ].map(({ label, color, border }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ background: color, border: border ? "1px solid #3a3a3a" : undefined }}
            />
            <span className="text-[10px] text-ink-faint">{label} µg/m³</span>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="mt-3 text-[10px] text-ink-faint leading-relaxed">
        All-years view shows the median across available years per calendar day.
        Individual year views show actual measured values.{" "}
        <a href="/about" className="underline hover:text-ink-muted">
          Methodology →
        </a>
      </p>
    </div>
  );
}
