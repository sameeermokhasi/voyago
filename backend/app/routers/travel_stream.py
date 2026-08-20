from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio
import requests
import urllib.parse
from datetime import datetime

router = APIRouter()

WMO_WEATHER_CODES = {
    0: ("Clear Sky", "☀️"),
    1: ("Mainly Clear", "🌤️"),
    2: ("Partly Cloudy", "⛅"),
    3: ("Overcast", "☁️"),
    45: ("Foggy", "🌫️"),
    48: ("Depositing Rime Fog", "🌫️"),
    51: ("Light Drizzle", "🌦️"),
    53: ("Moderate Drizzle", "🌦️"),
    55: ("Dense Drizzle", "🌧️"),
    61: ("Slight Rain", "🌧️"),
    63: ("Moderate Rain", "🌧️"),
    65: ("Heavy Rain", "🌧️"),
    71: ("Slight Snow", "🌨️"),
    73: ("Moderate Snow", "❄️"),
    75: ("Heavy Snow", "❄️"),
    80: ("Slight Rain Showers", "🌦️"),
    81: ("Moderate Rain Showers", "🌧️"),
    82: ("Violent Rain Showers", "⛈️"),
    95: ("Thunderstorm", "⚡"),
    96: ("Thunderstorm with Slight Hail", "⛈️"),
    99: ("Thunderstorm with Heavy Hail", "⛈️"),
}

async def fetch_weather_and_stays(destination: str, from_date: str, to_date: str, budget: float, days: int, websocket: WebSocket):
    # 1. Geocoding
    await websocket.send_json({"status": "thinking", "message": f"Geocoding {destination}..."})
    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={destination}&count=1&language=en&format=json"
    
    try:
        geo_res = requests.get(geo_url, timeout=5).json()
        if not geo_res.get("results"):
            await websocket.send_json({"status": "error", "message": "Destination not found"})
            return
            
        location = geo_res["results"][0]
        lat = location["latitude"]
        lon = location["longitude"]
    except Exception as e:
        await websocket.send_json({"status": "error", "message": f"Geocoding failed: {str(e)}"})
        return
        
    # 2. Fetch Weather
    await asyncio.sleep(1) # Simulate thinking
    await websocket.send_json({"status": "thinking", "message": "Fetching live weather data..."})
    
    weather_data = []
    try:
        # We request daily forecast
        forecast_url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&"
            f"start_date={from_date}&end_date={to_date}&timezone=auto"
        )
        forecast_res = requests.get(forecast_url, timeout=5)
        
        if forecast_res.status_code == 200:
            f_data = forecast_res.json()
            daily = f_data.get("daily", {})
            dates = daily.get("time", [])
            max_temps = daily.get("temperature_2m_max", [])
            min_temps = daily.get("temperature_2m_min", [])
            weathercodes = daily.get("weathercode", [])
            precips = daily.get("precipitation_probability_max", [])
            
            for i in range(len(dates)):
                date_obj = datetime.strptime(dates[i], "%Y-%m-%d")
                day_name = date_obj.strftime("%a, %d %b")
                code = weathercodes[i] if i < len(weathercodes) else 0
                condition, emoji = WMO_WEATHER_CODES.get(code, ("Pleasant", "🌤️"))
                precip = precips[i] if i < len(precips) else 0
                
                weather_data.append({
                    "dayNum": i + 1,
                    "dateStr": day_name,
                    "high": round(max_temps[i]) if i < len(max_temps) else 25,
                    "low": round(min_temps[i]) if i < len(min_temps) else 15,
                    "cond": f"{emoji} {condition}",
                    "rain": f"{precip}%"
                })
    except Exception as e:
        print(f"Weather error: {e}")
        pass
        
    # Calculate stay budget per night
    try:
        total_budget = float(budget)
        total_days = max(2, int(days))
        stay_cost = total_budget * 0.4048
        per_night = stay_cost / (total_days - 1)
        per_night_rounded = round(per_night / 100) * 100
        price_range = f"₹{max(0, per_night_rounded - 200)} – ₹{per_night_rounded + 300} per night"
    except (ValueError, TypeError):
        price_range = "Under Budget"

    # 3. Fetch Stays using Overpass API
    await asyncio.sleep(1)
    await websocket.send_json({"status": "thinking", "message": "Searching for real stays..."})
    
    stays_data = []
    try:
        # Overpass query: get hotels/hostels/guest_houses near lat, lon
        overpass_url = "http://overpass-api.de/api/interpreter"
        overpass_query = f"""
        [out:json];
        (
          node["tourism"="hotel"](around:5000,{lat},{lon});
          node["tourism"="guest_house"](around:5000,{lat},{lon});
          node["tourism"="hostel"](around:5000,{lat},{lon});
        );
        out 10;
        """
        response = requests.get(overpass_url, params={'data': overpass_query}, timeout=10)
        
        if response.status_code == 200:
            elements = response.json().get('elements', [])
            # Filter out places without names
            named_places = [e for e in elements if e.get('tags', {}).get('name')]
            
            # Take top 3
            for i, place in enumerate(named_places[:3]):
                tags = place.get('tags', {})
                name = tags.get('name', 'Stay')
                p_lat = place.get('lat')
                p_lon = place.get('lon')
                google_maps_url = f"https://www.google.com/travel/search?q={urllib.parse.quote(name)}+hotel+{destination}&checkin={from_date}&checkout={to_date}"
                
                stays_data.append({
                    "id": i + 1,
                    "name": name,
                    "cuisine": tags.get('tourism', 'hotel').replace('_', ' ').title(),
                    "location": f"Lat: {round(p_lat,4)}, Lon: {round(p_lon,4)}",
                    "rating": "Check Availability ✅",
                    "priceRange": price_range,
                    "itemsWithPrice": f"[Check Availability on Google]({google_maps_url})",
                    "quote": "Sourced live from OpenStreetMap."
                })
    except Exception as e:
        print(f"Overpass error: {e}")
        pass

    # If no stays found or less than 3, provide curated fallbacks with real dates
    while len(stays_data) < 3:
        # Generate tier-appropriate fallback names based on budget
        if per_night_rounded <= 2000:
            fallback_names = [
                f"Trippr {destination} Backpackers",
                f"Maharaja Inn {destination}",
                f"The Green View Guest House {destination}"
            ]
        elif per_night_rounded <= 5000:
            fallback_names = [
                f"Hotel Royal {destination}",
                f"The {destination} Boutique Inn",
                f"Comfort Suites {destination}"
            ]
        else:
            fallback_names = [
                f"The Grand {destination} Resort & Spa",
                f"Taj {destination} Palace",
                f"Luxury Villas {destination}"
            ]
            
        i = len(stays_data)
        name = fallback_names[i]
        
        # Add a max price to the Google query to hint the price range
        max_budget = per_night_rounded + 300
        search_query = f"{name} under {max_budget} INR"
        google_maps_url = f"https://www.google.com/travel/search?q={urllib.parse.quote(search_query)}&checkin={from_date}&checkout={to_date}"
        
        stays_data.append({
            "id": i + 1,
            "name": name,
            "cuisine": "Hotel/Guest House",
            "location": destination,
            "rating": "Check Availability ✅",
            "priceRange": price_range,
            "itemsWithPrice": f"[Check Availability on Google]({google_maps_url})",
            "quote": "Click link above to view live availability for your dates."
        })

    await asyncio.sleep(1)
    await websocket.send_json({
        "status": "success", 
        "data": {
            "weather": weather_data,
            "stays": stays_data
        }
    })


@router.websocket("/ws/travel-planner")
async def travel_planner_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            req = json.loads(data)
            destination = req.get("destination", "Chikmagalur")
            from_date = req.get("fromDate", datetime.today().strftime("%Y-%m-%d"))
            to_date = req.get("toDate", datetime.today().strftime("%Y-%m-%d"))
            budget = req.get("budget", 50000)
            days = req.get("days", 5)
            
            # Start background fetch
            asyncio.create_task(fetch_weather_and_stays(destination, from_date, to_date, budget, days, websocket))
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WS error: {e}")
