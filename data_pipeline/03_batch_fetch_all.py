import requests
import json
import os
import time
import pandas as pd
from config import CITIES, API_BASE_URL, get_headers

def setup_directories():
    os.makedirs("v3_data", exist_ok=True)
    os.makedirs("v3_data/raw", exist_ok=True)
    os.makedirs("v3_data/processed", exist_ok=True)

def fetch_and_process_city(city):
    print(f"\nProcessing {city['name']}...")
    
    # 1. Fetch Sensors for city
    locations_url = f"{API_BASE_URL}/locations?coordinates={city['coordinates']}&radius=25000&limit=100"
    sensors_resp = requests.get(locations_url, headers=get_headers())
    if sensors_resp.status_code == 429:
        print("Rate limit! Waiting 60s...")
        time.sleep(60)
        sensors_resp = requests.get(locations_url, headers=get_headers())
    
    if sensors_resp.status_code != 200:
        print(f"Failed to fetch locations for {city['name']}: {sensors_resp.text}")
        return
        
    locations = sensors_resp.json().get('results', [])
    
    target_sensor_ids = []
    
    # Find active sensors (PM2.5, PM10, NO2)
    for loc in locations:
        for sensor in loc.get("sensors", []):
            param_name = sensor.get("parameter", {}).get("name")
            if param_name in ["pm25", "pm10", "no2"]:
                target_sensor_ids.append((sensor["id"], param_name))
                
    if not target_sensor_ids:
        print(f"No active relevant sensors found for {city['name']}")
        return
        
    print(f"Found {len(target_sensor_ids)} target sensors parameters to fetch.")
    
    # Take a sample of sensors to prevent massive API usage per city during this initial run. Max 10 sensors.
    all_measurements = []
    
    for sensor_id, param in target_sensor_ids[:10]:
        meas_url = f"{API_BASE_URL}/sensors/{sensor_id}/measurements?limit=100"
        
        # Respect rate limits:
        time.sleep(1) # 60 req/min = 1/sec
        
        m_resp = requests.get(meas_url, headers=get_headers())
        if m_resp.status_code == 429:
             print("Rate limit! Waiting 60s...")
             time.sleep(60)
             m_resp = requests.get(meas_url, headers=get_headers())
             
        if m_resp.status_code != 200:
             continue
             
        results = m_resp.json().get('results', [])
        for r in results:
             all_measurements.append({
                 "sensor_id": sensor_id,
                 "parameter": param,
                 "utc_time": r["period"]["datetimeFrom"]["utc"],
                 "local_time": r["period"]["datetimeFrom"]["local"],
                 "value": r["value"],
             })
             
    if not all_measurements:
         print(f"No measurements downloaded for {city['name']}")
         return
         
    df = pd.DataFrame(all_measurements)
    
    # Normalize Timezones explicitly
    df['utc_time'] = pd.to_datetime(df['utc_time'])
    
    # Parse local time directly or set the column offset using Pandas tz_convert if needed.
    # The API returns ISO string with offset natively, so we just pass it to to_datetime
    df['local_time'] = pd.to_datetime(df['local_time'])
    
    output_path = f"v3_data/raw/{city['id']}_sample.csv"
    df.to_csv(output_path, index=False)
    print(f"Saved {len(df)} measurements for {city['name']} to {output_path}")

if __name__ == "__main__":
    setup_directories()
    for city in CITIES:
        fetch_and_process_city(city)
    
    print("\n--- BATCH FETCH COMPLETE ---")
