import requests
import json
import os
import pandas as pd
from datetime import datetime
from config import CITIES, API_BASE_URL, get_headers

def fetch_bangkok_poc():
    print("Running PoC fetch for Bangkok...")
    bangkok = next(c for c in CITIES if c["id"] == "bangkok")
    
    # 1. First we need to find the locations (sensors) around Bangkok
    # Uses point and radius (25km)
    locations_url = f"{API_BASE_URL}/locations?coordinates={bangkok['coordinates']}&radius=25000"
    print(f"Fetching sensors for Bangkok: {locations_url}")
    
    response = requests.get(locations_url, headers=get_headers())
    if response.status_code != 200:
        print(f"Failed to fetch locations: {response.text}")
        return
        
    locations_data = response.json()
    if not locations_data.get('results'):
        print("No sensors found!")
        return
        
    locations = locations_data['results']
    print(f"Found {len(locations)} sensors in Bangkok area.")
    
    # 2. Pick the first monitor reporting PM2.5 to fetch its latest measurements
    target_location = None
    target_sensor_id = None
    
    for loc in locations:
        for sensor in loc.get("sensors", []):
            if sensor.get("parameter", {}).get("name") == "pm25":
                target_location = loc
                target_sensor_id = sensor["id"]
                break
        if target_sensor_id:
            break
            
    if not target_location:
        print("No PM2.5 sensors found in Bangkok!")
        return
        
    loc_id = target_location["id"]
    print(f"Targeting Location ID: {loc_id} ({target_location.get('name')}) - Sensor ID: {target_sensor_id}")
    
    # 3. Fetch latest measurements for this sensor
    measurements_url = f"{API_BASE_URL}/sensors/{target_sensor_id}/measurements?limit=10"
    print(f"Fetching measurements: {measurements_url}")
    
    meas_response = requests.get(measurements_url, headers=get_headers())
    if meas_response.status_code != 200:
        print(f"Failed to fetch measurements: {meas_response.text}")
        return
        
    measurements = meas_response.json().get('results', [])
    
    if not measurements:
        print("No measurements returned.")
        return
        
    # 4. Display timezone conversion (UTC to Local)
    print("\n--- MEASUREMENTS (Latest 5) ---")
    df_data = []
    for m in measurements[:5]:
        utc_time = m["period"]["datetimeFrom"]["utc"]
        local_time = m["period"]["datetimeFrom"]["local"]
        value = m["value"]
        
        utc_dt = pd.to_datetime(utc_time)
        local_dt = pd.to_datetime(local_time)
        
        df_data.append({
            "utc_time": utc_dt,
            "local_time": local_dt,
            "pm25_value": value,
            "coverage": m.get("coverage", {}).get("expectedCount", 0)
        })
        
    df = pd.DataFrame(df_data)
    print(df)
    print("\nTimezone normalization verification successful if `local_time` shows UTC+7 offsets (+07:00).")
    
    # Save output for inspection
    os.makedirs("output", exist_ok=True)
    df.to_csv("output/bangkok_poc.csv", index=False)
    print("Saved PoC results to output/bangkok_poc.csv")

if __name__ == "__main__":
    fetch_bangkok_poc()
