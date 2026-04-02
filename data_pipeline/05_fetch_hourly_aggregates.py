"""
05_fetch_hourly_aggregates.py
-----------------------------
Fetches pre-computed hourly aggregates for all 15 cities from OpenAQ API v3
using the /sensors/{id}/hours endpoint.

Why this exists separately from 04:
  - 04 fetches /days for 5-year seasonal history → Breathing Calendar
  - This fetches /hours for the last 7 days → Lung Clock (24-hr radial chart)

The Lung Clock shows:
  - Today's hourly PM2.5 (24 arcs, WHO color-coded)
  - Safe outdoor exercise windows
  - Sunrise/sunset overlay

7-day window is intentional:
  - Enough to build a "typical recent day" average (median across 7 days per hour)
  - Covers any sensor delays (some stations post with 24-48hr lag)
  - Not so much data that it becomes a seasonal average (defeats the purpose)

Key extra column vs 04: `hour_local` (0–23) extracted from local timestamp.
This is the index the Lung Clock radial chart bins on.

Output: one CSV per city in v3_data/hourly/
Columns:
  city_id, city_name, sensor_id, parameter,
  date_local (YYYY-MM-DD), hour_local (0–23),
  utc_from, local_from,
  avg, median, min, max, p25, p75, sd,
  coverage_pct, observed_minutes

Run from data_pipeline/ directory:
  python 05_fetch_hourly_aggregates.py

Expected runtime: ~5-10 minutes for all 15 cities.
Safe to re-run daily — always overwrites (hourly data must stay fresh).
"""

import time
import requests
import pandas as pd
from pathlib import Path
from datetime import datetime, timezone, timedelta
from collections import deque

from config import CITIES, API_BASE_URL, get_headers

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

OUTPUT_DIR      = Path("v3_data/hourly")
PARAMS          = ["pm25", "pm10", "no2"]
MAX_SENSORS     = 5         # sensors per parameter per city
PAGE_LIMIT      = 1000      # max rows per API page (168 rows/7 days fits in 1)
DAYS_BACK       = 7         # Lung Clock needs recent data only

# Coverage threshold — hourly data: 25% = at least 15 min of readings in an hour
MIN_COVERAGE_PCT = 25.0

# Rate limit targets (safe under 60/min and 2000/hour)
LIMIT_PER_MIN   = 50
LIMIT_PER_HOUR  = 1800

# ---------------------------------------------------------------------------
# Rate limiter (identical pattern to 04)
# ---------------------------------------------------------------------------

_request_log = deque()

def _enforce_rate_limits():
    now = time.monotonic()
    while _request_log and now - _request_log[0] > 3600:
        _request_log.popleft()

    # Hourly cap
    if len(_request_log) >= LIMIT_PER_HOUR:
        wait = 3600 - (now - _request_log[0]) + 1
        print(f"\n  [rate limit] Hourly cap. Sleeping {wait:.0f}s ({wait/60:.1f} min)...")
        time.sleep(wait)
        now = time.monotonic()

    # Per-minute cap
    recent = [t for t in _request_log if now - t < 60]
    if len(recent) >= LIMIT_PER_MIN:
        wait = 60 - (now - recent[0]) + 0.5
        if wait > 0:
            time.sleep(wait)

    _request_log.append(time.monotonic())


def api_get(url: str, max_retries: int = 3) -> requests.Response | None:
    """Rate-limited GET with retry on transient errors."""
    for attempt in range(max_retries):
        _enforce_rate_limits()
        try:
            resp = requests.get(url, headers=get_headers(), timeout=60)
        except requests.exceptions.RequestException as e:
            print(f" [NET ERR {attempt+1}/{max_retries}]", end="", flush=True)
            time.sleep(10)
            continue

        if resp.status_code == 429:
            print(f" [429 rate limit, sleeping 60s]", end="", flush=True)
            time.sleep(60)
            continue

        if resp.status_code in [408, 500, 502, 503, 504]:
            print(f" [{resp.status_code} retry {attempt+1}/{max_retries}]", end="", flush=True)
            time.sleep(10)
            continue

        return resp

    return None


# ---------------------------------------------------------------------------
# Sensor discovery (same logic as 04, reused verbatim)
# ---------------------------------------------------------------------------

def get_sensors_for_city(city: dict, date_from_str: str) -> dict[str, list[dict]]:
    """
    Find active sensors within 25km of city centre.
    Filters out sensors that went offline before our target window.
    Returns {param: [{"id": sensor_id, ...}, ...]} capped at MAX_SENSORS each.
    """
    url = (
        f"{API_BASE_URL}/locations"
        f"?coordinates={city['coordinates']}&radius=25000&limit=100"
    )
    resp = api_get(url)
    if resp is None or resp.status_code != 200:
        print(f"  [ERROR] Locations fetch failed")
        return {p: [] for p in PARAMS}

    locations = resp.json().get("results", [])
    print(f"  {len(locations)} locations found")

    sensors_by_param: dict[str, list] = {p: [] for p in PARAMS}

    for loc in locations:
        dt_first = (loc.get("datetimeFirst") or {}).get("utc", "9999-01-01T00:00:00Z")
        dt_last  = (loc.get("datetimeLast")  or {}).get("utc", "1970-01-01T00:00:00Z")

        # Skip sensors that went offline before our 7-day window
        if dt_last < date_from_str:
            continue

        for sensor in loc.get("sensors", []):
            param = sensor.get("parameter", {}).get("name", "")
            if param in PARAMS:
                sensors_by_param[param].append({
                    "id":            sensor["id"],
                    "datetime_last": dt_last,
                })

    for param in PARAMS:
        # Most recently active first — best chance of having data from yesterday/today
        sensors_by_param[param].sort(key=lambda s: s["datetime_last"], reverse=True)
        sensors_by_param[param] = sensors_by_param[param][:MAX_SENSORS]
        print(f"  {param}: {len(sensors_by_param[param])} sensors selected")

    return sensors_by_param


# ---------------------------------------------------------------------------
# Hourly fetch per sensor
# ---------------------------------------------------------------------------

def fetch_sensor_hours(
    sensor_id: int,
    param: str,
    city: dict,
    date_from: datetime,
    date_to: datetime,
) -> list[dict]:
    """
    Fetch pre-computed hourly aggregates for one sensor.
    Uses /sensors/{id}/hours endpoint.

    7 days × 24 hours = 168 rows per sensor — fits in a single API page.
    Pagination loop kept for safety in case a sensor has sub-hourly data
    that the API splits across pages.
    """
    rows = []
    page = 1
    from_str = date_from.strftime("%Y-%m-%dT%H:%M:%SZ")
    to_str   = date_to.strftime("%Y-%m-%dT%H:%M:%SZ")

    while True:
        url = (
            f"{API_BASE_URL}/sensors/{sensor_id}/hours"
            f"?datetime_from={from_str}&datetime_to={to_str}"
            f"&limit={PAGE_LIMIT}&page={page}"
        )
        resp = api_get(url)

        if resp is None or resp.status_code != 200:
            status = resp.status_code if resp else "NET_ERR"
            print(f" [ERR {status}]", end="", flush=True)
            break

        results = resp.json().get("results", [])

        for r in results:
            summary  = r.get("summary", {})
            coverage = r.get("coverage", {})
            period   = r.get("period", {})
            dt_from  = period.get("datetimeFrom", {})

            coverage_pct = coverage.get("percentComplete", 0.0) or 0.0

            # Skip hours with very sparse readings
            if coverage_pct < MIN_COVERAGE_PCT:
                continue

            local_ts   = dt_from.get("local", "")
            date_local = local_ts[:10] if local_ts else ""

            # Extract the local hour (0–23) — primary index for Lung Clock
            try:
                hour_local = int(local_ts[11:13]) if len(local_ts) >= 13 else None
            except (ValueError, TypeError):
                hour_local = None

            rows.append({
                "city_id":          city["id"],
                "city_name":        city["name"],
                "sensor_id":        sensor_id,
                "parameter":        param,
                "date_local":       date_local,
                "hour_local":       hour_local,
                "utc_from":         dt_from.get("utc", ""),
                "local_from":       local_ts,
                "avg":              summary.get("avg"),
                "median":           summary.get("median"),
                "min":              summary.get("min"),
                "max":              summary.get("max"),
                "p25":              summary.get("q25"),
                "p75":              summary.get("q75"),
                "sd":               summary.get("sd"),
                "coverage_pct":     coverage_pct,
                "observed_minutes": coverage.get("observedCount", 0),
            })

        # Partial page = last page
        if not results or len(results) < PAGE_LIMIT:
            break

        page += 1

    return rows


# ---------------------------------------------------------------------------
# City orchestration
# ---------------------------------------------------------------------------

def fetch_city(city: dict) -> None:
    city_id     = city["id"]
    output_path = OUTPUT_DIR / f"{city_id}.csv"

    # Always overwrite — hourly data must be fresh, not cached from yesterday
    date_to   = datetime.now(timezone.utc)
    date_from = date_to - timedelta(days=DAYS_BACK)

    print(f"  Fetching sensors...")
    sensors_by_param = get_sensors_for_city(city, date_from.strftime("%Y-%m-%dT%H:%M:%SZ"))

    all_rows = []

    for param in PARAMS:
        sensors = sensors_by_param[param]
        if not sensors:
            print(f"  {param}: no sensors, skipping")
            continue

        for i, sensor_info in enumerate(sensors, 1):
            sid = sensor_info["id"]
            print(f"  {param} sensor {i}/{len(sensors)} (id={sid})...", end="", flush=True)
            rows = fetch_sensor_hours(sid, param, city, date_from, date_to)
            all_rows.extend(rows)
            print(f" {len(rows):,} rows")

    if not all_rows:
        print(f"  [WARN] No data collected — skipping file write.")
        return

    df = pd.DataFrame(all_rows)

    # Deduplicate: if same sensor + hour appears twice, keep best coverage
    df = df.sort_values("coverage_pct", ascending=False)
    df = df.drop_duplicates(
        subset=["sensor_id", "parameter", "date_local", "hour_local"],
        keep="first"
    )
    df = df.sort_values(["parameter", "date_local", "hour_local"])

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"  Saved {len(df):,} rows → {output_path}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    date_from_display = (
        datetime.now(timezone.utc) - timedelta(days=DAYS_BACK)
    ).strftime("%Y-%m-%d")

    print("=" * 60)
    print("Breathe Before You Go — Hourly Aggregate Fetch (Lung Clock)")
    print(f"Endpoint   : /sensors/{{id}}/hours  (pre-computed hourly averages)")
    print(f"Date range : {date_from_display} → today  ({DAYS_BACK} days)")
    print(f"Parameters : {', '.join(PARAMS)}")
    print(f"Sensors    : up to {MAX_SENSORS} per parameter per city")
    print(f"Cities     : {len(CITIES)}")
    print(f"Min coverage: {MIN_COVERAGE_PCT}% of readings per hour")
    print(f"Output dir : {OUTPUT_DIR.resolve()}")
    print("=" * 60)

    start_time = time.time()

    for i, city in enumerate(CITIES, 1):
        print(f"\n[{i:02d}/{len(CITIES)}] {city['name']} (Tier {city['tier']})")
        fetch_city(city)

    elapsed = time.time() - start_time
    mins, secs = divmod(int(elapsed), 60)

    print(f"\n{'=' * 60}")
    print(f"FETCH COMPLETE — {mins}m {secs}s")
    print(f"{'=' * 60}")

    print("\nSummary:")
    total_rows = 0
    for f in sorted(OUTPUT_DIR.glob("*.csv")):
        rows = pd.read_csv(f).shape[0]
        total_rows += rows
        print(f"  {f.name:<35} {rows:>8,} rows")
    print(f"  {'TOTAL':<35} {total_rows:>8,} rows")
