"""
08_export_json.py
-----------------
Week 2 Day 5-7: Assemble all computed data into the final static JSON layer
that the Next.js frontend consumes directly from /public/data/.

Reads:
  v3_data/computed/{city_id}_metrics.json  (from 06)
  v3_data/health/health_context.json       (from 07)
  v3_data/hourly/{city_id}.csv             (from 05)

Writes:
  public/data/index.json                   → continental map + city grid
  public/data/cities/{city_id}/profile.json        → full city page data
  public/data/cities/{city_id}/seasonal-heatmap.json → Breathing Calendar
  public/data/cities/{city_id}/hourly-latest.json  → Lung Clock

JSON structure summary:
  index.json          — array of 15 city summaries for the Mapbox markers
                        and month slider (monthlyMedians[12])
  profile.json        — everything: health metrics, monthly profiles,
                        seasonal events, WHO data, dataQuality
  seasonal-heatmap.json — flat array of {month, day, value, band} for D3
                          heatmap; byYear dict for year toggle
  hourly-latest.json  — 24-hour Lung Clock data; per-day breakdown for
                        exercise window recommendations

Run from data_pipeline/:
  python 08_export_json.py
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timezone, timedelta

from config import CITIES

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

COMPUTED_DIR  = Path("v3_data/computed")
HEALTH_FILE   = Path("v3_data/health/health_context.json")
HOURLY_DIR    = Path("v3_data/hourly")
PUBLIC_DIR    = Path("../public/data")   # relative to data_pipeline/

PM25_MIN      = 0.1
PM25_MAX      = 998.0

# Exercise safety thresholds (must match 06 and 07)
EXERCISE_THRESHOLDS = {"walk": 50.0, "cycle": 35.0, "jog": 25.0}

# WHO band colour mapping (for frontend direct use)
BAND_COLORS = {
    "good":                "#4CAF50",
    "moderate":            "#FFEB3B",
    "unhealthy_sensitive": "#FF9800",
    "unhealthy":           "#F44336",
    "hazardous":           "#9C27B0",
    "unknown":             "#9E9E9E",
}

# ---------------------------------------------------------------------------
# Load helpers
# ---------------------------------------------------------------------------

def load_metrics(city_id: str) -> dict | None:
    path = COMPUTED_DIR / f"{city_id}_metrics.json"
    if not path.exists():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_health_context() -> dict:
    if not HEALTH_FILE.exists():
        print("  [WARN] health_context.json not found — run 07 first")
        return {"cities": {}, "whoBands": [], "exerciseThresholds": {}}
    with open(HEALTH_FILE, encoding="utf-8") as f:
        return json.load(f)


def load_hourly(city_id: str) -> pd.DataFrame | None:
    path = HOURLY_DIR / f"{city_id}.csv"
    if not path.exists():
        return None
    df = pd.read_csv(path)
    df = df[
        (df["parameter"] == "pm25") &
        (df["median"] >= PM25_MIN) &
        (df["median"] <= PM25_MAX)
    ].copy()
    return df if not df.empty else None


# ---------------------------------------------------------------------------
# WHO band classifier
# ---------------------------------------------------------------------------

def classify_band(pm25: float | None) -> str:
    """
    Continuous WHO band thresholds — no float boundary gaps.
    Boundary values (e.g. exactly 15.0) fall into the lower (better) band.
    """
    if pm25 is None or (isinstance(pm25, float) and np.isnan(pm25)):
        return "unknown"
    if pm25 <= 15.0:  return "good"
    if pm25 <= 25.0:  return "moderate"
    if pm25 <= 50.0:  return "unhealthy_sensitive"
    if pm25 <= 100.0: return "unhealthy"
    return "hazardous"


# ---------------------------------------------------------------------------
# Process hourly CSV → Lung Clock JSON
# ---------------------------------------------------------------------------

def build_hourly_latest(city_id: str, hourly_df: pd.DataFrame | None) -> dict:
    """
    Produces the hourly-latest.json structure:
      - typicalDay: median PM2.5 for each hour 0-23 across all available days
                    (robust when a day has sensor gaps)
      - recentDays: per-date hourly arrays for the last 7 days
      - fetchedAt:  when the hourly CSV was last generated
    """
    empty = {
        "cityId":    city_id,
        "parameter": "pm25",
        "available": False,
        "fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "typicalDay": [],
        "recentDays": {},
    }

    if hourly_df is None or hourly_df.empty:
        return empty

    df = hourly_df.copy()

    # Aggregate across sensors per (date, hour)
    agg = (
        df.groupby(["date_local", "hour_local"])["median"]
        .median()
        .reset_index()
        .rename(columns={"median": "value"})
    )
    agg["hour_local"] = agg["hour_local"].astype(int)

    def hour_row(hour: int, value: float) -> dict:
        band = classify_band(value)
        return {
            "hour":       hour,
            "value":      round(float(value), 1),
            "band":       band,
            "color":      BAND_COLORS.get(band, "#9E9E9E"),
            "safeForWalk":  value <= EXERCISE_THRESHOLDS["walk"],
            "safeForCycle": value <= EXERCISE_THRESHOLDS["cycle"],
            "safeForJog":   value <= EXERCISE_THRESHOLDS["jog"],
        }

    # Typical day: median across all available days per hour
    typical_by_hour = agg.groupby("hour_local")["value"].median()
    typical_day = [
        hour_row(h, float(typical_by_hour.get(h, float("nan"))))
        for h in range(24)
        if h in typical_by_hour.index
    ]

    # Recent days: actual data per date
    recent_days: dict[str, list] = {}
    for date, ddf in agg.groupby("date_local"):
        day_rows = []
        for _, row in ddf.sort_values("hour_local").iterrows():
            h = int(row["hour_local"])
            v = float(row["value"])
            if not np.isnan(v):
                day_rows.append(hour_row(h, v))
        if day_rows:
            recent_days[str(date)] = day_rows

    # Most recent complete-ish date (>= 12 hours of data)
    best_date = max(
        (d for d, rows in recent_days.items() if len(rows) >= 12),
        default=None
    )

    return {
        "cityId":      city_id,
        "parameter":   "pm25",
        "available":   True,
        "fetchedAt":   datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mostRecentDate": best_date,
        "typicalDay":  typical_day,
        "recentDays":  recent_days,
    }


# ---------------------------------------------------------------------------
# Write per-city JSON files
# ---------------------------------------------------------------------------

def export_city(city: dict, metrics: dict, health_ctx: dict, hourly_df) -> dict | None:
    """
    Returns the index entry for this city (written to index.json).
    Also writes the 3 per-city JSON files.
    """
    cid      = city["id"]
    city_dir = PUBLIC_DIR / "cities" / cid
    city_dir.mkdir(parents=True, exist_ok=True)

    hm      = metrics["healthMetrics"]
    monthly = metrics["monthlyProfiles"]
    heat    = metrics["heatmap"]
    dq      = metrics["dataQuality"]
    city_health = health_ctx.get("cities", {}).get(cid, {})

    # ── 1. profile.json ──────────────────────────────────────────────────────
    profile = {
        "cityId":      cid,
        "cityName":    city["name"],
        "country":     city["country"],
        "tier":        city["tier"],
        "coordinates": metrics["coordinates"],
        "timezone":    city["timezone"],
        "healthMetrics": {
            **hm,
            # Life Expectancy Toll (§Viz 6) comparison anchors
            "lifeExpectancyContext": {
                "yearsLost": hm["yearsLost"],
                "comparisonAnchors": [
                    {"label": "Smoking (10 cigs/day)", "yearsLost": 10.0, "source": "WHO"},
                    {"label": "Heavy alcohol use",     "yearsLost": 1.3,  "source": "GBD 2019"},
                    {"label": "Traffic accidents (avg)","yearsLost": 0.3,  "source": "GBD 2019"},
                    {"label": "This city's air",        "yearsLost": hm["yearsLost"], "source": "AQLI"},
                ],
            },
        },
        "monthlyProfiles":  monthly,
        "seasonalEvents":   city_health.get("seasonalEvents", []),
        "monthlyRiskIndex": city_health.get("monthlyRiskIndex", []),
        "whoData":          city_health.get("whoData", {}),
        "dataQuality":      dq,
        "methodology": {
            "cigaretteEquivalence": hm.get("cigMethodologyNote", ""),
            "aqli":                 hm.get("aqliMethodologyNote", ""),
            "dataSource":           "OpenAQ API v3 /sensors/{id}/days pre-computed daily aggregates",
        },
    }
    with open(city_dir / "profile.json", "w", encoding="utf-8") as f:
        json.dump(profile, f, separators=(",", ":"), ensure_ascii=False)

    # ── 2. seasonal-heatmap.json ─────────────────────────────────────────────
    heatmap_json = {
        "cityId":     cid,
        "parameter":  "pm25",
        "unit":       "µg/m³",
        "bandColors": BAND_COLORS,
        "aggregated": heat["aggregated"],   # [{month, day, value, band, cigEquiv, sampleYears}]
        "byYear":     heat["byYear"],        # {"2021": [{month, day, value, band}], ...}
        "yearsAvailable": dq.get("yearsAvailable", []),
    }
    with open(city_dir / "seasonal-heatmap.json", "w", encoding="utf-8") as f:
        json.dump(heatmap_json, f, separators=(",", ":"), ensure_ascii=False)

    # ── 3. hourly-latest.json ────────────────────────────────────────────────
    hourly_json = build_hourly_latest(cid, hourly_df)
    with open(city_dir / "hourly-latest.json", "w", encoding="utf-8") as f:
        json.dump(hourly_json, f, separators=(",", ":"), ensure_ascii=False)

    # ── Index entry (returned, not written here) ─────────────────────────────
    monthly_medians_arr = [
        p["p50"] for p in sorted(monthly, key=lambda x: x["month"])
    ]   # Jan→Dec array of 12 values (or None if no data)

    index_entry = {
        "id":              cid,
        "name":            city["name"],
        "country":         city["country"],
        "tier":            city["tier"],
        "coordinates":     metrics["coordinates"],
        "annualMedianPm25":    hm["annualMedianPm25"],
        "annualCigarettesPerDay": hm["cigarettesPerDay"],
        "yearsLost":           hm["yearsLost"],
        "dominantBand":        classify_band(hm["annualMedianPm25"]),
        "dominantBandColor":   BAND_COLORS.get(classify_band(hm["annualMedianPm25"]), "#9E9E9E"),
        "bestMonth":       {"month": hm["bestMonth"],       "name": hm["bestMonthName"],  "median": hm["bestMonthMedian"]},
        "worstMonth":      {"month": hm["worstMonth"],      "name": hm["worstMonthName"], "median": hm["worstMonthMedian"]},
        "bestVisitMonth":  {"month": hm["bestVisitMonth"],  "name": hm["bestVisitMonthName"]},
        "monthlyMedians":  monthly_medians_arr,
        "dataQuality": {
            "completenessNote": f"{dq.get('totalDays', 0):,} days from {dq.get('dateFrom', '?')} to {dq.get('dateTo', '?')}",
        },
    }

    return index_entry


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    (PUBLIC_DIR / "cities").mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("08 — Export Static JSON Layer")
    print(f"     → {PUBLIC_DIR.resolve()}")
    print("=" * 60)

    health_ctx = load_health_context()
    index_entries = []
    files_written = 0

    for city in CITIES:
        cid = city["id"]
        print(f"\n  [{cid}] {city['name']}")

        metrics = load_metrics(cid)
        if not metrics:
            print(f"    [SKIP] No metrics — run 06 first")
            continue

        hourly_df = load_hourly(cid)
        if hourly_df is None:
            print(f"    [WARN] No hourly data — hourly-latest.json will be empty")

        entry = export_city(city, metrics, health_ctx, hourly_df)
        if entry:
            index_entries.append(entry)
            files_written += 3   # profile + heatmap + hourly
            print(f"    ✓ profile.json | seasonal-heatmap.json | hourly-latest.json")
            hm_count = len(metrics["heatmap"]["aggregated"])
            hourly_avail = hourly_df is not None
            print(f"      Heatmap: {hm_count} cells | Hourly: {'✓' if hourly_avail else '✗ missing'}")

    # ── Write index.json ─────────────────────────────────────────────────────
    index = {
        "generated":  datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "cityCount":  len(index_entries),
        "bandColors": BAND_COLORS,
        "cities":     index_entries,
    }
    index_path = PUBLIC_DIR / "index.json"
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, separators=(",", ":"), ensure_ascii=False)
    files_written += 1
    print(f"\n  ✓ index.json ({len(index_entries)} cities)")

    print(f"\n{'=' * 60}")
    print(f"DONE — {files_written} files written to {PUBLIC_DIR.resolve()}")
    print(f"{'=' * 60}")

    print("\nFile tree:")
    for p in sorted(PUBLIC_DIR.rglob("*.json")):
        size_kb = p.stat().st_size / 1024
        print(f"  {str(p.relative_to(PUBLIC_DIR)):<55} {size_kb:6.1f} KB")


if __name__ == "__main__":
    main()
