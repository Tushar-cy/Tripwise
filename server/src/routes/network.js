const express = require('express');
const { getDestination } = require('../services/mockData');
const router = express.Router();

// GET /api/network?destination=jaipur
router.get('/', (req, res) => {
  const { destination } = req.query;
  if (!destination) return res.status(400).json({ error: 'destination query param required' });

  const dest = getDestination(destination);
  if (!dest) return res.status(404).json({ error: 'Destination not found' });

  const coverage = dest.networkCoverage || {};

  res.json({
    success: true,
    destination: dest.name,
    overall: coverage.overall || 'Good',
    operators: coverage.operators || {},
    simSuggestion: coverage.simSuggestion || 'Jio or Airtel recommended',
    offlineAreas: coverage.offlineAreas || [],
    tips: [
      '📶 Download offline maps (Google Maps → "Download area") before leaving city',
      '📡 BSNL often has better coverage in remote/high-altitude areas',
      '🛜 Most hotels and cafes have WiFi — ask for password on check-in',
      '🔋 Keep phone charged — signal searching drains battery faster',
    ],
  });
});

module.exports = router;
