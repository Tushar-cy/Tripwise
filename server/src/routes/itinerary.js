const express = require('express');
const router = express.Router();

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// POST /api/itinerary/generate — SSE streaming with Groq AI or deterministic fallback
router.post('/generate', async (req, res) => {
  const { destination, places, days, tripType, travellerType, budgetPerDay, hotel } = req.body;

  if (!destination || !places || !days) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent({ type: 'status', message: `Analysing ${places.length} places across ${destination}...` });
    
    // Sort places using Google Maps Distance Matrix / Nearest Neighbor
    let sortedPlaces = [...places];
    if (process.env.GOOGLE_MAPS_API_KEY && places.length > 1) {
      sendEvent({ type: 'status', message: 'Calculating optimal travel routes...' });
      try {
        const locations = places.map(p => `${p.lat},${p.lng}`).join('|');
        const dmRes = await fetch(
          `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${locations}&destinations=${locations}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
          { signal: AbortSignal.timeout(5000) }
        );

        if (dmRes.ok) {
          const data = await dmRes.json();
          if (data.rows && data.rows.length === places.length) {
            let unvisited = [...places];
            let current = unvisited.shift();
            const tempSorted = [current];

            while (unvisited.length > 0) {
              const currentIndex = places.findIndex(p => p.id === current.id);
              let nearestIdx = -1;
              let minDistance = Infinity;

              for (let i = 0; i < unvisited.length; i++) {
                const targetIndex = places.findIndex(p => p.id === unvisited[i].id);
                const element = data.rows[currentIndex].elements[targetIndex];
                const dist = element.status === 'OK' ? element.distance.value : getDistanceFromLatLonInKm(current.lat || 0, current.lng || 0, unvisited[i].lat || 0, unvisited[i].lng || 0) * 1000;
                
                if (dist < minDistance) {
                  minDistance = dist;
                  nearestIdx = i;
                }
              }

              current = unvisited[nearestIdx];
              tempSorted.push(current);
              unvisited.splice(nearestIdx, 1);
            }
            sortedPlaces = tempSorted;
          }
        }
      } catch (e) {
        console.warn('[Itinerary] Distance Matrix failed, falling back to basic sort');
      }
    }

    sendEvent({ type: 'status', message: 'Building your personalised AI itinerary...' });
    
    // -------------------------------------------------------------
    // Gemini AI Integration via OpenRouter
    // -------------------------------------------------------------
    if (process.env.GEMINI_API_KEY) {
      console.log(`[Itinerary] Streaming from Gemini via OpenRouter for ${destination}, ${days} days...`);
      
      const prompt = `You are a professional travel planner. Create an engaging, hour-by-hour ${days}-day itinerary for a ${tripType} trip to ${destination} for a ${travellerType} traveler.
Budget is approximately ₹${budgetPerDay}/day.
The user wants to visit the following places (sorted geographically): ${sortedPlaces.map(p => p.name).join(', ')}.
Output ONLY the itinerary using emojis and clear formatting. Use markdown bolding. No intro/outro fluff. Maintain an exciting tone.`;

      const geminiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'TripWise AI'
        },
        body: JSON.stringify({
          model: 'google/gemini-1.5-pro',
          messages: [{ role: 'system', content: prompt }],
          temperature: 0.7,
          max_tokens: 1500,
          stream: true
        })
      });

      if (geminiRes.ok) {
        let fullItinerary = '';
        const reader = geminiRes.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]' && line.trim() !== 'data:') {
              try {
                const data = JSON.parse(line.substring(6));
                const token = data.choices[0]?.delta?.content || '';
                fullItinerary += token;
                sendEvent({ type: 'token', content: token });
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
        sendEvent({ type: 'done', fullText: fullItinerary });
        res.end();
        return; // Exit successfully
      } else {
        console.warn('[Itinerary] Gemini streaming failed, falling back to deterministic.');
      }
    }

    // -------------------------------------------------------------
    // Deterministic Fallback
    // -------------------------------------------------------------
    console.log(`[Itinerary] Streaming deterministic fallback output...`);
    const staticItinerary = generateDeterministicItinerary({ destination, places: sortedPlaces, days, budgetPerDay: budgetPerDay || 2500, tripType, travellerType });
    
    let fullItinerary = '';
    const chunkSize = 5;
    for (let i = 0; i < staticItinerary.length; i += chunkSize) {
      const chunk = staticItinerary.slice(i, i + chunkSize);
      fullItinerary += chunk;
      sendEvent({ type: 'token', content: chunk });
      await new Promise(r => setTimeout(r, 15)); // Artificial typing delay
    }

    sendEvent({ type: 'done', fullText: fullItinerary });
    res.end();

  } catch (err) {
    console.error('[Itinerary] Streaming error:', err);
    sendEvent({ type: 'status', message: 'Generating from templates...' });
    const staticItinerary = generateDeterministicItinerary({ destination, places, days, budgetPerDay: budgetPerDay || 2500 });
    sendEvent({ type: 'token', content: staticItinerary });
    sendEvent({ type: 'done', fullText: staticItinerary });
    res.end();
  }
});

function generateDeterministicItinerary({ destination, places, days, budgetPerDay, tripType, travellerType }) {
  let text = `📅 TripWise Optimized ${days}-Day Itinerary for ${destination}\n`;
  if (tripType && travellerType) {
    text += `Crafted for a ${tripType} trip for ${travellerType === 'solo' ? '1 person' : 'a ' + travellerType}.\n\n`;
  } else {
    text += `\n`;
  }
  
  const placesPerDay = Math.ceil(places.length / days);
  
  for (let day = 1; day <= days; day++) {
    const dayPlaces = places.slice((day - 1) * placesPerDay, day * placesPerDay);
    if (dayPlaces.length === 0) continue;

    text += `━━━ DAY ${day} ━━━\n`;
    text += `08:00 - 🍳 Breakfast at a recommended local cafe (~₹250)\n`;
    
    let time = 9;
    let dailySpend = 250; // breakfast

    for (const place of dayPlaces) {
      const entryFee = place.entryFee || 0;
      dailySpend += entryFee;
      text += `${String(time).padStart(2, '0')}:30 - ${place.category ? place.category.split(' ')[0] : '🗺️'} ${place.name}\n`;
      text += `  📝 ~${place.duration || '2 hours'}, ₹${entryFee} entry. Opens ${place.hours || '9 AM'}.\n`;
      text += `  → 15 mins by auto to next stop (~₹100)\n`;
      dailySpend += 100; // auto
      time += 2;
      
      if (time >= 13 && time < 14) {
        text += `13:00 - 🍛 Lunch near ${place.name} (~₹400)\n`;
        dailySpend += 400;
        time = 14;
      }
    }

    if (time <= 18) {
      text += `18:00 - 🌆 Evening stroll and local shopping\n`;
    }

    text += `20:00 - 🍽️ Dinner at a highly-rated local restaurant (~₹500)\n`;
    dailySpend += 500;
    
    text += `\nDay ${day} Estimated Spend: ~₹${dailySpend}\n\n`;
  }
  return text.trim() + '\n';
}

module.exports = router;
