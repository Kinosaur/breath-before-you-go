"""
Unit tests for pure computation functions in 06_compute_metrics.py.

These functions contain all the health-metric maths. A formula bug here
(like the yearsLost ÷10 incident) would silently corrupt every city's data,
so we test boundaries and known values explicitly.

Run from project root:
    pytest tests/ -v
"""

import math
import pytest
import pandas as pd
import numpy as np
import os
from importlib import import_module

os.environ.setdefault("DISABLE_PANDERA_IMPORT_WARNING", "True")

# Import the module by filename since it starts with a digit
metrics = import_module("06_compute_metrics")

classify_band    = metrics.classify_band
cig_equiv        = metrics.cig_equiv
years_lost       = metrics.years_lost
aqi_distribution = metrics.aqi_distribution
safe_day_pct     = metrics.safe_day_pct


# ── classify_band ─────────────────────────────────────────────────────────────

class TestClassifyBand:
    def test_zero_is_good(self):
        assert classify_band(0.0) == "good"

    def test_below_15_is_good(self):
        assert classify_band(10.0) == "good"

    def test_exactly_15_is_good(self):
        # Boundary belongs to the lower (better) band
        assert classify_band(15.0) == "good"

    def test_just_above_15_is_moderate(self):
        assert classify_band(15.1) == "moderate"

    def test_exactly_25_is_moderate(self):
        assert classify_band(25.0) == "moderate"

    def test_just_above_25_is_unhealthy_sensitive(self):
        assert classify_band(25.1) == "unhealthy_sensitive"

    def test_exactly_50_is_unhealthy_sensitive(self):
        assert classify_band(50.0) == "unhealthy_sensitive"

    def test_just_above_50_is_unhealthy(self):
        assert classify_band(50.1) == "unhealthy"

    def test_exactly_100_is_unhealthy(self):
        assert classify_band(100.0) == "unhealthy"

    def test_just_above_100_is_hazardous(self):
        assert classify_band(100.1) == "hazardous"

    def test_very_high_is_hazardous(self):
        assert classify_band(500.0) == "hazardous"

    def test_nan_returns_unknown(self):
        assert classify_band(float("nan")) == "unknown"

    def test_none_via_nan_returns_unknown(self):
        assert classify_band(math.nan) == "unknown"


# ── cig_equiv ─────────────────────────────────────────────────────────────────

class TestCigEquiv:
    """Berkeley Earth: 22 µg/m³ PM2.5 = 1 cigarette/day."""

    def test_zero_pm25(self):
        assert cig_equiv(0.0) == 0.0

    def test_one_cigarette(self):
        # Exactly 22 µg/m³ → 1.0 cig/day
        assert cig_equiv(22.0) == pytest.approx(1.0)

    def test_two_cigarettes(self):
        assert cig_equiv(44.0) == pytest.approx(2.0)

    def test_fractional(self):
        # Bangkok annual median ~20 µg/m³ → ~0.91 cigs/day
        result = cig_equiv(20.0)
        assert result == pytest.approx(0.91, abs=0.01)

    def test_delhi_level(self):
        # Delhi ~60.5 µg/m³ → ~2.75 cigs/day
        result = cig_equiv(60.5)
        assert result == pytest.approx(2.75, abs=0.01)

    def test_nan_returns_none(self):
        assert cig_equiv(float("nan")) is None

    def test_negative_clamps_to_zero(self):
        # Sensor error values can be slightly negative; must not go below 0
        assert cig_equiv(-5.0) == 0.0


# ── years_lost ────────────────────────────────────────────────────────────────

class TestYearsLost:
    """AQLI: each 10 µg/m³ above WHO 5 µg/m³ baseline ≈ 0.98 yr lost."""

    def test_at_who_baseline_no_loss(self):
        assert years_lost(5.0) == 0.0

    def test_below_baseline_no_loss(self):
        assert years_lost(2.0) == 0.0

    def test_zero_pm25_no_loss(self):
        assert years_lost(0.0) == 0.0

    def test_fifteen_micrograms(self):
        # (15 - 5) / 10 * 0.98 = 0.98
        assert years_lost(15.0) == pytest.approx(0.98, abs=0.01)

    def test_bangkok_level(self):
        # Bangkok ~20 µg/m³ → (20-5)/10*0.98 = 1.47
        assert years_lost(20.0) == pytest.approx(1.47, abs=0.01)

    def test_delhi_level(self):
        # Delhi ~60.5 µg/m³ → (60.5-5)/10*0.98 ≈ 5.44
        assert years_lost(60.5) == pytest.approx(5.44, abs=0.02)

    def test_dhaka_level(self):
        # Dhaka ~121.6 µg/m³ → (121.6-5)/10*0.98 ≈ 11.43
        assert years_lost(121.6) == pytest.approx(11.43, abs=0.02)

    def test_not_the_old_wrong_formula(self):
        # Guard against re-introducing the ×10 bug (formula was missing /10)
        # With the correct formula, Delhi is ~5.44, NOT 54.37
        assert years_lost(60.5) < 10.0

    def test_nan_returns_zero(self):
        assert years_lost(float("nan")) == 0.0


# ── aqi_distribution ──────────────────────────────────────────────────────────

class TestAqiDistribution:
    def test_empty_series_returns_zeros(self):
        result = aqi_distribution(pd.Series([], dtype=float))
        assert all(v == 0.0 for v in result.values())
        assert set(result.keys()) == {"good", "moderate", "unhealthy_sensitive", "unhealthy", "hazardous"}

    def test_all_good(self):
        result = aqi_distribution(pd.Series([5.0, 10.0, 14.9, 15.0]))
        assert result["good"] == 100.0
        assert result["moderate"] == 0.0

    def test_all_hazardous(self):
        result = aqi_distribution(pd.Series([200.0, 300.0, 500.0]))
        assert result["hazardous"] == 100.0

    def test_mixed_sums_to_100(self):
        values = pd.Series([5.0, 20.0, 35.0, 75.0, 200.0])
        result = aqi_distribution(values)
        assert sum(result.values()) == pytest.approx(100.0, abs=0.2)

    def test_equal_split(self):
        # 2 good, 2 hazardous → each should be 50%
        values = pd.Series([5.0, 10.0, 200.0, 300.0])
        result = aqi_distribution(values)
        assert result["good"] == pytest.approx(50.0, abs=0.5)
        assert result["hazardous"] == pytest.approx(50.0, abs=0.5)

    def test_nan_values_excluded(self):
        # NaN rows must not count toward total
        values = pd.Series([5.0, float("nan"), 10.0])
        result = aqi_distribution(values)
        assert result["good"] == 100.0


# ── safe_day_pct ──────────────────────────────────────────────────────────────

class TestSafeDayPct:
    """Walk ≤50, cycle ≤35, jog ≤25 µg/m³."""

    def test_empty_returns_none_for_all(self):
        result = safe_day_pct(pd.Series([], dtype=float))
        assert result == {"walk": None, "cycle": None, "jog": None}

    def test_all_clean_air_100_pct(self):
        result = safe_day_pct(pd.Series([5.0, 10.0, 15.0]))
        assert result["walk"] == 100.0
        assert result["cycle"] == 100.0
        assert result["jog"] == 100.0

    def test_heavily_polluted_0_pct(self):
        result = safe_day_pct(pd.Series([60.0, 80.0, 120.0]))
        assert result["walk"] == 0.0
        assert result["cycle"] == 0.0
        assert result["jog"] == 0.0

    def test_activity_thresholds_order(self):
        # Safe-for-walk is the most permissive; jog is the most strict
        result = safe_day_pct(pd.Series([30.0, 30.0, 30.0]))  # above jog (25), below cycle (35)
        assert result["jog"] == 0.0
        assert result["cycle"] == 100.0
        assert result["walk"] == 100.0

    def test_boundary_value_counts_as_safe(self):
        # Exactly at threshold → safe (≤, not <)
        result = safe_day_pct(pd.Series([50.0]))  # walk threshold is 50.0
        assert result["walk"] == 100.0
