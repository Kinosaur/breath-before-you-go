import os
from dotenv import load_dotenv

load_dotenv()

OPENAQ_API_KEY = os.getenv("OPENAQ_API_KEY")

API_BASE_URL = "https://api.openaq.org/v3"

CITIES = [
    {
        "id": "bangkok",
        "name": "Bangkok",
        "country": "Thailand",
        "tier": 1,
        "coordinates": "13.7563,100.5018", # Lat, Lon
        "timezone": "Asia/Bangkok"
    },
    {
        "id": "chiang-mai",
        "name": "Chiang Mai",
        "country": "Thailand",
        "tier": 1,
        "coordinates": "18.7883,98.9853",
        "timezone": "Asia/Bangkok"
    },
    {
        "id": "delhi",
        "name": "Delhi",
        "country": "India",
        "tier": 1,
        "coordinates": "28.6139,77.2090",
        "timezone": "Asia/Kolkata"
    },
    {
        "id": "hanoi",
        "name": "Hanoi",
        "country": "Vietnam",
        "tier": 2,
        "coordinates": "21.0285,105.8542",
        "timezone": "Asia/Ho_Chi_Minh"
    },
    {
        "id": "jakarta",
        "name": "Jakarta",
        "country": "Indonesia",
        "tier": 2,
        "coordinates": "-6.2088,106.8456",
        "timezone": "Asia/Jakarta"
    },
    {
        "id": "seoul",
        "name": "Seoul",
        "country": "South Korea",
        "tier": 2,
        "coordinates": "37.5665,126.9780",
        "timezone": "Asia/Seoul"
    },
    {
        "id": "beijing",
        "name": "Beijing",
        "country": "China",
        "tier": 2,
        "coordinates": "39.9042,116.4074",
        "timezone": "Asia/Shanghai"
    },
    {
        "id": "manila",
        "name": "Manila",
        "country": "Philippines",
        "tier": 3,
        "coordinates": "14.5995,120.9842",
        "timezone": "Asia/Manila"
    },
    {
        "id": "dhaka",
        "name": "Dhaka",
        "country": "Bangladesh",
        "tier": 2,
        "coordinates": "23.8103,90.4125",
        "timezone": "Asia/Dhaka"
    },
    {
        "id": "kathmandu",
        "name": "Kathmandu",
        "country": "Nepal",
        "tier": 2,
        "coordinates": "27.7172,85.3240",
        "timezone": "Asia/Kathmandu"
    },
    {
        "id": "ho-chi-minh-city",
        "name": "Ho Chi Minh City",
        "country": "Vietnam",
        "tier": 3,
        "coordinates": "10.8231,106.6297",
        "timezone": "Asia/Ho_Chi_Minh"
    },
    {
        "id": "taipei",
        "name": "Taipei",
        "country": "Taiwan",
        "tier": 3,
        "coordinates": "25.0330,121.5654",
        "timezone": "Asia/Taipei"
    },
    {
        "id": "singapore",
        "name": "Singapore",
        "country": "Singapore",
        "tier": 3,
        "coordinates": "1.3521,103.8198",
        "timezone": "Asia/Singapore"
    },
    {
        "id": "mumbai",
        "name": "Mumbai",
        "country": "India",
        "tier": 3,
        "coordinates": "19.0760,72.8777",
        "timezone": "Asia/Kolkata"
    },
    {
        "id": "ulaanbaatar",
        "name": "Ulaanbaatar",
        "country": "Mongolia",
        "tier": 2,
        "coordinates": "47.9200,106.9200",
        "timezone": "Asia/Ulaanbaatar"
    }
]

def get_headers():
    if not OPENAQ_API_KEY:
        raise ValueError("OPENAQ_API_KEY is missing from environment variables.")
    return {"X-API-Key": OPENAQ_API_KEY}
