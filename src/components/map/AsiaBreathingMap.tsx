"use client";

/**
 * AsiaBreathingMap — Client Component (MapLibre GL JS)
 *
 * Blueprint §Visualization 5: "Asia Breathing Map — Continental Overview"
 *
 * Features:
 *   • 15 AQI markers — color driven by PM2.5 band
 *   • Month slider (Jan→Dec) — debounced 150ms, updates all markers
 *   • Click any marker → popup with city stats + "View City" link
 *   • Popup reflects selected month's PM2.5, not annual average
 *
 * Architecture:
 *   • Dynamically imports maplibre-gl inside useEffect (SSR-safe)
 *   • Markers stored in markersRef — updated without re-mounting the map
 *   • selectedMonthRef keeps popup content in sync with slider position
 *
 * To swap the map style: change MAP_STYLE in src/lib/constants.ts
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type { FeatureCollection, Point } from "geojson";
import type { CityIndexEntry } from "@/lib/types";
import {
  classifyBand,
  getBandColor,
  getBandLabel,
  getBandTextColor,
  cigEquiv,
  MONTH_NAMES,
  MONTH_SHORT,
  MAP_STYLE,
  MAP_CENTER,
  MAP_ZOOM,
} from "@/lib/constants";

interface Props {
  cities: CityIndexEntry[];
}

const CITY_SOURCE_ID = "city-points";
const CITY_RING_LAYER_ID = "city-rings";
const CITY_DOT_LAYER_ID = "city-dots";

function buildCityGeoJSON(cities: CityIndexEntry[], month: number) {
  const features: FeatureCollection<Point, { id: string; color: string }>["features"] = cities.map((city) => {
      const pm25 = city.monthlyMedians[month] ?? city.annualMedianPm25;
      const color = getBandColor(classifyBand(pm25));
      return {
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [city.coordinates.lon, city.coordinates.lat] as [number, number],
        },
        properties: {
          id: city.id,
          color,
        },
      };
    });

  return {
    type: "FeatureCollection" as const,
    features,
  };
}

// ── Popup DOM factory ─────────────────────────────────────────────────────────
//
// Builds the popup content as a real DOM tree instead of an HTML string.
// This avoids XSS: all text is assigned via .textContent (never innerHTML).
// Use popup.setDOMContent(el) — never popup.setHTML().

function buildPopupContent(city: CityIndexEntry, pm25: number, monthIndex: number): HTMLElement {
  const band      = classifyBand(pm25);
  const color     = getBandColor(band);
  const bandLabel = getBandLabel(band);
  const textColor = getBandTextColor(band);
  const cigs      = cigEquiv(pm25).toFixed(2);
  const monthName = MONTH_NAMES[monthIndex];
  const bestVisit = city.bestVisitMonth.name ?? "–";

  function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    styles: Partial<CSSStyleDeclaration> = {},
    text?: string,
  ): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    Object.assign(node.style, styles);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const root = el("div", { padding: "16px", minWidth: "210px", fontFamily: "system-ui,sans-serif" });

  // City name
  root.appendChild(el("div", { fontSize: "15px", fontWeight: "700", marginBottom: "2px", color: "#f5f5f5" }, city.name));

  // Country · Tier
  root.appendChild(el("div", { fontSize: "11px", color: "#9e9e9e", marginBottom: "12px" }, `${city.country} · Tier ${city.tier}`));

  // Month label
  root.appendChild(el("div", { marginBottom: "4px", fontSize: "11px", color: "#9e9e9e" }, monthName));

  // PM2.5 row
  const pm25Row = el("div", { display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" });
  pm25Row.appendChild(el("div", { width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: "0" }));
  pm25Row.appendChild(el("span", { fontSize: "16px", fontWeight: "700", color, fontFamily: "monospace" }, `${pm25.toFixed(1)} µg/m³`));
  root.appendChild(pm25Row);

  // Band badge
  root.appendChild(el("div", {
    display: "inline-block", padding: "2px 8px", borderRadius: "12px",
    background: color, color: textColor, fontSize: "10px", fontWeight: "600", marginBottom: "10px",
  }, bandLabel));

  // Cigarette equivalence
  root.appendChild(el("div", { fontSize: "11px", color: "#9e9e9e", marginBottom: "2px" }, `≈ ${cigs} cigarettes equivalent/day`));

  // Best visit month
  const bestRow = el("div", { fontSize: "11px", color: "#9e9e9e", marginBottom: "14px" });
  bestRow.textContent = "Lower-risk month: ";
  const bestStrong = el("strong", { color: "#f5f5f5" }, bestVisit);
  bestRow.appendChild(bestStrong);
  root.appendChild(bestRow);

  // "View City" link — href set via property (safe), text via textContent
  const link = el("a", {
    display: "block", textAlign: "center", padding: "8px 12px", borderRadius: "7px",
    background: color, color: textColor, fontSize: "12px", fontWeight: "700",
    textDecoration: "none", transition: "opacity 0.15s",
  }, `View ${city.name} →`);
  (link as HTMLAnchorElement).href = `/cities/${city.id}`;
  link.addEventListener("mouseover", () => { link.style.opacity = "0.85"; });
  link.addEventListener("mouseout",  () => { link.style.opacity = "1"; });
  root.appendChild(link);

  return root;
}

// ── AQI band legend data ──────────────────────────────────────────────────────

const LEGEND = [
  { label: "Good (0–15)",       color: "#4CAF50" },
  { label: "Moderate (15–25)",  color: "#FFEB3B" },
  { label: "Sensitive (25–50)", color: "#FF9800" },
  { label: "Unhealthy (50–100)",color: "#F44336" },
  { label: "Hazardous (100+)",  color: "#9C27B0" },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function AsiaBreathingMap({ cities }: Props) {
  const containerRef     = useRef<HTMLDivElement>(null);
  const mapRef           = useRef<unknown>(null);
  const selectedMonthRef = useRef<number>(new Date().getMonth());
  const debounceRef      = useRef<ReturnType<typeof setTimeout>>();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isLoaded, setIsLoaded]           = useState(false);

  // ── Update all marker colours (called after debounce) ─────────────────────
  const updateMarkerColors = useCallback((month: number) => {
    const map = mapRef.current as {
      getSource: (id: string) => { setData?: (data: unknown) => void } | undefined;
    } | null;
    const source = map?.getSource(CITY_SOURCE_ID);
    source?.setData?.(buildCityGeoJSON(cities, month));
  }, [cities]);

  // ── Slider change handler ─────────────────────────────────────────────────
  const handleMonthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const month = parseInt(e.target.value, 10);
      setSelectedMonth(month);
      selectedMonthRef.current = month;

      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => updateMarkerColors(month), 150);
    },
    [updateMarkerColors]
  );

  // ── Map initialisation ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let mounted = true;

    async function init() {
      // Dynamic import keeps maplibre out of the SSR bundle
      const mlgl = (await import("maplibre-gl")).default;
      if (!mounted || !containerRef.current) return;

      const map = new mlgl.Map({
        container: containerRef.current,
        style:     MAP_STYLE,
        center:    MAP_CENTER,
        zoom:      MAP_ZOOM,
        bearing:   0,
        pitch:     0,
        minZoom:   2,
        maxZoom:   8,
        clickTolerance: 8,
        maxPitch:  0,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        attributionControl: false,
      });

      // Add compact attribution
      map.addControl(new mlgl.AttributionControl({ compact: true }));

      const handleResize = () => map.resize();
      window.addEventListener("resize", handleResize);

      mapRef.current = map;

      map.on("load", () => {
        if (!mounted) return;

        const initMonth = selectedMonthRef.current;
        const cityById = new Map(cities.map((city) => [city.id, city]));

        map.addSource(CITY_SOURCE_ID, {
          type: "geojson",
          data: buildCityGeoJSON(cities, initMonth),
        });

        // Circle radii interpolate with zoom so markers feel consistent
        // at all levels — small enough at zoom 2 (all Asia), readable at zoom 8.
        const ringRadius = ["interpolate", ["linear"], ["zoom"], 2, 7, 5, 11, 8, 16] as unknown as number;
        const dotRadius  = ["interpolate", ["linear"], ["zoom"], 2, 4, 5,  6, 8,  9] as unknown as number;

        map.addLayer({
          id: CITY_RING_LAYER_ID,
          type: "circle",
          source: CITY_SOURCE_ID,
          paint: {
            "circle-radius": ringRadius,
            "circle-color": "rgba(0,0,0,0)",
            "circle-stroke-width": 2,
            "circle-stroke-color": ["get", "color"],
            "circle-stroke-opacity": 0.55,
          },
        });

        map.addLayer({
          id: CITY_DOT_LAYER_ID,
          type: "circle",
          source: CITY_SOURCE_ID,
          paint: {
            "circle-radius": dotRadius,
            "circle-color": ["get", "color"],
            "circle-stroke-width": 1,
            "circle-stroke-color": "rgba(0,0,0,0.45)",
          },
        });

        const popup = new mlgl.Popup({
          offset:      22,
          closeButton: true,
          className:   "aqi-popup",
          maxWidth:    "260px",
        });

        map.on("mouseenter", CITY_DOT_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", CITY_DOT_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });

        map.on("click", CITY_DOT_LAYER_ID, (event) => {
          const feature = event.features?.[0] as {
            properties?: Record<string, unknown>;
          } | undefined;

          const id = typeof feature?.properties?.id === "string"
            ? feature.properties.id
            : null;
          if (!id) return;

          const city = cityById.get(id);
          if (!city) return;

          const curMonth = selectedMonthRef.current;
          const curPm25  = city.monthlyMedians[curMonth] ?? city.annualMedianPm25;

          // Use event.lngLat (the actual click point) — safer than
          // feature.geometry.coordinates which MapLibre may wrap across antimeridian.
          popup
            .setLngLat(event.lngLat)
            .setDOMContent(buildPopupContent(city, curPm25, curMonth))
            .addTo(map);
        });

        setIsLoaded(true);
      });

      map.once("remove", () => {
        window.removeEventListener("resize", handleResize);
      });
    }

    init();

    return () => {
      mounted = false;
      clearTimeout(debounceRef.current);
      (mapRef.current as { remove(): void } | null)?.remove();
      mapRef.current = null;
    };
  }, [cities]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Map canvas */}
      <div className="relative">
        <div
          ref={containerRef}
          className="w-full rounded-xl overflow-hidden"
          style={{ height: "clamp(320px, 62vh, 500px)" }}
          aria-label="Asia air quality map — click a city marker for details"
          role="img"
        />

        {/* Loading overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center
                          rounded-xl bg-surface-2">
            <span className="text-sm text-ink-muted animate-pulse">
              Loading map…
            </span>
          </div>
        )}
      </div>

      {/* Month slider */}
      <div className="mt-5 px-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-ink-muted font-mono">
            Drag to explore seasonal patterns
          </span>
          <span className="text-sm font-bold text-ink font-mono">
            {MONTH_NAMES[selectedMonth]}
          </span>
        </div>

        {/* Month tick labels */}
        <div className="flex justify-between text-[10px] font-mono text-ink-faint mb-1.5 px-px select-none">
          {MONTH_SHORT.map((m, i) => (
            <span
              key={m}
              className={
                i === selectedMonth
                  ? "text-ink font-bold"
                  : "text-ink-faint"
              }
              aria-current={i === selectedMonth ? "true" : undefined}
            >
              {m}
            </span>
          ))}
        </div>

        <input
          type="range"
          className="month-slider"
          min={0}
          max={11}
          step={1}
          value={selectedMonth}
          onChange={handleMonthChange}
          aria-label="Select month to see air quality patterns"
          aria-valuetext={MONTH_NAMES[selectedMonth]}
        />
      </div>

      {/* WHO band legend */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {LEGEND.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: color }}
              aria-hidden="true"
            />
            <span className="text-[11px] text-ink-muted">{label} µg/m³</span>
          </div>
        ))}
      </div>
    </div>
  );
}
