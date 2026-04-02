"""
06_compute_metrics.py
---------------------
Week 2 Day 1-4: Compute all health and seasonal metrics from the 5-year daily archive.

Reads:    v3_data/daily/{city_id}.csv
Produces: v3_data/computed/{city_id}_metrics.json  (one per city)

Metrics computed:
  ① Seasonal profiles  — monthly P10, P25, P50, P75, P90 (timezone-local dates)
  ② WHO AQI distribution — % of days in each safety band per month
  ③ Exercise safety — % of days safe per activity (walk / cycle / jog) per month
  ④ Cigarette equivalence — Berkeley Earth: 22 µg/m³ PM2.5 = 1 cigarette/day
  ⑤ AQLI life expectancy — each 10 µg/m³ above WHO 5 µg/m³ baseline ≈ 0.98 yr lost
  ⑥ Heatmap data — aggregated (month × day-of-month) + per-year breakdown
  ⑦ "Best month to visit" badge — lowest median + lowest variance

WHO 2021 PM2.5 bands (blueprint primary safety metric):
  Good              :  0 – 15.0 µg/m³    green  #4CAF50
  Moderate          : 15.1 – 25.0 µg/m³  yellow #FFEB3B
  Unhealthy (sens.) : 25.1 – 50.0 µg/m³  orange #FF9800
  Unhealthy         : 50.1 – 100.0 µg/m³  red    #F44336
  Hazardous         : 100+ µg/m³           purple #9C27B0

Run from data_pipeline/:
  python 06_compute_metrics.py
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime

from config import CITIES

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DAILY_DIR  = Path("v3_data/daily")
OUTPUT_DIR = Path("v3_data/computed")

# Valid PM2.5 range — filters out sentinel error values (-999, 9999, etc.)
PM25_MIN_VALID = 0.1
PM25_MAX_VALID = 998.0

# WHO 2021 PM2.5 annual guideline bands
WHO_BANDS = [
    {"id": "good",                "label": "Good",                    "min": 0,     "max": 15.0,  "color": "#4CAF50"},
    {"id": "moderate",            "label": "Moderate",                "min": 15.1,  "max": 25.0,  "color": "#FFEB3B"},
    {"id": "unhealthy_sensitive", "label": "Unhealthy for Sensitive", "min": 25.1,  "max": 50.0,  "color": "#FF9800"},
    {"id": "unhealthy",           "label": "Unhealthy",               "min": 50.1,  "max": 100.0, "color": "#F44336"},
    {"id": "hazardous",           "label": "Hazardous",               "min": 100.1, "max": 9999,  "color": "#9C27B0"},
]

# Exercise safety thresholds — µg/m³ PM2.5 above which the activity is unsafe
# Blueprint: runners inhale 5–10x more air per minute than walkers
EXERCISE_THRESHOLDS = {
    "walk":  50.0,   # unhealthy threshold
    "cycle": 35.0,   # midpoint between moderate and unhealthy
    "jog":   25.0,   # moderate threshold
}

# Health metric constants (blueprint §Health Metric Framework)
CIG_FACTOR       = 22.0   # Berkeley Earth: µg/m³ PM2.5 per cigarette per day
AQLI_BASELINE    = 5.0    # WHO annual guideline baseline µg/m³
AQLI_YRS_PER_10  = 0.98   # years lost per 10 µg/m³ above baseline

MONTH_NAMES  = {1:"January",2:"February",3:"March",4:"April",5:"May",6:"June",
                7:"July",8:"August",9:"September",10:"October",11:"November",12:"December"}
MONTH_SHORT  = {k: v[:3] for k, v in MONTH_NAMES.items()}

# ---------------------------------------------------------------------------
# Pure helper functions
# ---------------------------------------------------------------------------

def classify_band(pm25: float) -> str:
    """Continuous thresholds — no gaps between bands."""
    if pd.isna(pm25):
        return "unknown"
    if pm25 <= 15.0:  return "good"
    if pm25 <= 25.0:  return "moderate"
    if pm25 <= 50.0:  return "unhealthy_sensitive"
    if pm25 <= 100.0: return "unhealthy"
    return "hazardous"


def cig_equiv(pm25: float) -> float | None:
    if pd.isna(pm25):
        return None
    return round(max(0.0, pm25) / CIG_FACTOR, 2)


def years_lost(annual_pm25: float) -> float:
    """AQLI life-expectancy impact above WHO baseline."""
    if pd.isna(annual_pm25) or annual_pm25 <= AQLI_BASELINE:
        return 0.0
    return round((annual_pm25 - AQLI_BASELINE) / 10.0 * AQLI_YRS_PER_10 * 10, 2)


def aqi_distribution(series: pd.Series) -> dict:
    """
    Percentage of readings in each WHO band. Rounded to 1 dp.
    Uses pd.cut() with continuous bins — no float boundary gaps.
    Boundary values (e.g. exactly 15.0) fall into the lower (better) band.
    """
    clean = series.dropna()
    total = len(clean)
    if total == 0:
        return {b["id"]: 0.0 for b in WHO_BANDS}

    BINS   = [0.0, 15.0, 25.0, 50.0, 100.0, float("inf")]
    LABELS = ["good", "moderate", "unhealthy_sensitive", "unhealthy", "hazardous"]

    cats   = pd.cut(clean, bins=BINS, labels=LABELS, right=True, include_lowest=True)
    counts = cats.value_counts()
    return {label: round(counts.get(label, 0) / total * 100, 1) for label in LABELS}


def safe_day_pct(series: pd.Series) -> dict:
    """Percentage of days where PM2.5 is below each activity threshold."""
    clean = series.dropna()
    total = len(clean)
    if total == 0:
        return {act: None for act in EXERCISE_THRESHOLDS}
    return {
        act: round((clean <= thr).sum() / total * 100, 1)
        for act, thr in EXERCISE_THRESHOLDS.items()
    }


def pct(arr, q):
    """Numpy percentile, rounded to 2 dp."""
    return round(float(np.percentile(arr, q)), 2)


# ---------------------------------------------------------------------------
# Per-city computation
# ---------------------------------------------------------------------------

def compute_city(city: dict) -> dict | None:
    cid  = city["id"]
    path = DAILY_DIR / f"{cid}.csv"
    if not path.exists():
        print(f"    [SKIP] {path} not found")
        return None

    df = pd.read_csv(path)
    df["date_local"] = pd.to_datetime(df["date_local"], errors="coerce")
    df["year"]  = df["date_local"].dt.year
    df["month"] = df["date_local"].dt.month
    df["dom"]   = df["date_local"].dt.day   # day-of-month

    # ── PM2.5 only, valid range ──────────────────────────────────────────────
    pm = df[
        (df["parameter"] == "pm25") &
        (df["median"] >= PM25_MIN_VALID) &
        (df["median"] <= PM25_MAX_VALID)
    ].copy()

    if pm.empty:
        print(f"    [WARN] No valid PM2.5 data for {city['name']}")
        return None

    # ── Daily city-level median: aggregate multiple sensors per day ──────────
    # Each date may have several sensors; median-of-medians is robust.
    daily = (
        pm.groupby("date_local", as_index=False)
        .agg(
            year=("year", "first"),
            month=("month", "first"),
            dom=("dom", "first"),
            value=("median", "median"),
            sensor_count=("sensor_id", "nunique"),
        )
    )

    # ── Annual stats ─────────────────────────────────────────────────────────
    annual_median = float(daily["value"].median())
    annual_mean   = float(daily["value"].mean())
    annual_dist   = aqi_distribution(daily["value"])

    # ── Monthly profiles ─────────────────────────────────────────────────────
    monthly_profiles = []
    for m in range(1, 13):
        mvals = daily.loc[daily["month"] == m, "value"].dropna()

        if mvals.empty:
            monthly_profiles.append({
                "month": m, "monthName": MONTH_NAMES[m], "monthShort": MONTH_SHORT[m],
                "p10": None, "p25": None, "p50": None, "p75": None, "p90": None,
                "mean": None, "aqiDistribution": {b["id"]: 0.0 for b in WHO_BANDS},
                "dominantBand": "unknown", "cigarettesPerDay": None,
                "daysCount": 0, "safeDays": {a: None for a in EXERCISE_THRESHOLDS},
            })
            continue

        p50      = pct(mvals, 50)
        dist     = aqi_distribution(mvals)
        dominant = max(dist, key=dist.get)

        monthly_profiles.append({
            "month":           m,
            "monthName":       MONTH_NAMES[m],
            "monthShort":      MONTH_SHORT[m],
            "p10":             pct(mvals, 10),
            "p25":             pct(mvals, 25),
            "p50":             p50,
            "p75":             pct(mvals, 75),
            "p90":             pct(mvals, 90),
            "mean":            round(float(mvals.mean()), 2),
            "aqiDistribution": dist,
            "dominantBand":    dominant,
            "cigarettesPerDay": cig_equiv(p50),
            "daysCount":       int(len(mvals)),
            "safeDays":        safe_day_pct(mvals),
        })

    # ── Best / worst month ───────────────────────────────────────────────────
    monthly_p50 = {
        p["month"]: p["p50"]
        for p in monthly_profiles if p["p50"] is not None
    }
    best_month  = min(monthly_p50, key=monthly_p50.get) if monthly_p50 else None
    worst_month = max(monthly_p50, key=monthly_p50.get) if monthly_p50 else None

    # "Best month to visit" badge: lowest median + lowest p90 spread
    # (low p90 means reliably good, not just occasionally OK)
    if monthly_p50:
        monthly_p90 = {p["month"]: p["p90"] for p in monthly_profiles if p["p90"]}
        best_visit  = min(
            monthly_p50,
            key=lambda m: (monthly_p50[m], monthly_p90.get(m, 999))
        )
    else:
        best_visit = None

    # ── Heatmap data ─────────────────────────────────────────────────────────
    # Aggregated: median across all years for each (month, day-of-month)
    heatmap_agg = (
        daily.groupby(["month", "dom"])["value"]
        .agg(["median", "count"])
        .reset_index()
        .rename(columns={"dom": "day", "median": "value", "count": "years"})
    )
    heatmap_aggregated = [
        {
            "month":   int(r.month),
            "day":     int(r.day),
            "value":   round(float(r.value), 1),
            "band":    classify_band(r.value),
            "cigEquiv": cig_equiv(r.value),
            "sampleYears": int(r.years),
        }
        for r in heatmap_agg.itertuples()
        if not pd.isna(r.value)
    ]

    # By-year: actual daily readings for year toggle
    by_year: dict[str, list] = {}
    for year, ydf in daily.groupby("year"):
        yr_rows = [
            {
                "month": int(r.month), "day": int(r.dom),
                "value": round(float(r.value), 1),
                "band":  classify_band(r.value),
            }
            for r in ydf.itertuples() if not pd.isna(r.value)
        ]
        by_year[str(int(year))] = yr_rows

    # ── Data quality ─────────────────────────────────────────────────────────
    years_avail = sorted(daily["year"].dropna().unique().astype(int).tolist())
    data_quality = {
        "dateFrom":       str(daily["date_local"].min().date()),
        "dateTo":         str(daily["date_local"].max().date()),
        "yearsAvailable": years_avail,
        "totalDays":      int(daily["date_local"].nunique()),
        "sensors":        int(pm["sensor_id"].nunique()),
        "lastComputed":   datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    return {
        "cityId":     cid,
        "cityName":   city["name"],
        "country":    city["country"],
        "tier":       city["tier"],
        "coordinates": {
            "lat": float(city["coordinates"].split(",")[0]),
            "lon": float(city["coordinates"].split(",")[1]),
        },
        "timezone":   city["timezone"],
        "healthMetrics": {
            "annualMedianPm25":    round(annual_median, 1),
            "annualMeanPm25":      round(annual_mean, 1),
            "cigarettesPerDay":    cig_equiv(annual_median),
            "yearsLost":           years_lost(annual_median),
            "aqiDistribution":     annual_dist,
            "bestMonth":           best_month,
            "bestMonthName":       MONTH_NAMES.get(best_month, ""),
            "bestMonthMedian":     round(monthly_p50.get(best_month, 0), 1) if best_month else None,
            "worstMonth":          worst_month,
            "worstMonthName":      MONTH_NAMES.get(worst_month, ""),
            "worstMonthMedian":    round(monthly_p50.get(worst_month, 0), 1) if worst_month else None,
            "bestVisitMonth":      best_visit,
            "bestVisitMonthName":  MONTH_NAMES.get(best_visit, "") if best_visit else None,
            # Methodology notes — shown inline in the UI
            "cigMethodologyNote":  (
                f"Berkeley Earth conversion: {CIG_FACTOR} µg/m³ PM2.5 ≈ 1 cigarette/day. "
                "This compares population-level mortality risk, not individual clinical outcomes. "
                "Acute vs chronic exposure differs significantly."
            ),
            "aqliMethodologyNote": (
                f"AQLI methodology: each 10 µg/m³ PM2.5 above WHO baseline "
                f"({AQLI_BASELINE} µg/m³) ≈ {AQLI_YRS_PER_10} years of life expectancy lost."
            ),
        },
        "monthlyProfiles": monthly_profiles,
        "heatmap": {
            "aggregated": heatmap_aggregated,
            "byYear":     by_year,
        },
        "dataQuality": data_quality,
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("06 — Compute Health & Seasonal Metrics")
    print("=" * 60)

    success = 0
    for city in CITIES:
        print(f"\n  [{city['id']}] {city['name']} (Tier {city['tier']})")
        result = compute_city(city)
        if not result:
            continue

        out = OUTPUT_DIR / f"{city['id']}_metrics.json"
        with open(out, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        hm = result["healthMetrics"]
        print(f"    ✓ Annual PM2.5:  {hm['annualMedianPm25']} µg/m³")
        print(f"      Cigs/day:      {hm['cigarettesPerDay']}")
        print(f"      Years lost:    {hm['yearsLost']}")
        print(f"      Best month:    {hm['bestVisitMonthName']} (visit badge)")
        print(f"      Worst month:   {hm['worstMonthName']}")
        print(f"      Heatmap rows:  {len(result['heatmap']['aggregated'])}")
        success += 1

    print(f"\n{'=' * 60}")
    print(f"DONE — {success}/{len(CITIES)} cities → {OUTPUT_DIR.resolve()}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
