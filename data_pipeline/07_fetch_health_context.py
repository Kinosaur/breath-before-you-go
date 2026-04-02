"""
07_fetch_health_context.py
--------------------------
Week 2 Day 4-5: Fetch WHO GHO health data + define seasonal event configs.

Two parts:
  A. WHO GHO OData API — country-level ambient air pollution mortality data
     Endpoint: https://ghoapi.azureedge.net/api/
     Indicators fetched:
       - SDGPM25   : WHO PM2.5 concentration estimates
       - AIR_10    : Ambient air pollution attributable deaths
     No API key required. Falls back gracefully if API is unavailable.

  B. Static seasonal events config — per city, per month
     Blueprint table (§City Coverage) drives this: burning seasons,
     monsoons, dust events, Diwali, etc.
     This is more reliable and more precise than any API for local events.

Output: v3_data/health/health_context.json

Run from data_pipeline/:
  python 07_fetch_health_context.py
"""

import json
import time
import requests
from pathlib import Path
from datetime import datetime

from config import CITIES

OUTPUT_DIR   = Path("v3_data/health")
WHO_BASE_URL = "https://ghoapi.azureedge.net/api"
TIMEOUT      = 15  # seconds per request

# ---------------------------------------------------------------------------
# Country ISO codes for WHO GHO
# Taiwan is not a WHO member state — will be absent from GHO results.
# ---------------------------------------------------------------------------
CITY_COUNTRY_CODES = {
    "bangkok":          "THA",
    "chiang-mai":       "THA",
    "delhi":            "IND",
    "hanoi":            "VNM",
    "jakarta":          "IDN",
    "seoul":            "KOR",
    "beijing":          "CHN",
    "manila":           "PHL",
    "dhaka":            "BGD",
    "kathmandu":        "NPL",
    "ho-chi-minh-city": "VNM",
    "taipei":           "TWN",   # not in WHO — will be null
    "singapore":        "SGP",
    "mumbai":           "IND",
    "ulaanbaatar":      "MNG",
}

# ---------------------------------------------------------------------------
# Seasonal event configs (blueprint §City Coverage table + WHO/academic sources)
# Each entry: months (1-12 list), event name, risk_level (high/medium/low),
# cause (short causal phrase for narrative tooltips)
# ---------------------------------------------------------------------------
SEASONAL_EVENTS = {
    "bangkok": [
        {"months": [2, 3, 4],       "event": "Northern crop burning season",     "risk_level": "high",   "cause": "Agricultural burning in northern Thailand and neighbouring Mekong countries"},
        {"months": [6, 7, 8, 9],    "event": "Monsoon season",                   "risk_level": "low",    "cause": "Rain washes particulates from the air"},
        {"months": [11, 12, 1],     "event": "Cool season haze",                 "risk_level": "medium", "cause": "Temperature inversion traps vehicle and industrial emissions"},
    ],
    "chiang-mai": [
        {"months": [2, 3, 4],       "event": "Worst burning season in SE Asia",  "risk_level": "high",   "cause": "Upland deforestation burning + crop residue burning across the Mekong sub-region"},
        {"months": [6, 7, 8, 9],    "event": "Monsoon season",                   "risk_level": "low",    "cause": "Heavy rainfall clears smoke and dust"},
        {"months": [12, 1],         "event": "Valley inversion haze",            "risk_level": "medium", "cause": "Mountain topography traps cool-season pollution in the valley"},
    ],
    "delhi": [
        {"months": [10, 11],        "event": "Diwali fireworks + crop burning",  "risk_level": "high",   "cause": "Diwali pyrotechnics combined with Punjab/Haryana post-harvest stubble burning peak simultaneously"},
        {"months": [12, 1, 2],      "event": "Winter inversion trap",            "risk_level": "high",   "cause": "Cold air mass + low wind traps vehicle, industrial and biomass burning emissions in the Indo-Gangetic Plain"},
        {"months": [6, 7, 8],       "event": "Monsoon season",                   "risk_level": "low",    "cause": "Southwest monsoon suppresses dust and washes particulates"},
        {"months": [3, 4, 5],       "event": "Pre-monsoon dust storms",          "risk_level": "medium", "cause": "Westerly winds carry Rajasthan desert dust"},
    ],
    "hanoi": [
        {"months": [11, 12, 1, 2],  "event": "Winter pollution season",          "risk_level": "high",   "cause": "Coal power plants, motorcycles and brick kilns under northeast monsoon inversion"},
        {"months": [3],             "event": "Spring haze",                      "risk_level": "medium", "cause": "Agricultural burning transitions with monsoon onset"},
        {"months": [6, 7, 8, 9],    "event": "Summer monsoon",                   "risk_level": "low",    "cause": "Southwest monsoon brings cleaner air from the Gulf of Tonkin"},
    ],
    "jakarta": [
        {"months": [7, 8, 9, 10],   "event": "Dry season peat fire haze",        "risk_level": "high",   "cause": "Kalimantan and Sumatra peat fires during El Niño-amplified dry seasons"},
        {"months": [6],             "event": "Dry season onset",                 "risk_level": "medium", "cause": "Transition from wet to dry season, vehicle emissions accumulate"},
        {"months": [12, 1, 2],      "event": "Wet season",                       "risk_level": "low",    "cause": "Northwest monsoon rains suppress particulates"},
    ],
    "seoul": [
        {"months": [3, 4, 5],       "event": "Yellow dust season",               "risk_level": "high",   "cause": "Gobi and Taklamakan desert dust transported eastward by spring westerlies across China"},
        {"months": [11, 12, 1, 2],  "event": "Winter particulate season",        "risk_level": "medium", "cause": "Coal combustion in China and Korea transported by northwesterly winds"},
        {"months": [7, 8],          "event": "Summer monsoon",                   "risk_level": "low",    "cause": "East Asian monsoon rains clear the atmosphere"},
    ],
    "beijing": [
        {"months": [11, 12, 1, 2],  "event": "Heating season coal combustion",   "risk_level": "high",   "cause": "District heating systems burning coal under winter temperature inversions"},
        {"months": [3, 4],          "event": "Spring dust storms",               "risk_level": "high",   "cause": "Gobi Desert dust mobilised by spring cyclones"},
        {"months": [7, 8],          "event": "Summer monsoon",                   "risk_level": "low",    "cause": "East Asian monsoon reduces pollution concentration"},
    ],
    "manila": [
        {"months": [12, 1, 2, 3, 4, 5], "event": "Dry season pollution",        "risk_level": "medium", "cause": "Vehicle exhaust and industrial emissions accumulate during dry northeast monsoon"},
        {"months": [6, 7, 8, 9, 10, 11],"event": "Wet season",                  "risk_level": "low",    "cause": "Southwest monsoon and typhoon season bring regular rainfall"},
    ],
    "dhaka": [
        {"months": [11, 12, 1, 2],  "event": "Brick kiln burning season",        "risk_level": "high",   "cause": "500+ brick kilns around Dhaka operate during dry winter, combined with vehicle emissions and biomass cooking"},
        {"months": [3],             "event": "Late dry season",                  "risk_level": "medium", "cause": "Pre-monsoon heat and dust with reduced dilution"},
        {"months": [6, 7, 8, 9],    "event": "Monsoon season",                   "risk_level": "low",    "cause": "Heavy rainfall washes out particulates"},
    ],
    "kathmandu": [
        {"months": [11, 12, 1, 2],  "event": "Winter valley inversion",          "risk_level": "high",   "cause": "Himalayan bowl traps cold air, vehicle fumes, waste burning and brick kiln emissions under inversion layer"},
        {"months": [3, 4],          "event": "Pre-monsoon dust and fires",        "risk_level": "medium", "cause": "Forest fires and agricultural burning on valley slopes before monsoon"},
        {"months": [7, 8, 9],       "event": "Monsoon season",                   "risk_level": "low",    "cause": "Himalayan monsoon clears the valley air"},
    ],
    "ho-chi-minh-city": [
        {"months": [12, 1, 2, 3, 4], "event": "Dry season construction dust",   "risk_level": "medium", "cause": "Rapid urban construction, vehicle traffic and agricultural burning during dry northeast monsoon"},
        {"months": [5, 6, 7, 8, 9, 10, 11], "event": "Wet season",              "risk_level": "low",    "cause": "Southwest monsoon and tropical rains suppress dust and emissions"},
    ],
    "taipei": [
        {"months": [10, 11, 12, 1, 2, 3], "event": "Cross-strait industrial pollution", "risk_level": "medium", "cause": "Northeast monsoon carries PM2.5 from eastern Chinese industrial zones across the Taiwan Strait"},
        {"months": [4, 5],          "event": "Spring transitional haze",         "risk_level": "low",    "cause": "Shifting winds during monsoon transition"},
        {"months": [7, 8, 9],       "event": "Typhoon season",                   "risk_level": "low",    "cause": "Frequent rainfall and strong winds clean the atmosphere, though typhoons can also carry dust"},
    ],
    "singapore": [
        {"months": [6, 7, 8, 9, 10], "event": "Transboundary haze episodes",    "risk_level": "high",   "cause": "Sumatra and Kalimantan peat/forest fires carried by southwest monsoon winds to Singapore"},
        {"months": [11, 12, 1, 2],  "event": "Northeast monsoon",               "risk_level": "low",    "cause": "Northeast monsoon brings cleaner oceanic air"},
        {"months": [3, 4, 5],       "event": "Inter-monsoon period",             "risk_level": "medium", "cause": "Light variable winds can concentrate localised emissions"},
    ],
    "mumbai": [
        {"months": [11, 12, 1, 2],  "event": "Winter construction and burning",  "risk_level": "high",   "cause": "Post-monsoon construction boom, Diwali residue, vehicular emissions under winter inversion over Arabian Sea coast"},
        {"months": [3, 4, 5],       "event": "Pre-monsoon heat haze",            "risk_level": "medium", "cause": "Rising temperatures and low rainfall concentrate urban emissions"},
        {"months": [6, 7, 8, 9],    "event": "Southwest monsoon",               "risk_level": "low",    "cause": "Arabian Sea monsoon brings heavy rainfall and clean oceanic air"},
    ],
    "ulaanbaatar": [
        {"months": [10, 11, 12, 1, 2, 3, 4], "event": "Coal ger district heating", "risk_level": "high", "cause": "Traditional felt tents (gers) in peri-urban districts burn low-grade coal for heating during -40°C winters; one of the worst urban winter pollution events globally"},
        {"months": [5, 6, 7, 8, 9], "event": "Summer season",                   "risk_level": "low",    "cause": "No heating demand; strong summer winds dilute remaining vehicle emissions"},
    ],
}

# ---------------------------------------------------------------------------
# WHO GHO fetch
# ---------------------------------------------------------------------------

def fetch_who_indicator(indicator: str, country_code: str) -> list[dict]:
    """
    Fetch the most recent WHO GHO data for a given indicator and country.
    Returns a list of result objects (may be empty if country not in dataset).
    """
    url = (
        f"{WHO_BASE_URL}/{indicator}"
        f"?$filter=SpatialDim eq '{country_code}'"
        f"&$orderby=TimeDim desc"
        f"&$top=5"
    )
    try:
        resp = requests.get(url, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json().get("value", [])
    except Exception as e:
        print(f"    [WHO API] {indicator}/{country_code} failed: {e}")
        return []


def fetch_who_data() -> dict:
    """
    Fetch WHO GHO data for all unique countries.
    Returns {country_code: {indicator: [records]}}
    """
    unique_countries = sorted(set(CITY_COUNTRY_CODES.values()))
    indicators = {
        "SDGPM25":  "WHO PM2.5 concentration estimates",
        "AIR_10":   "Ambient air pollution attributable deaths per 100k",
    }

    results: dict[str, dict] = {}

    for country in unique_countries:
        if country == "TWN":
            print(f"    [SKIP] Taiwan (TWN) — not a WHO member state, no GHO data")
            results[country] = {}
            continue

        results[country] = {}
        for indicator, desc in indicators.items():
            print(f"    Fetching {indicator} for {country}...", end="", flush=True)
            records = fetch_who_indicator(indicator, country)
            results[country][indicator] = records
            print(f" {len(records)} records")
            time.sleep(0.5)  # be polite to WHO servers

    return results


def extract_who_summary(who_data: dict, country_code: str) -> dict:
    """
    Pull the most recent values for PM2.5 estimate and mortality rate.
    """
    if country_code not in who_data or not who_data[country_code]:
        return {"available": False}

    def latest_value(records: list) -> dict | None:
        if not records:
            return None
        r = records[0]  # already sorted desc by year
        return {
            "value": r.get("NumericValue"),
            "year":  r.get("TimeDim"),
            "unit":  r.get("Unit"),
        }

    country = who_data[country_code]
    return {
        "available": True,
        "pm25Estimate": latest_value(country.get("SDGPM25", [])),
        "mortalityPer100k": latest_value(country.get("AIR_10", [])),
    }


# ---------------------------------------------------------------------------
# Assemble final health context
# ---------------------------------------------------------------------------

def build_health_context(who_data: dict) -> dict:
    context = {
        "generated": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "sources": {
            "who_gho": "WHO Global Health Observatory OData API — ghoapi.azureedge.net",
            "seasonal_events": "Blueprint §City Coverage table + academic/WHO seasonal health literature",
            "exercise_thresholds": "WHO 2021 AQI guidelines adapted for activity-specific inhalation rates",
        },
        "exerciseThresholds": {
            "walk":  {"maxPm25": 50.0,  "rationale": "WHO 'Unhealthy' threshold; walkers have baseline inhalation rate"},
            "cycle": {"maxPm25": 35.0,  "rationale": "Intermediate; moderate exertion increases inhalation 3-5x"},
            "jog":   {"maxPm25": 25.0,  "rationale": "WHO 'Moderate' threshold; runners inhale 5-10x more than walkers"},
        },
        "whoBands": [
            {"id": b["id"], "label": b["label"], "min": b["min"], "max": b["max"], "color": b["color"]}
            for b in [
                {"id": "good",                "label": "Good",                    "min": 0,     "max": 15.0,  "color": "#4CAF50"},
                {"id": "moderate",            "label": "Moderate",                "min": 15.1,  "max": 25.0,  "color": "#FFEB3B"},
                {"id": "unhealthy_sensitive", "label": "Unhealthy for Sensitive", "min": 25.1,  "max": 50.0,  "color": "#FF9800"},
                {"id": "unhealthy",           "label": "Unhealthy",               "min": 50.1,  "max": 100.0, "color": "#F44336"},
                {"id": "hazardous",           "label": "Hazardous",               "min": 100.1, "max": 9999,  "color": "#9C27B0"},
            ]
        ],
        "cities": {},
    }

    for city in CITIES:
        cid          = city["id"]
        country_code = CITY_COUNTRY_CODES.get(cid, "")
        who_summary  = extract_who_summary(who_data, country_code)
        events       = SEASONAL_EVENTS.get(cid, [])

        # Build a per-month risk index from seasonal events (for frontend overlay)
        month_risk: dict[int, str] = {}
        for event in events:
            for m in event["months"]:
                existing = month_risk.get(m, "low")
                # Take the higher risk level
                levels = ["low", "medium", "high"]
                if levels.index(event["risk_level"]) > levels.index(existing):
                    month_risk[m] = event["risk_level"]

        # Fill all 12 months (default "low" if no event)
        monthly_risk_index = [
            {"month": m, "riskLevel": month_risk.get(m, "low")}
            for m in range(1, 13)
        ]

        context["cities"][cid] = {
            "cityId":           cid,
            "countryCode":      country_code,
            "whoData":          who_summary,
            "seasonalEvents":   events,
            "monthlyRiskIndex": monthly_risk_index,
        }

    return context


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("07 — Fetch WHO Health Context + Seasonal Events")
    print("=" * 60)

    print("\n① Fetching WHO GHO data...")
    who_data = {}
    try:
        who_data = fetch_who_data()
        print(f"   WHO GHO: fetched data for {len(who_data)} countries")
    except Exception as e:
        print(f"   [WARN] WHO GHO fetch failed entirely: {e}")
        print(f"   Continuing with static seasonal events only.")

    print("\n② Building health context...")
    context = build_health_context(who_data)

    out_path = OUTPUT_DIR / "health_context.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(context, f, indent=2, ensure_ascii=False)

    print(f"\n   Saved {out_path}")
    print(f"   Cities with seasonal events: {sum(1 for c in context['cities'].values() if c['seasonalEvents'])}/15")
    who_available = sum(1 for c in context["cities"].values() if c["whoData"].get("available"))
    print(f"   Cities with WHO GHO data:    {who_available}/15")

    print(f"\n{'=' * 60}")
    print(f"DONE → {out_path.resolve()}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
