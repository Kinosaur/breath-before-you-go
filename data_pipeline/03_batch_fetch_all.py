"""
03_batch_fetch_all.py
---------------------
Fetches 5 years of PM2.5, PM10, and NO2 measurements for all 15 cities
from OpenAQ API v3. Saves one CSV per city to v3_data/raw/.

Key features:
  - Date-range pagination (fetches ALL pages, not just latest 100)
  - Dual rate-limit enforcement: 55/min and 1800/hour (safe under 60/2000)
  - Resume-safe: skips cities whose output CSV already exists
  - Selects sensors with the longest history first (better 5-yr coverage)
  - Progress printed throughout so you can watch it run

Run from data_pipeline/ directory:
  python 03_batch_fetch_all.py

Expected runtime: 4-8 hours depending on data density. Safe to leave overnight.
To re-fetch a specific city, delete its CSV from v3_data/raw/ and re-run.
"""

import os
import sys
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

OUTPUT_DIR     = Path("v3_data/raw")
PARAMS         = ["pm25", "pm10", "no2"]
MAX_SENSORS    = 5          # sensors per parameter per city (sorted by oldest data first)
PAGE_LIMIT     = 1000       # measurements per API page (max the API allows)
YEARS_BACK     = 5

# Rate limit targets (stay comfortably below the API limits)
LIMIT_PER_MIN  = 55         # API hard limit is 60
LIMIT_PER_HOUR = 1800       # API hard limit is 2000

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------

_request_log = deque()  # stores timestamps of recent requests

def _enforce_rate_limits():
    """Sleep if necessary to stay within per-minute and per-hour limits."""
    now = time.monotonic()

    # Drop timestamps older than 1 hour
    while _request_log and now - _request_log[0] > 3600:
        _request_log.popleft()

    # --- Hourly limit ---
    if len(_request_log) >= LIMIT_PER_HOUR:
        wait = 3600 - (now - _request_log[0]) + 1
        print(f"\n  [rate limit] Hourly cap reached. Sleeping {wait:.0f}s "
              f"({wait/60:.1f} min)...")
        time.sleep(wait)
        now = time.monotonic()

    # --- Per-minute limit ---
    recent = sum(1 for t in _request_log if now - t < 60)
    if recent >= LIMIT_PER_MIN:
        # find the oldest request within the last 60s and wait past it
        minute_old = [t for t in _request_log if now - t < 60]
        wait = 60 - (now - minute_old[0]) + 0.5
        if wait > 0:
            time.sleep(wait)
        now = time.monotonic()

    _request_log.append(now)


def api_get(url: str, max_retries: int = 3) -> requests.Response:
    """Rate-limited GET with automatic retries for 429 and transient errors."""
    resp = None
    for attempt in range(max_retries):
        _enforce_rate_limits()
        try:
            # Each request covers only a 3-month chunk, so 60s is plenty.
            resp = requests.get(url, headers=get_headers(), timeout=60)
        except requests.exceptions.RequestException as e:
            print(f" [NET ERROR] {str(e)[:40]}... retry {attempt+1}/{max_retries}", end="")
            time.sleep(10)
            continue
            
        if resp.status_code == 429:
            print(f" [429] Server rate limit! Sleeping 60s... retry {attempt+1}/{max_retries}", end="")
            time.sleep(60)
            continue
            
        if resp.status_code in [408, 500, 502, 503, 504]:
            print(f" [{resp.status_code}] Server timeout/fail. Sleeping 10s... retry {attempt+1}/{max_retries}", end="")
            time.sleep(10)
            continue
            
        return resp
        
    return resp


# ---------------------------------------------------------------------------
# Core fetch logic
# ---------------------------------------------------------------------------

def get_sensors_for_city(city: dict, date_from_str: str) -> dict[str, list[dict]]:
    """
    Query all locations within 25km of the city centre.
    Returns {param: [{"id": sensor_id, "datetime_first": str}, ...]}
    sorted oldest-first, capped at MAX_SENSORS each.
    """
    url = (
        f"{API_BASE_URL}/locations"
        f"?coordinates={city['coordinates']}&radius=25000&limit=100"
    )
    resp = api_get(url)
    if resp.status_code != 200:
        print(f"  [ERROR] Locations fetch failed ({resp.status_code}): {resp.text[:200]}")
        return {p: [] for p in PARAMS}

    locations = resp.json().get("results", [])
    print(f"  {len(locations)} locations found")

    sensors_by_param: dict[str, list] = {p: [] for p in PARAMS}

    for loc in locations:
        dt_first = loc.get("datetimeFirst") or {}
        utc_first = dt_first.get("utc", "9999-01-01T00:00:00Z")
        
        dt_last = loc.get("datetimeLast") or {}
        utc_last = dt_last.get("utc", "1970-01-01T00:00:00Z")

        # Skip sensors that stopped reporting before our target history window
        if utc_last < date_from_str:
            continue

        for sensor in loc.get("sensors", []):
            param = sensor.get("parameter", {}).get("name", "")
            if param in PARAMS:
                sensors_by_param[param].append({
                    "id": sensor["id"],
                    "datetime_first": utc_first,
                })

    for param in PARAMS:
        # Sort by oldest data first — more likely to have 5-year coverage
        sensors_by_param[param].sort(key=lambda s: s["datetime_first"])
        sensors_by_param[param] = sensors_by_param[param][:MAX_SENSORS]
        print(f"  {param}: {len(sensors_by_param[param])} sensors selected")

    return sensors_by_param


CHUNK_DAYS = 90  # 3-month slices — small enough that OpenAQ won't time out

def _date_chunks(date_from: datetime, date_to: datetime, chunk_days: int):
    """Yield (chunk_start, chunk_end) pairs covering [date_from, date_to]."""
    cursor = date_from
    while cursor < date_to:
        end = min(cursor + timedelta(days=chunk_days), date_to)
        yield cursor, end
        cursor = end


def fetch_sensor_measurements(
    sensor_id: int,
    param: str,
    city: dict,
    date_from: datetime,
    date_to: datetime,
) -> list[dict]:
    """
    Fetch measurements for a single sensor by iterating over 3-month chunks.
    Each chunk is a single-page request small enough to avoid server 408s.
    """
    rows = []

    chunks = list(_date_chunks(date_from, date_to, CHUNK_DAYS))
    for chunk_start, chunk_end in chunks:
        from_str = chunk_start.strftime("%Y-%m-%dT%H:%M:%SZ")
        to_str   = chunk_end.strftime("%Y-%m-%dT%H:%M:%SZ")

        page = 1
        while True:
            url = (
                f"{API_BASE_URL}/sensors/{sensor_id}/measurements"
                f"?datetime_from={from_str}&datetime_to={to_str}"
                f"&limit={PAGE_LIMIT}&page={page}"
            )
            resp = api_get(url)

            if resp is None or resp.status_code != 200:
                status = resp.status_code if resp else "NET_ERR"
                print(f"[{status}]", end="", flush=True)
                break

            data    = resp.json()
            results = data.get("results", [])

            for r in results:
                period  = r.get("period", {})
                dt_from = period.get("datetimeFrom", {})
                rows.append({
                    "city_id":    city["id"],
                    "city_name":  city["name"],
                    "sensor_id":  sensor_id,
                    "parameter":  param,
                    "utc_time":   dt_from.get("utc", ""),
                    "local_time": dt_from.get("local", ""),
                    "value":      r.get("value"),
                })

            # Partial page → done with this chunk
            if not results or len(results) < PAGE_LIMIT:
                break

            page += 1

    print(f" {len(rows):,} rows", end="")
    return rows


def fetch_city(city: dict) -> None:
    city_id     = city["id"]
    output_path = OUTPUT_DIR / f"{city_id}.csv"

    if output_path.exists():
        existing = pd.read_csv(output_path).shape[0]
        print(f"  Already fetched ({existing:,} rows). "
              f"Delete {output_path.name} to re-fetch.")
        return

    date_to   = datetime.now(timezone.utc)
    date_from = date_to - timedelta(days=365 * YEARS_BACK)

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
            rows = fetch_sensor_measurements(sid, param, city, date_from, date_to)
            all_rows.extend(rows)
            print()  # newline after the row count

    if not all_rows:
        print(f"  [WARN] No data collected — skipping file write.")
        return

    df = pd.DataFrame(all_rows)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"  Saved {len(df):,} rows → {output_path}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    date_from_display = (
        datetime.now(timezone.utc) - timedelta(days=365 * YEARS_BACK)
    ).strftime("%Y-%m-%d")

    print("=" * 60)
    print("Breathe Before You Go — Batch Fetch")
    print(f"Date range : {date_from_display} → today")
    print(f"Parameters : {', '.join(PARAMS)}")
    print(f"Sensors    : up to {MAX_SENSORS} per parameter per city")
    print(f"Cities     : {len(CITIES)}")
    print(f"Output dir : {OUTPUT_DIR.resolve()}")
    print("=" * 60)

    start_time = time.time()

    for i, city in enumerate(CITIES, 1):
        print(f"\n[{i:02d}/{len(CITIES)}] {city['name']} (Tier {city['tier']})")
        fetch_city(city)

    elapsed = time.time() - start_time
    hours, rem = divmod(int(elapsed), 3600)
    mins, secs = divmod(rem, 60)

    print(f"\n{'=' * 60}")
    print(f"BATCH FETCH COMPLETE — {hours}h {mins}m {secs}s")
    print(f"{'=' * 60}")

    print("\nSummary:")
    total_rows = 0
    for f in sorted(OUTPUT_DIR.glob("*.csv")):
        rows = pd.read_csv(f).shape[0]
        total_rows += rows
        print(f"  {f.name:<35} {rows:>10,} rows")
    print(f"  {'TOTAL':<35} {total_rows:>10,} rows")
