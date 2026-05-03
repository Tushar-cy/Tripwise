const express = require('express');
const { getDestination } = require('../services/mockData');
const CITY_MAP = require('../data/cityMap');
const router = express.Router();

// GET /api/hotels?destination=jaipur&budget=3000&tier=mid
router.get('/', async (req, res) => {
  const { destination, budget, tier } = req.query;
  if (!destination) return res.status(400).json({ error: 'destination query param required' });

  const dest = getDestination(destination);
  if (!dest) return res.status(404).json({ error: 'Destination not found' });

  const cityData = CITY_MAP[dest.id.toLowerCase()] || CITY_MAP['jaipur'];

  let liveHotels = null;
  try {
    if (process.env.RAPIDAPI_KEY) {
      const headers = {
        'x-rapidapi-host': 'booking-com15.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      };

      // 1. Get Destination ID
      const destRes = await fetch(
        `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(destination)}`,
        { headers, signal: AbortSignal.timeout(5000) }
      );

      if (destRes.ok) {
        const destData = await destRes.json();
        const firstMatch = destData?.data?.find(d => d.search_type === 'CITY') || destData?.data?.[0];
        
        if (firstMatch && firstMatch.dest_id) {
          // 2. Search Hotels (Using INR currency for consistency)
          const hotelsRes = await fetch(
            `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels?dest_id=${firstMatch.dest_id}&search_type=CITY&adults=1&children_age=0%2C17&room_qty=1&page_number=1&units=metric&temperature_unit=c&languagecode=en-us&currency_code=INR`,
            { headers, signal: AbortSignal.timeout(10000) }
          );

          if (hotelsRes.ok) {
            const hotelsData = await hotelsRes.json();
            const results = hotelsData?.data?.hotels || [];
            
            if (results.length > 0) {
              liveHotels = results.slice(0, 10).map(h => {
                const hInfo = h.property;
                const priceInfo = h.accessibilityLabel ? h.accessibilityLabel.match(/\d+,\d+|\d+/) : null;
                // Try to parse exact price if available, otherwise mock based on rating
                let exactPrice = priceInfo ? parseInt(priceInfo[0].replace(/,/g, ''), 10) : null;
                const stars = hInfo.class || 3;
                
                if (!exactPrice) {
                  exactPrice = stars === 5 ? 12000 : stars === 4 ? 4500 : stars === 3 ? 2200 : 900;
                }

                return {
                  id: String(hInfo.id || Math.random()),
                  name: hInfo.name,
                  stars,
                  rating: hInfo.reviewScore || (4.0 + (Math.random() * 0.9)),
                  reviews: hInfo.reviewCount || Math.floor(Math.random() * 1000) + 50,
                  pricePerNight: exactPrice,
                  tier: stars >= 4 ? 'premium' : stars === 3 ? 'mid' : 'budget',
                  distance: 'Near City Centre', // Could extract from hInfo but keeping safe
                  amenities: ['WiFi', 'AC', 'Breakfast'], // Placeholder for amenities
                  images: hInfo.photoUrls && hInfo.photoUrls.length > 0 ? hInfo.photoUrls : ['https://images.unsplash.com/photo-1582719478250-c89404bb8a0e?w=600'],
                  taxes: Math.round(exactPrice * 0.18),
                  cancellation: hInfo.isFreeCancellation ? 'Free cancellation' : 'Non-refundable',
                  location: cityData.name,
                  source: 'live-booking'
                };
              });
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[Hotels API] Failed or not configured, falling back to mock data', e.message);
  }

  let hotels = liveHotels || [...(dest.hotels || [])];

  // ── Guarantee minimum 7 hotels ────────────────────────────────────────────
  function generateMockHotels(destName, budgetPerNight, count) {
    const isNumeric = /^\d+$/.test(destName);
    const city = isNumeric ? '' : destName.charAt(0).toUpperCase() + destName.slice(1);
    const displayName = city ? ` ${city}` : '';
    const BASE = budgetPerNight || 2000;
    const STABLE_IMGS = [
      'https://images.unsplash.com/photo-1582719478250-c89404bb8a0e?w=600',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600',
      'https://images.unsplash.com/photo-1582719478250-c89404bb8a0e?w=600',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600',
    ];
    const templates = [
      { prefix: 'Taj', stars: 5, basePrice: 18500, type: 'premium', amenities: ['WiFi','Pool','AC','Breakfast','Spa','Restaurant','Butler'] },
      { prefix: 'Marriott', stars: 4, basePrice: 12500, type: 'premium', amenities: ['WiFi','Pool','AC','Breakfast','Gym','Restaurant'] },
      { prefix: 'Lemon Tree', stars: 4, basePrice: 5500, type: 'mid', amenities: ['WiFi','AC','Breakfast','Pool'] },
      { prefix: 'FabHotel', stars: 3, basePrice: 2800, type: 'mid', amenities: ['WiFi','AC','Breakfast','Parking'] },
      { prefix: 'OYO Townhouse', stars: 3, basePrice: 1500, type: 'mid', amenities: ['WiFi','AC','TV'] },
      { prefix: 'Zostel', stars: 2, basePrice: 700, type: 'budget', amenities: ['WiFi','Lockers','Common Kitchen','Dorm Beds'] },
      { prefix: 'GoStops', stars: 2, basePrice: 600, type: 'budget', amenities: ['WiFi','Lockers','Rooftop'] },
      { prefix: 'Hotel Heritage', stars: 3, basePrice: 3200, type: 'mid', amenities: ['WiFi','AC','Heritage Decor'] },
      { prefix: 'The Grand', stars: 5, basePrice: 22000, type: 'premium', amenities: ['WiFi','Pool','AC','Spa','Fine Dining'] },
    ];
    return templates.slice(0, count).map((t, i) => {
      const finalPrice = t.basePrice + Math.floor(Math.random() * 500);
      return {
        id: `mock-${destName}-${i}`,
        name: `${t.prefix}${displayName}`,
        stars: t.stars,
        rating: parseFloat((3.7 + Math.random() * 1.2).toFixed(1)),
        reviews: Math.floor(80 + Math.random() * 1200),
        pricePerNight: finalPrice,
        tier: t.stars >= 4 ? 'premium' : t.type === 'budget' ? 'budget' : 'mid',
        distance: `${(0.4 + Math.random() * 4).toFixed(1)} km from centre`,
        amenities: t.amenities,
        images: [STABLE_IMGS[i] || STABLE_IMGS[0]],
        taxes: Math.round(finalPrice * 0.18),
        cancellation: t.stars >= 4 ? 'Free cancellation 48h' : 'Non-refundable',
        location: city ? `${city} City Centre` : 'City Centre',
        source: 'mock',
      };
    });
  }

  // Fill up to 9 hotels if not enough
  if (hotels.length < 7) {
    const budgetVal = budget ? Number(budget) : 2000;
    const mockFill = generateMockHotels(dest.id || destination, budgetVal, 9);
    const existingNames = new Set(hotels.map(h => h.name.toLowerCase()));
    for (const mh of mockFill) {
      if (!existingNames.has(mh.name.toLowerCase())) {
        hotels.push(mh);
        existingNames.add(mh.name.toLowerCase());
      }
      if (hotels.length >= 9) break;
    }
  }

  if (tier && tier !== 'all') {
    hotels = hotels.filter(h => h.tier === tier.toLowerCase());
    // Still need 7 if filter reduced too much — add matching mocks
    if (hotels.length < 4) {
      const budgetVal = budget ? Number(budget) : 2000;
      const mockFill = generateMockHotels(dest.id || destination, budgetVal, 9)
        .filter(m => m.tier === tier.toLowerCase());
      hotels = [...hotels, ...mockFill].slice(0, 9);
    }
  }

  if (budget) {
    const maxPrice = Number(budget) * 1.3;
    hotels = hotels.filter(h => h.pricePerNight <= maxPrice);
  }

  // Add budget fit indicator
  hotels = hotels.map(h => ({
    ...h,
    budgetFit: !budget
      ? 'unknown'
      : h.pricePerNight <= Number(budget)
        ? 'within'
        : h.pricePerNight <= Number(budget) * 1.2
          ? 'slightly_over'
          : 'over',
    overBy: budget && h.pricePerNight > Number(budget) ? h.pricePerNight - Number(budget) : 0,
    savingsVsTop: dest.hotels?.[0] ? Math.max(0, dest.hotels[0].pricePerNight - h.pricePerNight) : 0,
  }));

  // Sort: within budget first, then by rating
  hotels.sort((a, b) => {
    const order = { within: 0, slightly_over: 1, over: 2, unknown: 3 };
    if (order[a.budgetFit] !== order[b.budgetFit]) return order[a.budgetFit] - order[b.budgetFit];
    return b.rating - a.rating;
  });

  res.json({
    success: true,
    destination: dest.name,
    count: hotels.length,
    hotels,
    nearbyFood: dest.popularRestaurants?.slice(0, 2) || [],
  });
});

// GET /api/hotels/:id?destination=jaipur
router.get('/:id', (req, res) => {
  const { destination } = req.query;
  if (!destination) return res.status(400).json({ error: 'destination query param required' });

  const dest = getDestination(destination);
  if (!dest) return res.status(404).json({ error: 'Destination not found' });

  const hotel = (dest.hotels || []).find(h => h.id === req.params.id);
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });

  res.json({
    success: true,
    hotel,
    nearbyRestaurants: dest.popularRestaurants || [],
    nearbyPlaces: (dest.places || []).slice(0, 3),
  });
});

module.exports = router;
