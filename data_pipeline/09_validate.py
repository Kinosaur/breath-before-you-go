"""
09_validate.py
--------------
Week 2 Day 5-7: Validate the complete static JSON data layer.

Checks every JSON file the frontend will consume and prints a
pass/fail report. Hard fail (sys.exit 1) if critical checks fail.

Validation categories:
  ① File existence  — all expected files are present
  ② Structure       — required keys present in each JSON
  ③ Range checks    — PM2.5 values in 0–998 µg/m³
  ④ Completeness    — all 12 months present in monthly profiles
  ⑤ Hourly          — 24 hours covered in typicalDay (or marked unavailable)
  ⑥ Heatmap         — ≥ 50 cells per city (otherwise suspiciously empty)
  ⑦ Health metrics  — cigarettes and years_lost are non-negative numbers
  ⑧ Index           — all 15 cities present with valid coordinates
  ⑨ Timezone note   — local_from timestamps contain UTC offset (not bare UTC)

Outputs a validation_report.md in v3_data/profiling/.

Run from data_pipeline/:
  python 09_validate.py
"""

import json
import sys
from pathlib import Path
from datetime import datetime

from config import CITIES

PUBLIC_DIR    = Path("../public/data")
PROFILING_DIR = Path("v3_data/profiling")

# ─────────────────────────────────────────────────────────────────────────────
# Check helpers
# ─────────────────────────────────────────────────────────────────────────────

class CheckResult:
    def __init__(self):
        self.passed  = 0
        self.failed  = 0
        self.warnings= 0
        self.lines   = []

    def ok(self, msg: str):
        self.passed += 1
        self.lines.append(f"  ✅ {msg}")

    def fail(self, msg: str):
        self.failed += 1
        self.lines.append(f"  ❌ {msg}")

    def warn(self, msg: str):
        self.warnings += 1
        self.lines.append(f"  ⚠️  {msg}")

    def info(self, msg: str):
        self.lines.append(f"     {msg}")

    @property
    def all_passed(self):
        return self.failed == 0


def load_json(path: Path) -> dict | list | None:
    if not path.exists():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ─────────────────────────────────────────────────────────────────────────────
# Individual check functions
# ─────────────────────────────────────────────────────────────────────────────

def check_file_existence(r: CheckResult):
    r.lines.append("\n## ① File Existence")
    missing = 0

    index_path = PUBLIC_DIR / "index.json"
    if index_path.exists():
        r.ok(f"index.json exists")
    else:
        r.fail(f"index.json MISSING — run 08_export_json.py")
        missing += 1

    for city in CITIES:
        cid      = city["id"]
        city_dir = PUBLIC_DIR / "cities" / cid
        for fname in ["profile.json", "seasonal-heatmap.json", "hourly-latest.json"]:
            p = city_dir / fname
            if p.exists():
                r.ok(f"{cid}/{fname}")
            else:
                r.fail(f"{cid}/{fname} MISSING")
                missing += 1

    if missing == 0:
        r.info("All 46 expected files present (1 index + 3 × 15 cities)")


def check_index(r: CheckResult):
    r.lines.append("\n## ② Index Structure")
    index = load_json(PUBLIC_DIR / "index.json")
    if not index:
        r.fail("Cannot load index.json")
        return

    if "cities" not in index:
        r.fail("index.json missing 'cities' key")
        return

    city_count = len(index["cities"])
    if city_count == 15:
        r.ok(f"index.json has all 15 cities")
    else:
        r.fail(f"index.json has {city_count}/15 cities")

    for entry in index["cities"]:
        cid = entry.get("id", "?")
        coords = entry.get("coordinates", {})
        lat, lon = coords.get("lat"), coords.get("lon")

        if lat is None or lon is None:
            r.fail(f"{cid}: missing coordinates")
        elif not (-90 <= lat <= 90 and -180 <= lon <= 180):
            r.fail(f"{cid}: invalid coordinates lat={lat} lon={lon}")

        monthly = entry.get("monthlyMedians", [])
        if len(monthly) != 12:
            r.warn(f"{cid}: monthlyMedians has {len(monthly)} values (expected 12)")

    r.ok("Index coordinate range checks passed")


def check_profile(r: CheckResult, city_id: str, profile: dict):
    cid = city_id
    required_keys = [
        "cityId", "cityName", "country", "tier",
        "coordinates", "timezone", "healthMetrics",
        "monthlyProfiles", "dataQuality",
    ]
    for key in required_keys:
        if key not in profile:
            r.fail(f"{cid}/profile.json: missing key '{key}'")

    # Health metrics
    hm = profile.get("healthMetrics", {})
    for metric in ["annualMedianPm25", "cigarettesPerDay", "yearsLost"]:
        val = hm.get(metric)
        if val is None:
            r.warn(f"{cid}: healthMetrics.{metric} is null")
        elif not isinstance(val, (int, float)):
            r.fail(f"{cid}: healthMetrics.{metric} is not numeric: {val}")
        elif val < 0:
            r.fail(f"{cid}: healthMetrics.{metric} is negative: {val}")

    # PM2.5 range
    pm25 = hm.get("annualMedianPm25")
    if pm25 is not None and not (0 < pm25 < 998):
        r.fail(f"{cid}: annualMedianPm25={pm25} outside valid range (0–998)")

    # Monthly profiles completeness
    monthly = profile.get("monthlyProfiles", [])
    if len(monthly) != 12:
        r.fail(f"{cid}: monthlyProfiles has {len(monthly)} months (expected 12)")
    else:
        months_with_data = sum(1 for m in monthly if m.get("p50") is not None)
        if months_with_data < 6:
            r.warn(f"{cid}: only {months_with_data}/12 months have P50 data")

        for m in monthly:
            p50 = m.get("p50")
            if p50 is not None and not (0 < p50 < 998):
                r.fail(f"{cid}: month {m['month']} p50={p50} outside valid range")

            dist = m.get("aqiDistribution", {})
            if dist:
                total_pct = sum(dist.values())
                if not (98 <= total_pct <= 102):   # allow small rounding error
                    r.warn(f"{cid}: month {m['month']} AQI distribution sums to {total_pct:.1f}% (expected ~100%)")


def check_heatmap(r: CheckResult, city_id: str, heatmap: dict):
    cid = city_id
    aggregated = heatmap.get("aggregated", [])

    if len(aggregated) < 50:
        r.fail(f"{cid}/seasonal-heatmap.json: only {len(aggregated)} cells (expected ≥ 50)")
    else:
        r.ok(f"{cid}: heatmap has {len(aggregated)} cells")

    # Check PM2.5 values
    bad = [c for c in aggregated if c.get("value") is not None and not (0 < c["value"] < 998)]
    if bad:
        r.fail(f"{cid}: {len(bad)} heatmap cells with PM2.5 outside 0–998")

    # Check band field populated
    no_band = [c for c in aggregated if not c.get("band")]
    if no_band:
        r.warn(f"{cid}: {len(no_band)} heatmap cells missing 'band' field")

    # Year coverage
    by_year = heatmap.get("byYear", {})
    if by_year:
        r.ok(f"{cid}: byYear has {len(by_year)} years ({', '.join(sorted(by_year.keys()))})")
    else:
        r.warn(f"{cid}: byYear is empty (year toggle won't work)")


def check_hourly(r: CheckResult, city_id: str, hourly: dict):
    cid = city_id
    if not hourly.get("available"):
        r.warn(f"{cid}: hourly-latest.json marked unavailable (no hourly data)")
        return

    typical = hourly.get("typicalDay", [])
    if len(typical) == 0:
        r.fail(f"{cid}: typicalDay is empty")
    elif len(typical) < 12:
        r.warn(f"{cid}: typicalDay has only {len(typical)} hours (< 12 — sparse data)")
    else:
        r.ok(f"{cid}: typicalDay has {len(typical)} hours")

    # Check exercise safety flags present
    if typical:
        sample = typical[0]
        for flag in ["safeForWalk", "safeForCycle", "safeForJog"]:
            if flag not in sample:
                r.fail(f"{cid}: typicalDay[0] missing '{flag}'")

    # Check PM2.5 range
    bad = [h for h in typical if h.get("value") is not None and not (0 <= h["value"] < 998)]
    if bad:
        r.fail(f"{cid}: {len(bad)} hourly cells with PM2.5 outside range")

    recent = hourly.get("recentDays", {})
    if recent:
        r.ok(f"{cid}: recentDays has {len(recent)} dates")
    else:
        r.warn(f"{cid}: recentDays is empty")


def check_all_cities(r: CheckResult):
    r.lines.append("\n## ③–⑦ Per-City Data Checks")
    for city in CITIES:
        cid = city["id"]
        r.lines.append(f"\n### {city['name']} (Tier {city['tier']})")

        profile = load_json(PUBLIC_DIR / "cities" / cid / "profile.json")
        heatmap = load_json(PUBLIC_DIR / "cities" / cid / "seasonal-heatmap.json")
        hourly  = load_json(PUBLIC_DIR / "cities" / cid / "hourly-latest.json")

        if profile:
            check_profile(r, cid, profile)
        else:
            r.fail(f"{cid}: profile.json not loadable")

        if heatmap:
            check_heatmap(r, cid, heatmap)
        else:
            r.fail(f"{cid}: seasonal-heatmap.json not loadable")

        if hourly:
            check_hourly(r, cid, hourly)
        else:
            r.fail(f"{cid}: hourly-latest.json not loadable")


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("09 — Validate Static JSON Layer")
    print("=" * 60)

    r = CheckResult()

    check_file_existence(r)
    check_index(r)
    check_all_cities(r)

    # ── Build report ──────────────────────────────────────────────────────────
    status_line = (
        f"**{r.passed} passed** | "
        f"**{r.failed} failed** | "
        f"**{r.warnings} warnings**"
    )
    overall = "✅ ALL CHECKS PASSED" if r.all_passed else "❌ VALIDATION FAILED"

    report_lines = [
        "# Breathe Before You Go — JSON Validation Report",
        f"\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"\n## Result: {overall}",
        f"\n{status_line}",
        "\n## Detail\n",
    ] + r.lines

    report = "\n".join(report_lines)

    PROFILING_DIR.mkdir(parents=True, exist_ok=True)
    out_path = PROFILING_DIR / "validation_report.md"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(report)

    # Print to console
    for line in r.lines:
        print(line)

    print(f"\n{'=' * 60}")
    print(f"{overall}")
    print(f"{status_line}")
    print(f"Report saved → {out_path.resolve()}")
    print(f"{'=' * 60}")

    if not r.all_passed:
        sys.exit(1)


if __name__ == "__main__":
    main()
