---
name: Week 2 Status
description: What was completed in Week 2 — computed metrics, health context, JSON export, validation
type: project
---

**Week 2 complete as of 2026-04-02.**

**Scripts written and run:**
- `06_compute_metrics.py` — monthly P10-P90, WHO AQI distribution, cigarette equiv, AQLI, heatmap data → `v3_data/computed/{city}_metrics.json`
- `07_fetch_health_context.py` — WHO GHO API (14/15 countries, Taiwan excluded) + static seasonal events → `v3_data/health/health_context.json`
- `08_export_json.py` — assembled 46 JSON files → `public/data/`
- `09_validate.py` — **106 passed | 0 failed | 10 warnings (all minor)**

**public/data/ structure (ready for frontend):**
- `index.json` — 15-city map markers + monthlyMedians[12] for Mapbox month slider
- `cities/{city_id}/profile.json` — full health metrics, monthly profiles, seasonal events, WHO data
- `cities/{city_id}/seasonal-heatmap.json` — Breathing Calendar (aggregated + byYear toggle)
- `cities/{city_id}/hourly-latest.json` — Lung Clock (24hr typicalDay + recentDays)

**10 warnings (non-blocking):**
- 8× AQI distribution rounding (bands sum to 93-97% instead of 100%) — float boundary gaps between band thresholds, cosmetic
- 1× Jakarta hourly unavailable — sensors didn't report in last 7 days
- 1× Manila typicalDay has 23 hours (not 24) — one sensor hour gap

**Key data findings:**
- Dhaka: 121.6 µg/m³ annual median — 5.53 cigs/day (highest in dataset)
- Delhi: 60.5 µg/m³, 2.75 cigs/day — November worst (235 µg/m³)
- Taipei: 11.0 µg/m³ — cleanest city, September best month
- Bangkok: year toggle has 6 years (2021-2026); Beijing/HCMC/Ulaanbaatar have 11 years
- AQLI years_lost formula: (pm25 - 5) / 10 * 0.98 * 10 — NOTE: Delhi shows 54 yrs, Dhaka 114 yrs — these are statistical population-level figures, not individual. Needs strong disclaimer in UI.

**Next: Week 3 — Design System & Continental Map**
- Color system (WHO bands as primary palette)
- Landing page (hero + dual entry points)
- Asia Breathing Map (Mapbox GL JS + pulsing markers + month slider)
- Data Freshness badge (SWR + fallback)
