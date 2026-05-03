import { useTripStore } from '../store/tripStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BudgetStatus {
  withinBudget: boolean;
  overBy: number;        // 0 if within budget
  percentUsed: number;   // e.g. 87
  remaining: number;     // INR remaining in this category
  severity: 'ok' | 'tight' | 'over';
  message: string;
  suggestion: string;
}

export interface TripBudgetSummary {
  totalBudget: number;
  transportSelected: number;
  hotelSelected: number;
  committedBudget: number;
  remainingForFood: number;
  remainingForLocal: number;
  bufferRemaining: number;
  isOnTrack: boolean;
  healthScore: number;       // 0–100
  healthLabel: 'Excellent' | 'Good' | 'Tight' | 'Over Budget';
  healthColor: string;
}

// ─── Private helper ───────────────────────────────────────────────────────────

function makeStatus(
  cost: number,
  budget: number,
  category: 'hotel' | 'transport',
): BudgetStatus {
  if (budget <= 0) {
    return {
      withinBudget: true,
      overBy: 0,
      percentUsed: 0,
      remaining: 0,
      severity: 'ok',
      message: '⏳ Run AI budget first to see fit',
      suggestion: '',
    };
  }

  const remaining = budget - cost;
  const pct = (cost / budget) * 100;

  if (pct <= 80) {
    return {
      withinBudget: true,
      overBy: 0,
      percentUsed: Math.round(pct),
      remaining,
      severity: 'ok',
      message: `✅ Fits your budget — ₹${Math.round(remaining).toLocaleString('en-IN')} remaining`,
      suggestion: '',
    };
  }

  if (pct <= 100) {
    const savingHint =
      category === 'hotel'
        ? `Consider a lower-tier option to save ₹${Math.round(cost * 0.25).toLocaleString('en-IN')}/night for food & local`
        : `A train/bus option could save ₹${Math.round(cost * 0.4).toLocaleString('en-IN')}`;
    return {
      withinBudget: true,
      overBy: 0,
      percentUsed: Math.round(pct),
      remaining,
      severity: 'tight',
      message: `⚠️ Using ${Math.round(pct)}% of ${category} budget — tight but doable`,
      suggestion: savingHint,
    };
  }

  const overBy = cost - budget;
  return {
    withinBudget: false,
    overBy,
    percentUsed: Math.round(pct),
    remaining,
    severity: 'over',
    message: `❌ ₹${Math.round(overBy).toLocaleString('en-IN')} over ${category} budget`,
    suggestion:
      category === 'hotel'
        ? 'This will break your overall plan. Budget-friendly alternatives are shown below.'
        : 'This exceeds transport allocation. Consider train or bus options below.',
  };
}

// ─── Hotel budget check ───────────────────────────────────────────────────────

/**
 * Check if a hotel's per-night price fits within the AI-allocated hotel budget.
 * Budget is per-day (per person × travellers), so we compare against pricePerNight.
 */
export function checkHotelBudget(pricePerNight: number): BudgetStatus {
  const store = useTripStore.getState();
  const hotelBudget = store.budgetResult?.hotel_inr ?? 0;
  // hotel_inr is already the total per-day hotel allowance (all travellers)
  return makeStatus(pricePerNight, hotelBudget / store.days, 'hotel');
}

// ─── Transport budget check ───────────────────────────────────────────────────

/**
 * Check if a transport option's total cost fits the transport budget.
 * transport_inr is the total trip transport budget (all days, all travellers).
 */
export function checkTransportBudget(totalCost: number): BudgetStatus {
  const store = useTripStore.getState();
  const transportBudget = store.budgetResult?.transport_inr ?? 0;
  return makeStatus(totalCost, transportBudget, 'transport');
}

// ─── Overall trip budget summary ─────────────────────────────────────────────

export function getTripBudgetSummary(): TripBudgetSummary {
  const store = useTripStore.getState();
  const { budgetResult, totalBudgetPerDay, travellers, days, selectedHotel } = store;

  const totalBudget = totalBudgetPerDay * travellers * days;

  const hotelSelected = selectedHotel
    ? selectedHotel.pricePerNight * days
    : 0;

  const transportSelected = store.selectedTransportPrice ?? 0;

  const committedBudget = hotelSelected + transportSelected;
  const remainingForFood = budgetResult?.food_inr ?? 0;
  const remainingForLocal = budgetResult?.local_inr ?? 0;
  const bufferRemaining = budgetResult?.buffer_inr ?? 0;

  const pctCommitted = totalBudget > 0 ? (committedBudget / totalBudget) * 100 : 0;
  const isOnTrack = pctCommitted <= 90;

  let healthScore = 100;
  let healthLabel: TripBudgetSummary['healthLabel'] = 'Excellent';
  let healthColor = '#22C55E'; // green

  if (pctCommitted > 100) {
    healthScore = 20;
    healthLabel = 'Over Budget';
    healthColor = '#EF4444';
  } else if (pctCommitted > 85) {
    healthScore = 50;
    healthLabel = 'Tight';
    healthColor = '#F59E0B';
  } else if (pctCommitted > 65) {
    healthScore = 75;
    healthLabel = 'Good';
    healthColor = '#F5A623';
  }

  return {
    totalBudget,
    transportSelected,
    hotelSelected,
    committedBudget,
    remainingForFood,
    remainingForLocal,
    bufferRemaining,
    isOnTrack,
    healthScore,
    healthLabel,
    healthColor,
  };
}
