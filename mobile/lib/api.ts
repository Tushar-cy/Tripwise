import axios, { AxiosRequestConfig } from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// ─── Simple in-memory request deduplication cache ──────────────────
const requestCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL_MS = 30_000; // 30s cache window

function getCacheKey(url: string, params?: any) {
  return `${url}?${JSON.stringify(params || {})}`;
}

function getCache(key: string) {
  const entry = requestCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.data;
  return null;
}

function setCache(key: string, data: any) {
  requestCache.set(key, { data, ts: Date.now() });
}

// ─── Axios instance ─────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,  // 15s — fail fast so users see an error, not a 2-min spinner
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: unwrap .data
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg = error.response?.data?.error || error.message || 'Request failed';
    console.error('[API Error]', error.config?.url, msg);
    throw new Error(msg);
  }
);

// ─── Cached GET helper with automatic retry ─────────────────────────
async function cachedGet(path: string, params?: any, maxRetries = 2): Promise<any> {
  const key = getCacheKey(path, params);
  const cached = getCache(key);
  if (cached) return cached;

  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await api.get(path, { params } as AxiosRequestConfig);
      setCache(key, data);
      return data;
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 800)); // 0.8s, 1.6s backoff
      }
    }
  }
  throw lastErr;
}

// ─── Separate AI instance with longer timeout ───────────────────────
// Budget & itinerary calls go to Gemini via server, need more time
export const aiApi = axios.create({
  baseURL: BASE_URL,
  timeout: 90_000, // 90s for Gemini AI generation
  headers: { 'Content-Type': 'application/json' },
});
aiApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg = error.response?.data?.error || error.message || 'AI request failed';
    console.error('[AI Error]', error.config?.url, msg);
    throw new Error(msg);
  }
);

// ─── Chat API ───────────────────────────────────────────────────────
export const chatAPI = {
  send: (message: string, context: any, history: any[]) =>
    aiApi.post('/api/chat', { message, context, history }),
};

// ─── Budget API ─────────────────────────────────────────────────────
export const budgetAPI = {
  generate: (params: {
    destination: string;
    fromCity?: string;
    totalBudget: number;
    days: number;
    travellers: number;
    tripType: string;
    travellerType: string;
    transportCostOverride?: number;
    overrides?: Record<string, number>;
  }) => aiApi.post('/api/budget/generate', params),

  /** Get minimum realistic budget for route BEFORE user enters one */
  estimateMin: (params: {
    from?: string;
    to: string;
    days: number;
    travellers: number;
    travellerType: string;
  }) => cachedGet('/api/budget/estimate-min', params),
};

// ─── Reverse Geocode: lat/lon → city name ───────────────────────────
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      { headers: { 'User-Agent': 'TripWise/1.0' }, signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return null;
    const data = await r.json();
    // Prefer city > town > county
    return data.address?.city || data.address?.town || data.address?.county || data.address?.state_district || null;
  } catch {
    return null;
  }
}

// ─── Trending API ───────────────────────────────────────────────────
export const trendingAPI = {
  get: () => cachedGet('/api/trending'),
};

// ─── Hotels API ─────────────────────────────────────────────────────
export const hotelsAPI = {
  search: (destination: string, budget?: number, tier?: string) =>
    cachedGet('/api/hotels', { destination, budget, tier }),
  getById: (id: string, destination: string) =>
    cachedGet(`/api/hotels/${id}`, { destination }),
};

// ─── Transport API ──────────────────────────────────────────────────
export const transportAPI = {
  get: (from: string, to: string) =>
    cachedGet('/api/transport', { from, to }),
};

// ─── Places API ─────────────────────────────────────────────────────
export const placesAPI = {
  get: (destination: string) =>
    cachedGet('/api/places', { destination }),
  getNearby: (destination: string) =>
    cachedGet('/api/places/nearby', { destination }),
};

// ─── Weather API ────────────────────────────────────────────────────
export const weatherAPI = {
  get: (destination: string) =>
    cachedGet('/api/weather', { destination }),
};

// ─── Safety API ─────────────────────────────────────────────────────
export const safetyAPI = {
  get: (destination: string) =>
    cachedGet('/api/safety', { destination }),
};

// ─── Network API ────────────────────────────────────────────────────
export const networkAPI = {
  get: (destination: string) =>
    cachedGet('/api/network', { destination }),
};



// ─── OpenCage Geocoding (Free: 2,500 calls/day) ───────────────────────────
// Sign up → opencagedata.com → API keys → copy key
// Set: EXPO_PUBLIC_OPENCAGE_KEY=your_key in mobile/.env

const OPENCAGE_KEY = process.env.EXPO_PUBLIC_OPENCAGE_KEY || '';

export const geoAPI = {
  /**
   * Convert city name → { lat, lng } using OpenCage.
   * Falls back to a curated static map for common Indian cities so the app
   * always works even without an API key.
   */
  getCoords: async (cityName: string): Promise<{ lat: number; lng: number } | null> => {
    // Static fallback for common Indian cities (always works, free, instant)
    const STATIC_COORDS: Record<string, { lat: number; lng: number }> = {
      delhi: { lat: 28.6139, lng: 77.2090 },
      mumbai: { lat: 19.0760, lng: 72.8777 },
      bangalore: { lat: 12.9716, lng: 77.5946 },
      bengaluru: { lat: 12.9716, lng: 77.5946 },
      kolkata: { lat: 22.5726, lng: 88.3639 },
      jaipur: { lat: 26.9124, lng: 75.7873 },
      goa: { lat: 15.2993, lng: 74.1240 },
      manali: { lat: 32.2396, lng: 77.1887 },
      varanasi: { lat: 25.3176, lng: 82.9739 },
      udaipur: { lat: 24.5854, lng: 73.7125 },
      rishikesh: { lat: 30.0869, lng: 78.2676 },
      coorg: { lat: 12.4244, lng: 75.7382 },
      ooty: { lat: 11.4102, lng: 76.6950 },
      ladakh: { lat: 34.1526, lng: 77.5771 },
      leh: { lat: 34.1526, lng: 77.5771 },
      andaman: { lat: 11.7401, lng: 92.6586 },
      mysuru: { lat: 12.2958, lng: 76.6394 },
      agra: { lat: 27.1767, lng: 78.0081 },
      hyderabad: { lat: 17.3850, lng: 78.4867 },
      pune: { lat: 18.5204, lng: 73.8567 },
      chennai: { lat: 13.0827, lng: 80.2707 },
      ahmedabad: { lat: 23.0225, lng: 72.5714 },
    };

    const normalized = cityName.toLowerCase().trim();
    const staticHit = STATIC_COORDS[normalized];
    if (staticHit) return staticHit;

    // OpenCage live lookup
    if (!OPENCAGE_KEY || OPENCAGE_KEY === 'your_opencage_key_here') return null;
    const cacheKey = `geo:${normalized}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      const r = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(cityName + ', India')}&key=${OPENCAGE_KEY}&limit=1&no_annotations=1`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!r.ok) return null;
      const data = await r.json();
      const coords = data.results?.[0]?.geometry ?? null;
      if (coords) setCache(cacheKey, coords);
      return coords;
    } catch {
      return null;
    }
  },
};

// ─── OpenStreetMap / Overpass API (100% Free, no key) ────────────────────
// Uses the public Overpass API endpoint — no registration needed.
// Rate limit: ~1 req/s — we apply 800ms cache to stay well within limits.

const OVERPASS = 'https://overpass-api.de/api/interpreter';

async function overpassQuery(query: string, cacheKey: string) {
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const r = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: query,
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) throw new Error(`Overpass: ${r.status}`);
  const data = await r.json();
  setCache(cacheKey, data);
  return data;
}

export const osmAPI = {
  /** Hotels within radiusKm of given coordinates */
  getHotels: (lat: number, lon: number, radiusKm = 10) =>
    overpassQuery(
      `[out:json][timeout:25];node["tourism"="hotel"](around:${radiusKm * 1000},${lat},${lon});out body;`,
      `osm:hotels:${lat.toFixed(2)}:${lon.toFixed(2)}:${radiusKm}`,
    ),

  /** Restaurants within 5km */
  getRestaurants: (lat: number, lon: number) =>
    overpassQuery(
      `[out:json][timeout:25];node["amenity"="restaurant"](around:5000,${lat},${lon});out body;`,
      `osm:restaurants:${lat.toFixed(2)}:${lon.toFixed(2)}`,
    ),

  /** Tourist attractions + historic sites within 20km */
  getAttractions: (lat: number, lon: number) =>
    overpassQuery(
      `[out:json][timeout:25];(node["tourism"="attraction"](around:20000,${lat},${lon});node["historic"](around:20000,${lat},${lon}););out body;`,
      `osm:attractions:${lat.toFixed(2)}:${lon.toFixed(2)}`,
    ),

  /** ATMs, pharmacies, hospitals within 3km — useful for safety screen */
  getAmenities: (lat: number, lon: number) =>
    overpassQuery(
      `[out:json][timeout:20];(node["amenity"="atm"](around:3000,${lat},${lon});node["amenity"="pharmacy"](around:3000,${lat},${lon});node["amenity"="hospital"](around:5000,${lat},${lon}););out body;`,
      `osm:amenities:${lat.toFixed(2)}:${lon.toFixed(2)}`,
    ),
};

// ─── Amadeus (Sandbox, Free) — via Supabase Edge Function ─────────────────
// Register → developers.amadeus.com → Self-Service → API key + secret
// NEVER put AMADEUS_CLIENT_SECRET in the app .env.
// Deploy supabase/functions/amadeus/ and put secret there.
// Set: EXPO_PUBLIC_AMADEUS_CLIENT_ID=your_id in mobile/.env

import { supabase } from './supabase';

export const amadeusAPI = {
  /**
   * Hotel offers search — calls Supabase Edge Function which holds the secret.
   * Falls back gracefully if edge function is not yet deployed.
   */
  searchHotels: async (params: {
    cityCode: string;       // IATA city code, e.g. 'JAI' for Jaipur
    checkIn: string;        // YYYY-MM-DD
    checkOut: string;
    adults?: number;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('amadeus', {
        body: { action: 'hotel_offers', ...params },
      });
      if (error) throw error;
      return data;
    } catch {
      return null; // Edge function not deployed yet
    }
  },

  /**
   * Flight offers — origin/destination IATA airport codes.
   */
  searchFlights: async (params: {
    origin: string;         // IATA airport code, e.g. 'DEL'
    destination: string;    // e.g. 'JAI'
    departureDate: string;  // YYYY-MM-DD
    adults?: number;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('amadeus', {
        body: { action: 'flight_offers', ...params },
      });
      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  },
};

// ─── India Rail (RapidAPI — Free tier) ───────────────────────────────────
// Search "Indian Railways" on rapidapi.com → Subscribe to free plan
// Set: EXPO_PUBLIC_RAPIDAPI_KEY=your_key in mobile/.env

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || '';
const TRAIN_HOST = 'indian-railway1.p.rapidapi.com';

export const trainAPI = {
  /**
   * Trains between stations.
   * @param from  Station code e.g. "NDLS" (New Delhi)
   * @param to    Station code e.g. "JP" (Jaipur)
   * @param date  YYYYMMDD format
   */
  getTrains: async (from: string, to: string, date: string) => {
    if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'your_rapidapi_key_here') return null;
    const key = `train:${from}:${to}:${date}`;
    const cached = getCache(key);
    if (cached) return cached;

    const r = await fetch(
      `https://${TRAIN_HOST}/trains-between-stations/?fromStationCode=${from}&toStationCode=${to}&dateOfJourney=${date}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': TRAIN_HOST,
        },
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!r.ok) throw new Error(`TrainAPI: ${r.status}`);
    const data = await r.json();
    setCache(key, data);
    return data;
  },

  /** Live train status */
  getStatus: async (trainNumber: string, date: string) => {
    if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'your_rapidapi_key_here') return null;
    const r = await fetch(
      `https://${TRAIN_HOST}/live-train-status/?trainNo=${trainNumber}&startingDate=${date}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': TRAIN_HOST,
        },
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!r.ok) throw new Error(`TrainStatus: ${r.status}`);
    return r.json();
  },
};

// ─── India Open Data / data.gov.in ────────────────────────────────────────
// Register → data.gov.in → API console → get API key
// Set: EXPO_PUBLIC_DATA_GOV_KEY=your_key in mobile/.env
// Resource IDs vary by dataset — browse at data.gov.in/catalogs

const DATA_GOV_KEY = process.env.EXPO_PUBLIC_DATA_GOV_KEY || '';
const DATA_GOV_BASE = 'https://api.data.gov.in/resource';

export const alertsAPI = {
  /**
   * Generic dataset fetch. Pass the resource UUID from data.gov.in.
   */
  getResource: async (resourceId: string, limit = 10) => {
    if (!DATA_GOV_KEY || DATA_GOV_KEY === 'your_data_gov_key_here') return null;
    const key = `datagov:${resourceId}`;
    const cached = getCache(key);
    if (cached) return cached;

    const r = await fetch(
      `${DATA_GOV_BASE}/${resourceId}?api-key=${DATA_GOV_KEY}&format=json&limit=${limit}`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!r.ok) throw new Error(`DataGov: ${r.status}`);
    const data = await r.json();
    setCache(key, data);
    return data;
  },

  /** Disaster/flood alert datasets (IMD / NDRF) */
  getDisasterAlerts: () =>
    // Resource ID: IMD rain/flood alert — replace with actual ID from data.gov.in
    alertsAPI.getResource('3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69', 20),

  /** Tourist statistics by state */
  getTouristStats: () =>
    alertsAPI.getResource('4a3d97b1-498e-4a20-b8c4-0b7e1af3a8d1', 10),
};

// ─── Convenience: resolve city → coords with static fallback ─────────────

/**
 * One-stop helper: get lat/lng for any city.
 * Uses static map first (instant, free), falls back to OpenCage.
 * Used everywhere that feeds lat/lon to OWM, OSM, etc.
 */
export async function resolveCoords(
  cityName: string,
): Promise<{ lat: number; lng: number } | null> {
  return geoAPI.getCoords(cityName);
}

export async function streamItinerary(
  params: {
    destination: string;
    fromCity?: string;
    places: any[];
    days: number;
    tripType: string;
    travellerType: string;
    budgetPerDay: number;
  },
  onChunk: (text: string) => void,
  onStatus: (msg: string) => void,
  onDone: (fullText: string) => void
) {
  const response = await fetch(`${BASE_URL}/api/itinerary/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.body) throw new Error('No response body from itinerary endpoint');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const parsed = JSON.parse(line.replace('data: ', ''));
        if (parsed.type === 'status') onStatus(parsed.message);
        if (parsed.type === 'token') onChunk(parsed.content);
        if (parsed.type === 'done') onDone(parsed.fullText);
      } catch (e) { /* ignore */ }
    }
  }
}
