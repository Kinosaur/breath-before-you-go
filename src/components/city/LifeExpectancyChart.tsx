"use client";

/**
 * LifeExpectancyChart — Client Component (D3)
 *
 * Blueprint §Week 5: "Life Expectancy Toll bar chart: horizontal bars,
 * equity toggle, peer comparison."
 *
 * Default view:
 *   4 comparison anchors (smoking, alcohol, traffic, this city's air)
 *
 * Peer toggle ON:
 *   Adds all 15 cities as context bars so the user can see where
 *   this city sits in the regional distribution.
 *
 * Equity toggle ON:
 *   Overlays 3 global reference points as dashed lines:
 *   WHO target (0 yr), global avg (~2.2 yr), South Asia avg (~5.6 yr).
 */

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { CityProfile } from "@/lib/types";

interface PeerCity {
  name:      string;
  id:        string;
  yearsLost: number;
  isCurrent: boolean;
}

interface Props {
  context:    CityProfile["healthMetrics"]["lifeExpectancyContext"];
  cityName:   string;
  peerCities: PeerCity[];
}

// Global equity reference values (AQLI-derived approximations)
const EQUITY_REFS = [
  { label: "WHO target",   years: 0,   note: "5 µg/m³" },
  { label: "Global avg",   years: 2.2, note: "~30 µg/m³" },
  { label: "S. Asia avg",  years: 5.6, note: "~50 µg/m³" },
];

const BAR_H    = 26;
const BAR_GAP  = 10;
const LABEL_W  = 160;
const MARGIN   = { top: 12, right: 56, bottom: 32, left: LABEL_W };

// City-bar accent colour (warm red-orange so it reads as "attention" not "danger")
const CITY_COLOR   = "#E87040";
const PEER_COLOR   = "#3a3a3a";
const ANCHOR_COLOR = "#4a4a4a";

export function LifeExpectancyChart({ context, cityName, peerCities }: Props) {
  const svgRef       = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPeers,  setShowPeers]  = useState(false);
  const [showEquity, setShowEquity] = useState(false);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const containerW = containerRef.current.clientWidth || 600;
    const barW = containerW - MARGIN.left - MARGIN.right;

    // ── Build rows ──────────────────────────────────────────────────────
    const anchors = context.comparisonAnchors.map((a) => ({
      label:   a.label,
      years:   a.yearsLost,
      isCity:  a.label.toLowerCase().includes("this city") ||
               a.label.toLowerCase().includes("city's air"),
      isPeer:  false,
    }));

    // Replace generic "This city's air" label with the real city name
    anchors.forEach((a) => {
      if (a.isCity) a.label = `${cityName}'s air`;
    });

    const peerRows = showPeers
      ? peerCities
          .slice()
          .sort((a, b) => b.yearsLost - a.yearsLost)
          .map((c) => ({
            label:  c.name,
            years:  c.yearsLost,
            isCity: c.isCurrent,
            isPeer: true,
          }))
      : [];

    const rows = [...anchors, ...peerRows];
    const maxYears = Math.max(
      ...rows.map((r) => r.years),
      ...(showEquity ? EQUITY_REFS.map((r) => r.years) : []),
    );

    const svgH = MARGIN.top + rows.length * (BAR_H + BAR_GAP) + MARGIN.bottom;
    const xScale = d3.scaleLinear().domain([0, maxYears * 1.12]).range([0, barW]);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${containerW} ${svgH}`).attr("width", "100%");

    const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // ── Subtle grid lines ────────────────────────────────────────────────
    const ticks = xScale.ticks(5);
    g.append("g")
      .selectAll("line")
      .data(ticks)
      .enter()
      .append("line")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", 0)
      .attr("y2", svgH - MARGIN.top - MARGIN.bottom)
      .attr("stroke", "#242424")
      .attr("stroke-width", 1);

    // ── Equity reference lines ───────────────────────────────────────────
    if (showEquity) {
      EQUITY_REFS.forEach(({ label, years, note }) => {
        const x = xScale(years);
        // Skip the WHO target line at x=0 (it's just the axis)
        if (years > 0) {
          g.append("line")
            .attr("x1", x).attr("x2", x)
            .attr("y1", 0)
            .attr("y2", svgH - MARGIN.top - MARGIN.bottom)
            .attr("stroke", "rgba(255,200,80,0.4)")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "5,4");
        }

        g.append("text")
          .attr("x", years === 0 ? 3 : x + 3)
          .attr("y", 9)
          .attr("font-size", 9)
          .attr("fill", "rgba(255,200,80,0.75)")
          .text(`${label} · ${note}`);
      });
    }

    // ── Divider between anchors and peer rows ────────────────────────────
    if (showPeers && anchors.length > 0) {
      const divY = anchors.length * (BAR_H + BAR_GAP) - BAR_GAP / 2;
      g.append("line")
        .attr("x1", -LABEL_W + 8).attr("x2", barW)
        .attr("y1", divY).attr("y2", divY)
        .attr("stroke", "#2e2e2e")
        .attr("stroke-width", 1);
      g.append("text")
        .attr("x", -8).attr("y", divY + 10)
        .attr("text-anchor", "end")
        .attr("font-size", 8)
        .attr("fill", "#484848")
        .attr("font-style", "italic")
        .text("peer cities ↓");
    }

    // ── Bars ─────────────────────────────────────────────────────────────
    rows.forEach((row, i) => {
      const y     = i * (BAR_H + BAR_GAP);
      const width = Math.max(xScale(row.years), 2);
      const color = row.isCity ? CITY_COLOR : row.isPeer ? PEER_COLOR : ANCHOR_COLOR;
      const labelColor = row.isCity ? "#f0f0f0" : row.isPeer ? "#707070" : "#909090";
      const baseOpacity = row.isCity ? 1 : row.isPeer ? 0.6 : 0.75;
      const hoverOpacity = row.isCity ? 1 : Math.min(baseOpacity + 0.2, 0.95);

      // ── Bar background track ──
      g.append("rect")
        .attr("x", 0).attr("y", y)
        .attr("width", barW).attr("height", BAR_H)
        .attr("rx", 4)
        .attr("fill", "#1a1a1a");

      // ── Animated bar fill ──
      const fillBar = g.append("rect")
        .attr("x", 0).attr("y", y)
        .attr("width", 0).attr("height", BAR_H)
        .attr("rx", 4)
        .attr("fill", color)
        .attr("opacity", baseOpacity);

      fillBar
        .transition()
        .duration(500)
        .delay(i * 35)
        .attr("width", width);

      // ── Left label ──
      const maxChars = row.isCity ? 24 : 22;
      const labelText = row.label.length > maxChars
        ? row.label.slice(0, maxChars - 1) + "…"
        : row.label;

      const leftLabel = g.append("text")
        .attr("x", -10)
        .attr("y", y + BAR_H / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "central")
        .attr("font-size", row.isCity ? 12 : row.isPeer ? 10 : 11)
        .attr("font-weight", row.isCity ? "600" : "400")
        .attr("fill", labelColor)
        .text(labelText);

      // ── Value label (right of bar) ──
      const valueLabel = g.append("text")
        .attr("x", width + 6)
        .attr("y", y + BAR_H / 2)
        .attr("dominant-baseline", "central")
        .attr("font-size", row.isCity ? 11 : 10)
        .attr("font-family", "monospace")
        .attr("font-weight", row.isCity ? "600" : "400")
        .attr("fill", row.isCity ? "#f0f0f0" : "#606060")
        .text(`${row.years.toFixed(1)} yr`);

      // Hover hit area for subtle emphasis and readability boost.
      g.append("rect")
        .attr("x", -LABEL_W + 8)
        .attr("y", y)
        .attr("width", LABEL_W + barW)
        .attr("height", BAR_H)
        .attr("fill", "transparent")
        .style("cursor", "default")
        .on("mouseenter", () => {
          fillBar.attr("opacity", hoverOpacity);
          leftLabel.attr("fill", row.isCity ? "#ffffff" : "#cfcfcf");
          valueLabel.attr("fill", "#f0f0f0");
        })
        .on("mouseleave", () => {
          fillBar.attr("opacity", baseOpacity);
          leftLabel.attr("fill", labelColor);
          valueLabel.attr("fill", row.isCity ? "#f0f0f0" : "#606060");
        });
    });

    // ── X axis ───────────────────────────────────────────────────────────
    const axisY = svgH - MARGIN.top - MARGIN.bottom;
    g.append("g")
      .attr("transform", `translate(0,${axisY})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(5)
          .tickFormat((d) => `${d} yr`)
          .tickSize(4),
      )
      .call((axis) => {
        axis.select(".domain").attr("stroke", "#3a3a3a");
        axis.selectAll(".tick line").attr("stroke", "#3a3a3a");
        axis.selectAll(".tick text")
          .attr("fill", "#666666")
          .attr("font-size", 10);
      });

    // ── X axis label ────────────────────────────────────────────────────
    g.append("text")
      .attr("x", barW / 2)
      .attr("y", axisY + 26)
      .attr("text-anchor", "middle")
      .attr("font-size", 9)
      .attr("fill", "#505050")
      .text("life-years lost vs. WHO clean-air baseline");

  }, [context, cityName, peerCities, showPeers, showEquity]);

  // Find this city's years from anchors for the callout
  const cityAnchor = context.comparisonAnchors.find(
    (a) => a.label.toLowerCase().includes("this city") || a.label.toLowerCase().includes("city's air"),
  );
  const cityYears = cityAnchor?.yearsLost ?? null;

  return (
    <div>
      {/* ── Callout summary ───────────────────────────────────────────── */}
      {cityYears !== null && (
        <div className="mb-5 p-3 rounded-lg bg-[#1e1510] border border-[#3a2510]">
          <p className="text-sm text-[#e0a060] leading-snug">
            <span className="font-semibold">{cityName}</span>
            {" "}residents lose an estimated{" "}
            <span className="font-bold tabular-nums">{cityYears.toFixed(1)} year{cityYears !== 1 ? "s" : ""}</span>
            {" "}of life expectancy on average due to PM2.5 air pollution —
            compared to living in a city that meets WHO air quality guidelines.
          </p>
        </div>
      )}

      {/* ── Chart explanation ─────────────────────────────────────────── */}
      <p className="text-[11px] text-ink-faint mb-4 leading-relaxed">
        Each bar shows estimated life-years lost due to that risk factor.
        The orange bar is {cityName}. Gray bars are risk comparisons.
      </p>

      {/* ── Toggle controls ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setShowPeers((p) => !p)}
          className={[
            "control-chip text-xs focus-visible:ring-2 focus-visible:ring-accent-clean focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2",
            showPeers
              ? "control-chip-active font-semibold"
              : "",
          ].join(" ")}
        >
          {showPeers ? "↑ Hide" : "↓ Show"} peer cities
        </button>
        <button
          onClick={() => setShowEquity((e) => !e)}
          className={[
            "control-chip text-xs focus-visible:ring-2 focus-visible:ring-accent-clean focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2",
            showEquity
              ? "control-chip-active font-semibold"
              : "",
          ].join(" ")}
        >
          {showEquity ? "↑ Hide" : "↓ Show"} global benchmarks
        </button>
      </div>

      <div ref={containerRef}>
        <svg ref={svgRef} aria-label={`Life expectancy impact chart for ${cityName}`} />
      </div>

      <p className="mt-3 text-[10px] text-ink-faint leading-relaxed">
        Source: AQLI methodology — each 10 µg/m³ above the WHO 5 µg/m³ baseline ≈ 0.98 life-years lost.
        Population-level statistical estimates, not individual predictions.{" "}
        <a href="/about" className="underline hover:text-ink-muted">Methodology →</a>
      </p>
    </div>
  );
}
