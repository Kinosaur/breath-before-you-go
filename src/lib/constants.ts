/**
 * constants.ts
 * Single source of truth for all WHO AQI band definitions, health metric
 * formulas, and map config. Mirrors the Python constants in 06_compute_metrics.py.
 */

// ── Band ID type ─────────────────────────────────────────────────────────────
// 'unhealthy_sensitive' matches the JSON keys output by the Python pipeline.
export type BandId =
  | "good"
  | "moderate"
  | "unhealthy_sensitive"
  | "unhealthy"
  | "hazardous"
  | "unknown";

// ── WHO 2021 PM2.5 band definitions ─────────────────────────────────────────
export const WHO_BANDS: Record<
  BandId,
  { label: string; maxPm25: number; color: string; textOnBg: "#000" | "#fff" }
> = {
  good:                 { label: "Good",                    maxPm25: 15.0,     color: "#4CAF50", textOnBg: "#000" },
  moderate:             { label: "Moderate",                maxPm25: 25.0,     color: "#FFEB3B", textOnBg: "#000" },
  unhealthy_sensitive:  { label: "Unhealthy for Sensitive", maxPm25: 50.0,     color: "#FF9800", textOnBg: "#000" },
  unhealthy:            { label: "Unhealthy",               maxPm25: 100.0,    color: "#F44336", textOnBg: "#fff" },
  hazardous:            { label: "Hazardous",               maxPm25: Infinity, color: "#9C27B0", textOnBg: "#fff" },
  unknown:              { label: "No Data",                 maxPm25: -1,       color: "#9E9E9E", textOnBg: "#fff" },
};

/** Continuous threshold classifier — no float boundary gaps. */
export function classifyBand(pm25: number | null | undefined): BandId {
  if (pm25 == null || isNaN(pm25) || pm25 < 0) return "unknown";
  if (pm25 <= 15.0)  return "good";
  if (pm25 <= 25.0)  return "moderate";
  if (pm25 <= 50.0)  return "unhealthy_sensitive";
  if (pm25 <= 100.0) return "unhealthy";
  return "hazardous";
}

export function getBandColor(band: BandId): string {
  return WHO_BANDS[band]?.color ?? WHO_BANDS.unknown.color;
}

export function getBandLabel(band: BandId): string {
  return WHO_BANDS[band]?.label ?? "Unknown";
}

export function getBandTextColor(band: BandId): "#000" | "#fff" {
  return WHO_BANDS[band]?.textOnBg ?? "#fff";
}

// ── Marker pulse speed: bad air → faster pulse ───────────────────────────────
export function getPulseDuration(band: BandId): number {
  const map: Record<BandId, number> = {
    good:                3.0,
    moderate:            2.5,
    unhealthy_sensitive: 2.0,
    unhealthy:           1.5,
    hazardous:           1.0,
    unknown:             4.0,
  };
  return map[band] ?? 3.0;
}

// ── Health metric formulas ────────────────────────────────────────────────────
/** Berkeley Earth: 22 µg/m³ PM2.5 ≈ 1 cigarette/day */
export const CIG_FACTOR = 22;

export function cigEquiv(pm25: number): number {
  return Math.max(0, pm25 / CIG_FACTOR);
}

/** AQLI: each 10 µg/m³ above WHO 5 µg/m³ baseline ≈ 0.98 yr lost */
export const AQLI_BASELINE    = 5.0;
export const AQLI_YRS_PER_10  = 0.98;

export function yearsLost(annualPm25: number): number {
  if (annualPm25 <= AQLI_BASELINE) return 0;
  return ((annualPm25 - AQLI_BASELINE) / 10) * AQLI_YRS_PER_10 * 10;
}

// ── Exercise safety ───────────────────────────────────────────────────────────
export const EXERCISE_THRESHOLDS = {
  walk:  50.0,   // WHO unhealthy threshold; walkers have baseline inhalation
  cycle: 35.0,   // Moderate exertion increases inhalation 3-5x
  jog:   25.0,   // WHO moderate threshold; runners inhale 5-10x more
} as const;

// ── Month labels ──────────────────────────────────────────────────────────────
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

// ── Map configuration ─────────────────────────────────────────────────────────
// CARTO Dark Matter (public style URL) gives a cleaner, modern map canvas.
export const MAP_STYLE  = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
export const MAP_CENTER: [number, number] = [103, 17];  // [lng, lat] — SE Asia
export const MAP_ZOOM   = 3.2;
