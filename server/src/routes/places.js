const express = require('express');
const { getDestination } = require('../services/mockData');
const router = express.Router();

// Helper: Haversine distance as fallback
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/places?destination=jaipur
router.get('/', (req, res) => {
  const { destination } = req.query;
  if (!destination) return res.status(400).json({ error: 'destination query param required' });

  const dest = getDestination(destination);
  if (!dest) return res.status(404).json({ error: 'Destination not found' });

  // Sort by popularity
  const places = (dest.places || []).sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));

  res.json({
    success: true,
    destination: dest.name,
    places,
    timeManagement: dest.timeManagement || {},
    restaurants: dest.popularRestaurants || [],
    totalEntryFeeMin: places.reduce((sum, p) => sum + (p.entryFee || 0), 0),
  });
});

// GET /api/places/nearby?destination=jaipur  (time-clustered)
router.get('/nearby', async (req, res) => {
  const { destination } = req.query;
  if (!destination) return res.status(400).json({ error: 'destination query param required' });

  const dest = getDestination(destination);
  if (!dest) return res.status(404).json({ error: 'Destination not found' });

  const allPlaces = dest.places || [];
  
  if (process.env.GOOGLE_MAPS_API_KEY && allPlaces.length > 0) {
    // Live clustering using Distance Matrix API
    try {
      // Build origins and destinations string
      const locations = allPlaces.map(p => `${p.lat},${p.lng}`).join('|');
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${locations}&destinations=${locations}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.rows && data.rows.length === allPlaces.length) {
          // Nearest neighbor algorithm
          let unvisited = [...allPlaces];
          let current = unvisited.shift(); // Start with the first place
          const sorted = [current];

          while (unvisited.length > 0) {
            const currentIndex = allPlaces.findIndex(p => p.id === current.id);
            let nearestIdx = -1;
            let minDistance = Infinity;

            for (let i = 0; i < unvisited.length; i++) {
              const targetIndex = allPlaces.findIndex(p => p.id === unvisited[i].id);
              const element = data.rows[currentIndex].elements[targetIndex];
              const dist = element.status === 'OK' ? element.distance.value : getDistanceFromLatLonInKm(current.lat, current.lng, unvisited[i].lat, unvisited[i].lng) * 1000;
              
              if (dist < minDistance) {
                minDistance = dist;
                nearestIdx = i;
              }
            }

            current = unvisited[nearestIdx];
            sorted.push(current);
            unvisited.splice(nearestIdx, 1);
          }

          // Split into Morning, Afternoon, Evening
          const third = Math.ceil(sorted.length / 3);
          const morningPlaces = sorted.slice(0, third);
          const afternoonPlaces = sorted.slice(third, third * 2);
          const eveningPlaces = sorted.slice(third * 2);

          return res.json({
            success: true,
            destination: dest.name,
            clusters: {
              morning: { label: 'Morning', tip: 'Optimized via Google Maps Distance Matrix', places: morningPlaces },
              afternoon: { label: 'Afternoon', tip: 'Optimized via Google Maps Distance Matrix', places: afternoonPlaces },
              evening: { label: 'Evening', tip: 'Optimized via Google Maps Distance Matrix', places: eveningPlaces },
            },
            mustVisit: allPlaces.filter(p => p.mustVisit).map(p => p.id),
            restaurants: dest.popularRestaurants || [],
          });
        }
      }
    } catch (e) {
      console.warn('[Places API] Distance Matrix failed, falling back to mock clustering');
    }
  }

  // Fallback to Mock Data Clustering
  const tm = dest.timeManagement || {};
  const clusterize = (slot) => {
    const ids = tm[slot]?.places || [];
    return ids.map(id => allPlaces.find(p => p.id === id)).filter(Boolean);
  };

  res.json({
    success: true,
    destination: dest.name,
    clusters: {
      morning: {
        label: tm.morning?.label || 'Morning',
        tip: tm.morning?.tip || '',
        places: clusterize('morning'),
      },
      afternoon: {
        label: tm.afternoon?.label || 'Afternoon',
        tip: tm.afternoon?.tip || '',
        places: clusterize('afternoon'),
      },
      evening: {
        label: tm.evening?.label || 'Evening',
        tip: tm.evening?.tip || '',
        places: clusterize('evening'),
      },
    },
    mustVisit: allPlaces.filter(p => p.mustVisit).map(p => p.id),
    restaurants: dest.popularRestaurants || [],
  });
});

module.exports = router;
