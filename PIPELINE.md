# Data Pipeline Architecture

## Quick Start

```bash
# Install dependencies (first time)
pip install -r requirements.txt

# Run compute → export → validate (raw CSVs already present)
make pipeline

# Re-fetch from OpenAQ API, then run the full pipeline
make refresh

# Unit tests only
make test
```

---

## Data Flow

```
OpenAQ API v3                  WHO GHO API
(pm25 sensors /days)           (mortality data)
        │                             │
        ▼                             ▼
04_fetch_daily_aggregates    07_fetch_health_context
05_fetch_hourly_aggregates          │
        │                           │
        ▼                           ▼
v3_data/daily/{city}.csv    v3_data/health/health_context.json
v3_data/hourly/{city}.csv
        │
        ▼
06_compute_metrics.py
  ├─ monthly P10/P50/P90 percentiles
  ├─ WHO AQI band distribution
  ├─ cigarette equivalence (Berkeley Earth)
  ├─ AQLI life-years lost
  └─ calendar heatmap data
        │
        ▼
v3_data/computed/{city}_metrics.json
        │
        ▼
08_export_json.py  ─────────────────────────────────────────────┐
  ├─ assembles per-city profile.json                            │
  ├─ writes seasonal-heatmap.json                               │
  ├─ writes hourly-latest.json                                  │
  └─ writes index.json (15-city summary)                        │
        │                                                       │
        ▼                                                       │
public/data/                                            pipeline_log.jsonl
  ├─ index.json
  └─ cities/{id}/
       ├─ profile.json
       ├─ seasonal-heatmap.json
       └─ hourly-latest.json
        │
        ▼
09_validate.py
  (106 checks — exits 1 on failure)
        │
        ▼
Next.js 15 (static build → Vercel)
```

---

## Pipeline Scripts

| Script | Purpose | Input | Output | Runtime |
|--------|---------|-------|--------|---------|
| `04_fetch_daily_aggregates.py` | Fetch 5yr daily PM2.5 from OpenAQ `/sensors/{id}/days` | API | `v3_data/daily/*.csv` | ~10–20 min |
| `05_fetch_hourly_aggregates.py` | Fetch last 7 days of hourly PM2.5 | API | `v3_data/hourly/*.csv` | ~5 min |
| `06_compute_metrics.py` | Monthly percentiles, AQI distribution, cig equiv, AQLI, heatmap | daily CSVs | `v3_data/computed/*.json` | <1 min |
| `07_fetch_health_context.py` | WHO GHO mortality data + static seasonal events | API + hardcoded | `v3_data/health/health_context.json` | <1 min |
| `08_export_json.py` | Assemble all data into the frontend JSON layer | computed JSONs + hourly CSVs | `public/data/**` | <1 min |
| `09_validate.py` | Structural + range checks on all output files | public/data/ | `v3_data/profiling/validation_report.md` | <5 sec |

---

## Design Decisions

### Why static JSON instead of a database?
The data pipeline runs once per week (or on demand) and the frontend needs zero backend compute at serve time. Pre-computed JSON files pushed to Vercel gives sub-10ms data access, free hosting, and no database ops. At scale (e.g. hourly refresh or 100+ cities) the tradeoff flips toward a database + API layer.

### Why median-of-medians for daily aggregation?
Each city has 2–103 active PM2.5 sensors. Averaging across sensors is vulnerable to outlier sensors that are miscalibrated or in unusually polluted micro-locations. Taking the **median of sensor medians** per day produces a robust city-representative value. This is the same approach used by WHO and IQAir for multi-monitor aggregation.

### Why WHO 2021 bands instead of US EPA AQI?
WHO 2021 guidelines are the latest global standard and are more protective than EPA thresholds (WHO "Good" is ≤15 µg/m³ vs EPA's ≤12 µg/m³ for annual, but WHO 24h is ≤15 vs EPA's 35 µg/m³). Since this tool targets Asian cities and a global audience, WHO bands are the appropriate frame. EPA AQI is US-regulatory context, not health guidance.

### Why `p50` (median) as the primary value, not `mean`?
PM2.5 distributions are right-skewed — a handful of extremely polluted days pull the mean up substantially (e.g. a wildfire week). The median is what a visitor would experience on a "typical" day, which is what the travel-planning use case needs. The mean is still computed and used for AQLI life-years calculation, which is a long-term chronic exposure metric.

### Why OpenAQ `/sensors/{id}/days` instead of raw measurements?
The pre-aggregated daily endpoint returns ~1,825 rows per sensor for 5 years versus ~43,800 raw hourly rows. It also includes coverage metadata (`percentComplete`) for data quality filtering. Raw measurements were hitting 408 timeouts at scale.

### Why preserve `scrollyContent` and `narrativeSummary` on re-export?
These are manually-written narrative fields added directly to the JSON files, not pipeline-computable. `08_export_json.py` reads and re-writes the profile, so it explicitly preserves those keys to avoid overwriting editorial content with each pipeline run.

---

## Known Limitations

| Limitation | Impact | Status |
|-----------|--------|--------|
| **Jakarta hourly unavailable** | Lung Clock shows fallback message | Sensors didn't report for 7+ days; non-blocking |
| **Manila typicalDay has 23/24 hours** | One clock arc missing | One sensor hour gap; cosmetic |
| **Beijing: only 2 active sensors** | Lower confidence for Beijing data | Flagged in DataConfidenceBadge; borderline coverage |
| **AQI distribution sums to 93–97%** | Rounding gap in some months | Float boundary effect from `pd.cut`; cosmetic (8 warnings in validation) |
| **Taiwan excluded from WHO GHO data** | `whoData.available = false` for Taipei | WHO GHO doesn't list Taiwan as a country; static data used instead |
| **Static data, not live** | Shows historical seasonal patterns, not today's readings | By design; users directed to IQAir for live readings |

---

## What I'd Do at Scale

If this needed to handle 100+ cities, live data, or a team:

1. **Orchestration** — Replace the `Makefile` with an Airflow or Prefect DAG. Each script becomes a task with explicit upstream dependencies and retry logic.

2. **Storage** — Replace flat JSON files with a Postgres database (e.g. Supabase). The current schema maps naturally to a `daily_readings` fact table + `city_metrics` dimension table. The frontend would hit an API endpoint instead of static files.

3. **Incremental loading** — Currently every run re-fetches 5 years of data. A `last_fetched_date` checkpoint per city would let the pipeline fetch only new days (~7 rows per sensor instead of ~1,825).

4. **Schema enforcement** — Promote the current Pandera schema to a full dbt project with source tests and model tests. This gives SQL-level data contracts and a lineage graph UI for free.

5. **Monitoring** — Push the `pipeline_log.jsonl` entries to a metrics system (Datadog, Grafana) and alert on `errors > 0` or `cities_processed < 15`.

6. **CI** — Add a GitHub Actions workflow that runs `make test && make validate` on every pull request against the pipeline scripts.
