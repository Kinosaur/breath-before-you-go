# Breathe Before You Go

**Seasonal air quality decision support for 15 Asian cities.**

> *When and where is it safe to breathe?*

Live: [breath-before-you-go.vercel.app](https://breath-before-you-go.vercel.app) · Methodology: [/about](https://breath-before-you-go.vercel.app/about)

---

## What it does

Existing AQI tools (IQAir, AirVisual) show real-time numbers with no seasonal context, no health translation, and no planning layer. This fills those gaps.

For every city you get:

- **Breathing Calendar** — 12×31 D3 heatmap of every day of the year, colored by PM2.5 band. Shows the full seasonal pattern at a glance.
- **Lung Clock** — 24-hour radial chart showing the typical daily pollution cycle and safe exercise windows.
- **Life Expectancy Toll** — AQLI-based estimate of years of life expectancy lost from long-term exposure, compared to smoking and alcohol.
- **Cigarette Counter** — Berkeley Earth equivalence: breathing this city's air year-round equals smoking how many cigarettes per day?
- **Asia Breathing Map** — MapLibre GL JS continental map with a month slider showing every city's typical PM2.5 for that month.
- **City Narrative** — Plain-language seasonal analysis written from the data: what drives the bad season, when the relief arrives, what the numbers mean.
- **Data Confidence Badge** — Honest signal: how many years of data back up this profile?

This is a **seasonal planning tool**, not a real-time monitor. For today's readings, use [IQAir](https://www.iqair.com).

---

## Cities (15)

| Tier | Cities | What you get |
|------|--------|-------------|
| **T1 — Deep** | Bangkok · Chiang Mai · Delhi | Full scrollytelling story + all charts |
| **T2 — Standard** | Hanoi · Jakarta · Seoul · Beijing · Dhaka · Kathmandu · Ulaanbaatar | All charts + narrative summary |
| **T3 — Dashboard** | Manila · Ho Chi Minh City · Taipei · Singapore · Mumbai | All charts + narrative summary |

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, SSG) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Visualizations | D3.js v7 (custom — no chart libraries) |
| Map | MapLibre GL JS |
| Data pipeline | Python 3.12 (Pandas, Requests) |
| Data source | OpenAQ API v3 |
| Hosting | Vercel (free tier, zero server cost) |
| Data format | Static JSON in `/public/data/` |

---

## Architecture

```
OpenAQ API v3
     │
     ▼
data_pipeline/
  04_fetch_daily_aggregates.py   ← raw PM2.5 daily data per city
  05_fetch_hourly_aggregates.py  ← hourly data for Lung Clock
  06_compute_metrics.py          ← seasonal profiles, P10/P50/P90,
  │                                 AQI distribution, cigarette equiv,
  │                                 AQLI years-lost
  07_fetch_health_context.py     ← WHO 2019 modelled estimates
  08_export_json.py              ← assembles all data into static JSON
  09_validate.py                 ← schema validation before deploy
     │
     ▼
public/data/
  index.json                     ← 15-city summary (map + city grid)
  cities/{id}/
    profile.json                 ← full city page data
    seasonal-heatmap.json        ← Breathing Calendar D3 input
    hourly-latest.json           ← Lung Clock D3 input
     │
     ▼
Next.js SSG
  /                              ← homepage + Asia map + city grid
  /cities/[id]                   ← city page (15 static routes)
  /about                         ← methodology reference
  /sitemap.xml                   ← auto-generated
  /robots.txt                    ← auto-generated
```

All data is pre-computed at pipeline run time. The frontend reads static JSON — no API calls, no database, no server-side rendering. Re-running the pipeline and re-deploying updates the data.

---

## Health metrics methodology

| Metric | Source | Formula |
|--------|--------|---------|
| PM2.5 bands | WHO 2021 AQG | 0–15 / 15–25 / 25–50 / 50–100 / 100+ µg/m³ |
| Cigarette equivalence | Berkeley Earth | PM2.5 (µg/m³) ÷ 22 = cigarettes/day |
| Life years lost | AQLI (EPIC/UChicago) | (annual mean − 5) × 0.098 |
| WHO cross-reference | WHO 2019 modelled estimates | Independent validation layer |

All caveats, formula derivations, and known limitations are documented at [/about](https://breath-before-you-go.vercel.app/about).

---

## Local development

```bash
# Install
npm install

# Dev server
npm run dev
# → http://localhost:3000

# Type check
npx tsc --noEmit

# Production build
npm run build
```

### Environment variables

```bash
# Required for data pipeline only (not needed to run the frontend)
OPENAQ_API_KEY=your_key_here

# Optional: override the canonical site URL
# Fallback order: NEXT_PUBLIC_SITE_URL -> VERCEL_PROJECT_PRODUCTION_URL -> VERCEL_URL -> localhost
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Deploy on Vercel

1. Import this repository in Vercel and keep the default Next.js preset.
2. Root directory: `./`
3. Build command: default (`next build`)
4. After first successful deploy, set:

```bash
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

5. Redeploy once so metadata, sitemap, robots, and share URLs use the canonical site URL.

---

## Data pipeline

Pipeline scripts live in `data_pipeline/`. Run from project root after activating `.venv`:

```bash
cd data_pipeline

# Full refresh (order matters)
python 04_fetch_daily_aggregates.py   # raw daily PM2.5 per city
python 05_fetch_hourly_aggregates.py  # hourly data for Lung Clock
python 06_compute_metrics.py          # seasonal profiles + health metrics
python 07_fetch_health_context.py     # WHO 2019 modelled estimates
python 08_export_json.py              # assemble static JSON for frontend
python 09_validate.py                 # schema check before deploy
```

The pipeline preserves manually-authored fields (`scrollyContent`, `narrativeSummary`) in existing `profile.json` files — re-running will not overwrite narrative content.

---

## Known limitations

- **PM2.5 only** — NO₂, O₃, and CO₂ are not tracked.
- **Station coverage varies** — cities with fewer sensors (e.g. Manila: 2 years, 357 days) have less reliable seasonal patterns than cities with deep history (e.g. Ho Chi Minh City: 11 years, 2,742 days).
- **Health metrics assume permanent residence** — cigarette equivalence and years-lost estimates apply to year-round residents, not short-term visitors.
- **Not medical advice** — all figures are population-level statistical estimates.

---

## License

MIT
