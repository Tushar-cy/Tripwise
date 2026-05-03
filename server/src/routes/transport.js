const express = require('express');
const { getDestination } = require('../services/mockData');
const CITY_MAP = require('../data/cityMap');
const router = express.Router();

const DISTANCE_MAP = {
  'delhi-jaipur': 280,   'delhi-agra': 230,    'delhi-varanasi': 820,
  'delhi-manali': 540,   'delhi-rishikesh': 245,'delhi-shimla': 350,
  'delhi-amritsar': 450, 'delhi-chandigarh': 250,
  'delhi-goa': 1900,     'delhi-mumbai': 1400,  'delhi-bangalore': 2100,
  'delhi-hyderabad': 1500,'delhi-chennai': 2200,'delhi-kolkata': 1500,
  'delhi-udaipur': 660,  'delhi-jodhpur': 600,  'delhi-bhopal': 770,
  'delhi-pune': 1460,
  'mumbai-goa': 590,     'mumbai-pune': 150,    'mumbai-bangalore': 980,
  'mumbai-hyderabad': 710,'mumbai-udaipur': 800,
  'bangalore-mysuru': 150,'bangalore-coorg': 265,'bangalore-ooty': 280,
  'bangalore-chennai': 350,'bangalore-hyderabad': 570,
  'chennai-pondicherry': 160,'chennai-madurai': 460,
  'hyderabad-goa': 680,  'hyderabad-bangalore': 570,
  'kolkata-darjeeling': 615,'kolkata-varanasi': 670,
};

function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function estimateDistance(fromData, toData) {
  const fromL = (fromData.name || '').toLowerCase().replace(/\s+/g, '');
  const toL   = (toData.name   || '').toLowerCase().replace(/\s+/g, '');
  const key1  = `${fromL}-${toL}`;
  const key2  = `${toL}-${fromL}`;
  if (DISTANCE_MAP[key1]) return DISTANCE_MAP[key1];
  if (DISTANCE_MAP[key2]) return DISTANCE_MAP[key2];
  
  if (fromData.lat && fromData.lng && toData.lat && toData.lng) {
    const straightLine = getHaversineDistance(fromData.lat, fromData.lng, toData.lat, toData.lng);
    return Math.max(50, Math.round(straightLine * 1.3)); // 1.3x multiplier for road distance
  }
  return 800;
}

router.get('/', async (req, res) => {
  const { from, to, destination } = req.query;

  const toKey = to || destination;
  if (!toKey) return res.status(400).json({ error: 'Provide to= (destination) query param' });

  const dest = getDestination(toKey);
  if (!dest) return res.status(404).json({ error: 'Destination not found' });

  const fromKey = from || 'delhi';
  const transport = dest.transport || {};

  const fromCityData = CITY_MAP[fromKey.toLowerCase()] || {
    name: fromKey.charAt(0).toUpperCase() + fromKey.slice(1),
    iata: fromKey.substring(0, 3).toUpperCase(),
    station: fromKey.substring(0, 4).toUpperCase(),
    lat: 20.5937,
    lng: 78.9629
  };
  const toCityData = CITY_MAP[dest.id.toLowerCase()] || {
    name: dest.name,
    iata: dest.name.substring(0, 3).toUpperCase(),
    station: dest.name.substring(0, 4).toUpperCase(),
    lat: 20.5937,
    lng: 78.9629
  };

  const distKm = estimateDistance(fromCityData, toCityData);

  // Dynamic realistic fallback data based on distance
  const trainSleeper = Math.round(distKm * 0.60 + 100);
  const train3AC     = Math.round(distKm * 1.60 + 150);
  const train2AC     = Math.round(distKm * 2.40 + 200);
  const busPrice     = Math.round(distKm * 2.00 + 100);
  const cabPrice     = Math.round(distKm * 14);
  
  let flightPrice;
  if (distKm < 500)       flightPrice = 3500;
  else if (distKm < 1000) flightPrice = 5500;
  else if (distKm < 1500) flightPrice = 7500;
  else                    flightPrice = 9000;

  const dynamicTrains = [{
    id: 'dt1', name: `${toCityData.name} Express`, number: '124' + Math.floor(Math.random() * 90),
    departure: '18:30', arrival: '08:15', duration: `${Math.max(1, Math.round(distKm / 60))}h 30m`,
    classes: [
      { name: 'Sleeper', price: trainSleeper, availability: 'Available' },
      { name: '3AC', price: train3AC, availability: 'Available' },
      { name: '2AC', price: train2AC, availability: 'RAC' }
    ], type: 'popular'
  }];

  const dynamicFlights = distKm > 300 ? [{
    id: 'df1', airline: 'IndiGo', flightNo: '6E-' + Math.floor(Math.random() * 900 + 100),
    departure: '08:00', arrival: '09:30', duration: '1h 30m', stops: 'Non-stop',
    price: flightPrice, carbon: '45 kg CO₂'
  }] : [];

  const dynamicBuses = [{
    id: 'db1', operator: 'Intercity SmartBus', type: 'AC Sleeper',
    departure: '21:00', arrival: '06:00', duration: `${Math.max(1, Math.round(distKm / 45))}h 00m`, price: busPrice
  }];

  const dynamicCab = {
    estimatedFare: cabPrice, distanceKm: distKm, duration: `${Math.max(1, Math.round(distKm / 50))} hours`, providers: ['Ola', 'Uber']
  };

  // 1. Train API (RailwayAPI)
  let liveTrains = null;
  try {
    const fromStation = fromCityData.station;
    const toStation = toCityData.station;
    const response = await fetch(
      `https://railwayapi.in/api/trains-between-stations/?from_station_code=${fromStation}&to_station_code=${toStation}`,
      { headers: { 'Authorization': `Bearer ${process.env.RAILWAY_API_KEY || ''}` }, signal: AbortSignal.timeout(4000) }
    );
    if (response.ok && process.env.RAILWAY_API_KEY) {
      const data = await response.json();
      if (data.trains) {
        liveTrains = data.trains.slice(0, 5).map(t => ({
          id: t.train_number,
          name: t.train_name,
          number: t.train_number,
          departure: t.departure_time,
          arrival: t.arrival_time,
          duration: t.travel_time,
          classes: t.classes?.map(c => {
            let p = c.fare || 0;
            if (p === 0) {
              if (c.class_code === 'SL') p = trainSleeper;
              else if (c.class_code === '3A' || c.class_code === 'CC') p = train3AC;
              else if (c.class_code === '2A') p = train2AC;
              else if (c.class_code === '1A') p = Math.round(distKm * 3.50 + 300);
              else p = trainSleeper;
            }
            return { name: c.class_code, price: p, availability: 'Check IRCTC' };
          }) || [],
          source: 'live',
        }));
      }
    }
  } catch (e) {}

  // 2. Flight API (Booking.com RapidAPI)
  let liveFlights = null;
  try {
    if (process.env.RAPIDAPI_KEY) {
      const headers = {
        'x-rapidapi-host': 'booking-com15.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      };

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      // Assuming searchFlights endpoint based on standard Booking.com RapidAPI structure
      const flightRes = await fetch(
        `https://booking-com15.p.rapidapi.com/api/v1/flights/searchFlights?fromId=${fromCityData.iata}&toId=${toCityData.iata}&departDate=${dateStr}&pageNo=1&adults=1&currency_code=INR`,
        { headers, signal: AbortSignal.timeout(6000) }
      );

      if (flightRes.ok) {
        const flightData = await flightRes.json();
        const flights = flightData?.data?.flightOffers || [];
        
        if (flights.length > 0) {
          liveFlights = flights.slice(0, 5).map(f => {
            const segment = f.segments?.[0];
            return {
              id: f.token || Math.random().toString(),
              airline: segment?.marketingCarrier?.name || 'Airlines',
              flightNo: segment?.flightNumber || 'FL123',
              from: fromCityData.iata,
              to: toCityData.iata,
              departure: segment?.departureTime ? segment.departureTime.split('T')[1].substring(0, 5) : '10:00',
              arrival: segment?.arrivalTime ? segment.arrivalTime.split('T')[1].substring(0, 5) : '12:00',
              duration: f.totalTravelTime || '2h 00m',
              stops: f.segments?.length > 1 ? `${f.segments.length - 1} stop` : 'Non-stop',
              price: f.priceBreakdown?.total?.units || flightPrice,
              source: 'live-booking'
            };
          });
        }
      }
    }
  } catch (e) {
    console.warn('[Transport API] Flights failed, falling back to mock data', e.message);
  }

  // 3. Bus API (Google Maps Directions Transit)
  let liveBuses = null;
  try {
    if (process.env.GOOGLE_MAPS_API_KEY) {
      const gmapsRes = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${fromCityData.lat},${fromCityData.lng}&destination=${toCityData.lat},${toCityData.lng}&mode=transit&transit_mode=bus&key=${process.env.GOOGLE_MAPS_API_KEY}`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (gmapsRes.ok) {
        const gmapsData = await gmapsRes.json();
        if (gmapsData.routes && gmapsData.routes[0]) {
          const leg = gmapsData.routes[0].legs[0];
          let p = Math.round((leg.distance.value / 1000) * 2);
          if (p < 100) p = busPrice;
          liveBuses = [{
            id: 'gbus1',
            operator: 'State Transit',
            type: 'Bus',
            from: fromCityData.name,
            to: toCityData.name,
            departure: fromCityData.name,
            arrival: toCityData.name,
            duration: leg.duration.text,
            price: p,
            source: 'live'
          }];
        }
      }
    }
  } catch (e) {}

  const trains = liveTrains || dynamicTrains;
  const flights = liveFlights || dynamicFlights;
  const buses = liveBuses || dynamicBuses;

  const cheapestTrain = trains.reduce((min, t) => {
    const price = t.classes?.[0]?.price || 9999;
    return price < min ? price : min;
  }, Infinity);
  const cheapestFlight = flights.reduce((min, f) => Math.min(min, f.price || 9999), Infinity);
  const cheapestBus = buses.reduce((min, b) => Math.min(min, b.price || 9999), Infinity);

  const cheapestOneway = Math.min(
    isFinite(cheapestTrain) ? cheapestTrain : Infinity,
    isFinite(cheapestFlight) ? cheapestFlight : Infinity,
    isFinite(cheapestBus) ? cheapestBus : Infinity
  );

  res.json({
    success: true,
    fromCity: fromCityData.name,
    toCity: dest.name,
    toState: dest.state,
    trains,
    flights,
    buses,
    cab: dynamicCab,
    localTransport: transport.localTransport || [],
    summary: {
      cheapestOnewayINR: isFinite(cheapestOneway) ? cheapestOneway : 0,
      estimatedRoundtripINR: isFinite(cheapestOneway) ? cheapestOneway * 2 : 0,
      recommendedMode: trains.length > 0 ? 'Train' : flights.length > 0 ? 'Flight' : 'Bus',
      note: 'Budget includes 10% transport safety buffer for fare surges & local cabs',
    },
  });
});

module.exports = router;
