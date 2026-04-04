# Breathe Before You Go

Help people in Asia decide when and where it is safer to breathe and travel.

## Purpose

This community project turns PM2.5 data into decisions people can use:

- Understand how bad air pollution is across Asian cities.
- Choose better months for travel.
- Find typically safer daily windows for outdoor activity.

## Core User Journeys

1. Plan a trip:
- Compare cities by seasonal PM2.5 patterns.
- See best month and worst month.
- Estimate trip exposure.

2. My city:
- See hourly breathing patterns.
- Identify safer windows for walk or exercise.
- Track health-oriented context from PM2.5 data.

## Data + Methodology

- Source data: OpenAQ API v3
- Health baseline: WHO 2021 PM2.5 guidance
- Communication metric: Berkeley Earth cigarette equivalence
- Life-impact framing: AQLI style years-lost estimate

For formulas, caveats, and limits, see the in-app Methodology page at `/about`.

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Data Pipeline (Python)

Pipeline scripts are in `data_pipeline/` and can be run from the project `.venv`.

Typical refresh sequence:

```bash
cd data_pipeline
../.venv/bin/python 04_fetch_daily_aggregates.py
../.venv/bin/python 05_fetch_hourly_aggregates.py
../.venv/bin/python 06_compute_metrics.py
../.venv/bin/python 07_fetch_health_context.py
../.venv/bin/python 08_export_json.py
../.venv/bin/python 09_validate.py
```
