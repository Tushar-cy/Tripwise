require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const budgetRouter = require('./routes/budget');
const itineraryRouter = require('./routes/itinerary');
const hotelsRouter = require('./routes/hotels');
const transportRouter = require('./routes/transport');
const placesRouter = require('./routes/places');
const weatherRouter = require('./routes/weather');
const safetyRouter = require('./routes/safety');
const networkRouter = require('./routes/network');
const trendingRouter = require('./routes/trending');
const suggestRouter = require('./routes/suggest');
const chatRouter = require('./routes/chat');

app.use('/api/budget', budgetRouter);
app.use('/api/itinerary', itineraryRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/transport', transportRouter);
app.use('/api/places', placesRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/safety', safetyRouter);
app.use('/api/network', networkRouter);
app.use('/api/trending', trendingRouter);
app.use('/api/suggest', suggestRouter);
app.use('/api/chat', chatRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TripWise API',
    model: 'Gemini 1.5 Flash via OpenRouter',
    gemini: !!process.env.GEMINI_API_KEY,
    rapidapi: !!process.env.RAPIDAPI_KEY,
    railway: !!process.env.RAILWAY_API_KEY,
    googleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/budget/generate',
      'POST /api/itinerary/generate (SSE)',
      'GET  /api/hotels?destination=jaipur',
      'GET  /api/transport?from=delhi&to=jaipur',
      'GET  /api/places?destination=jaipur',
      'GET  /api/weather?destination=jaipur',
      'GET  /api/safety?destination=jaipur',
      'GET  /api/trending',
    ],
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ✈️  TripWise API Server
  🟢 Running on http://0.0.0.0:${PORT}
  🧠 AI: Gemini 1.5 Pro via OpenRouter
  🌤  Weather: Open-Meteo (live, no key needed)

  Endpoints:
  POST /api/budget/generate        — AI budget with 90/10 split + transport buffer
  POST /api/itinerary/generate     — SSE streaming itinerary
  GET  /api/hotels?destination=... — Hotels with budget-fit tags
  GET  /api/transport?from=&to=... — Train/Flight/Bus/Cab routes
  GET  /api/places?destination=... — Places sorted by popularity
  GET  /api/places/nearby?...      — Time-clustered day plan
  GET  /api/weather?destination=.. — Live Open-Meteo + packing list
  GET  /api/safety?destination=... — Alerts, prohibited areas, emergency contacts
  GET  /api/network?destination=.. — Network coverage by operator
  GET  /api/trending               — Trending destinations
  GET  /health                     — Health check
  `);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.error(`\n  ❌ Port ${PORT} is in use. Trying port ${nextPort}...\n`);
    server.close();
    app.listen(nextPort, '0.0.0.0', () => {
      console.log(`\n  ✅ Travel Guide API running on fallback port ${nextPort}\n`);
    });
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

