const express = require('express');
const { getTrending } = require('../services/mockData');
const router = express.Router();

// Weather Code Mapping for Open-Meteo
const getWeatherCondition = (code) => {
  if (code <= 3) return 'Clear/Cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 69) return 'Rainy';
  if (code <= 79) return 'Snowy';
  return 'Stormy';
};

// GET /api/trending
router.get('/', async (req, res) => {
  const { getTrending, DESTINATIONS } = require('../services/mockData');
  let trending = getTrending();

  try {
    // Fetch live weather for each trending destination via Open-Meteo (no API key needed)
    trending = await Promise.all(
      trending.map(async (dest) => {
        const fullDest = Object.values(DESTINATIONS).find(d => d.id === dest.id);
        if (!fullDest || !fullDest.lat || !fullDest.lng) return dest;

        try {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${fullDest.lat}&longitude=${fullDest.lng}&current=temperature_2m,weather_code`,
            { signal: AbortSignal.timeout(3000) }
          );
          if (response.ok) {
            const data = await response.json();
            const temp = Math.round(data.current.temperature_2m);
            const condition = getWeatherCondition(data.current.weather_code);
            return {
              ...dest,
              weather: { temp, condition }
            };
          }
        } catch (e) {
          // Fallback to mock weather if fetch fails
        }
        return dest;
      })
    );
  } catch (err) {
    console.error('[Trending] Failed to fetch live weather, using mock fallback', err);
  }

  res.json({ success: true, destinations: trending });
});

module.exports = router;
