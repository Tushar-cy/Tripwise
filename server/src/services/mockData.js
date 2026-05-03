/**
 * Travel Guide — Comprehensive Mock Data
 * 10 Indian destinations with full data: transport, hotels, places,
 * weather, safety alerts, network coverage, time-management clusters
 */

const DESTINATIONS = {
  jaipur: {
    id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', region: 'North India',
    lat: 26.9124, lng: 75.7873,
    tag: 'The Pink City', bestSeason: 'Oct–Mar',
    popularityRank: 1, trending: true,
    weather: {
      temp: 28, condition: 'Sunny', humidity: 35, windSpeed: 12,
      uvIndex: 8, aqi: 95, feelsLike: 31,
      hourly: [
        { time: '06:00', icon: '🌅', temp: 20, rain: 0 },
        { time: '09:00', icon: '☀️', temp: 25, rain: 0 },
        { time: '12:00', icon: '☀️', temp: 32, rain: 0 },
        { time: '15:00', icon: '🌤', temp: 34, rain: 5 },
        { time: '18:00', icon: '🌇', temp: 28, rain: 0 },
        { time: '21:00', icon: '🌙', temp: 22, rain: 0 },
      ],
      weekly: [
        { day: 'Mon', icon: '☀️', high: 32, low: 18, rain: 0 },
        { day: 'Tue', icon: '⛅', high: 30, low: 17, rain: 10 },
        { day: 'Wed', icon: '☀️', high: 33, low: 19, rain: 0 },
        { day: 'Thu', icon: '☀️', high: 34, low: 20, rain: 0 },
        { day: 'Fri', icon: '🌤', high: 31, low: 18, rain: 5 },
        { day: 'Sat', icon: '☀️', high: 32, low: 19, rain: 0 },
        { day: 'Sun', icon: '☀️', high: 33, low: 20, rain: 0 },
      ],
    },
    safetyStatus: 'green',
    safetyNote: 'Jaipur is generally safe for tourists. Well-patrolled Pink City area.',
    safetyAlerts: [
      { level: 'orange', category: 'Tourist Scam', title: 'Gem Stone Scams', description: 'Beware of touts near Hawa Mahal offering "wholesale" gemstones. Prices are grossly inflated. Avoid purchasing gems from street vendors.', area: 'Johari Bazaar, Near Hawa Mahal', reportedCount: 120 },
      { level: 'orange', category: 'Traffic', title: 'Heavy Traffic Near Badi Chaupar', description: 'Extreme congestion during evening hours (5–8 PM). Allow extra 45 min in travel plans.', area: 'Old City Area', reportedCount: 0 },
      { level: 'green', category: 'General', title: 'Tourist Police Active', description: 'Tourist police booths at Amber Fort, Hawa Mahal, City Palace. Helpline: 0141-2744902', area: 'All major tourist sites', reportedCount: 0 },
    ],
    prohibitedAreas: [],
    emergencyContacts: { police: '100', ambulance: '108', touristHelpline: '1800-200-5044', fireStation: '101' },
    networkCoverage: {
      overall: 'Excellent',
      operators: {
        'Jio': { '4G': 'Excellent', '5G': 'Available in select areas', signal: 95 },
        'Airtel': { '4G': 'Excellent', '5G': 'Available in select areas', signal: 92 },
        'Vi': { '4G': 'Good', '5G': 'Not available', signal: 78 },
        'BSNL': { '4G': 'Moderate', '5G': 'Not available', signal: 60 },
      },
      simSuggestion: 'Jio or Airtel — best 4G/5G coverage across the city, including Amber Fort hills.',
      offlineAreas: ['Inside Amber Fort basement vaults', 'Nahargarh Jungle Trails'],
    },
    hotels: [
      { id: 'j1', name: 'The Pink Pearl Heritage', stars: 4, rating: 4.5, reviews: 1842, pricePerNight: 3200, tier: 'premium', distance: '1.2 km from City Centre', amenities: ['WiFi', 'Pool', 'AC', 'Breakfast', 'Spa'], images: ['https://images.unsplash.com/photo-1582719478250-c89404bb8a0e?w=600'], taxes: 576, cancellation: 'Free until 24h before', location: 'Near Hawa Mahal', budgetFit: 'within' },
      { id: 'j2', name: 'Rajputana Haveli Stay', stars: 3, rating: 4.2, reviews: 956, pricePerNight: 1800, tier: 'mid', distance: '2.1 km from City Centre', amenities: ['WiFi', 'AC', 'Breakfast'], images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600'], taxes: 324, cancellation: 'Free until 48h before', location: 'Amber Fort Road', budgetFit: 'within' },
      { id: 'j3', name: 'Budget Backpackers Inn', stars: 2, rating: 3.8, reviews: 412, pricePerNight: 850, tier: 'budget', distance: '3.5 km from City Centre', amenities: ['WiFi', 'AC'], images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600'], taxes: 153, cancellation: 'Non-refundable', location: 'Near Railway Station', budgetFit: 'within' },
      { id: 'j4', name: 'Rambagh Palace (Taj)', stars: 5, rating: 4.9, reviews: 3200, pricePerNight: 18500, tier: 'luxury', distance: '4 km from City Centre', amenities: ['WiFi', 'Pool', 'AC', 'Breakfast', 'Spa', 'Restaurant', 'Bar', 'Butler'], images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600'], taxes: 3330, cancellation: 'Free until 72h before', location: 'Bhawani Singh Road', budgetFit: 'slightly_over' },
    ],
    transport: {
      trains: [
        { id: 't1', name: 'Shatabdi Express', number: '12015', from: 'New Delhi', to: 'Jaipur', departure: '06:05', arrival: '10:40', duration: '4h 35m', classes: [{ name: 'CC', price: 755, availability: 'Available' }, { name: 'EC', price: 1475, availability: 'Available' }], type: 'fastest' },
        { id: 't2', name: 'Ajmer Shatabdi', number: '12957', from: 'New Delhi', to: 'Jaipur', departure: '16:10', arrival: '22:40', duration: '6h 30m', classes: [{ name: '3AC', price: 945, availability: 'Available' }, { name: '2AC', price: 1380, availability: 'RAC' }], type: 'comfortable' },
        { id: 't3', name: 'Jaipur Express', number: '12413', from: 'New Delhi', to: 'Jaipur', departure: '18:25', arrival: '23:40', duration: '5h 15m', classes: [{ name: 'Sleeper', price: 215, availability: 'Available' }, { name: '3AC', price: 545, availability: 'Available' }], type: 'cheapest' },
      ],
      flights: [
        { id: 'f1', airline: 'IndiGo', flightNo: '6E-2165', from: 'DEL', to: 'JAI', departure: '07:30', arrival: '08:45', duration: '1h 15m', stops: 'Non-stop', price: 3850, carbon: '38 kg CO₂' },
        { id: 'f2', airline: 'Air India', flightNo: 'AI-473', from: 'DEL', to: 'JAI', departure: '14:20', arrival: '15:40', duration: '1h 20m', stops: 'Non-stop', price: 4200, carbon: '42 kg CO₂' },
        { id: 'f3', airline: 'SpiceJet', flightNo: 'SG-108', from: 'DEL', to: 'JAI', departure: '20:10', arrival: '21:25', duration: '1h 15m', stops: 'Non-stop', price: 3200, carbon: '35 kg CO₂' },
      ],
      buses: [
        { id: 'b1', operator: 'RSRTC Volvo', type: 'AC Sleeper', from: 'ISBT Kashmere Gate', to: 'Sindhi Camp', departure: '22:00', arrival: '04:30', duration: '6h 30m', price: 650 },
        { id: 'b2', operator: 'Orange Travels', type: 'Luxury AC', from: 'ISBT Kashmere Gate', to: 'Sindhi Camp', departure: '23:30', arrival: '05:00', duration: '5h 30m', price: 850 },
      ],
      cab: { estimatedFare: 4500, distanceKm: 281, duration: '5–6 hours', providers: ['Ola', 'Uber', 'Rapido Cab'] },
      localTransport: [
        { mode: 'Metro', avgCostPerDay: 80, available: true, tip: 'Connects station to city centre' },
        { mode: 'Auto Rickshaw', avgCostPerDay: 200, available: true, tip: 'Negotiate before boarding' },
        { mode: 'City Bus', avgCostPerDay: 50, available: true, tip: 'JCTSL buses cover all tourist spots' },
        { mode: 'Rental Bike', avgCostPerDay: 350, available: true, tip: 'Royal Enfield available at ₹800/day' },
        { mode: 'Cab (Ola/Uber)', avgCostPerDay: 500, available: true, tip: 'Most reliable for families' },
        { mode: 'Tuk-Tuk Tour', avgCostPerDay: 800, available: true, tip: 'Full-day heritage tour ₹1,200' },
      ],
    },
    places: [
      { id: 'p1', name: 'Amber Fort', category: '🏰 Fort & Palace', entryFee: 550, hours: '8 AM – 5:30 PM', crowd: 'Very High', duration: '2–3 hours', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400', lat: 26.9855, lng: 75.8513, popularityScore: 98, distanceFromCentre: 11, timeSlot: 'morning', mustVisit: true, tip: 'Book elephant ride in advance. Avoid noon — scorching heat.' },
      { id: 'p2', name: 'Hawa Mahal', category: '🏛️ Palace', entryFee: 200, hours: '9 AM – 5 PM', crowd: 'Very High', duration: '1–1.5 hours', image: 'https://images.unsplash.com/photo-1477587458883-47145ed6979c?w=400', lat: 26.9239, lng: 75.8267, popularityScore: 96, distanceFromCentre: 0.5, timeSlot: 'morning', mustVisit: true, tip: 'Best photos in morning light from the street opposite.' },
      { id: 'p3', name: 'City Palace', category: '🏛️ Royal Museum', entryFee: 700, hours: '9:30 AM – 5 PM', crowd: 'High', duration: '2–3 hours', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400', lat: 26.9258, lng: 75.8237, popularityScore: 94, distanceFromCentre: 0.8, timeSlot: 'morning', mustVisit: true },
      { id: 'p4', name: 'Jantar Mantar', category: '🔭 Observatory', entryFee: 200, hours: '9 AM – 4:30 PM', crowd: 'Medium', duration: '1 hour', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400', lat: 26.9247, lng: 75.8242, popularityScore: 85, distanceFromCentre: 0.9, timeSlot: 'morning' },
      { id: 'p5', name: 'Nahargarh Fort', category: '🏰 Fort', entryFee: 200, hours: '10 AM – 5:30 PM', crowd: 'Medium', duration: '2 hours', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400', lat: 26.9484, lng: 75.8031, popularityScore: 88, distanceFromCentre: 3, timeSlot: 'afternoon', mustVisit: true, tip: 'Stunning sunset views. Reach by 4 PM.' },
      { id: 'p6', name: 'Johari Bazaar', category: '🛍️ Shopping', entryFee: 0, hours: '10 AM – 9 PM', crowd: 'Very High', duration: '1.5 hours', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', lat: 26.9236, lng: 75.8296, popularityScore: 80, distanceFromCentre: 0.5, timeSlot: 'evening', tip: 'Best for bangles, fabric, and silver jewelry' },
      { id: 'p7', name: 'Albert Hall Museum', category: '🏛️ Museum', entryFee: 150, hours: '10 AM – 5 PM', crowd: 'Low', duration: '1.5 hours', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', lat: 26.9083, lng: 75.8195, popularityScore: 72, distanceFromCentre: 2, timeSlot: 'afternoon' },
      { id: 'p8', name: 'Birla Mandir', category: '🛕 Temple', entryFee: 0, hours: '6 AM – 12 PM, 4 PM – 9 PM', crowd: 'Low', duration: '45 min', image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400', lat: 26.8978, lng: 75.8157, popularityScore: 65, distanceFromCentre: 3, timeSlot: 'evening', tip: 'Beautiful illuminated at night.' },
    ],
    timeManagement: {
      morning: { label: 'Morning (7AM–1PM)', places: ['p2', 'p3', 'p4', 'p1'], tip: 'Start at Hawa Mahal for photos, walk to City Palace & Jantar Mantar. Drive to Amber for noon visit.' },
      afternoon: { label: 'Afternoon (1PM–6PM)', places: ['p7', 'p5'], tip: 'Lunch in old city. Albert Hall Museum first, then Nahargarh Fort for sunset.' },
      evening: { label: 'Evening (6PM–10PM)', places: ['p8', 'p6'], tip: 'Birla Mandir at golden hour, then shop at Johari Bazaar for bangles & textiles.' },
    },
    popularRestaurants: [
      { name: 'Laxmi Mishtan Bhandar', type: 'Traditional Rajasthani', avgCost: 200, mustTry: 'Dal Baati Churma', rating: 4.7 },
      { name: 'Chokhi Dhani', type: 'Cultural Village Experience', avgCost: 600, mustTry: 'Full Rajasthani Thali', rating: 4.5 },
      { name: 'Natraj Restaurant', type: 'Veg Thali', avgCost: 180, mustTry: 'Pyaaz Kachori', rating: 4.3 },
    ],
  },

  goa: {
    id: 'goa', name: 'Goa', state: 'Goa', region: 'West India',
    lat: 15.2993, lng: 74.1240,
    tag: 'Beach Paradise', bestSeason: 'Nov–Feb',
    popularityRank: 2, trending: true,
    weather: {
      temp: 30, condition: 'Partly Cloudy', humidity: 75, windSpeed: 18,
      uvIndex: 9, aqi: 30, feelsLike: 35,
      hourly: [
        { time: '06:00', icon: '🌅', temp: 26, rain: 0 },
        { time: '09:00', icon: '⛅', temp: 29, rain: 5 },
        { time: '12:00', icon: '☀️', temp: 34, rain: 0 },
        { time: '15:00', icon: '⛅', temp: 33, rain: 15 },
        { time: '18:00', icon: '🌦', temp: 28, rain: 20 },
        { time: '21:00', icon: '🌙', temp: 26, rain: 0 },
      ],
      weekly: [
        { day: 'Mon', icon: '☀️', high: 33, low: 24, rain: 5 },
        { day: 'Tue', icon: '🌤', high: 31, low: 23, rain: 20 },
        { day: 'Wed', icon: '🌦', high: 29, low: 23, rain: 40 },
        { day: 'Thu', icon: '☀️', high: 32, low: 24, rain: 10 },
        { day: 'Fri', icon: '☀️', high: 33, low: 25, rain: 0 },
        { day: 'Sat', icon: '⛅', high: 31, low: 24, rain: 15 },
        { day: 'Sun', icon: '☀️', high: 32, low: 25, rain: 5 },
      ],
    },
    safetyStatus: 'orange',
    safetyNote: 'Goa is generally safe but exercise caution at night on isolated beaches.',
    safetyAlerts: [
      { level: 'red', category: 'Beach Safety', title: 'No Swimming Zones', description: 'Red flag hoisted at Baga, Calangute, and Anjuna during high tide periods. Drowning incidents reported in Nov–Dec. Always swim near lifeguard posts.', area: 'Baga Beach, Anjuna Beach', reportedCount: 8 },
      { level: 'orange', category: 'Nightlife Safety', title: 'Spike in Drink Spiking Reports', description: 'Cases of drink spiking reported at certain clubs in Anjuna and Vagator area. Never leave your drink unattended at nightclubs.', area: 'Anjuna, Vagator', reportedCount: 15 },
      { level: 'orange', category: 'Scooter Rental', title: 'Unlicensed Scooter Rentals', description: 'Many tourists rented scooters without valid DL and faced police fines (₹5,000+). Carry valid driving licence. Avoid unlicensed operators.', area: 'All tourist areas', reportedCount: 200 },
      { level: 'green', category: 'General', title: 'Tourist Police at Beaches', description: 'Beach shacks and police patrol active 7 AM–10 PM. Use official taxi stands over random cabs.', area: 'All major beaches', reportedCount: 0 },
    ],
    prohibitedAreas: ['Miramar Beach after midnight (police curfew)', 'Near Naval establishments (photography prohibited)'],
    emergencyContacts: { police: '100', ambulance: '108', touristHelpline: '0832-2228000', coastGuard: '1554' },
    networkCoverage: {
      overall: 'Good',
      operators: {
        'Jio': { '4G': 'Excellent', '5G': 'Not available', signal: 90 },
        'Airtel': { '4G': 'Excellent', '5G': 'Not available', signal: 88 },
        'Vi': { '4G': 'Good', '5G': 'Not available', signal: 72 },
        'BSNL': { '4G': 'Poor', '5G': 'Not available', signal: 40 },
      },
      simSuggestion: 'Jio offers best coastal coverage. Beach shacks have WiFi.',
      offlineAreas: ['Dudhsagar Falls interior', 'Netravali Wildlife Sanctuary'],
    },
    hotels: [
      { id: 'g1', name: 'Novotel Goa Candolim', stars: 4, rating: 4.4, reviews: 2100, pricePerNight: 4800, tier: 'premium', distance: '200m from beach', amenities: ['WiFi', 'Pool', 'AC', 'Breakfast', 'Bar', 'Restaurant'], images: ['https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600'], taxes: 864, cancellation: 'Free until 48h before', location: 'Candolim Beach', budgetFit: 'within' },
      { id: 'g2', name: 'Casa de Olga', stars: 3, rating: 4.3, reviews: 780, pricePerNight: 2200, tier: 'mid', distance: '5 min walk to beach', amenities: ['WiFi', 'Pool', 'AC', 'Breakfast'], images: ['https://images.unsplash.com/photo-1582719478250-c89404bb8a0e?w=600'], taxes: 396, cancellation: 'Free until 24h before', location: 'Calangute', budgetFit: 'within' },
      { id: 'g3', name: 'Zostel Goa (Panaji)', stars: 1, rating: 4.1, reviews: 1200, pricePerNight: 650, tier: 'budget', distance: '3 km from beach', amenities: ['WiFi', 'Fan', 'Common Kitchen', 'Lockers'], images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600'], taxes: 117, cancellation: 'Non-refundable', location: 'Panaji', budgetFit: 'within' },
    ],
    transport: {
      trains: [
        { id: 't1', name: 'Goa Express', number: '12779', from: 'Mumbai CST', to: 'Madgaon', departure: '22:00', arrival: '11:30', duration: '13h 30m', classes: [{ name: 'Sleeper', price: 315, availability: 'Available' }, { name: '3AC', price: 830, availability: 'Available' }], type: 'cheapest' },
        { id: 't2', name: 'Konkan Kanya Express', number: '10111', from: 'Mumbai CST', to: 'Madgaon', departure: '06:05', arrival: '16:50', duration: '10h 45m', classes: [{ name: '3AC', price: 780, availability: 'RAC' }, { name: '2AC', price: 1150, availability: 'WL' }], type: 'fastest' },
      ],
      flights: [
        { id: 'f1', airline: 'IndiGo', flightNo: '6E-447', from: 'BOM', to: 'GOI', departure: '08:00', arrival: '09:15', duration: '1h 15m', stops: 'Non-stop', price: 4200, carbon: '42 kg CO₂' },
        { id: 'f2', airline: 'SpiceJet', flightNo: 'SG-288', from: 'BOM', to: 'GOI', departure: '06:00', arrival: '07:20', duration: '1h 20m', stops: 'Non-stop', price: 3600, carbon: '38 kg CO₂' },
      ],
      buses: [
        { id: 'b1', operator: 'Paulo Travels', type: 'AC Sleeper', from: 'Mumbai Borivali', to: 'Panaji', departure: '18:00', arrival: '06:00', duration: '12h', price: 1200 },
      ],
      cab: { estimatedFare: 8500, distanceKm: 590, duration: '11–12 hours', providers: ['Ola', 'Zoom Car'] },
      localTransport: [
        { mode: 'Rented Scooter', avgCostPerDay: 350, available: true, tip: 'Most popular — carry DL' },
        { mode: 'Rented Bike (RE)', avgCostPerDay: 800, available: true },
        { mode: 'Auto Rickshaw', avgCostPerDay: 400, available: true, tip: 'Limited to North Goa' },
        { mode: 'Goa Miles (Cab App)', avgCostPerDay: 600, available: true, tip: 'Official Goa cab app — safer than random cabs' },
        { mode: 'Tourist Bus', avgCostPerDay: 200, available: true, tip: 'North Goa circuit buses' },
      ],
    },
    places: [
      { id: 'p1', name: 'Baga Beach', category: '🏖️ Beach', entryFee: 0, hours: 'Open 24h', crowd: 'Very High', duration: '2–4 hours', image: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=400', lat: 15.5520, lng: 73.7520, popularityScore: 96, distanceFromCentre: 16, timeSlot: 'morning', mustVisit: true, tip: 'Visit for water sports in morning. Beach parties at night.' },
      { id: 'p2', name: 'Dudhsagar Falls', category: '💧 Waterfall', entryFee: 400, hours: '7 AM – 5 PM (Nov–May only)', crowd: 'High', duration: 'Full day', image: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=400', lat: 15.3143, lng: 74.3137, popularityScore: 94, distanceFromCentre: 60, timeSlot: 'morning', mustVisit: true },
      { id: 'p3', name: 'Old Goa Churches', category: '⛪ Heritage', entryFee: 0, hours: '9 AM – 6 PM', crowd: 'Medium', duration: '2 hours', image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400', lat: 15.5009, lng: 73.9120, popularityScore: 88, distanceFromCentre: 10, timeSlot: 'afternoon' },
      { id: 'p4', name: 'Anjuna Flea Market', category: '🛍️ Market', entryFee: 0, hours: 'Wed 8 AM – 6 PM only', crowd: 'High', duration: '2 hours', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', lat: 15.5728, lng: 73.7411, popularityScore: 82, distanceFromCentre: 12, timeSlot: 'afternoon' },
    ],
    timeManagement: {
      morning: { label: 'Morning (7AM–1PM)', places: ['p1', 'p2'], tip: 'Early water sports at Baga. Book Dudhsagar jeep tour the night before.' },
      afternoon: { label: 'Afternoon (1PM–6PM)', places: ['p3', 'p4'], tip: 'Old Goa churches after lunch. Anjuna market on Wednesdays only.' },
      evening: { label: 'Evening (6PM–midnight)', places: ['p1'], tip: 'Beach shack dinner with live music at Baga or Calangute.' },
    },
    popularRestaurants: [
      { name: 'Britto\'s', type: 'Seafood', avgCost: 600, mustTry: 'Fish Curry Rice + Fresh King Prawns', rating: 4.5 },
      { name: 'Gunpowder', type: 'Kerala + Goan Fusion', avgCost: 500, mustTry: 'Crab Xec Xec', rating: 4.6 },
    ],
  },

  manali: {
    id: 'manali', name: 'Manali', state: 'Himachal Pradesh', region: 'North India',
    lat: 32.2432, lng: 77.1892,
    tag: 'Valley of Gods', bestSeason: 'Oct–Jun',
    popularityRank: 3, trending: true,
    weather: {
      temp: 8, condition: 'Partly Cloudy', humidity: 60, windSpeed: 22,
      uvIndex: 5, aqi: 20, feelsLike: 3,
      hourly: [
        { time: '06:00', icon: '❄️', temp: 2, rain: 0 },
        { time: '09:00', icon: '⛅', temp: 6, rain: 5 },
        { time: '12:00', icon: '🌤', temp: 12, rain: 0 },
        { time: '15:00', icon: '⛅', temp: 10, rain: 10 },
        { time: '18:00', icon: '🌨', temp: 5, rain: 30 },
        { time: '21:00', icon: '❄️', temp: 1, rain: 0 },
      ],
      weekly: [
        { day: 'Mon', icon: '⛅', high: 11, low: 1, rain: 20 },
        { day: 'Tue', icon: '❄️', high: 5, low: -2, rain: 60 },
        { day: 'Wed', icon: '☀️', high: 14, low: 2, rain: 0 },
        { day: 'Thu', icon: '🌤', high: 12, low: 1, rain: 5 },
        { day: 'Fri', icon: '⛅', high: 10, low: 0, rain: 30 },
        { day: 'Sat', icon: '☀️', high: 15, low: 3, rain: 0 },
        { day: 'Sun', icon: '☀️', high: 16, low: 4, rain: 0 },
      ],
    },
    safetyStatus: 'orange',
    safetyNote: 'Manali is safe but mountain roads can be dangerous during snow/rain. Follow HRTC advisories.',
    safetyAlerts: [
      { level: 'red', category: 'Road Safety', title: 'Rohtang Pass Weather Warning', description: 'Rohtang Pass (3978m) experiences sudden snowstorms. Do not proceed if visibility drops below 50m. Check HRTC weather bulletin before departure.', area: 'Rohtang Pass, Atal Tunnel', reportedCount: 3 },
      { level: 'orange', category: 'Altitude Sickness', title: 'AMS Risk Above 3000m', description: 'Acute Mountain Sickness risk for rapid ascents. Acclimatize for 24h at Manali before going to Rohtang or Spiti. Carry Diamox on prescription.', area: 'Rohtang Pass, Solang Valley', reportedCount: 12 },
      { level: 'orange', category: 'Flash Floods', title: 'Beas River Flash Flood Risk', description: 'Beas River prone to flash floods in July–September. Do not camp near riverbanks during monsoon.', area: 'Beas Riverbanks', reportedCount: 2 },
    ],
    prohibitedAreas: ['Rohtang Pass after 9 PM (permits required)', 'Inner Line near LAC (military zones)'],
    emergencyContacts: { police: '100', ambulance: '108', mountainRescue: '01902-252331', hrtcBulletin: '01902-252323' },
    networkCoverage: {
      overall: 'Moderate',
      operators: {
        'Jio': { '4G': 'Good in town', '5G': 'Not available', signal: 75 },
        'Airtel': { '4G': 'Good in town', '5G': 'Not available', signal: 72 },
        'Vi': { '4G': 'Poor', '5G': 'Not available', signal: 45 },
        'BSNL': { '4G': 'Moderate (best at high altitude)', '5G': 'Not available', signal: 60 },
      },
      simSuggestion: 'BSNL is surprisingly strong at higher altitudes. Jio/Airtel best in town.',
      offlineAreas: ['Rohtang Pass', 'Spiti Valley', 'Baralacha La', 'Deep gorge sections of Beas'],
    },
    hotels: [
      { id: 'm1', name: 'The Orchard Greens', stars: 4, rating: 4.5, reviews: 650, pricePerNight: 4200, tier: 'premium', distance: '2 km from Mall Road', amenities: ['WiFi', 'Fireplace', 'AC', 'Breakfast', 'Mountain View'], images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600'], taxes: 756, cancellation: 'Free until 48h before', location: 'Old Manali', budgetFit: 'within' },
      { id: 'm2', name: 'Zostel Manali', stars: 2, rating: 4.4, reviews: 1890, pricePerNight: 800, tier: 'budget', distance: '1 km from Mall Road', amenities: ['WiFi', 'Common Area', 'Bonfire', 'Lockers'], images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600'], taxes: 144, cancellation: 'Non-refundable', location: 'Old Manali', budgetFit: 'within' },
    ],
    transport: {
      trains: [
        { id: 't1', name: 'Himachal Express', number: '14553', from: 'New Delhi', to: 'Chandigarh', departure: '11:30', arrival: '15:45', duration: '4h 15m', note: 'Take bus Chandigarh→Manali (8–10h)', classes: [{ name: 'Sleeper', price: 190, availability: 'Available' }], type: 'cheapest' },
        { id: 't2', name: 'Kalka Mail', number: '12137', from: 'New Delhi', to: 'Kalka', departure: '22:05', arrival: '05:10', duration: '7h 05m', note: 'Take bus/cab Kalka→Manali (9h)', classes: [{ name: '3AC', price: 650, availability: 'Available' }], type: 'comfortable' },
      ],
      flights: [
        { id: 'f1', airline: 'Alliance Air', flightNo: '9I-513', from: 'DEL', to: 'KUU', departure: '08:30', arrival: '09:30', duration: '1h', stops: 'Non-stop', price: 8500, carbon: '45 kg CO₂', note: 'To Bhuntar (Kullu) airport, 50 km from Manali' },
      ],
      buses: [
        { id: 'b1', operator: 'HRTC Volvo', type: 'AC Semi-Sleeper', from: 'ISBT Delhi', to: 'Manali Bus Stand', departure: '17:00', arrival: '08:00', duration: '15h', price: 1200 },
        { id: 'b2', operator: 'HRTC Ordinary', type: 'Non-AC Sleeper', from: 'ISBT Delhi', to: 'Manali Bus Stand', departure: '20:00', arrival: '12:00', duration: '16h', price: 700 },
      ],
      cab: { estimatedFare: 9000, distanceKm: 540, duration: '12–14 hours', providers: ['Ola', 'Local Himachal Cabs'] },
      localTransport: [
        { mode: 'Local Taxi (fixed rate)', avgCostPerDay: 1500, available: true, tip: 'Fixed rates set by govt. Rohtang: ₹2,800/car' },
        { mode: 'Rented Bike (enfield)', avgCostPerDay: 1200, available: true, tip: 'Ideal for Old Manali area' },
        { mode: 'Auto Rickshaw', avgCostPerDay: 200, available: true, tip: 'Only within town limits' },
        { mode: 'HRTC Local Bus', avgCostPerDay: 80, available: true, tip: 'Connects Manali-Kullu corridor' },
      ],
    },
    places: [
      { id: 'p1', name: 'Rohtang Pass', category: '🏔️ Mountain Pass', entryFee: 550, hours: '9 AM – 4 PM (closed Tue)', crowd: 'High', duration: 'Full day', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400', lat: 32.3718, lng: 77.2465, popularityScore: 97, distanceFromCentre: 51, timeSlot: 'morning', mustVisit: true, tip: 'Book permit online at himachalpermit.nic.in a day before.' },
      { id: 'p2', name: 'Solang Valley', category: '🎿 Adventure', entryFee: 200, hours: '8 AM – 6 PM', crowd: 'High', duration: '3 hours', image: 'https://images.unsplash.com/photo-1544085311-11a028465b03?w=400', lat: 32.3271, lng: 77.1464, popularityScore: 92, distanceFromCentre: 14, timeSlot: 'morning', mustVisit: true, tip: 'Paragliding (₹2,500), Zorbing (₹600), Rope courses.' },
      { id: 'p3', name: 'Hadimba Temple', category: '🛕 Temple', entryFee: 0, hours: '8 AM – 6 PM', crowd: 'Medium', duration: '1 hour', image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400', lat: 32.2407, lng: 77.1763, popularityScore: 85, distanceFromCentre: 2.5, timeSlot: 'afternoon' },
      { id: 'p4', name: 'Old Manali', category: '🍺 Cafes & Culture', entryFee: 0, hours: 'Open 24h', crowd: 'Medium', duration: '2–3 hours', image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400', lat: 32.2563, lng: 77.1738, popularityScore: 88, distanceFromCentre: 3, timeSlot: 'evening', tip: 'Bob Dylan Cafe, Drifters Inn, cafe-hopping culture.' },
    ],
    timeManagement: {
      morning: { label: 'Morning (7AM–1PM)', places: ['p1', 'p2'], tip: 'Start early for Rohtang (permits needed). Alternatively Solang Valley for adventure sports.' },
      afternoon: { label: 'Afternoon (1PM–5PM)', places: ['p3'], tip: 'Hadimba Temple + cedar forest walk.' },
      evening: { label: 'Evening (5PM–10PM)', places: ['p4'], tip: 'Old Manali cafe crawl — try Moon Dance Cafe and Drifters Inn.' },
    },
    popularRestaurants: [
      { name: 'Johnson Bar & Restaurant', type: 'Continental', avgCost: 600, mustTry: 'Trout Fish', rating: 4.6 },
      { name: 'Lazy Dog', type: 'Cafe', avgCost: 300, mustTry: 'Israeli Breakfast', rating: 4.4 },
    ],
  },

  varanasi: {
    id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', region: 'North India',
    lat: 25.3176, lng: 82.9739,
    tag: 'City of Light', bestSeason: 'Oct–Mar',
    popularityRank: 4, trending: false,
    weather: {
      temp: 32, condition: 'Sunny', humidity: 45, windSpeed: 10,
      uvIndex: 9, aqi: 150, feelsLike: 36,
      hourly: [
        { time: '05:00', icon: '🌅', temp: 24, rain: 0 },
        { time: '08:00', icon: '☀️', temp: 29, rain: 0 },
        { time: '12:00', icon: '☀️', temp: 36, rain: 0 },
        { time: '16:00', icon: '☀️', temp: 35, rain: 0 },
        { time: '19:00', icon: '🌇', temp: 30, rain: 0 },
        { time: '22:00', icon: '🌙', temp: 26, rain: 0 },
      ],
      weekly: [
        { day: 'Mon', icon: '☀️', high: 36, low: 22, rain: 0 },
        { day: 'Tue', icon: '☀️', high: 37, low: 23, rain: 0 },
        { day: 'Wed', icon: '☀️', high: 38, low: 24, rain: 0 },
        { day: 'Thu', icon: '⛅', high: 34, low: 22, rain: 5 },
        { day: 'Fri', icon: '☀️', high: 36, low: 22, rain: 0 },
        { day: 'Sat', icon: '☀️', high: 37, low: 23, rain: 0 },
        { day: 'Sun', icon: '☀️', high: 38, low: 24, rain: 0 },
      ],
    },
    safetyStatus: 'orange',
    safetyNote: 'Varanasi is safe for tourists but congested. Watch your belongings in ghats area.',
    safetyAlerts: [
      { level: 'orange', category: 'Crowd Safety', title: 'Dense Crowd at Ghats', description: 'Dashashwamedh Ghat is extremely crowded during Ganga Aarti (7 PM). Pickpocketing incidents reported. Keep bags in front.', area: 'Dashashwamedh Ghat, Assi Ghat', reportedCount: 45 },
      { level: 'orange', category: 'Scam', title: 'Boat Ride Price Gouging', description: 'Boat operators charge 3–5x the fixed price to tourists. Fixed govt rate: ₹200/hour. Negotiate firmly before boarding.', area: 'All Ghats', reportedCount: 300 },
      { level: 'orange', category: 'Air Quality', title: 'High AQI Alert', description: 'AQI consistently above 150 in winter. Wear N95 masks during outdoor activities. Sensitive groups should avoid early morning ghats.', area: 'Entire city', reportedCount: 0 },
    ],
    prohibitedAreas: ['Photography inside Kashi Vishwanath Temple (inner sanctum)', 'Ganga bank during Chhath Puja (police cordon)'],
    emergencyContacts: { police: '100', ambulance: '108', touristHelpline: '0542-2500054', ghatsPolice: '0542-2390201' },
    networkCoverage: {
      overall: 'Good',
      operators: {
        'Jio': { '4G': 'Excellent', '5G': 'Not available', signal: 88 },
        'Airtel': { '4G': 'Good', '5G': 'Not available', signal: 80 },
        'Vi': { '4G': 'Moderate', signal: 65 },
        'BSNL': { '4G': 'Poor', signal: 40 },
      },
      simSuggestion: 'Jio is best. Signal can be weak inside narrow galis of old city.',
      offlineAreas: ['Deep interior galis of old Varanasi', 'Inside Kashi Vishwanath corridor'],
    },
    hotels: [
      { id: 'v1', name: 'BrijRama Palace', stars: 5, rating: 4.8, reviews: 890, pricePerNight: 12000, tier: 'luxury', distance: 'On Darbhanga Ghat', amenities: ['WiFi', 'Pool', 'AC', 'Breakfast', 'Ganga View', 'Spa'], images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600'], taxes: 2160, cancellation: 'Free until 72h before', location: 'Darbhanga Ghat', budgetFit: 'slightly_over' },
      { id: 'v2', name: 'Ganges View Hotel', stars: 3, rating: 4.3, reviews: 1200, pricePerNight: 2500, tier: 'mid', distance: 'Assi Ghat Steps', amenities: ['WiFi', 'AC', 'Rooftop', 'Ganga View'], images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600'], taxes: 450, cancellation: 'Free until 24h before', location: 'Assi Ghat', budgetFit: 'within' },
      { id: 'v3', name: 'Shanti Guesthouse', stars: 1, rating: 3.9, reviews: 420, pricePerNight: 600, tier: 'budget', distance: '5 min from Assi Ghat', amenities: ['WiFi', 'Fan', 'Shared Bathroom'], images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600'], taxes: 108, cancellation: 'Non-refundable', location: 'Assi Ghat area', budgetFit: 'within' },
    ],
    transport: {
      trains: [
        { id: 't1', name: 'Kashi Vishwanath Express', number: '13010', from: 'New Delhi', to: 'Varanasi', departure: '18:40', arrival: '08:35', duration: '13h 55m', classes: [{ name: 'Sleeper', price: 290, availability: 'Available' }, { name: '3AC', price: 780, availability: 'Available' }], type: 'cheapest' },
        { id: 't2', name: 'Rajdhani Express', number: '12759', from: 'New Delhi', to: 'Varanasi', departure: '21:25', arrival: '08:00', duration: '10h 35m', classes: [{ name: '3AC', price: 1240, availability: 'RAC' }, { name: '2AC', price: 1780, availability: 'Available' }], type: 'fastest' },
      ],
      flights: [
        { id: 'f1', airline: 'IndiGo', flightNo: '6E-701', from: 'DEL', to: 'VNS', departure: '09:00', arrival: '10:30', duration: '1h 30m', stops: 'Non-stop', price: 4500, carbon: '50 kg CO₂' },
      ],
      buses: [],
      cab: { estimatedFare: 14000, distanceKm: 820, duration: '13–15 hours', providers: ['Ola', 'Local UP Taxis'] },
      localTransport: [
        { mode: 'E-Rickshaw', avgCostPerDay: 150, available: true, tip: 'Best for narrow galis' },
        { mode: 'Auto Rickshaw', avgCostPerDay: 250, available: true },
        { mode: 'Boat (Ghat Cruise)', avgCostPerDay: 400, available: true, tip: '₹200/hour — book at govt counter' },
        { mode: 'Cycle Rickshaw', avgCostPerDay: 100, available: true, tip: 'Perfect for old city exploration' },
      ],
    },
    places: [
      { id: 'p1', name: 'Dashashwamedh Ghat', category: '🕯️ Ghat & Aarti', entryFee: 0, hours: 'Open 24h (Aarti 7 PM)', crowd: 'Very High', duration: '2 hours', image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400', lat: 25.3109, lng: 83.0102, popularityScore: 99, distanceFromCentre: 0, timeSlot: 'evening', mustVisit: true, tip: 'Arrive 30 min before Aarti for front row. Boat view is magical.' },
      { id: 'p2', name: 'Kashi Vishwanath Temple', category: '🛕 Temple', entryFee: 0, hours: '4 AM – 11 PM', crowd: 'Very High', duration: '1.5 hours', image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400', lat: 25.3109, lng: 83.0099, popularityScore: 98, distanceFromCentre: 0.2, timeSlot: 'morning', mustVisit: true },
      { id: 'p3', name: 'Sarnath', category: '🔮 Buddhist Site', entryFee: 40, hours: '6 AM – 6 PM', crowd: 'Low', duration: '2–3 hours', image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400', lat: 25.3816, lng: 83.0237, popularityScore: 85, distanceFromCentre: 10, timeSlot: 'afternoon' },
      { id: 'p4', name: 'Morning Boat Ride', category: '🚣 River Experience', entryFee: 200, hours: '5:30 AM – 8 AM', crowd: 'Medium', duration: '1.5 hours', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400', lat: 25.3097, lng: 83.0138, popularityScore: 95, distanceFromCentre: 0, timeSlot: 'morning', mustVisit: true, tip: 'Sunrise on Ganga is once-in-a-lifetime. Book rowboat the evening before.' },
    ],
    timeManagement: {
      morning: { label: 'Dawn & Morning (5AM–12PM)', places: ['p4', 'p2'], tip: 'Pre-dawn boat ride at 5:30 AM, then Kashi Vishwanath darshan.' },
      afternoon: { label: 'Afternoon (12PM–5PM)', places: ['p3'], tip: 'Sarnath Buddhist circuit after a Banarasi thaali lunch.' },
      evening: { label: 'Evening (5:30PM–10PM)', places: ['p1'], tip: 'Dashashwamedh Ghat Aarti at 7 PM — spiritual highlight of the trip.' },
    },
    popularRestaurants: [
      { name: 'Blue Lassi Shop', type: 'Iconic Lassi', avgCost: 60, mustTry: 'Rose Lassi in clay pot', rating: 4.8 },
      { name: 'Kashi Chaat Bhandar', type: 'Street Food', avgCost: 100, mustTry: 'Tamatar Chaat', rating: 4.7 },
    ],
  },

  udaipur: {
    id: 'udaipur', name: 'Udaipur', state: 'Rajasthan', region: 'North India',
    lat: 24.5854, lng: 73.7125,
    tag: 'The City of Lakes', bestSeason: 'Sep–Mar',
    popularityRank: 5, trending: true,
    weather: {
      temp: 26, condition: 'Sunny', humidity: 40, windSpeed: 8,
      uvIndex: 7, aqi: 55, feelsLike: 28,
      hourly: [
        { time: '06:00', icon: '🌅', temp: 18, rain: 0 },
        { time: '09:00', icon: '☀️', temp: 23, rain: 0 },
        { time: '12:00', icon: '☀️', temp: 29, rain: 0 },
        { time: '15:00', icon: '☀️', temp: 31, rain: 0 },
        { time: '18:00', icon: '🌇', temp: 26, rain: 0 },
        { time: '21:00', icon: '🌙', temp: 20, rain: 0 },
      ],
      weekly: [
        { day: 'Mon', icon: '☀️', high: 29, low: 16, rain: 0 },
        { day: 'Tue', icon: '☀️', high: 30, low: 17, rain: 0 },
        { day: 'Wed', icon: '⛅', high: 27, low: 15, rain: 5 },
        { day: 'Thu', icon: '☀️', high: 29, low: 16, rain: 0 },
        { day: 'Fri', icon: '☀️', high: 30, low: 17, rain: 0 },
        { day: 'Sat', icon: '☀️', high: 31, low: 18, rain: 0 },
        { day: 'Sun', icon: '☀️', high: 30, low: 17, rain: 0 },
      ],
    },
    safetyStatus: 'green',
    safetyNote: 'Udaipur is among the safest tourist cities in India. Well-policed lakeside areas.',
    safetyAlerts: [
      { level: 'green', category: 'General', title: 'City Safe for Solo & Women Travellers', description: 'Udaipur consistently rated as one of the safest cities for solo female travellers in India. Tourist police at all major lakefront zones.', area: 'All tourist zones', reportedCount: 0 },
      { level: 'orange', category: 'Traffic', title: 'Narrow Roads in Old City', description: 'The old city lanes near City Palace are extremely narrow (under 3m). Drive slowly. Two-wheelers recommended.', area: 'Old City near City Palace', reportedCount: 0 },
    ],
    prohibitedAreas: [],
    emergencyContacts: { police: '100', ambulance: '108', touristHelpline: '0294-2422461' },
    networkCoverage: {
      overall: 'Good',
      operators: {
        'Jio': { '4G': 'Excellent', signal: 90 },
        'Airtel': { '4G': 'Excellent', signal: 88 },
        'Vi': { '4G': 'Good', signal: 70 },
        'BSNL': { '4G': 'Moderate', signal: 55 },
      },
      simSuggestion: 'Jio or Airtel — excellent throughout city and lake areas.',
      offlineAreas: ['Jaisamand Lake Wildlife Sanctuary (50km from city)'],
    },
    hotels: [
      { id: 'u1', name: 'Leela Palace Udaipur', stars: 5, rating: 4.9, reviews: 2800, pricePerNight: 22000, tier: 'luxury', distance: 'On Lake Pichola', amenities: ['WiFi', 'Pool', 'AC', 'Breakfast', 'Spa', 'Lake View', 'Restaurant'], images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600'], taxes: 3960, cancellation: 'Free until 72h before', location: 'Bhatt Ji Ki Bari', budgetFit: 'slightly_over' },
      { id: 'u2', name: 'Jagat Niwas Palace', stars: 4, rating: 4.6, reviews: 1400, pricePerNight: 3800, tier: 'premium', distance: 'On Lake Pichola Steps', amenities: ['WiFi', 'Rooftop', 'AC', 'Lake View'], images: ['https://images.unsplash.com/photo-1582719478250-c89404bb8a0e?w=600'], taxes: 684, cancellation: 'Free until 24h before', location: 'Chandpole', budgetFit: 'within' },
      { id: 'u3', name: 'Dream Heaven Guest House', stars: 2, rating: 4.1, reviews: 580, pricePerNight: 900, tier: 'budget', distance: '400m from Lake', amenities: ['WiFi', 'AC', 'Rooftop Views'], images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600'], taxes: 162, cancellation: 'Non-refundable', location: 'Near Lal Ghat', budgetFit: 'within' },
    ],
    transport: {
      trains: [
        { id: 't1', name: 'Mewar Express', number: '12963', from: 'New Delhi Hazrat Nizamuddin', to: 'Udaipur City', departure: '19:10', arrival: '08:15', duration: '13h 05m', classes: [{ name: 'Sleeper', price: 270, availability: 'Available' }, { name: '3AC', price: 735, availability: 'Available' }], type: 'popular' },
        { id: 't2', name: 'Chetak Express', number: '12982', from: 'Jaipur', to: 'Udaipur', departure: '23:00', arrival: '05:40', duration: '6h 40m', classes: [{ name: 'Sleeper', price: 145, availability: 'Available' }], type: 'cheapest' },
      ],
      flights: [
        { id: 'f1', airline: 'IndiGo', flightNo: '6E-2201', from: 'DEL', to: 'UDR', departure: '07:00', arrival: '08:30', duration: '1h 30m', stops: 'Non-stop', price: 4800, carbon: '48 kg CO₂' },
      ],
      buses: [
        { id: 'b1', operator: 'RSRTC Volvo', type: 'AC', from: 'Delhi', to: 'Udaipur', departure: '18:00', arrival: '07:00', duration: '13h', price: 900 },
      ],
      cab: { estimatedFare: 11000, distanceKm: 660, duration: '12–13 hours', providers: ['Ola', 'Zoom Car'] },
      localTransport: [
        { mode: 'Electric Boat (Lake Pichola)', avgCostPerDay: 700, available: true, tip: 'Sunset cruise ₹400 — best experience' },
        { mode: 'Auto Rickshaw', avgCostPerDay: 250, available: true },
        { mode: 'Rented Scooter', avgCostPerDay: 300, available: true },
        { mode: 'Bicycle', avgCostPerDay: 100, available: true, tip: 'Perfect for lakeside Fateh Sagar circuit' },
      ],
    },
    places: [
      { id: 'p1', name: 'City Palace', category: '🏛️ Palace Complex', entryFee: 300, hours: '9:30 AM – 5:30 PM', crowd: 'High', duration: '3 hours', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400', lat: 24.5763, lng: 73.6844, popularityScore: 97, distanceFromCentre: 0.5, timeSlot: 'morning', mustVisit: true },
      { id: 'p2', name: 'Lake Pichola Boat Ride', category: '⛵ Lake Experience', entryFee: 400, hours: '9 AM – 6 PM', crowd: 'High', duration: '1 hour', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400', lat: 24.5786, lng: 73.6781, popularityScore: 96, distanceFromCentre: 0, timeSlot: 'afternoon', mustVisit: true, tip: 'Sunset cruise is ₹700 — worth every rupee.' },
      { id: 'p3', name: 'Jagdish Temple', category: '🛕 Temple', entryFee: 0, hours: '5 AM – 2 PM, 4 PM – 8 PM', crowd: 'Medium', duration: '45 min', image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400', lat: 24.5780, lng: 73.6847, popularityScore: 80, distanceFromCentre: 0.3, timeSlot: 'morning' },
      { id: 'p4', name: 'Fateh Sagar Lake', category: '🌊 Lake', entryFee: 0, hours: 'Open 24h', crowd: 'Low', duration: '1 hour', image: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=400', lat: 24.5977, lng: 73.6694, popularityScore: 78, distanceFromCentre: 2.5, timeSlot: 'evening', tip: 'Bicycle ride around the lake at sunset.' },
    ],
    timeManagement: {
      morning: { label: 'Morning (9AM–1PM)', places: ['p1', 'p3'], tip: 'City Palace opens at 9:30. Combine with Jagdish Temple next door.' },
      afternoon: { label: 'Afternoon (2PM–6PM)', places: ['p2'], tip: 'Lake Pichola boat ride — book at Rameshwar Ghat.' },
      evening: { label: 'Evening (6PM–9PM)', places: ['p4'], tip: 'Fateh Sagar sunset walk and Sajjan Niwas Garden.' },
    },
    popularRestaurants: [
      { name: 'Ambrai Restaurant', type: 'Fine Dining', avgCost: 1200, mustTry: 'Dal Baati with Lake Palace view', rating: 4.7 },
      { name: 'Natraj Dining Hall', type: 'Traditional Rajasthani', avgCost: 300, mustTry: 'Unlimited Thali', rating: 4.5 },
    ],
  },

  rishikesh: {
    id: 'rishikesh', name: 'Rishikesh', state: 'Uttarakhand', region: 'North India',
    lat: 30.0869, lng: 78.2676,
    tag: 'Yoga Capital of the World', bestSeason: 'Sep–Jun',
    popularityRank: 6, trending: true,
    weather: {
      temp: 22, condition: 'Clear', humidity: 55, windSpeed: 10,
      uvIndex: 6, aqi: 40, feelsLike: 22,
      hourly: [
        { time: '06:00', icon: '🌅', temp: 15, rain: 0 },
        { time: '09:00', icon: '☀️', temp: 19, rain: 0 },
        { time: '12:00', icon: '☀️', temp: 25, rain: 0 },
        { time: '15:00', icon: '🌤', temp: 24, rain: 5 },
        { time: '18:00', icon: '🌇', temp: 20, rain: 0 },
        { time: '21:00', icon: '🌙', temp: 16, rain: 0 },
      ],
      weekly: [
        { day: 'Mon', icon: '☀️', high: 26, low: 14, rain: 0 },
        { day: 'Tue', icon: '☀️', high: 27, low: 15, rain: 0 },
        { day: 'Wed', icon: '⛅', high: 24, low: 13, rain: 15 },
        { day: 'Thu', icon: '☀️', high: 26, low: 14, rain: 0 },
        { day: 'Fri', icon: '☀️', high: 28, low: 15, rain: 0 },
        { day: 'Sat', icon: '☀️', high: 27, low: 14, rain: 0 },
        { day: 'Sun', icon: '⛅', high: 25, low: 13, rain: 10 },
      ],
    },
    safetyStatus: 'green',
    safetyNote: 'Rishikesh is safe. Strong current in Ganga — follow rafting operator safety rules.',
    safetyAlerts: [
      { level: 'orange', category: 'River Safety', title: 'Fast Ganga Current Near Lakshman Jhula', description: 'Do not swim in Ganga near bridges without official rafting guide. Flash floods possible July–Sep.', area: 'Lakshman Jhula, Ram Jhula', reportedCount: 4 },
      { level: 'green', category: 'General', title: 'Spiritual Safety Zone', description: 'Ram Jhula and Lakshman Jhula areas are extremely safe. Alcohol and meat prohibited in this area.', area: 'All tourist zones', reportedCount: 0 },
    ],
    prohibitedAreas: ['Alcohol and meat prohibited across entire Rishikesh (spiritual town)'],
    emergencyContacts: { police: '100', ambulance: '108', raftingRescue: '0135-2430811' },
    networkCoverage: {
      overall: 'Good',
      operators: {
        'Jio': { '4G': 'Good', signal: 82 },
        'Airtel': { '4G': 'Good', signal: 80 },
        'Vi': { '4G': 'Moderate', signal: 60 },
        'BSNL': { '4G': 'Moderate', signal: 65 },
      },
      simSuggestion: 'Jio or Airtel works well in town. Signal weak in deep forest yoga retreat areas.',
      offlineAreas: ['Neelkanth Mahadev Temple road', 'Remote ashrams near Badrinath highway'],
    },
    hotels: [
      { id: 'r1', name: 'Ananda in the Himalayas', stars: 5, rating: 4.9, reviews: 1200, pricePerNight: 28000, tier: 'luxury', distance: 'Narendra Nagar (15km)', amenities: ['WiFi', 'Ayurveda', 'Pool', 'Yoga', 'River View', 'Spa'], images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600'], taxes: 5040, cancellation: 'Free until 7 days before', location: 'Narendra Nagar', budgetFit: 'slightly_over' },
      { id: 'r2', name: 'Bunk Hostel Rishikesh', stars: 2, rating: 4.3, reviews: 880, pricePerNight: 700, tier: 'budget', distance: '100m from Ram Jhula', amenities: ['WiFi', 'Yoga Deck', 'Shared Kitchen'], images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600'], taxes: 126, cancellation: 'Non-refundable', location: 'Lakshman Jhula', budgetFit: 'within' },
      { id: 'r3', name: 'Aloha on the Ganges', stars: 4, rating: 4.6, reviews: 2150, pricePerNight: 8500, tier: 'premium', distance: 'Near Tapovan', amenities: ['WiFi', 'Infinity Pool', 'AC', 'River View', 'Spa'], images: ['https://images.unsplash.com/photo-1582719478250-c89404bb8a0e?w=600'], taxes: 1530, cancellation: 'Free until 48h before', location: 'Tapovan', budgetFit: 'within' },
      { id: 'r4', name: 'Ganga Kinare', stars: 3, rating: 4.4, reviews: 1500, pricePerNight: 4500, tier: 'mid', distance: 'On the banks of Ganges', amenities: ['WiFi', 'AC', 'Private Ghat', 'Breakfast'], images: ['https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600'], taxes: 810, cancellation: 'Free until 24h before', location: 'Pashulok Barrage', budgetFit: 'within' },
    ],
    transport: {
      trains: [
        { id: 't1', name: 'Dehradun Express', number: '12055', from: 'New Delhi', to: 'Haridwar', departure: '17:40', arrival: '22:20', duration: '4h 40m', note: 'Bus/cab Haridwar→Rishikesh 25km', classes: [{ name: 'CC', price: 680, availability: 'Available' }], type: 'fastest' },
      ],
      flights: [
        { id: 'f1', airline: 'Multiple', flightNo: 'Various', from: 'DEL', to: 'Jolly Grant (DED)', departure: 'Multiple', arrival: 'Various', duration: '1h', stops: 'Non-stop', price: 5000, note: 'Airport 35km from Rishikesh' },
      ],
      buses: [
        { id: 'b1', operator: 'UPSRTC / Uttarakhand Roadways', type: 'AC', from: 'Delhi ISBT', to: 'Rishikesh', departure: 'Every 30 min (5AM–10PM)', arrival: '+6h', duration: '6h', price: 400 },
      ],
      cab: { estimatedFare: 3500, distanceKm: 245, duration: '5–6 hours', providers: ['Ola', 'Zoom Car'] },
      localTransport: [
        { mode: 'E-Rickshaw', avgCostPerDay: 150, available: true },
        { mode: 'Shared Vikram', avgCostPerDay: 50, available: true, tip: '₹10/ride between Ram & Lakshman Jhula' },
        { mode: 'Bicycle', avgCostPerDay: 120, available: true, tip: 'Best way to explore ghats' },
        { mode: 'Rafting (Adventure Transort)', avgCostPerDay: 600, available: true, tip: '16km Shivpuri stretch — most popular' },
      ],
    },
    places: [
      { id: 'p1', name: 'River Rafting (Shivpuri)', category: '🏄 Adventure', entryFee: 600, hours: '9 AM – 4 PM', crowd: 'High', duration: '3 hours', image: 'https://images.unsplash.com/photo-1544085311-11a028465b03?w=400', lat: 30.1283, lng: 78.3547, popularityScore: 98, distanceFromCentre: 18, timeSlot: 'morning', mustVisit: true },
      { id: 'p2', name: 'Laxman Jhula', category: '🌉 Iconic Bridge', entryFee: 0, hours: 'Open 24h', crowd: 'Very High', duration: '45 min', image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400', lat: 30.1258, lng: 78.3223, popularityScore: 92, distanceFromCentre: 3, timeSlot: 'morning' },
      { id: 'p3', name: 'Triveni Ghat Aarti', category: '🕯️ Ghat & Aarti', entryFee: 0, hours: 'Aarti at 6:00 PM daily', crowd: 'High', duration: '1 hour', image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400', lat: 30.0975, lng: 78.2953, popularityScore: 90, distanceFromCentre: 1, timeSlot: 'evening', mustVisit: true },
      { id: 'p4', name: 'Bungee Jumping (Jumpin Heights)', category: '🪂 Extreme Adventure', entryFee: 3550, hours: '9 AM – 5 PM', crowd: 'Medium', duration: '2 hours', image: 'https://images.unsplash.com/photo-1544085311-11a028465b03?w=400', lat: 30.1312, lng: 78.4003, popularityScore: 88, distanceFromCentre: 22, timeSlot: 'afternoon' },
      { id: 'p5', name: 'Beatles Ashram', category: '🧘 Meditation', entryFee: 600, hours: '10 AM – 4 PM', crowd: 'Medium', duration: '2 hours', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400', lat: 30.1130, lng: 78.3150, popularityScore: 85, distanceFromCentre: 4, timeSlot: 'morning', mustVisit: true },
      { id: 'p6', name: 'Neer Garh Waterfall', category: '🌊 Nature', entryFee: 50, hours: '8 AM – 5 PM', crowd: 'Medium', duration: '1.5 hours', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400', lat: 30.1444, lng: 78.3421, popularityScore: 80, distanceFromCentre: 7, timeSlot: 'afternoon' },
      { id: 'p7', name: 'Parmarth Niketan', category: '🕌 Ashram', entryFee: 0, hours: '6 AM – 9 PM', crowd: 'High', duration: '1 hour', image: 'https://images.unsplash.com/photo-1561361058-c24e03e59f69?w=400', lat: 30.1186, lng: 78.3110, popularityScore: 91, distanceFromCentre: 2, timeSlot: 'evening' },
      { id: 'p8', name: 'Vashishta Gufa', category: '🧘 Cave & Meditation', entryFee: 0, hours: '8 AM – 6 PM', crowd: 'Low', duration: '1 hour', image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=400', lat: 30.1500, lng: 78.4100, popularityScore: 78, distanceFromCentre: 25, timeSlot: 'morning' },
    ],
    timeManagement: {
      morning: { label: 'Morning (8AM–1PM)', places: ['p1', 'p2', 'p5', 'p8'], tip: 'Start with rafting or Beatles Ashram for peace before the crowds. Breakfast at Laxman Jhula.' },
      afternoon: { label: 'Afternoon (2PM–5PM)', places: ['p4', 'p6'], tip: 'Adventure time (Bungee) or a short trek to Neer Garh Waterfall to cool off.' },
      evening: { label: 'Evening (5:30PM–8PM)', places: ['p3', 'p7'], tip: 'Witness the grand Aarti at Triveni Ghat or Parmarth Niketan at sunset.' },
    },
    popularRestaurants: [
      { name: 'The Little Buddha Cafe', type: 'International & Indian', avgCost: 300, mustTry: 'Falafel Wrap + Lassi', rating: 4.5 },
      { name: 'Chotiwala Restaurant', type: 'North Indian', avgCost: 200, mustTry: 'Aloo Puri', rating: 4.2 },
      { name: 'Secret Garden Cafe', type: 'Vegan', avgCost: 350, mustTry: 'Vegan Burgers & Smoothies', rating: 4.6 },
    ],
  },

  ladakh: {
    id: 'ladakh', name: 'Ladakh', state: 'Ladakh', region: 'North India',
    lat: 34.1526, lng: 77.5771, tag: 'The Land of High Passes', bestSeason: 'Jun–Sep',
    popularityRank: 7, trending: true,
    weather: { temp: 12, condition: 'Clear & Cold', humidity: 20, windSpeed: 15, uvIndex: 9, aqi: 30, feelsLike: 8,
      hourly: [{ time: '09:00', icon: '☀️', temp: 10, rain: 0 }, { time: '14:00', icon: '☀️', temp: 15, rain: 0 }],
      weekly: [{ day: 'Mon', icon: '☀️', high: 15, low: -2, rain: 0 }] },
    safetyStatus: 'green', safetyNote: 'Safe but acclimatize properly. Altitude sickness risk above 3500m.',
    safetyAlerts: [{ level: 'orange', category: 'Health', title: 'Altitude Sickness', description: 'Rest for first 24–48 hours. Avoid alcohol and heavy exercise on arrival.', area: 'Leh City & above', reportedCount: 0 }],
    prohibitedAreas: ['Border zones near Siachen (Permit required)'],
    emergencyContacts: { police: '100', ambulance: '108', touristHelpline: '01982-252094' },
    networkCoverage: { overall: 'Poor', operators: { 'BSNL': { '4G': 'Available in Leh', signal: 50 }, 'Jio': { '4G': 'Limited', signal: 30 } }, simSuggestion: 'Buy BSNL SIM — only network with coverage in remote areas.' },
    hotels: [
      { id: 'l1', name: 'The Grand Dragon Ladakh', stars: 4, rating: 4.7, reviews: 980, pricePerNight: 7500, tier: 'premium', distance: 'Leh Center', amenities: ['WiFi', 'Restaurant', 'Mountain View'], images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600'], taxes: 1350, cancellation: 'Free 72h', location: 'Leh', budgetFit: 'within' },
      { id: 'l2', name: 'Budget Guesthouse Leh', stars: 2, rating: 4.0, reviews: 320, pricePerNight: 1200, tier: 'budget', distance: '500m from Main Bazaar', amenities: ['WiFi', 'Breakfast'], images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600'], taxes: 216, cancellation: 'Non-refundable', location: 'Old Leh', budgetFit: 'within' },
    ],
    transport: {
      trains: [], flights: [{ id: 'f1', airline: 'IndiGo/Air India', flightNo: 'Various', from: 'DEL', to: 'IXL', departure: '06:00', arrival: '07:30', duration: '1h 30m', stops: 'Non-stop', price: 6500 }],
      buses: [{ id: 'b1', operator: 'HRTC / Manali-Leh Bus', type: 'Government', from: 'Manali', to: 'Leh', departure: '06:00', arrival: '+2 days', duration: '2 days', price: 700 }],
      cab: { estimatedFare: 18000, distanceKm: 1050, duration: '2 days via Manali' },
      localTransport: [{ mode: 'Taxi', avgCostPerDay: 2500, available: true }, { mode: 'Motorcycle Rental', avgCostPerDay: 1200, available: true }],
    },
    places: [
      { id: 'lp1', name: 'Pangong Lake', category: '🏔️ Lake', entryFee: 0, hours: 'Open all day', crowd: 'Medium', duration: 'Full day', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400', lat: 33.7594, lng: 78.6423, popularityScore: 99, distanceFromCentre: 160, timeSlot: 'morning', mustVisit: true },
      { id: 'lp2', name: 'Nubra Valley', category: '🌄 Valley', entryFee: 0, hours: 'Open all day', crowd: 'Low', duration: 'Full day', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400', lat: 34.6867, lng: 77.5619, popularityScore: 95, distanceFromCentre: 150, timeSlot: 'morning', mustVisit: true },
      { id: 'lp3', name: 'Leh Palace', category: '🏯 Heritage', entryFee: 100, hours: '7 AM – 4 PM', crowd: 'Medium', duration: '2 hours', image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400', lat: 34.1664, lng: 77.5858, popularityScore: 88, distanceFromCentre: 1, timeSlot: 'afternoon' },
    ],
    timeManagement: {
      morning: { label: 'Morning', places: ['lp1', 'lp2'], tip: 'Start drives by 5 AM for mountain passes.' },
      afternoon: { label: 'Afternoon', places: ['lp3'], tip: 'Visit Leh Palace and local monasteries.' },
      evening: { label: 'Evening', places: [], tip: 'Stroll Main Bazaar, try Butter Tea.' },
    },
    popularRestaurants: [{ name: 'Bon Appetit', type: 'Multi-cuisine', avgCost: 400, mustTry: 'Thukpa Noodle Soup', rating: 4.4 }],
  },

  mysuru: {
    id: 'mysuru', name: 'Mysuru', state: 'Karnataka', region: 'South India',
    lat: 12.2958, lng: 76.6394, tag: 'The City of Palaces', bestSeason: 'Oct–Feb',
    popularityRank: 8, trending: false,
    weather: { temp: 27, condition: 'Pleasant', humidity: 55, windSpeed: 10, uvIndex: 6, aqi: 70, feelsLike: 29,
      hourly: [{ time: '09:00', icon: '⛅', temp: 23, rain: 5 }, { time: '14:00', icon: '🌤', temp: 28, rain: 0 }],
      weekly: [{ day: 'Mon', icon: '🌤', high: 29, low: 19, rain: 10 }] },
    safetyStatus: 'green', safetyNote: 'Very safe city for tourists. Well-lit areas and tourist police active.',
    safetyAlerts: [],
    prohibitedAreas: [],
    emergencyContacts: { police: '100', ambulance: '108', touristHelpline: '0821-2422096' },
    networkCoverage: { overall: 'Excellent', operators: { 'Jio': { '4G': 'Excellent', signal: 95 }, 'Airtel': { '4G': 'Excellent', signal: 92 } }, simSuggestion: 'Any major operator works perfectly.' },
    hotels: [
      { id: 'm1', name: 'Lalitha Mahal Palace Hotel', stars: 5, rating: 4.8, reviews: 1200, pricePerNight: 9500, tier: 'luxury', distance: '3km from Palace', amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant'], images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600'], taxes: 1710, cancellation: 'Free 48h', location: 'Nazarabad', budgetFit: 'slightly_over' },
      { id: 'm2', name: 'Hotel Mayura', stars: 3, rating: 4.1, reviews: 650, pricePerNight: 2200, tier: 'mid', distance: 'City Center', amenities: ['WiFi', 'AC', 'Breakfast'], images: ['https://images.unsplash.com/photo-1582719478250-c89404bb8a0e?w=600'], taxes: 396, cancellation: 'Free 24h', location: 'Sayyaji Rao Rd', budgetFit: 'within' },
    ],
    transport: {
      trains: [{ id: 't1', name: 'Shatabdi Express', number: '12007', from: 'Bengaluru', to: 'Mysuru', departure: '11:00', arrival: '13:00', duration: '2h', classes: [{ name: 'CC', price: 390, availability: 'Available' }], type: 'fastest' }],
      flights: [], buses: [{ id: 'b1', operator: 'KSRTC', type: 'AC Volvo', from: 'Bengaluru Majestic', to: 'Mysuru', departure: 'Every 30 min', arrival: '+3h', duration: '3h', price: 300 }],
      cab: { estimatedFare: 3000, distanceKm: 145, duration: '3 hours' },
      localTransport: [{ mode: 'Auto Rickshaw', avgCostPerDay: 400, available: true }, { mode: 'City Bus', avgCostPerDay: 50, available: true }],
    },
    places: [
      { id: 'mp1', name: 'Mysore Palace', category: '🏯 Heritage', entryFee: 70, hours: '10 AM – 5:30 PM', crowd: 'Very High', duration: '2 hours', image: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=400', lat: 12.3052, lng: 76.6552, popularityScore: 99, distanceFromCentre: 1, timeSlot: 'morning', mustVisit: true },
      { id: 'mp2', name: 'Chamundi Hills', category: '⛩️ Temple', entryFee: 0, hours: '6 AM – 9 PM', crowd: 'High', duration: '2 hours', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400', lat: 12.2723, lng: 76.6739, popularityScore: 90, distanceFromCentre: 13, timeSlot: 'afternoon' },
      { id: 'mp3', name: 'Brindavan Gardens', category: '🌸 Garden', entryFee: 30, hours: '6 AM – 8 PM (Fountains 7–8 PM)', crowd: 'High', duration: '2 hours', image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400', lat: 12.4158, lng: 76.5741, popularityScore: 87, distanceFromCentre: 19, timeSlot: 'evening', mustVisit: true },
    ],
    timeManagement: {
      morning: { label: 'Morning', places: ['mp1'], tip: 'Reach Mysore Palace before 10 AM to beat crowds.' },
      afternoon: { label: 'Afternoon', places: ['mp2'], tip: 'Climb Chamundi Hills — 1000 steps or taxi.' },
      evening: { label: 'Evening', places: ['mp3'], tip: 'Musical fountain show at Brindavan is unmissable.' },
    },
    popularRestaurants: [{ name: 'Hotel RRR', type: 'South Indian', avgCost: 200, mustTry: 'Mysore Masala Dosa', rating: 4.5 }],
  },

  agra: {
    id: 'agra', name: 'Agra', state: 'Uttar Pradesh', region: 'North India',
    lat: 27.1767, lng: 78.0081, tag: 'City of the Taj Mahal', bestSeason: 'Oct–Mar',
    popularityRank: 9, trending: false,
    weather: { temp: 26, condition: 'Hazy', humidity: 45, windSpeed: 8, uvIndex: 7, aqi: 180, feelsLike: 28,
      hourly: [{ time: '09:00', icon: '🌤', temp: 22, rain: 0 }, { time: '14:00', icon: '☀️', temp: 30, rain: 0 }],
      weekly: [{ day: 'Mon', icon: '☀️', high: 30, low: 16, rain: 0 }] },
    safetyStatus: 'orange', safetyNote: 'Busy tourist area. Watch for touts near Taj Mahal gates.',
    safetyAlerts: [{ level: 'orange', category: 'Tourist Scam', title: 'Marble Shop Touts', description: 'Rickshaw drivers receive commissions from marble shops. Avoid unsolicited "free" tours.', area: 'Near Taj Mahal', reportedCount: 200 }],
    prohibitedAreas: [],
    emergencyContacts: { police: '100', ambulance: '108', touristHelpline: '0562-2226431' },
    networkCoverage: { overall: 'Good', operators: { 'Jio': { '4G': 'Excellent', signal: 90 }, 'Airtel': { '4G': 'Good', signal: 85 } }, simSuggestion: 'Jio recommended.' },
    hotels: [
      { id: 'a1', name: 'The Oberoi Amarvilas', stars: 5, rating: 4.9, reviews: 2100, pricePerNight: 35000, tier: 'luxury', distance: '600m from Taj Mahal', amenities: ['WiFi', 'Pool', 'Taj View', 'Spa'], images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600'], taxes: 6300, cancellation: 'Free 72h', location: 'Taj East Gate', budgetFit: 'slightly_over' },
      { id: 'a2', name: 'Hotel Sidhartha', stars: 3, rating: 4.2, reviews: 900, pricePerNight: 2500, tier: 'mid', distance: '2km from Taj', amenities: ['WiFi', 'AC', 'Breakfast'], images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600'], taxes: 450, cancellation: 'Free 24h', location: 'Fatehabad Rd', budgetFit: 'within' },
    ],
    transport: {
      trains: [{ id: 't1', name: 'Gatimaan Express', number: '12050', from: 'New Delhi', to: 'Agra Cantt', departure: '08:10', arrival: '09:50', duration: '1h 40m', classes: [{ name: 'CC', price: 755, availability: 'Available' }], type: 'fastest' }],
      flights: [], buses: [{ id: 'b1', operator: 'UPSRTC Volvo', type: 'AC', from: 'Delhi ISBT', to: 'Agra', departure: 'Every 1h', arrival: '+4h', duration: '4h', price: 350 }],
      cab: { estimatedFare: 3200, distanceKm: 210, duration: '3–4 hours' },
      localTransport: [{ mode: 'Auto Rickshaw', avgCostPerDay: 600, available: true }, { mode: 'Tonga (horse carriage)', avgCostPerDay: 300, available: true }],
    },
    places: [
      { id: 'ap1', name: 'Taj Mahal', category: '🕌 Wonder', entryFee: 1100, hours: '6 AM – 7 PM (Closed Fri)', crowd: 'Very High', duration: '3 hours', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400', lat: 27.1751, lng: 78.0421, popularityScore: 100, distanceFromCentre: 3, timeSlot: 'morning', mustVisit: true },
      { id: 'ap2', name: 'Agra Fort', category: '🏯 UNESCO', entryFee: 650, hours: 'Sunrise–Sunset', crowd: 'High', duration: '2 hours', image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400', lat: 27.1795, lng: 78.0211, popularityScore: 92, distanceFromCentre: 2, timeSlot: 'afternoon' },
    ],
    timeManagement: {
      morning: { label: 'Morning', places: ['ap1'], tip: 'Taj Mahal at sunrise is magical — arrive by 6 AM.' },
      afternoon: { label: 'Afternoon', places: ['ap2'], tip: 'Agra Fort afternoon light is perfect for photos.' },
      evening: { label: 'Evening', places: [], tip: 'Mehtab Bagh for Taj sunset view across the river.' },
    },
    popularRestaurants: [{ name: 'Peshawri (ITC)', type: 'Mughlai', avgCost: 1200, mustTry: 'Dal Bukhara & Kebabs', rating: 4.7 }],
  },

  andaman: {
    id: 'andaman', name: 'Andaman Islands', state: 'A&N Islands', region: 'Islands',
    lat: 11.7401, lng: 92.6586, tag: 'Tropical Island Paradise', bestSeason: 'Oct–May',
    popularityRank: 10, trending: true,
    weather: { temp: 29, condition: 'Tropical & Sunny', humidity: 75, windSpeed: 18, uvIndex: 9, aqi: 25, feelsLike: 33,
      hourly: [{ time: '09:00', icon: '⛅', temp: 27, rain: 10 }, { time: '14:00', icon: '☀️', temp: 31, rain: 0 }],
      weekly: [{ day: 'Mon', icon: '🌤', high: 31, low: 24, rain: 20 }] },
    safetyStatus: 'green', safetyNote: 'Very safe. Follow water sports safety instructions.',
    safetyAlerts: [],
    prohibitedAreas: ['North Sentinel Island (strictly prohibited by law)'],
    emergencyContacts: { police: '100', ambulance: '108', coastGuard: '1554' },
    networkCoverage: { overall: 'Moderate', operators: { 'BSNL': { '4G': 'Available', signal: 60 }, 'Airtel': { '4G': 'Limited', signal: 45 } }, simSuggestion: 'BSNL SIM recommended. Carry offline maps.' },
    hotels: [
      { id: 'an1', name: 'Taj Exotica Andaman', stars: 5, rating: 4.8, reviews: 1500, pricePerNight: 22000, tier: 'luxury', distance: 'Havelock Island', amenities: ['WiFi', 'Pool', 'Beach', 'Spa', 'Dive Center'], images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600'], taxes: 3960, cancellation: 'Free 7 days', location: 'Radhanagar Beach', budgetFit: 'slightly_over' },
      { id: 'an2', name: 'Pristine Beach Resort', stars: 3, rating: 4.3, reviews: 800, pricePerNight: 3500, tier: 'mid', distance: 'Neil Island', amenities: ['WiFi', 'AC', 'Beach Access'], images: ['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600'], taxes: 630, cancellation: 'Free 48h', location: 'Neil Island', budgetFit: 'within' },
    ],
    transport: {
      trains: [],
      flights: [{ id: 'f1', airline: 'IndiGo/Air India', flightNo: 'Various', from: 'Chennai/Kolkata', to: 'Port Blair (IXZ)', departure: 'Multiple', arrival: '+2h', duration: '2h', stops: 'Non-stop', price: 7000 }],
      buses: [], cab: { estimatedFare: 500, distanceKm: 15, duration: 'Port Blair city', providers: ['Local Taxis'] },
      localTransport: [{ mode: 'Ferry', avgCostPerDay: 600, available: true, tip: 'Only way to reach islands' }, { mode: 'Motorcycle Rental', avgCostPerDay: 800, available: true }],
    },
    places: [
      { id: 'anp1', name: 'Radhanagar Beach (Beach 7)', category: '🏖️ Beach', entryFee: 0, hours: 'Open 24h', crowd: 'Medium', duration: '3 hours', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400', lat: 11.9715, lng: 92.9465, popularityScore: 99, distanceFromCentre: 55, timeSlot: 'morning', mustVisit: true },
      { id: 'anp2', name: 'Cellular Jail', category: '🏛️ Heritage', entryFee: 30, hours: '9 AM – 5 PM', crowd: 'High', duration: '2 hours', image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400', lat: 11.6751, lng: 92.7423, popularityScore: 90, distanceFromCentre: 2, timeSlot: 'afternoon', mustVisit: true },
      { id: 'anp3', name: 'Scuba Diving (Havelock)', category: '🤿 Adventure', entryFee: 3500, hours: '8 AM – 3 PM', crowd: 'Low', duration: 'Half day', image: 'https://images.unsplash.com/photo-1544085311-11a028465b03?w=400', lat: 11.9776, lng: 92.9829, popularityScore: 96, distanceFromCentre: 60, timeSlot: 'morning', mustVisit: true },
    ],
    timeManagement: {
      morning: { label: 'Morning', places: ['anp3', 'anp1'], tip: 'Scuba diving is best in calm morning seas.' },
      afternoon: { label: 'Afternoon', places: ['anp2'], tip: 'Light & Sound show at Cellular Jail at 6 PM.' },
      evening: { label: 'Evening', places: [], tip: 'Seafood dinner at Aberdeen Bazaar.' },
    },
    popularRestaurants: [{ name: 'Ananda Restaurant', type: 'Seafood & Indian', avgCost: 600, mustTry: 'Grilled Lobster', rating: 4.4 }],
  },
};

// Utility: get destination by id or name
function getDestination(key) {
  if (!key) return null;
  const k = key.toLowerCase().replace(/\s+/g, '');
  if (DESTINATIONS[k]) return DESTINATIONS[k];
  // Try matching by name
  const found = Object.values(DESTINATIONS).find(d =>
    d.name.toLowerCase().replace(/\s+/g, '') === k ||
    d.id === k
  );
  if (found) return found;

  // DYNAMIC FALLBACK: If destination is not in mock DB, generate a stub to prevent 404
  const isNumeric = /^\d+$/.test(key);
  const formattedName = isNumeric ? 'City' : key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
  const displayName = isNumeric ? '' : ` ${formattedName}`;
  
  return {
    id: k,
    name: formattedName,
    state: 'Destination',
    region: 'Global',
    lat: 28.6139, lng: 77.2090, // Fallback coords (Delhi)
    tag: isNumeric ? 'Discover new places' : `Discover ${formattedName}`,
    bestSeason: 'Year-round',
    popularityRank: 10,
    trending: false,
    weather: {
      temp: 25, condition: 'Clear', humidity: 50, windSpeed: 10, uvIndex: 5, aqi: 100, feelsLike: 26,
      hourly: [
        { time: '09:00', icon: '☀️', temp: 22, rain: 0 },
        { time: '12:00', icon: '☀️', temp: 25, rain: 0 },
        { time: '15:00', icon: '🌤', temp: 26, rain: 0 }
      ],
      weekly: [
        { day: 'Mon', icon: '☀️', high: 26, low: 18, rain: 0 }
      ]
    },
    safetyStatus: 'green',
    safetyNote: 'Standard travel precautions apply.',
    safetyAlerts: [],
    prohibitedAreas: [],
    emergencyContacts: { police: '100', ambulance: '108' },
    networkCoverage: {
      overall: 'Good',
      operators: { 'Jio': { '4G': 'Good' }, 'Airtel': { '4G': 'Good' } },
      simSuggestion: 'Major networks work fine.'
    },
    hotels: [
      { id: `${k}_h1`, name: `Premium Stay${displayName}`, stars: 4, rating: 4.5, reviews: 100, pricePerNight: 4000, tier: 'premium', distance: 'City Centre', amenities: ['WiFi', 'AC'], images: ['https://images.unsplash.com/photo-1582719478250-c89404bb8a0e?w=600'], taxes: 500, cancellation: 'Free', location: isNumeric ? 'City Centre' : `${formattedName} City Centre`, budgetFit: 'within' },
      { id: `${k}_h2`, name: `Budget Inn${displayName}`, stars: 2, rating: 3.8, reviews: 50, pricePerNight: 1500, tier: 'budget', distance: 'Outskirts', amenities: ['WiFi'], images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600'], taxes: 200, cancellation: 'Non-refundable', location: isNumeric ? 'Suburbs' : `${formattedName} Suburbs`, budgetFit: 'within' }
    ],
    transport: {
      trains: [], flights: [], buses: [], cab: null, localTransport: [
        { mode: 'Auto Rickshaw', avgCostPerDay: 200, available: true },
        { mode: 'City Bus', avgCostPerDay: 50, available: true },
        { mode: 'Rental Bike', avgCostPerDay: 350, available: true },
        { mode: 'Taxi', avgCostPerDay: 500, available: true }
      ]
    },
    places: [
      { id: `${k}_p1`, name: `Popular Spot${isNumeric ? '' : ` in ${formattedName}`}`, category: 'Sightseeing', entryFee: 100, hours: '9 AM - 5 PM', crowd: 'Medium', duration: '2 hours', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600', lat: 28.61, lng: 77.20, popularityScore: 80, distanceFromCentre: 5, timeSlot: 'morning', mustVisit: true },
      { id: `${k}_p2`, name: `Central Market${displayName}`, category: 'Shopping', entryFee: 0, hours: '10 AM - 9 PM', crowd: 'High', duration: '3 hours', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600', lat: 28.62, lng: 77.21, popularityScore: 85, distanceFromCentre: 2, timeSlot: 'afternoon' }
    ],
    timeManagement: {
      morning: { label: 'Morning', places: [`${k}_p1`], tip: 'Start early to beat the crowds.' },
      afternoon: { label: 'Afternoon', places: [`${k}_p2`], tip: 'Perfect time for shopping.' },
      evening: { label: 'Evening', places: [], tip: 'Relax and grab dinner.' }
    },
    popularRestaurants: [
      { name: 'Local Cuisine Hub', type: 'Local', avgCost: 500, mustTry: 'Regional Special', rating: 4.0 }
    ]
  };
}

// Destination cover images (Unsplash, free)
const DESTINATION_IMAGES = {
  jaipur:    'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600',
  goa:       'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600',
  manali:    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600',
  varanasi:  'https://images.unsplash.com/photo-1591018533945-9a2f97773a41?w=600',
  udaipur:   'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600',
  rishikesh: 'https://images.unsplash.com/photo-1591018533945-9a2f97773a41?w=600',
  ladakh:    'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600',
  kerala:    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600',
  coorg:     'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=600',
  mysuru:    'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600',
  agra:      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600',
  andaman:   'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600',
};

const AVG_BUDGET_PER_DAY = {
  jaipur: 3500, goa: 4500, manali: 3800, varanasi: 2800, udaipur: 4000,
  rishikesh: 3200, ladakh: 5500, kerala: 4000, coorg: 3800, mysuru: 2800,
  agra: 3000, andaman: 6000,
};

// Utility: get all trending destinations
function getTrending() {
  return Object.values(DESTINATIONS)
    .sort((a, b) => a.popularityRank - b.popularityRank)
    .map(d => ({
      id: d.id,
      name: d.name,
      state: d.state,
      tag: d.tag,
      bestSeason: d.bestSeason,
      popularityRank: d.popularityRank,
      trendingRank: d.popularityRank,
      trending: d.trending,
      image: DESTINATION_IMAGES[d.id] || `https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600`,
      avgBudgetPerDay: AVG_BUDGET_PER_DAY[d.id] || 3500,
      weather: { temp: d.weather.temp, condition: d.weather.condition },
    }));
}

// Utility: get transport between two cities
function getTransportRoute(fromId, toId) {
  const dest = getDestination(toId);
  if (!dest) return null;
  return { ...dest.transport, fromCity: fromId, toCity: dest.name };
}

module.exports = { getDestination, getTrending, getTransportRoute, DESTINATIONS };
