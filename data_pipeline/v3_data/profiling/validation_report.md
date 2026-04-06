# Breathe Before You Go — JSON Validation Report

Generated: 2026-04-06 15:59

## Result: ✅ ALL CHECKS PASSED

**106 passed** | **0 failed** | **1 warnings**

## Detail


## ① File Existence
  ✅ index.json exists
  ✅ bangkok/profile.json
  ✅ bangkok/seasonal-heatmap.json
  ✅ bangkok/hourly-latest.json
  ✅ chiang-mai/profile.json
  ✅ chiang-mai/seasonal-heatmap.json
  ✅ chiang-mai/hourly-latest.json
  ✅ delhi/profile.json
  ✅ delhi/seasonal-heatmap.json
  ✅ delhi/hourly-latest.json
  ✅ hanoi/profile.json
  ✅ hanoi/seasonal-heatmap.json
  ✅ hanoi/hourly-latest.json
  ✅ jakarta/profile.json
  ✅ jakarta/seasonal-heatmap.json
  ✅ jakarta/hourly-latest.json
  ✅ seoul/profile.json
  ✅ seoul/seasonal-heatmap.json
  ✅ seoul/hourly-latest.json
  ✅ beijing/profile.json
  ✅ beijing/seasonal-heatmap.json
  ✅ beijing/hourly-latest.json
  ✅ manila/profile.json
  ✅ manila/seasonal-heatmap.json
  ✅ manila/hourly-latest.json
  ✅ dhaka/profile.json
  ✅ dhaka/seasonal-heatmap.json
  ✅ dhaka/hourly-latest.json
  ✅ kathmandu/profile.json
  ✅ kathmandu/seasonal-heatmap.json
  ✅ kathmandu/hourly-latest.json
  ✅ ho-chi-minh-city/profile.json
  ✅ ho-chi-minh-city/seasonal-heatmap.json
  ✅ ho-chi-minh-city/hourly-latest.json
  ✅ taipei/profile.json
  ✅ taipei/seasonal-heatmap.json
  ✅ taipei/hourly-latest.json
  ✅ singapore/profile.json
  ✅ singapore/seasonal-heatmap.json
  ✅ singapore/hourly-latest.json
  ✅ mumbai/profile.json
  ✅ mumbai/seasonal-heatmap.json
  ✅ mumbai/hourly-latest.json
  ✅ ulaanbaatar/profile.json
  ✅ ulaanbaatar/seasonal-heatmap.json
  ✅ ulaanbaatar/hourly-latest.json
     All 46 expected files present (1 index + 3 × 15 cities)

## ② Index Structure
  ✅ index.json has all 15 cities
  ✅ Index coordinate range checks passed

## ③–⑦ Per-City Data Checks

### Bangkok (Tier 1)
  ✅ bangkok: heatmap has 366 cells
  ✅ bangkok: byYear has 6 years (2021, 2022, 2023, 2024, 2025, 2026)
  ✅ bangkok: typicalDay has 24 hours
  ✅ bangkok: recentDays has 8 dates

### Chiang Mai (Tier 1)
  ✅ chiang-mai: heatmap has 366 cells
  ✅ chiang-mai: byYear has 4 years (2023, 2024, 2025, 2026)
  ✅ chiang-mai: typicalDay has 24 hours
  ✅ chiang-mai: recentDays has 8 dates

### Delhi (Tier 1)
  ✅ delhi: heatmap has 365 cells
  ✅ delhi: byYear has 3 years (2024, 2025, 2026)
  ✅ delhi: typicalDay has 24 hours
  ✅ delhi: recentDays has 8 dates

### Hanoi (Tier 2)
  ✅ hanoi: heatmap has 366 cells
  ✅ hanoi: byYear has 3 years (2024, 2025, 2026)
  ✅ hanoi: typicalDay has 24 hours
  ✅ hanoi: recentDays has 8 dates

### Jakarta (Tier 2)
  ✅ jakarta: heatmap has 366 cells
  ✅ jakarta: byYear has 4 years (2022, 2023, 2024, 2025)
  ⚠️  jakarta: hourly-latest.json marked unavailable (no hourly data)

### Seoul (Tier 2)
  ✅ seoul: heatmap has 365 cells
  ✅ seoul: byYear has 3 years (2024, 2025, 2026)
  ✅ seoul: typicalDay has 24 hours
  ✅ seoul: recentDays has 8 dates

### Beijing (Tier 2)
  ✅ beijing: heatmap has 366 cells
  ✅ beijing: byYear has 11 years (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026)
  ✅ beijing: typicalDay has 24 hours
  ✅ beijing: recentDays has 8 dates

### Manila (Tier 3)
  ✅ manila: heatmap has 357 cells
  ✅ manila: byYear has 2 years (2025, 2026)
  ✅ manila: typicalDay has 24 hours
  ✅ manila: recentDays has 8 dates

### Dhaka (Tier 2)
  ✅ dhaka: heatmap has 285 cells
  ✅ dhaka: byYear has 3 years (2024, 2025, 2026)
  ✅ dhaka: typicalDay has 24 hours
  ✅ dhaka: recentDays has 8 dates

### Kathmandu (Tier 2)
  ✅ kathmandu: heatmap has 321 cells
  ✅ kathmandu: byYear has 3 years (2024, 2025, 2026)
  ✅ kathmandu: typicalDay has 24 hours
  ✅ kathmandu: recentDays has 8 dates

### Ho Chi Minh City (Tier 3)
  ✅ ho-chi-minh-city: heatmap has 366 cells
  ✅ ho-chi-minh-city: byYear has 11 years (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026)
  ✅ ho-chi-minh-city: typicalDay has 24 hours
  ✅ ho-chi-minh-city: recentDays has 8 dates

### Taipei (Tier 3)
  ✅ taipei: heatmap has 366 cells
  ✅ taipei: byYear has 9 years (2016, 2017, 2018, 2019, 2020, 2021, 2024, 2025, 2026)
  ✅ taipei: typicalDay has 24 hours
  ✅ taipei: recentDays has 8 dates

### Singapore (Tier 3)
  ✅ singapore: heatmap has 365 cells
  ✅ singapore: byYear has 3 years (2024, 2025, 2026)
  ✅ singapore: typicalDay has 24 hours
  ✅ singapore: recentDays has 8 dates

### Mumbai (Tier 3)
  ✅ mumbai: heatmap has 366 cells
  ✅ mumbai: byYear has 6 years (2019, 2020, 2021, 2022, 2025, 2026)
  ✅ mumbai: typicalDay has 24 hours
  ✅ mumbai: recentDays has 8 dates

### Ulaanbaatar (Tier 2)
  ✅ ulaanbaatar: heatmap has 366 cells
  ✅ ulaanbaatar: byYear has 11 years (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026)
  ✅ ulaanbaatar: typicalDay has 24 hours
  ✅ ulaanbaatar: recentDays has 8 dates