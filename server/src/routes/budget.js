const express = require('express');
const { getDestination, DESTINATIONS } = require('../services/mockData');
const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
//  TRANSPORT INTELLIGENCE ENGINE
//  Selects the RIGHT transport mode based on per-person budget & distance.
//  Returns { mode, name, oneWayFare, totalFare (both-way × travellers), note }
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rough distance buckets between major Indian city pairs (km).
 * Used as fallback when no mock data exists.
 */
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

const CITY_MAP = require('../data/cityMap');

function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

/**
 * Estimate distance (km) between two cities.
 */
function estimateDistance(from, to) {
  const fromL = (from || '').toLowerCase().replace(/\s+/g, '');
  const toL   = (to   || '').toLowerCase().replace(/\s+/g, '');
  const key1  = `${fromL}-${toL}`;
  const key2  = `${toL}-${fromL}`;
  if (DISTANCE_MAP[key1]) return DISTANCE_MAP[key1];
  if (DISTANCE_MAP[key2]) return DISTANCE_MAP[key2];
  
  const fromCityData = CITY_MAP[fromL] || Object.values(CITY_MAP).find(c => c.name.toLowerCase() === fromL) || null;
  const toCityData = CITY_MAP[toL] || Object.values(CITY_MAP).find(c => c.name.toLowerCase() === toL) || null;

  if (fromCityData?.lat && fromCityData?.lng && toCityData?.lat && toCityData?.lng) {
    const straightLine = getHaversineDistance(fromCityData.lat, fromCityData.lng, toCityData.lat, toCityData.lng);
    return Math.max(50, Math.round(straightLine * 1.3)); // 1.3x multiplier for road distance
  }
  // Rough default for unknown pair — assume 800 km
  return 800;
}

/**
 * Select the SMART transport mode based on budget per person and distance.
 *
 * Logic:
 *   < 300 km   → Bus preferred if budget is tight, else Train Sleeper / 3AC
 *   300-800 km → Train is default (Sleeper / 3AC / 2AC based on budget)
 *   800-1500km → Train if budget tight, flight if budget > ₹8000/person/trip
 *   > 1500 km  → Flight recommended; Train Sleeper as budget option
 *
 * budgetPerPersonForTransport = (totalBudget × 0.9 × 0.30) / travellers
 * (30% of usable budget per person allocated for ROUND TRIP transport)
 */
// ── Budget tier helper ─────────────────────────────────────────────────────
function getBudgetTier(totalBudget, travellers, days) {
  const perPersonPerDay = totalBudget / Math.max(travellers, 1) / Math.max(days, 1);
  if (perPersonPerDay < 1500) return 'low';
  if (perPersonPerDay < 3500) return 'normal';
  return 'premium';
}

function smartTransportSelection(params) {
  const { fromCity, destination, totalBudget, travellers, days, destData, budgetTier } = params;
  const distKm = estimateDistance(fromCity, destination);
  const budgetPerPerson = Math.round((totalBudget * 0.9 * 0.28) / travellers); // 28% of usable, one side

  // Pull real fares from mock data if available
  let trainSleeper = null, train3AC = null, train2AC = null, trainCC = null;
  let cheapestFlight = null, cheapestBus = null;

  if (destData?.transport && (fromCity || '').toLowerCase() === 'delhi') {
    const trains  = destData.transport.trains  || [];
    const flights = destData.transport.flights || [];
    const buses   = destData.transport.buses   || [];

    // Collect class-level prices
    for (const t of trains) {
      for (const cls of (t.classes || [])) {
        const p = cls.price;
        if (['Sleeper', 'SL'].includes(cls.name) && (trainSleeper === null || p < trainSleeper)) trainSleeper = p;
        if (['3AC', '3A'].includes(cls.name)      && (train3AC    === null || p < train3AC))    train3AC    = p;
        if (['2AC', '2A'].includes(cls.name)      && (train2AC    === null || p < train2AC))    train2AC    = p;
        if (['CC', 'EC'].includes(cls.name)       && (trainCC     === null || p < trainCC))     trainCC     = p;
      }
    }
    for (const f of flights) {
      const p = f.price;
      if (p && (cheapestFlight === null || p < cheapestFlight)) cheapestFlight = p;
    }
    for (const b of buses) {
      const p = b.price;
      if (p && (cheapestBus === null || p < cheapestBus)) cheapestBus = p;
    }
  }

  // ── Realistic fare estimates when mock data is absent ──────────────────
  // Based on approximate Indian Railways pricing patterns (₹/km)
  if (!trainSleeper) trainSleeper = Math.round(distKm * 0.60 + 100);
  if (!train3AC)     train3AC     = Math.round(distKm * 1.60 + 150);
  if (!train2AC)     train2AC     = Math.round(distKm * 2.40 + 200);
  if (!cheapestBus)  cheapestBus  = Math.round(distKm * 2.00 + 100);
  if (!cheapestFlight) {
    // Approximate flight price based on distance
    if (distKm < 500)       cheapestFlight = 3500;
    else if (distKm < 1000) cheapestFlight = 5500;
    else if (distKm < 1500) cheapestFlight = 7500;
    else                    cheapestFlight = 9000;
  }

  // ── Decision matrix ────────────────────────────────────────────────────
  let selected = null;

  // Budget-tier overrides take priority over distance logic
  const tier = budgetTier || getBudgetTier(totalBudget, travellers, days);

  if (tier === 'low') {
    // Force bus regardless of distance
    selected = { mode: 'bus', name: cheapestBus <= 800 ? 'AC Bus' : 'Volvo AC Sleeper', oneWayFare: cheapestBus, note: 'Best budget option — book early for front seats' };
  } else if (tier === 'premium' && distKm > 400) {
    // Prefer flight for premium + long distance
    selected = { mode: 'flight', name: 'Flight', oneWayFare: cheapestFlight, note: 'Fastest and most comfortable for your premium plan' };
  } else {
    // Normal tier (or premium on short routes) — distance-based train selection
    if (distKm < 150) {
      selected = { mode: 'bus', name: 'AC Bus', oneWayFare: cheapestBus, note: 'Best option for short distance' };
    } else if (distKm < 300) {
      if (budgetPerPerson >= train3AC) {
        selected = { mode: 'train', name: 'Train — 3AC', oneWayFare: train3AC, note: 'Comfortable 3AC for short haul' };
      } else {
        selected = { mode: 'train', name: 'Train — Sleeper', oneWayFare: trainSleeper, note: 'Most affordable rail option' };
      }
    } else if (distKm < 800) {
      if (tier === 'premium' && budgetPerPerson >= train2AC) {
        selected = { mode: 'train', name: 'Train — 2AC', oneWayFare: train2AC, note: 'Premium comfort for overnight journey' };
      } else if (budgetPerPerson >= train3AC) {
        selected = { mode: 'train', name: 'Train — 3AC', oneWayFare: train3AC, note: 'Best value for money on this route' };
      } else {
        selected = { mode: 'train', name: 'Train — Sleeper', oneWayFare: trainSleeper, note: 'Budget rail option' };
      }
    } else if (distKm < 1500) {
      if (budgetPerPerson >= train3AC) {
        selected = { mode: 'train', name: 'Train — 3AC', oneWayFare: train3AC, note: 'Overnight train; budget-smart choice' };
      } else {
        selected = { mode: 'train', name: 'Train — Sleeper', oneWayFare: trainSleeper, note: 'Most budget-friendly for this distance' };
      }
    } else {
      if (budgetPerPerson >= cheapestFlight) {
        selected = { mode: 'flight', name: 'Flight', oneWayFare: cheapestFlight, note: 'Only practical option for this distance' };
      } else if (budgetPerPerson >= train3AC) {
        selected = { mode: 'train', name: 'Train — 3AC', oneWayFare: train3AC, note: 'Long journey; book well in advance' };
      } else {
        selected = { mode: 'train', name: 'Train — Sleeper', oneWayFare: trainSleeper, note: '30+ hour journey; book 60 days ahead' };
      }
    }
  }

  // ── Round trip total for all travellers ──────────────────────────────────
  const roundTripPerPerson = selected.oneWayFare * 2;
  const totalFare = roundTripPerPerson * travellers;

  return {
    ...selected,
    distanceKm: distKm,
    roundTripPerPerson,
    totalFare,
    travellers,
    allFares: {
      trainSleeper, train3AC, train2AC, trainCC,
      bus: cheapestBus, flight: cheapestFlight,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  REALISTIC BUDGET ALLOCATION
//  Per-day allocation based on what things actually cost in India.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get realistic daily hotel cost per room (2 people share one room).
 * Solo travellers get single occupancy.
 */
function realisticHotelPerNight(usableAfterTransportPerDay, travellers, travellerType) {
  const rooms = travellerType === 'solo' ? 1 : Math.ceil(travellers / 2);
  const hotelShare = usableAfterTransportPerDay * 0.50; // 50% of remaining daily
  const perRoom = Math.round(hotelShare / rooms);

  // Clamp to realistic ranges
  const minPerRoom = 500;   // Absolute floor (budget guesthouse)
  const maxPerRoom = 15000; // Absolute ceiling (5-star)
  return Math.max(minPerRoom, Math.min(maxPerRoom, perRoom));
}

/**
 * Get realistic daily food budget per person.
 */
function realisticFoodPerDay(usableAfterTransportPerDay, travellers) {
  const foodShare = usableAfterTransportPerDay * 0.30; // 30% of remaining daily
  const perPerson = Math.round(foodShare / travellers);

  // ₹200/day is absolute minimum (street food only)
  // ₹2500/day is comfortable mid-range dining
  return Math.max(200, Math.min(2500, perPerson));
}

// ─────────────────────────────────────────────────────────────────────────────
//  GEMINI AI INSIGHTS
// ─────────────────────────────────────────────────────────────────────────────

// ── Build the AI insight prompt (shared by Gemini + Groq) ──────────────────
function buildInsightPrompt(params) {
  const { destination, fromCity, totalBudget, days, travellers, tripType, transport, hotelPerNight, foodPerDay, perDayBudget } = params;
  return `You are TripWise AI, an expert Indian travel budget advisor.

Trip details:
- Route: ${fromCity} → ${destination} (${transport.distanceKm} km)
- Duration: ${days} nights, ${travellers} traveller(s)
- Total budget: ₹${totalBudget.toLocaleString('en-IN')}
- Per person per day: ₹${Math.round(perDayBudget / travellers).toLocaleString('en-IN')}
- Transport: ${transport.name} (₹${transport.roundTripPerPerson.toLocaleString('en-IN')} per person round trip)
- Hotel: ~₹${hotelPerNight.toLocaleString('en-IN')}/night per room
- Food: ~₹${foodPerDay.toLocaleString('en-IN')}/day per person
- Trip type: ${tripType}

Respond ONLY with a valid JSON object:
{
  "verdict": "One confident, specific sentence about whether this budget is tight/comfortable/generous for ${destination} for ${days} days.",
  "saving_tip": "One specific, actionable saving tip for this exact route and budget.",
  "splurge_recommendation": "One specific experience in ${destination} worth spending extra on.",
  "budget_warning": null
}`;
}

function parseInsightJSON(text) {
  try {
    const cleaned = text.replace(/^```json\s*/m, '').replace(/\s*```$/m, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.verdict && parsed.saving_tip) return parsed;
  } catch (_) {}
  return null;
}

// ── Primary: Gemini via OpenRouter ─────────────────────────────────────────
async function getGeminiInsights(params) {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'TripWise Budget AI',
      },
      body: JSON.stringify({
        model: 'google/gemini-1.5-pro',
        messages: [{ role: 'user', content: buildInsightPrompt(params) }],
        temperature: 0.6,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return parseInsightJSON(data.choices?.[0]?.message?.content || '');
  } catch (e) {
    console.warn('[Budget] Gemini failed:', e.message);
    return null;
  }
}

// ── Failover: Groq (llama3 — extremely fast, free tier) ────────────────────
async function getGroqInsights(params) {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'You are a travel budget AI. Always respond with valid JSON only, no markdown.' },
          { role: 'user', content: buildInsightPrompt(params) },
        ],
        temperature: 0.5,
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return parseInsightJSON(data.choices?.[0]?.message?.content || '');
  } catch (e) {
    console.warn('[Budget] Groq failed:', e.message);
    return null;
  }
}

// ── AI Insights with automatic failover chain ──────────────────────────────
async function getAIInsights(params) {
  // Try Gemini first, fall back to Groq
  const gemini = await getGeminiInsights(params);
  if (gemini) { console.log('[Budget] ✅ Gemini insights'); return { ...gemini, source: 'ai-gemini' }; }

  const groq = await getGroqInsights(params);
  if (groq) { console.log('[Budget] ✅ Groq insights (fallback)'); return { ...groq, source: 'ai-groq' }; }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  DETERMINISTIC SMART INSIGHTS (no AI needed)
// ─────────────────────────────────────────────────────────────────────────────

function deterministicInsights(params) {
  const { destination, fromCity, totalBudget, travellers, days, transport, hotelPerNight, foodPerDay, perDayBudget } = params;
  const destL = (destination || '').toLowerCase();
  const isBeach    = ['goa', 'andaman', 'kovalam', 'varkala', 'tarkarli', 'pondicherry'].some(x => destL.includes(x));
  const isHill     = ['manali', 'shimla', 'ladakh', 'darjeeling', 'ooty', 'coorg', 'munnar', 'rishikesh', 'mussoorie', 'nainital'].some(x => destL.includes(x));
  const isHeritage = ['jaipur', 'agra', 'varanasi', 'udaipur', 'khajuraho', 'hampi', 'mysuru'].some(x => destL.includes(x));

  const ppd = Math.round(perDayBudget / travellers); // per person per day after transport

  let verdict, saving_tip, splurge_recommendation, budget_warning = null;

  // Verdict based on per person per day
  if (ppd < 800) {
    verdict = `Tight budget for ${destination} — ₹${ppd}/person/day after transport. Dorm stays and street food will be essential.`;
    budget_warning = `₹${ppd}/person/day is very tight. Consider extending dates or increasing budget.`;
  } else if (ppd < 1500) {
    verdict = `Budget-friendly trip to ${destination} — ₹${ppd}/person/day. Comfortable guesthouses and local restaurants are well within reach.`;
  } else if (ppd < 3000) {
    verdict = `Well-balanced budget for ${destination} — ₹${ppd}/person/day. 3-star hotels and good restaurants are comfortably affordable.`;
  } else if (ppd < 6000) {
    verdict = `Comfortable trip to ${destination} — ₹${ppd}/person/day. 4-star stays and premium dining available throughout.`;
  } else {
    verdict = `Generous budget for ${destination} — ₹${ppd}/person/day. You can experience the best hotels, restaurants, and activities without any compromise.`;
  }

  // Transport-specific saving tip
  if (transport.mode === 'train') {
    saving_tip = `Book your ${transport.name} tickets on IRCTC at least 30–60 days ahead — Tatkal prices are 2-3× higher. Use UPI for instant payment without charges.`;
  } else if (transport.mode === 'flight') {
    saving_tip = `Set fare alerts for this route on Google Flights. Flying on Tuesday/Wednesday is typically 15-20% cheaper than Friday/Sunday for ${fromCity}–${destination}.`;
  } else {
    saving_tip = isBeach
      ? `In ${destination}, rent a scooter (₹300–400/day) — it covers every beach and costs 70% less than taxis.`
      : `Use IRCTC to book government bus tickets in advance — cheaper and more reliable than private operators.`;
  }

  // Destination-specific splurge
  splurge_recommendation = isHeritage
    ? `Hire a certified ASI-registered guide for the main monument — ₹600–1,200 but transforms a casual visit into a deep historical experience.`
    : isBeach
    ? `Book a sunset sailing cruise or parasailing package — usually ₹1,200–2,500 and completely worth it.`
    : isHill
    ? `Spend one night in a mountain-view luxury tent/camp — these cost ₹2,500–5,000 but the dawn views are unforgettable.`
    : `Reserve ₹1,000–2,000 for one premium local dining experience — this is where you'll make the best memories.`;

  return { verdict, saving_tip, splurge_recommendation, budget_warning };
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN ROUTE: POST /api/budget/generate
// ─────────────────────────────────────────────────────────────────────────────

router.post('/generate', async (req, res) => {
  const {
    destination, fromCity, totalBudget, days, travellers,
    tripType, travellerType, transportCostOverride, budgetTier,
  } = req.body;

  if (!destination || !totalBudget || !days || !travellers || !tripType || !travellerType) {
    return res.status(400).json({ error: 'Missing required fields: destination, totalBudget, days, travellers, tripType, travellerType' });
  }

  try {
    const A           = Number(totalBudget);   // Total trip budget (entire trip, all people)
    const N           = Number(days);
    const P           = Number(travellers);
    const destData    = getDestination(destination);

    console.log(`[Budget] ${fromCity || 'Unknown'} → ${destination} | ₹${A} total | ${N} nights | ${P} pax`);

    // ── Step 1: Lock 10% emergency buffer ─────────────────────────────────
    const buffer_inr  = Math.round(A * 0.10);
    const usable      = A - buffer_inr;          // Usable budget

    // ── Step 2: Smart transport selection ─────────────────────────────────
    let transport;
    if (transportCostOverride !== undefined && transportCostOverride !== null) {
      // User manually selected a transport option on the transport screen
      transport = {
        mode: 'custom',
        name: 'Selected by user',
        oneWayFare: Math.round(Number(transportCostOverride) / (2 * P)),
        roundTripPerPerson: Math.round(Number(transportCostOverride) / P),
        totalFare: Number(transportCostOverride),
        distanceKm: estimateDistance(fromCity, destination),
      };
    } else {
      transport = smartTransportSelection({
        fromCity: fromCity || 'Delhi',
        destination,
        totalBudget: A,
        travellers: P,
        days: N,
        destData,
        budgetTier,
      });

      // Safety cap: transport can never consume > 40% of usable budget
      // (prevents a flight costing 90% of a small budget)
      const maxTransport = Math.round(usable * 0.40);
      if (transport.totalFare > maxTransport) {
        // Downgrade transport to fit budget
        const downgradedPerPerson = Math.round(maxTransport / (2 * P));
        // Select cheapest viable option under the cap
        const af = transport.allFares || {};
        let downgraded = null;
        for (const [mode, name, fare] of [
          ['train', 'Train — Sleeper', af.trainSleeper],
          ['bus',   'AC Bus',          af.bus],
        ]) {
          if (fare && fare * 2 * P <= maxTransport) {
            downgraded = { mode, name, oneWayFare: fare, roundTripPerPerson: fare * 2, totalFare: fare * 2 * P, note: 'Adjusted to fit your budget' };
            break;
          }
        }
        if (!downgraded) {
          // Force-fit: use 35% of usable budget for transport
          const forced = Math.round(usable * 0.35);
          downgraded = { mode: 'bus', name: 'Bus / Shared Transport', oneWayFare: Math.round(forced / (2 * P)), roundTripPerPerson: Math.round(forced / P), totalFare: forced, note: 'Budget adjusted to fit transport' };
        }
        transport = { ...transport, ...downgraded };
      }
    }

    // ── Step 3: Remaining budget after transport ──────────────────────────
    const transport_base_inr   = transport.totalFare;
    const transport_buffer_inr = Math.round(transport_base_inr * 0.08); // 8% buffer for taxi/local autos
    const transport_inr        = transport_base_inr + transport_buffer_inr;

    const afterTransport = usable - transport_inr;          // Remaining for stay+food+local
    const afterTransportPerDay = Math.round(afterTransport / N); // Per day

    // ── Step 4: Realistic hotel allocation ───────────────────────────────
    const rooms = travellerType === 'solo' ? 1 : Math.ceil(P / 2);
    // Hotel takes 50% of after-transport daily budget, shared across rooms
    const hotelDailyTotal = Math.round(afterTransportPerDay * 0.50);
    const hotelPerNight   = Math.max(500, Math.round(hotelDailyTotal / rooms));
    const hotel_inr       = hotelPerNight * rooms * N;

    // ── Step 5: Food allocation ───────────────────────────────────────────
    const foodDailyTotal = Math.round(afterTransportPerDay * 0.32); // 32% of daily
    const foodPerDay     = Math.max(200 * P, foodDailyTotal);
    const food_inr       = foodPerDay * N;

    // ── Step 6: Local + experiences ──────────────────────────────────────
    const local_inr = Math.max(0, afterTransport - hotel_inr - food_inr);

    // ── Step 7: Compute percentages ───────────────────────────────────────
    const transport_pct      = Math.round((transport_inr      / A) * 100);
    const transport_base_pct = Math.round((transport_base_inr / A) * 100);
    const hotel_pct          = Math.round((hotel_inr          / A) * 100);
    const food_pct           = Math.round((food_inr           / A) * 100);
    const local_pct          = Math.max(0, 90 - transport_pct - hotel_pct - food_pct);
    const buffer_pct         = 10;

    // Per-day budget remaining for food + local (useful for client display)
    const perDayBudget       = afterTransportPerDay;

    // ── Step 8: Smart insights (Gemini → deterministic fallback) ─────────
    let smart_insights = null;
    let source = 'deterministic';

    const aiResult = await getAIInsights({
      destination, fromCity, totalBudget: A, days: N, travellers: P,
      tripType, transport, hotelPerNight, foodPerDay, perDayBudget,
    });

    if (aiResult) {
      smart_insights = aiResult;
      source = aiResult.source || 'ai-enhanced';
      console.log(`[Budget] AI insights applied (${source}) ✅`);
    } else {
      smart_insights = deterministicInsights({
        destination, fromCity, totalBudget: A, travellers: P, days: N,
        transport, hotelPerNight, foodPerDay, perDayBudget,
      });
    }

    // ── Step 9: Build response ────────────────────────────────────────────
    const budgetResult = {
      // Percentages
      transport_pct, transport_base_pct,
      transport_buffer_pct: transport_pct - transport_base_pct,
      hotel_pct, food_pct, local_pct, buffer_pct,
      // INR amounts
      transport_inr, transport_base_inr, transport_buffer_inr,
      hotel_inr, food_inr, local_inr, buffer_inr,
      // Daily breakdowns (useful for UI)
      hotel_per_night: hotelPerNight,
      hotel_rooms: rooms,
      food_per_day_per_person: Math.round(foodPerDay / P),
      food_per_day_total: foodPerDay,
      per_day_budget: perDayBudget,
      // Trip totals
      total_per_day: Math.round(A / N),
      usable_per_day: Math.round(usable / N),
      total_trip_cost: A,
      // Transport recommendation (rich object for UI)
      recommended_transport: {
        mode: transport.mode,
        name: transport.name,
        oneWayFare: transport.oneWayFare,
        roundTripPerPerson: transport.roundTripPerPerson,
        totalFare: transport.totalFare,
        distanceKm: transport.distanceKm,
        note: transport.note || '',
        allFares: transport.allFares || null,
      },
      // AI
      smart_insights,
      source,
      // Budget tier
      budget_tier: budgetTier || getBudgetTier(A, P, N),
      budget_tier_label: (() => {
        const t = budgetTier || getBudgetTier(A, P, N);
        return t === 'low' ? '🎒 Budget Traveller' : t === 'premium' ? '💎 Premium Traveller' : '🌟 Comfort Traveller';
      })(),
    };

    console.log(`[Budget] Done → Mode:${transport.name} | Transport:₹${transport_inr} | Hotel:₹${hotel_inr} (${hotelPerNight}/night) | Food:₹${food_inr} (${Math.round(foodPerDay/P)}/pax/day)`);

    res.json({
      success: true,
      destination,
      fromCity: fromCity || 'Delhi',
      totalBudget: A,
      days: N,
      travellers: P,
      tripType,
      travellerType,
      ...budgetResult,
    });

  } catch (err) {
    console.error('[Budget] Error:', err);
    res.status(500).json({ error: 'Budget generation failed', message: err.message });
  }
});

// ── GET /api/budget/estimate-min — returns minimum budget for a route ────────
// Used by onboarding Step 3 (group) to show min budget BEFORE user types one
router.get('/estimate-min', (req, res) => {
  const { from, to, days = 3, travellers = 2, travellerType = 'couple' } = req.query;
  if (!to) return res.status(400).json({ error: 'to= required' });

  const N = Number(days);
  const P = Number(travellers);
  const distKm = estimateDistance(from || 'Delhi', to);

  // Cheapest realistic transport (bus/sleeper)
  const trainSleeper = Math.round(distKm * 0.38 + 80);
  const cheapestBus  = Math.round(distKm * 1.10 + 60);
  const transportOneWay = Math.min(trainSleeper, cheapestBus);
  const transportTotal = transportOneWay * 2 * P;

  // Minimum hotel (₹500/room/night budget guesthouse)
  const rooms = travellerType === 'solo' ? 1 : Math.ceil(P / 2);
  const hotelMin = 500 * rooms * N;

  // Minimum food (₹200/person/day)
  const foodMin = 200 * P * N;

  // Local misc (₹150/person/day)
  const localMin = 150 * P * N;

  // 10% buffer on top
  const subTotal = transportTotal + hotelMin + foodMin + localMin;
  const minBudget = Math.round(subTotal / 0.9);
  const comfortBudget = Math.round(minBudget * 1.6);

  res.json({
    minBudget,
    comfortBudget,
    breakdown: {
      transport: transportTotal,
      hotel: hotelMin,
      food: foodMin,
      local: localMin,
      buffer: minBudget - subTotal,
    },
    distanceKm: distKm,
    days: N,
    travellers: P,
  });
});

module.exports = router;
