const express = require('express');
const { getDestination } = require('../services/mockData');
const router = express.Router();

// GET /api/weather?destination=jaipur
// Tries Open-Meteo (free, no key), falls back to mock data
router.get('/', async (req, res) => {
  const { destination } = req.query;
  if (!destination) return res.status(400).json({ error: 'destination query param required' });

  const dest = getDestination(destination);
  if (!dest) return res.status(404).json({ error: 'Destination not found' });

  let weatherData = dest.weather;
  let source = 'mock';

  // Try Open-Meteo (completely free, no API key)
  try {
    const params = new URLSearchParams({
      latitude: dest.lat,
      longitude: dest.lng,
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index,apparent_temperature,weather_code',
      hourly: 'temperature_2m,precipitation_probability,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
      forecast_days: 7,
      timezone: 'Asia/Kolkata',
    });

    const aqiParams = new URLSearchParams({
      latitude: dest.lat,
      longitude: dest.lng,
      current: 'european_aqi',
      timezone: 'Asia/Kolkata',
    });

    const [response, aqiResponse] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: AbortSignal.timeout(5000) }),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${aqiParams}`, { signal: AbortSignal.timeout(5000) }).catch(() => null)
    ]);

    if (response.ok) {
      const data = await response.json();
      
      let currentAqi = 50; // default good
      if (aqiResponse && aqiResponse.ok) {
        const aqiData = await aqiResponse.json();
        if (aqiData.current && aqiData.current.european_aqi) {
          currentAqi = Math.round(aqiData.current.european_aqi);
        }
      }

      const current = data.current;
      const hourly = data.hourly;
      const daily = data.daily;

      // Map WMO weather codes to readable condition + icon
      const wmoToCondition = (code) => {
        if (code === 0) return { condition: 'Clear Sky', icon: '☀️' };
        if (code <= 3) return { condition: 'Partly Cloudy', icon: '⛅' };
        if (code <= 49) return { condition: 'Foggy', icon: '🌫' };
        if (code <= 69) return { condition: 'Drizzle', icon: '🌦' };
        if (code <= 79) return { condition: 'Rain', icon: '🌧' };
        if (code <= 84) return { condition: 'Rain Showers', icon: '🌦' };
        if (code <= 99) return { condition: 'Thunderstorm', icon: '⛈' };
        return { condition: 'Unknown', icon: '🌤' };
      };

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentCond = wmoToCondition(current.weather_code);

      // Build hourly (next 6 slots)
      const now = new Date();
      const currentHour = now.getHours();
      const hourlySlots = [];
      for (let i = 0; i < 24; i += 4) {
        const idx = Math.floor(currentHour / 4) * 4 + i;
        if (idx < hourly.time.length) {
          const t = new Date(hourly.time[idx]);
          const hh = String(t.getHours()).padStart(2, '0');
          hourlySlots.push({
            time: `${hh}:00`,
            icon: wmoToCondition(hourly.weather_code[idx]).icon,
            temp: Math.round(hourly.temperature_2m[idx]),
            rain: hourly.precipitation_probability[idx] || 0,
          });
        }
      }

      // Build weekly
      const weekly = daily.time.slice(0, 7).map((dateStr, i) => {
        const d = new Date(dateStr);
        return {
          day: dayNames[d.getDay()],
          icon: wmoToCondition(daily.weather_code[i]).icon,
          high: Math.round(daily.temperature_2m_max[i]),
          low: Math.round(daily.temperature_2m_min[i]),
          rain: daily.precipitation_probability_max[i] || 0,
        };
      });

      weatherData = {
        temp: Math.round(current.temperature_2m),
        condition: currentCond.condition,
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        uvIndex: Math.round(current.uv_index || 0),
        aqi: currentAqi, 
        feelsLike: Math.round(current.apparent_temperature),
        hourly: hourlySlots.length > 0 ? hourlySlots : dest.weather.hourly,
        weekly: weekly.length > 0 ? weekly : dest.weather.weekly,
      };
      source = 'live';
      console.log(`[Weather] Live data fetched for ${dest.name}`);
    }
  } catch (err) {
    console.warn('[Weather] Open-Meteo failed, using mock data:', err.message);
  }

  const packingSuggestions = generatePackingSuggestions(weatherData);
  const bestTimeToVisit = getBestTimeToday(weatherData);
  const travelAdvisory = getTravelAdvisory(weatherData);

  res.json({
    success: true,
    destination: dest.name,
    state: dest.state,
    source,
    weather: {
      ...weatherData,
      packingSuggestions,
      bestTimeToVisit,
      travelAdvisory,
    },
    safety: { status: dest.safetyStatus, note: dest.safetyNote },
    networkCoverage: dest.networkCoverage?.overall || 'Good',
    bestSeason: dest.bestSeason,
  });
});

function generatePackingSuggestions(weather) {
  const suggestions = [];
  if (weather.temp > 30) {
    suggestions.push('🌿 Pack light cotton/linen clothes', '🧴 Carry sunscreen SPF 50+', '🧢 Wide-brim hat essential');
  }
  if (weather.temp < 15) {
    suggestions.push('🧥 Carry a warm jacket/fleece', '🧣 Thermal innerwear recommended', '🧤 Pack gloves and woolen socks');
  }
  if (weather.temp >= 15 && weather.temp <= 30) {
    suggestions.push('👕 Light layers — warm mornings, cool evenings');
  }
  if (weather.humidity > 70) {
    suggestions.push('👗 Pack moisture-wicking clothes', '🎒 Waterproof bag cover recommended');
  }
  if (weather.aqi > 100) {
    suggestions.push('😷 Carry N95 mask — AQI is high', '🏃 Avoid outdoor activity 11AM–3PM');
  }
  if (weather.uvIndex > 7) {
    suggestions.push('☀️ Apply SPF 50 every 2 hours', '🕶️ Sunglasses essential');
  }
  const rainyDays = weather.weekly?.filter(d => d.rain > 20).length || 0;
  if (rainyDays > 2) {
    suggestions.push('☂️ Pack a compact umbrella or raincoat');
  }
  if (suggestions.length === 0) {
    suggestions.push('👟 Comfortable walking shoes', '💧 Reusable water bottle', '🔋 Mobile power bank');
  }
  suggestions.push('📋 Carry ID proof (Aadhaar/Passport) + hotel booking printout');
  return suggestions;
}

function getBestTimeToday(weather) {
  const hourly = weather.hourly || [];
  // Find the slot with lowest rain + comfortable temp
  const best = hourly.reduce((acc, slot) => {
    const comfort = Math.abs(slot.temp - 24) + slot.rain / 5;
    if (!acc || comfort < acc.score) return { slot, score: comfort };
    return acc;
  }, null);
  if (best) {
    return `Best outdoor time today: ${best.slot.time} (${best.slot.temp}°C, ${best.slot.rain}% rain chance)`;
  }
  return 'Morning hours (7–10 AM) are generally best for sightseeing';
}

function getTravelAdvisory(weather) {
  const advisories = [];
  if (weather.uvIndex >= 8) advisories.push('🔆 Extreme UV — avoid noon outdoor activity');
  if (weather.aqi > 150) advisories.push('⚠️ Unhealthy AQI — sensitive groups should limit outdoor time');
  if ((weather.weekly || []).some(d => d.rain > 50)) advisories.push('🌧 Heavy rain expected mid-week — carry rain gear');
  if (weather.windSpeed > 30) advisories.push('💨 High wind speed — avoid open elevated areas');
  if (advisories.length === 0) advisories.push('✅ Weather conditions are favorable for your trip');
  return advisories;
}

module.exports = router;
