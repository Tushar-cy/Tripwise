const express = require('express');
const router = express.Router();

const GEMINI_MODEL = 'google/gemini-1.5-flash';

router.post('/generate', async (req, res) => {
  const { context, tripProfile, currentSelection } = req.body;

  if (!tripProfile?.destination) {
    return res.status(400).json({ error: 'tripProfile.destination required' });
  }

  const prompt = `You are TripWise AI – a smart travel advisor for Indian trips.

Trip Profile:
- Destination: ${tripProfile.destination}
- From: ${tripProfile.fromCity || 'N/A'}
- Budget: ₹${tripProfile.budgetPerDay}/day × ${tripProfile.days} days (${tripProfile.travellers} people)
- Group: ${tripProfile.travellerType}
- Trip type: ${tripProfile.tripType}
- Hotel budget: ₹${tripProfile.hotelBudget}/night
- Transport budget: ₹${tripProfile.transportBudget} total
- Food budget: ₹${tripProfile.foodBudget}/day

Current context: ${context}
Current selection: ${JSON.stringify(currentSelection || {})}

Give a SHORT (1-2 sentences MAX), specific, actionable suggestion.
Rules:
- Be direct, no fluff
- Use ₹ rupee amounts and real numbers
- Mention specific alternatives when possible
- Do NOT use markdown, just plain text

Respond ONLY as valid JSON:
{"suggestion":"<1-2 sentence suggestion>","alternatives":["<alt1>","<alt2>"],"savingsOpportunity":<number in INR>}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('No GEMINI_API_KEY');

    const geminiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'TripWise Suggest AI',
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!geminiRes.ok) throw new Error('Gemini unavailable');

    const geminiData = await geminiRes.json();
    const rawText = geminiData.choices?.[0]?.message?.content || '';
    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { suggestion: rawText.slice(0, 200) || '', alternatives: [], savingsOpportunity: 0 };
    }
    return res.json(parsed);
  } catch (err) {
    // Try Groq before falling back to rule-based
    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [
              { role: 'system', content: 'Travel budget AI. Reply ONLY with valid JSON, no markdown.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 300,
          }),
          signal: AbortSignal.timeout(7000),
        });
        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const raw = groqData.choices?.[0]?.message?.content || '';
          const cleaned = raw.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.suggestion) return res.json(parsed);
        }
      } catch (_) {}
    }
    // Final fallback: rule-based (always works)
    const fallback = buildRuleSuggestion(context, tripProfile, currentSelection);
    return res.json(fallback);
  }
});

/**
 * Rule-based fallback — deterministic, instant, always correct
 */
function buildRuleSuggestion(context, profile, selection) {
  const { hotelBudget, transportBudget, foodBudget, budgetPerDay, days, travellers, tripType } = profile;

  if (context === 'user_selected_hotel' && selection?.pricePerNight) {
    const pct = Math.round((selection.pricePerNight / (hotelBudget || 1)) * 100);
    const saving = Math.round(selection.pricePerNight * 0.25);
    if (pct > 95) {
      return {
        suggestion: `This hotel uses ${pct}% of your nightly budget. Choosing a 3★ option ~₹${saving}/night cheaper frees up ₹${saving * days} for food & local experiences.`,
        alternatives: ['Look for hotels under ₹' + Math.round(hotelBudget * 0.8)],
        savingsOpportunity: saving * days,
      };
    }
    if (pct > 80) {
      return {
        suggestion: `Good fit at ${pct}% of hotel budget. You have ₹${Math.round(foodBudget)}/day left for food — stick to local dhabas (₹200/meal) to stay comfortable.`,
        alternatives: [],
        savingsOpportunity: 0,
      };
    }
    return {
      suggestion: `Great value at ${pct}% of hotel budget. The ₹${Math.round(hotelBudget - selection.pricePerNight)} saved/night means ₹${Math.round((hotelBudget - selection.pricePerNight) * days)} extra for experiences or shopping.`,
      alternatives: [],
      savingsOpportunity: Math.round((hotelBudget - selection.pricePerNight) * days),
    };
  }

  if (context === 'user_selected_transport' && selection?.price) {
    const pct = Math.round((selection.price / (transportBudget || 1)) * 100);
    const trainSaving = Math.max(0, selection.price - Math.round(selection.price * 0.4));
    if (pct > 90) {
      return {
        suggestion: `This transport option uses ${pct}% of your travel budget. A train 3AC class can be 40–60% cheaper and covers the same route comfortably.`,
        alternatives: ['Train 3AC', 'RSRTC AC Bus'],
        savingsOpportunity: trainSaving,
      };
    }
    return {
      suggestion: `Smart choice — this uses ${pct}% of transport budget. The ₹${Math.round(transportBudget - selection.price)} remaining could cover ${Math.floor((transportBudget - selection.price) / 200)} days of local auto/metro transport.`,
      alternatives: [],
      savingsOpportunity: 0,
    };
  }

  if (context === 'itinerary_budget_break') {
    const overBy = selection?.overBy || 0;
    return {
      suggestion: `Day is ₹${overBy} over budget. Skip one paid attraction (₹150–₹300 entry) and swap one restaurant meal for street food to save ₹${Math.min(overBy, 450)}.`,
      alternatives: ['Street food stalls', 'Government museums (free entry)'],
      savingsOpportunity: Math.min(overBy, 450),
    };
  }

  if (context === 'pre_booking_review') {
    const total = budgetPerDay * days * travellers;
    return {
      suggestion: `Your ₹${total.toLocaleString('en-IN')} trip budget looks ${total > 20000 ? 'comfortable' : 'tight'}. Biggest saving: book train tickets 60 days ahead (Tatkal is 30% more expensive).`,
      alternatives: ['Book trains on IRCTC 2 months early', 'Use Redbus for last-minute bus deals'],
      savingsOpportunity: Math.round(total * 0.08),
    };
  }

  return {
    suggestion: `₹${budgetPerDay}/day is ${budgetPerDay > 3000 ? 'comfortable' : 'budget-friendly'} for ${profile.destination}. Pro tip: visit major attractions in the morning to avoid crowds and save on local transport time.`,
    alternatives: [],
    savingsOpportunity: 0,
  };
}

module.exports = router;
