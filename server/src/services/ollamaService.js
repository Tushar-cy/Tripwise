const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

/**
 * BUDGET MATH RULES (per user specification):
 * 
 * Total Budget (100%)
 * ├── Emergency Buffer: 10% (always locked)
 * └── Usable Budget: 90% → splits into:
 *     ├── Transport: X% of total  +  10% extra of that X% (transport safety buffer)
 *     │   e.g., if transport = 30% → actual transport INR = 30% + 3% = 33% of total
 *     ├── Hotel: Y% of usable remaining
 *     ├── Food: Z% (nearby restaurants if no hotel meals)
 *     └── Personal/Local: remaining %
 *     All four must still sum to 90 (transport_pct already includes its own buffer)
 */

const STATIC_DEFAULTS = {
  // transport_pct is the pre-inflated pct (includes the ~10% transport buffer baked in)
  'solo_adventurous':  { transport_pct: 33, hotel_pct: 27, food_pct: 20, local_pct: 10 },
  'solo_exploring':    { transport_pct: 30, hotel_pct: 28, food_pct: 22, local_pct: 10 },
  'solo_cultural':     { transport_pct: 27, hotel_pct: 32, food_pct: 22, local_pct: 9 },
  'solo_fun':          { transport_pct: 22, hotel_pct: 33, food_pct: 22, local_pct: 13 },
  'couple_cultural':   { transport_pct: 22, hotel_pct: 42, food_pct: 18, local_pct: 8 },
  'couple_fun':        { transport_pct: 18, hotel_pct: 40, food_pct: 20, local_pct: 12 },
  'couple_adventurous':{ transport_pct: 30, hotel_pct: 33, food_pct: 18, local_pct: 9 },
  'family_cultural':   { transport_pct: 22, hotel_pct: 44, food_pct: 18, local_pct: 6 },
  'family_exploring':  { transport_pct: 25, hotel_pct: 40, food_pct: 18, local_pct: 7 },
  'friends_fun':       { transport_pct: 18, hotel_pct: 28, food_pct: 24, local_pct: 20 },
  'friends_adventurous':{ transport_pct: 28, hotel_pct: 28, food_pct: 22, local_pct: 12 },
  'default':           { transport_pct: 27, hotel_pct: 35, food_pct: 20, local_pct: 8 },
};

function getStaticDefault(travellerType, tripType) {
  const key = `${travellerType}_${tripType}`;
  return STATIC_DEFAULTS[key] || STATIC_DEFAULTS['default'];
}

function buildBudgetPrompt(params) {
  const { destination, fromCity, totalBudget, days, travellers, tripType, travellerType } = params;
  const effectiveBudget = totalBudget * 0.9; // 10% emergency buffer locked upfront

  return `You are Travel Guide AI, an expert Indian travel budget planner. Think step by step.

Trip profile:
- Route: ${fromCity || 'origin city'} → ${destination}
- Total budget: ₹${totalBudget}/day per person (₹${effectiveBudget}/day usable after 10% emergency buffer)
- Duration: ${days} days
- Travellers: ${travellers} ${travellerType}
- Trip type: ${tripType}

IMPORTANT BUDGET RULES:
1. Emergency buffer (10%) is PRE-DEDUCTED. Work only with the remaining 90%.
2. Transport allocation MUST include an extra 10% safety buffer ON TOP OF estimated transport cost.
   Example: if raw transport = 25% of total, allocate 27.5% (25% × 1.1), rounded.
   This extra transport buffer is to account for fare surges, missed trains, and local cab costs.
3. Hotel is highest priority for families and couples. Food includes nearby restaurant costs if hotel has no meals.
4. All four percentages (transport + hotel + food + local) must sum to exactly 90.
5. transport_pct already includes the transport safety buffer (it is inflated by 10%).

STEP 1 — Analyse: What are typical costs for ${tripType} trip from ${fromCity || 'major city'} to ${destination} for ${travellers} ${travellerType}(s)?

STEP 2 — Draft allocation: Given the rules, create percentage splits. Transport MUST be inflated by 10%.

STEP 3 — Self-critique: Is hotel realistic for this destination and group? Is food enough if hotel has breakfast only?

STEP 4 — Final answer. Output ONLY this exact JSON at the end:
{
  "transport_pct": <number, includes 10% transport safety buffer>,
  "transport_base_pct": <number, raw transport before buffer>,
  "transport_buffer_pct": <number, the 10% extra on transport>,
  "hotel_pct": <number>,
  "food_pct": <number>,
  "local_pct": <number>,
  "buffer_pct": 10,
  "reasoning": "<2-3 sentences explaining key allocation decisions and why transport got its buffer>"
}

All four main percentages must sum to 90. buffer_pct is always 10 (pre-deducted, not in the sum).`;
}

function buildStrictBudgetPrompt(params) {
  const { destination, fromCity, totalBudget, days, travellers, tripType, travellerType } = params;
  return `Travel budget calculator for India. Output ONLY valid JSON, no other text.

Route: ${fromCity || 'Delhi'} → ${destination}, ${days} days, ${travellers} ${travellerType}, ₹${totalBudget}/day, ${tripType} trip.
Rules: transport_pct includes 10% extra buffer on raw transport. All four must sum to 90. buffer_pct = 10.

Output:
{"transport_pct": 27, "transport_base_pct": 25, "transport_buffer_pct": 2, "hotel_pct": 35, "food_pct": 20, "local_pct": 8, "buffer_pct": 10, "reasoning": "Transport inflated by 10% safety buffer for ${travellerType} ${tripType} trip to ${destination}."}`;
}

function extractJSON(text) {
  const patterns = [
    /```json\s*([\s\S]*?)\s*```/,
    /```\s*([\s\S]*?)\s*```/,
    /(\{[\s\S]*?"reasoning"[\s\S]*?\})/,
    /(\{[^{}]*\})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const candidate = match[1] || match[0];
        const parsed = JSON.parse(candidate.trim());
        if (parsed.transport_pct !== undefined) return parsed;
      } catch (e) { continue; }
    }
  }
  return null;
}

/**
 * Calculate INR amounts applying the correct budget rules.
 * transport_pct already includes the transport safety buffer.
 * Total budget BEFORE the 10% emergency deduction = totalBudget * travellers * days
 */
function calculateINR(params, percentages) {
  const { totalBudget, travellers, days } = params;
  const totalPerDay = totalBudget * travellers;                    // total/day for group
  const usablePerDay = totalPerDay * 0.9;                         // 90% usable

  const transport_inr = Math.round((percentages.transport_pct / 90) * usablePerDay);
  const hotel_inr = Math.round((percentages.hotel_pct / 90) * usablePerDay);
  const food_inr = Math.round((percentages.food_pct / 90) * usablePerDay);
  const local_inr = Math.round((percentages.local_pct / 90) * usablePerDay);
  const buffer_inr = Math.round(totalPerDay * 0.10);              // 10% locked

  // Transport breakdown
  const transport_base_pct = percentages.transport_base_pct || Math.round(percentages.transport_pct / 1.1);
  const transport_buffer_pct = percentages.transport_pct - transport_base_pct;
  const transport_base_inr = Math.round((transport_base_pct / 90) * usablePerDay);
  const transport_buffer_inr = transport_inr - transport_base_inr;

  return {
    transport_inr, hotel_inr, food_inr, local_inr, buffer_inr,
    transport_base_inr, transport_buffer_inr,
    total_per_day: totalPerDay,
    usable_per_day: usablePerDay,
    total_trip_cost: totalPerDay * days,
  };
}



async function callClaude(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('No ANTHROPIC_API_KEY');
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 900,
    messages: [{ role: 'user', content: prompt }],
  });
  return message.content[0].text;
}

async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('No GROQ_API_KEY');
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', // using versatile 70b as a fast and smart model
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 900
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) throw new Error(`Groq error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateBudget(params, overrides = null) {
  let rawText = null;
  let source = 'groq';

  if (overrides && Object.keys(overrides).length > 0) {
    return applyOverrides(params, overrides);
  }

  try {
    console.log('[Budget] Calling Groq...');
    rawText = await callGroq(buildBudgetPrompt(params));
    console.log('[Budget] Groq responded');
  } catch (errGroq) {
    console.warn('[Budget] Groq unavailable:', errGroq.message);
    source = 'claude';
    try {
      console.log('[Budget] Falling back to Claude...');
      rawText = await callClaude(buildBudgetPrompt(params));
    } catch (err2) {
      console.warn('[Budget] Claude unavailable:', err2.message);
      source = 'static';
    }
  }

  let percentages = null;
  if (rawText) {
    percentages = extractJSON(rawText);
    if (!percentages) {
      console.warn('[Budget] JSON parse failed, retrying with strict prompt...');
      try {
        const strictText = source === 'claude'
          ? await callClaude(buildStrictBudgetPrompt(params))
          : await callGroq(buildStrictBudgetPrompt(params));
        percentages = extractJSON(strictText);
      } catch (e) { console.warn('[Budget] Strict retry failed:', e.message); }
    }
  }

  if (!percentages) {
    console.log('[Budget] Using static defaults');
    source = 'static';
    const defaults = getStaticDefault(params.travellerType, params.tripType);
    const basePct = Math.round(defaults.transport_pct / 1.1);
    percentages = {
      ...defaults,
      transport_base_pct: basePct,
      transport_buffer_pct: defaults.transport_pct - basePct,
      buffer_pct: 10,
      reasoning: `Smart allocation for ${params.travellerType} ${params.tripType} trip from ${params.fromCity || 'Delhi'} to ${params.destination}. Transport includes 10% safety buffer for fare surges. Hotel prioritised based on group type.`,
    };
  }

  // Normalise to sum=90
  percentages.buffer_pct = 10;
  const total = (percentages.transport_pct || 0) + (percentages.hotel_pct || 0) + (percentages.food_pct || 0) + (percentages.local_pct || 0);
  if (Math.abs(total - 90) > 1) {
    const factor = 90 / total;
    percentages.transport_pct = Math.round(percentages.transport_pct * factor);
    percentages.hotel_pct = Math.round(percentages.hotel_pct * factor);
    percentages.food_pct = Math.round(percentages.food_pct * factor);
    percentages.local_pct = 90 - percentages.transport_pct - percentages.hotel_pct - percentages.food_pct;
  }

  const inrAmounts = calculateINR(params, percentages);
  return { ...percentages, ...inrAmounts, source };
}

function applyOverrides(params, overrides) {
  const budget = getStaticDefault(params.travellerType, params.tripType);
  const merged = { ...budget, ...overrides };
  const total = merged.transport_pct + merged.hotel_pct + merged.food_pct + merged.local_pct;
  if (Math.abs(total - 90) > 0.5) {
    const factor = 90 / total;
    merged.transport_pct = Math.round(merged.transport_pct * factor);
    merged.hotel_pct = Math.round(merged.hotel_pct * factor);
    merged.food_pct = Math.round(merged.food_pct * factor);
    merged.local_pct = 90 - merged.transport_pct - merged.hotel_pct - merged.food_pct;
  }
  merged.buffer_pct = 10;
  merged.reasoning = 'Budget adjusted based on your custom preferences.';
  const inrAmounts = calculateINR(params, merged);
  return { ...merged, ...inrAmounts, source: 'override' };
}

module.exports = { generateBudget, callGroq, callClaude, extractJSON };
