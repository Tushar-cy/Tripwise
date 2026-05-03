import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

/**
 * TripWise — Amadeus Edge Function
 * 
 * Handles all Amadeus API calls server-side so AMADEUS_CLIENT_SECRET
 * is NEVER exposed to the mobile app.
 * 
 * Environment vars required (set in Supabase Dashboard → Edge Functions → Secrets):
 *   AMADEUS_CLIENT_ID     — from developers.amadeus.com
 *   AMADEUS_CLIENT_SECRET — NEVER in mobile .env
 * 
 * Supporteded actions:
 *   hotel_offers   — Hotel search by city IATA code
 *   flight_offers  — Flight search between airports
 */

const AMADEUS_BASE = 'https://test.api.amadeus.com'; // test = free sandbox

// ── OAuth token management ────────────────────────────────────────────────
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAmadeusToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Amadeus credentials not configured in Edge Function environment');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Amadeus OAuth failed: ${res.status}`);
  const data = await res.json();

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.token;
}

// ── CORS headers ──────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Main handler ──────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { action, ...params } = await req.json();
    const token = await getAmadeusToken();

    let apiUrl: string;

    switch (action) {
      case 'hotel_offers': {
        // Hotel search by city IATA code
        const { cityCode, checkIn, checkOut, adults = 2 } = params;
        if (!cityCode || !checkIn || !checkOut) {
          return Response.json({ error: 'cityCode, checkIn, checkOut required' }, { status: 400, headers: CORS });
        }
        apiUrl = `${AMADEUS_BASE}/v3/shopping/hotel-offers?cityCode=${cityCode}&checkInDate=${checkIn}&checkOutDate=${checkOut}&adults=${adults}&max=10&currency=INR`;
        break;
      }

      case 'flight_offers': {
        // Flight search
        const { origin, destination, departureDate, adults = 1 } = params;
        if (!origin || !destination || !departureDate) {
          return Response.json({ error: 'origin, destination, departureDate required' }, { status: 400, headers: CORS });
        }
        apiUrl = `${AMADEUS_BASE}/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${departureDate}&adults=${adults}&currencyCode=INR&max=10`;
        break;
      }

      case 'city_search': {
        // IATA city code lookup
        const { keyword } = params;
        apiUrl = `${AMADEUS_BASE}/v1/reference-data/locations?subType=CITY&keyword=${encodeURIComponent(keyword)}&countryCode=IN&view=LIGHT&max=5`;
        break;
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400, headers: CORS });
    }

    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: `Amadeus API error: ${res.status}`, detail: err }, { status: res.status, headers: CORS });
    }

    const data = await res.json();
    return Response.json(data, { headers: CORS });
  } catch (e: any) {
    return Response.json({ error: e.message || 'Internal error' }, { status: 500, headers: CORS });
  }
});
