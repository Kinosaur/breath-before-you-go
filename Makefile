.PHONY: pipeline fetch compute export validate test

# Run the full pipeline end-to-end (skips fetch — use when raw CSVs are current)
pipeline: compute export validate

# Step 1: Hit the OpenAQ API and write raw CSVs  (~10-20 min, needs API key)
fetch:
	cd data_pipeline && python 04_fetch_daily_aggregates.py
	cd data_pipeline && python 05_fetch_hourly_aggregates.py

# Step 2: Compute health metrics from raw CSVs
compute:
	cd data_pipeline && python 06_compute_metrics.py
	cd data_pipeline && python 07_fetch_health_context.py

# Step 3: Assemble the static JSON layer the frontend reads
export:
	cd data_pipeline && python 08_export_json.py

# Step 4: Validate every output file — exits non-zero on failures
validate:
	cd data_pipeline && python 09_validate.py

# Run unit tests for pure pipeline functions
test:
	python -m pytest tests/ -v

# Fetch fresh data then run the full pipeline
refresh: fetch pipeline
