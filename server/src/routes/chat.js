const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { message, context, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI Service Unavailable' });
    }

    const sysPrompt = `You are TripWise AI, an expert luxury travel concierge.
The user is asking a question about their upcoming trip. 

TRIP CONTEXT:
- Destination: ${context.destination} (from ${context.fromCity})
- Duration: ${context.days} nights
- Travellers: ${context.travellers} (${context.travellerType})
- Total Budget: ₹${context.totalBudget?.toLocaleString('en-IN')}
- Selected Hotel: ${context.hotelName || 'Not selected yet'}
- Budget Breakdown: Transport: ₹${context.budgetResult?.transport_inr}, Hotel: ₹${context.budgetResult?.hotel_inr}, Food: ₹${context.budgetResult?.food_inr}

Keep your answers extremely concise, helpful, and highly specific to Indian travel constraints. Suggest realistic prices in INR. Use short paragraphs or bullet points. DO NOT output markdown code blocks containing JSON, just write the actual conversational response directly to the user.`;

    const messages = [
      { role: 'system', content: sysPrompt }
    ];

    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    messages.push({ role: 'user', content: message });

    console.log(`[Chat] Incoming message for ${context.destination}: "${message.substring(0, 50)}..."`);

    const geminiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'TripWise Chat'
      },
      body: JSON.stringify({
        model: 'google/gemini-1.5-pro',
        messages: messages,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!geminiRes.ok) {
      console.error('[Chat] Gemini Error:', geminiRes.status, await geminiRes.text());
      return res.status(500).json({ error: 'AI is currently unavailable' });
    }

    const data = await geminiRes.json();
    let reply = data.choices?.[0]?.message?.content || 'I could not process that.';

    res.json({ success: true, reply });

  } catch (err) {
    console.error('[Chat] Server Error:', err);
    res.status(500).json({ error: 'Chat failed', message: err.message });
  }
});

module.exports = router;
