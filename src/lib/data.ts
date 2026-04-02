/**
 * data.ts — Server-side data loading
 *
 * Reads static JSON from /public/data/ directly from disk via fs.
 * Use ONLY in Server Components (page.tsx, layout.tsx, etc.).
 * For client-side data access, fetch from '/data/...' directly or use SWR.
 */

import { readFileSync } from "fs";
import { join } from "path";
import type { IndexData, CityProfile, HourlyLatest, FreshnessInfo } from "./types";

function readPublic(relativePath: string): string {
  return readFileSync(
    join(process.cwd(), "public", "data", relativePath),
    "utf-8"
  );
}

export function getIndex(): IndexData {
  return JSON.parse(readPublic("index.json"));
}

export function getCityProfile(cityId: string): CityProfile {
  return JSON.parse(readPublic(`cities/${cityId}/profile.json`));
}

export function getHourlyLatest(cityId: string): HourlyLatest {
  return JSON.parse(readPublic(`cities/${cityId}/hourly-latest.json`));
}

// ── Data Freshness ────────────────────────────────────────────────────────────

/**
 * Computes the data freshness status from an ISO UTC timestamp.
 * Used by DataFreshnessBadge (server-rendered — no client polling needed).
 *
 * Status logic:
 *   live       < 2 hours
 *   delayed    2–24 hours
 *   historical > 24 hours (pipeline hasn't re-run; show seasonal data only)
 */
export function computeFreshness(generatedAt: string): FreshnessInfo {
  const ageMs    = Date.now() - new Date(generatedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours < 2) {
    const ageMin = Math.round(ageHours * 60);
    return {
      status:   "live",
      ageHours,
      label:    ageMin < 2 ? "Just updated" : `Updated ${ageMin} min ago`,
    };
  }

  if (ageHours < 24) {
    return {
      status:   "delayed",
      ageHours,
      label:    `Last updated ${Math.floor(ageHours)}h ago`,
    };
  }

  return {
    status:   "historical",
    ageHours,
    label:    "Showing seasonal trends",
  };
}
