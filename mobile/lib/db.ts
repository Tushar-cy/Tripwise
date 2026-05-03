import { supabase, SUPABASE_ENABLED } from './supabase';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface DbTrip {
  id: string;
  user_id: string;
  destination: string;
  from_city: string | null;
  days: number;
  travellers: number;
  trip_type: string | null;
  budget_per_day: number;
  status: string;
  created_at: string;
}

export interface DbBudget {
  id: string;
  trip_id: string;
  transport_pct: number;
  transport_inr: number;
  hotel_pct: number;
  hotel_inr: number;
  food_pct: number;
  food_inr: number;
  local_pct: number;
  local_inr: number;
  buffer_pct: number;
  buffer_inr: number;
  ai_reasoning: string | null;
}

export interface SpendSummary {
  total: number;
  byCategory: Record<string, number>;
}

// ─── Helper: guard for Supabase calls ────────────────────────────────────────
function guardSupabase<T>(fallback: T): T {
  if (!SUPABASE_ENABLED) return fallback;
  return fallback; // only used in the guard pattern below
}

// ─── Save a new trip ──────────────────────────────────────────────────────────
export async function saveTrip(params: {
  userId: string;
  destination: string;
  fromCity: string;
  days: number;
  travellers: number;
  tripType: string;
  budgetPerDay: number;
}) {
  if (!SUPABASE_ENABLED) return null; // Local-only mode — trips saved in Zustand
  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: params.userId,
      destination: params.destination,
      from_city: params.fromCity,
      days: params.days,
      travellers: params.travellers,
      trip_type: params.tripType,
      budget_per_day: params.budgetPerDay,
      status: 'planning',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as DbTrip;
}

// ─── Save a budget ────────────────────────────────────────────────────────────
export async function saveBudget(params: {
  tripId: string;
  transportPct: number;
  transportInr: number;
  hotelPct: number;
  hotelInr: number;
  foodPct: number;
  foodInr: number;
  localPct: number;
  localInr: number;
  bufferInr: number;
  aiReasoning?: string;
}) {
  if (!SUPABASE_ENABLED) return null;
  const { data, error } = await supabase
    .from('trip_budgets')
    .insert({
      trip_id: params.tripId,
      transport_pct: params.transportPct,
      transport_inr: params.transportInr,
      hotel_pct: params.hotelPct,
      hotel_inr: params.hotelInr,
      food_pct: params.foodPct,
      food_inr: params.foodInr,
      local_pct: params.localPct,
      local_inr: params.localInr,
      buffer_pct: 10,
      buffer_inr: params.bufferInr,
      ai_reasoning: params.aiReasoning || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as DbBudget;
}

// ─── Load all trips for a user ────────────────────────────────────────────────
export async function getMyTrips(userId: string) {
  if (!SUPABASE_ENABLED) return []; // Trips come from Zustand savedTrips in local mode
  const { data, error } = await supabase
    .from('trips')
    .select(`*, trip_budgets (*)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[db] getMyTrips error:', error.message);
    return [];
  }
  return data || [];
}

// ─── Spend tracking ───────────────────────────────────────────────────────────
export async function addSpend(params: {
  tripId: string;
  category: string;
  amount: number;
  description: string;
}) {
  if (!SUPABASE_ENABLED) return null;
  const { data, error } = await supabase
    .from('trip_spends')
    .insert({
      trip_id: params.tripId,
      category: params.category,
      amount: params.amount,
      description: params.description,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getSpends(tripId: string) {
  if (!SUPABASE_ENABLED) return [];
  const { data, error } = await supabase
    .from('trip_spends')
    .select('*')
    .eq('trip_id', tripId)
    .order('spent_at', { ascending: false });

  if (error) {
    console.warn('[db] getSpends error:', error.message);
    return [];
  }
  return data || [];
}

export async function getSpendSummary(tripId: string): Promise<SpendSummary> {
  const spends = await getSpends(tripId);
  const byCategory: Record<string, number> = {};
  let total = 0;
  for (const s of spends) {
    byCategory[s.category] = (byCategory[s.category] || 0) + s.amount;
    total += s.amount;
  }
  return { total, byCategory };
}

export async function upsertProfile(userId: string, updates: {
  name?: string;
  phone?: string;
  language?: string;
  dietary_pref?: string;
}) {
  if (!SUPABASE_ENABLED) return;
  const { error } = await supabase.from('profiles').upsert({ id: userId, ...updates });
  if (error) throw new Error(error.message);
}

export async function updateTripStatus(
  tripId: string,
  status: 'planning' | 'booked' | 'in_progress' | 'completed',
) {
  if (!SUPABASE_ENABLED) return;
  const { error } = await supabase.from('trips').update({ status }).eq('id', tripId);
  if (error) throw new Error(error.message);
}
