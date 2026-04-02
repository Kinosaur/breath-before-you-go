import requests
import json
import time
from config import CITIES, API_BASE_URL, get_headers

def audit_sensor_coverage():
    print("Auditing OpenAQ v3 Sensor Coverage for 15 Asian Cities...")
    
    results = []
    
    headers = get_headers()
    
    for city in CITIES:
        print(f"Checking {city['name']}...")
        
        # We query locations within 25km radius
        locations_url = f"{API_BASE_URL}/locations?coordinates={city['coordinates']}&radius=25000&limit=100"
        
        # Rate limit handling (Wait if we exceed 60 req/min, but we're only making 15 requests here)
        response = requests.get(locations_url, headers=headers)
        
        if response.status_code == 429:
            print("Rate limit exceeded! Waiting 60 seconds...")
            time.sleep(60)
            response = requests.get(locations_url, headers=headers)
            
        if response.status_code != 200:
            print(f"Error fetching {city['name']}: {response.text}")
            continue
            
        data = response.json()
        locations = data.get('results', [])
        
        active_pm25_sensors = 0
        total_pm25_sensors = 0
        
        for loc in locations:
            # Check for PM2.5 sensors
            for sensor in loc.get("sensors", []):
                if sensor.get("parameter", {}).get("name") == "pm25":
                    total_pm25_sensors += 1
                    
                    # We can check if it's "active" by looking at datetimeLast
                    datetime_last = loc.get("datetimeLast")
                    last_utc = datetime_last.get("utc") if datetime_last else None
                    # In a real check we could parse the date and see if it's within the last month. 
                    if last_utc and type(last_utc) == str and any(year in last_utc for year in ["2024", "2025", "2026"]):
                         active_pm25_sensors += 1
        
        city_result = {
            "City": city['name'],
            "Tier": city['tier'],
            "Total_Locations": len(locations),
            "PM2.5_Sensors": total_pm25_sensors,
            "Active_Recent_PM2.5": active_pm25_sensors,
            "Status": "PASS" if active_pm25_sensors >= 2 else "FAIL (<2 active)",
            "Timezone": city['timezone']
        }
        
        results.append(city_result)
        
        # Sleep slightly to respect rate limits
        time.sleep(1)
        
    print("\n--- COVERAGE REPORT ---\n")
    print(f"{'City':<18} | {'Tier'} | {'Locs'} | {'PM2.5 Sens.'} | {'Active PM2.5'} | {'Status'}")
    print("-" * 75)
    
    for r in results:
        print(f"{r['City']:<18} | {r['Tier']:<4} | {r['Total_Locations']:<4} | {r['PM2.5_Sensors']:<11} | {r['Active_Recent_PM2.5']:<12} | {r['Status']}")
        
    # Generate markdown report
    with open("coverage_report.md", "w") as f:
        f.write("# OpenAQ Sensor Coverage Report\n\n")
        f.write("| City | Tier | Locations | PM2.5 Sensors | Active Recent PM2.5 | Status |\n")
        f.write("|---|---|---|---|---|---|\n")
        for r in results:
            f.write(f"| {r['City']} | {r['Tier']} | {r['Total_Locations']} | {r['PM2.5_Sensors']} | {r['Active_Recent_PM2.5']} | {r['Status']} |\n")
    
    print("\nReport saved to coverage_report.md")

if __name__ == "__main__":
    audit_sensor_coverage()
