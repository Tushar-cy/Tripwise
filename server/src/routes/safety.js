const express = require('express');
const router = express.Router();

// GET /api/safety?destination=anywhere
router.get('/', (req, res) => {
  const { destination = 'your destination' } = req.query;

  // Try to load from mockData gracefully
  let dest = null;
  try {
    const { getDestination } = require('../services/mockData');
    dest = getDestination(destination);
  } catch (e) { /* mockData may not have this destination */ }

  // Aggregate alert level
  const alerts = dest?.safetyAlerts || [];
  const hasRed    = alerts.some(a => a.level === 'red');
  const hasOrange = alerts.some(a => a.level === 'orange');
  const overallLevel = hasRed ? 'red' : hasOrange ? 'orange' : 'green';

  // Generic safety tips (always returned)
  const genericTips = [
    '📞 Save local emergency numbers: Police 100, Ambulance 108, Fire 101',
    '📍 Share your live location with a trusted contact before travelling',
    '💳 Carry minimal cash — use UPI/card wherever possible',
    '🆔 Keep a digital copy of your ID, hotel booking, and travel insurance',
    '🔋 Always carry a charged power bank — essential in remote areas',
    '🗺️ Download offline maps (Google Maps / Maps.me) before arriving',
    '🌐 Buy a local SIM at the airport for reliable data',
    '💊 Carry basic medicines: ORS, antacids, pain relief, and any prescription meds',
  ];

  const destinationTips = dest?.safetyNote
    ? [dest.safetyNote, ...genericTips]
    : genericTips;

  // Universal emergency contacts
  const emergencyContacts = dest?.emergencyContacts || {
    police: '100',
    ambulance: '108',
    fire: '101',
    tourist_helpline: '1800-111-363',
    women_helpline: '1091',
    disaster_management: '1078',
  };

  // For unknown destinations: return helpful general safety data
  const responseAlerts = alerts.length > 0
    ? alerts.map(alert => ({ ...alert, actionable: getActionableAdvice(alert) }))
    : [
        {
          category: 'General Travel',
          level: 'green',
          title: `Travel to ${destination}`,
          description: 'No specific safety advisories. Exercise standard travel precautions.',
          actionable: '✅ Register on the STEP program (travel.state.gov) if travelling internationally.',
        },
      ];

  res.json({
    success: true,
    destination: dest?.name || destination,
    state: dest?.state || 'Check destination details',
    overallLevel,
    safetyNote: dest?.safetyNote || `No specific advisories for ${destination}. Standard travel precautions apply.`,
    alerts: responseAlerts,
    prohibitedAreas: dest?.prohibitedAreas || [],
    emergencyContacts,
    safetyTips: destinationTips,
    lastUpdated: new Date().toISOString(),
  });
});

function getActionableAdvice(alert) {
  const map = {
    'Tourist Scam': '✅ Buy from government-certified shops only. Always ask for a receipt.',
    'Beach Safety': '✅ Only swim when green flag is hoisted. Stay near lifeguard zones.',
    'Road Safety': '✅ Check weather before mountain drives. Avoid driving after snowfall.',
    'Altitude Sickness': '✅ Acclimatise for 24h before ascending further. Consult a doctor for Diamox.',
    'Nightlife Safety': '✅ Travel in groups at night. Keep phone charged. Share your location.',
    'Scooter Rental': '✅ Carry a valid driving licence. Wear a helmet. Use licensed rental shops only.',
    'Flash Floods': '✅ Avoid riverbeds during monsoon. Monitor state disaster alerts.',
    'Crowd Safety': '✅ Keep bags in front. Use official entry queues. Stay alert in crowds.',
    'Scam': '✅ Agree on all prices before availing any service. Use government-listed providers.',
    'Air Quality': '✅ Wear an N95 mask on high-AQI days. Check AQI app before outdoor plans.',
    'River Safety': '✅ Book rafting only with certified operators. Always wear a life jacket.',
  };
  return map[alert.category] || '✅ Exercise standard caution and situational awareness.';
}

module.exports = router;
