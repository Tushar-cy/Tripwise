import { supabase } from './supabase';
import { useTripStore } from '../store/tripStore';

export type SuggestionContext =
  | 'user_selected_hotel'
  | 'user_selected_transport'
  | 'itinerary_budget_break'
  | 'pre_trip_review'
  | 'general';

export interface SmartSuggestion {
  suggestion: string;
  alternatives: string[];
  savingsOpportunity: number;   // INR
  source: 'edge' | 'ollama' | 'local';
}

// 30-second in-process cache keyed by context+selectionId
const cache = new Map<string, { data: SmartSuggestion; ts: number }>();
const CACHE_TTL = 30_000;

/**
 * Builds the trip profile payload from the current Zustand store.
 */
function buildProfile() {
  const s = useTripStore.getState();
  const br = s.budgetResult;
  return {
    destination: s.destination,
    fromCity: s.fromCity,
    budgetPerDay: s.totalBudgetPerDay,
    days: s.days,
    travellers: s.travellers,
    travellerType: s.travellerType,
    tripType: s.tripType,
    hotelBudget: br ? Math.round(br.hotel_inr / Math.max(s.days, 1)) : 0,
    transportBudget: br?.transport_inr ?? 0,
    foodBudget: br ? Math.round(br.food_inr / Math.max(s.days, 1)) : 0,
  };
}

/**
 * Deterministic local fallback — zero network, always instant.
 */
function localFallback(
  context: SuggestionContext,
  profile: ReturnType<typeof buildProfile>,
  selection: Record<string, any>,
): SmartSuggestion {
  const { hotelBudget, transportBudget, foodBudget, budgetPerDay, days, travellers } = profile;

  if (context === 'user_selected_hotel' && selection.pricePerNight) {
    const pct = Math.round((selection.pricePerNight / (hotelBudget || 1)) * 100);
    const saving = Math.round(selection.pricePerNight * 0.25);
    if (pct > 95) {
      return {
        suggestion: `This hotel uses ${pct}% of your nightly budget. A 3★ alternative ~₹${saving}/night cheaper would free ₹${saving * days} for dining & local experiences.`,
        alternatives: [`Hotels under ₹${Math.round(hotelBudget * 0.8)}/night`],
        savingsOpportunity: saving * days,
        source: 'local',
      };
    }
    if (pct > 80) {
      return {
        suggestion: `Uses ${pct}% of hotel budget — tight but doable. Stick to local dhabas (₹${Math.round(foodBudget * 0.4)}/meal) to keep food spend on track.`,
        alternatives: [],
        savingsOpportunity: 0,
        source: 'local',
      };
    }
    return {
      suggestion: `Great value at ${pct}% of hotel budget — ₹${Math.round((hotelBudget - selection.pricePerNight) * days)} extra freed up over ${days} nights for experiences or shopping.`,
      alternatives: [],
      savingsOpportunity: Math.round((hotelBudget - selection.pricePerNight) * days),
      source: 'local',
    };
  }

  if (context === 'user_selected_transport' && selection.price) {
    const pct = Math.round((selection.price / (transportBudget || 1)) * 100);
    if (pct > 85) {
      return {
        suggestion: `This uses ${pct}% of your transport budget. Train 3AC on the same route typically costs 40–55% less and is equally comfortable.`,
        alternatives: ['Train 3AC', 'RSRTC AC Sleeper Bus'],
        savingsOpportunity: Math.round(selection.price * 0.45),
        source: 'local',
      };
    }
    const left = transportBudget - selection.price;
    return {
      suggestion: `Smart pick — ₹${Math.round(left)} remaining in transport budget covers ${Math.floor(left / 200)} days of local auto/metro rides in ${profile.destination}.`,
      alternatives: [],
      savingsOpportunity: 0,
      source: 'local',
    };
  }

  if (context === 'itinerary_budget_break') {
    const overBy = selection.overBy || 300;
    return {
      suggestion: `Day is ₹${overBy} over budget. Skip one paid attraction (save ₹150–₹300) and swap one restaurant for street food to recover the overspend.`,
      alternatives: ['Free heritage walks', 'Government museums', 'Street food stalls'],
      savingsOpportunity: Math.min(overBy, 450),
      source: 'local',
    };
  }

  if (context === 'pre_trip_review') {
    const total = budgetPerDay * days * travellers;
    return {
      suggestion: `₹${total.toLocaleString('en-IN')} total trip budget. Aim to confirm your travel and hotel early to avoid surge pricing.`,
      alternatives: ['Advance planning', 'Budget monitoring'],
      savingsOpportunity: Math.round(total * 0.09),
      source: 'local',
    };
  }

  return {
    suggestion: `₹${budgetPerDay}/day for ${profile.destination} — keep morning slots for paid attractions, save evenings for free heritage walks and local markets.`,
    alternatives: [],
    savingsOpportunity: 0,
    source: 'local',
  };
}

/**
 * Main entry point — tries Supabase Edge → Ollama backend → local rule engine.
 */
export async function getSuggestion(
  context: SuggestionContext,
  selection: Record<string, any> = {},
): Promise<SmartSuggestion> {
  const profile = buildProfile();
  const cacheKey = `${context}:${JSON.stringify(selection).slice(0, 60)}`;

  // Cache hit
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  const body = { context, tripProfile: profile, currentSelection: selection };

  // ── Tier 1: Supabase Edge Function (Claude Sonnet) ──────────────────────────
  try {
    const { data, error } = await supabase.functions.invoke('suggest', {
      body,
    });
    if (!error && data?.suggestion) {
      const result: SmartSuggestion = { ...data, source: 'edge' as const };
      cache.set(cacheKey, { data: result, ts: Date.now() });
      return result;
    }
  } catch {
    // Edge function not deployed or Claude key missing → fall through
  }

  // ── Tier 2: Local Ollama backend ─────────────────────────────────────────────
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${apiUrl}/api/suggest/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(14_000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.suggestion) {
        const result: SmartSuggestion = { ...data, source: 'ollama' as const };
        cache.set(cacheKey, { data: result, ts: Date.now() });
        return result;
      }
    }
  } catch {
    // Backend offline → fall through
  }

  // ── Tier 3: Local rule engine (always works) ─────────────────────────────────
  const result = localFallback(context, profile, selection);
  cache.set(cacheKey, { data: result, ts: Date.now() });
  return result;
}

/**
 * Clear the suggestion cache (call when trip profile changes).
 */
export function clearSuggestionCache() {
  cache.clear();
}
