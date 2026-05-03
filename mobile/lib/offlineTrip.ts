/**
 * TripWise — Offline Trip Storage
 * 
 * Serializes trip data to AsyncStorage for offline access.
 * Checks network connectivity via @react-native-community/netinfo.
 * 
 * Install: npx expo install @react-native-community/netinfo
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIP_KEY_PREFIX = 'tripwise:trip:';
const OFFLINE_QUEUE_KEY = 'tripwise:offline_queue';

export interface OfflineTripData {
  id: string;
  savedAt: string;           // ISO timestamp
  destination: string;
  fromCity: string;
  days: number;
  travellers: number;
  tripType: string;
  totalBudgetPerDay: number;
  budgetResult: any | null;
  selectedHotel: any | null;
  generatedItinerary: string;
  selectedPlaces: any[];
  emergencyContacts: EmergencyContact[];
}

export interface EmergencyContact {
  label: string;
  number: string;
}

// Destination emergency contacts (curated)
const EMERGENCY_CONTACTS: Record<string, EmergencyContact[]> = {
  default: [
    { label: 'Police', number: '100' },
    { label: 'Ambulance', number: '108' },
    { label: 'Tourist Helpline', number: '1800-11-1363' },
    { label: 'IRCTC Helpline', number: '139' },
  ],
  goa: [
    { label: 'Goa Police', number: '0832-2423400' },
    { label: 'Tourist Police', number: '0832-2224750' },
    { label: 'Ambulance', number: '108' },
    { label: 'Coastal Guard', number: '1554' },
  ],
  jaipur: [
    { label: 'Jaipur Police', number: '0141-2744000' },
    { label: 'Tourist Police', number: '0141-2200778' },
    { label: 'Ambulance', number: '108' },
    { label: 'Lady Doctor Helpline', number: '1090' },
  ],
  manali: [
    { label: 'Manali Police', number: '01902-252340' },
    { label: 'Mountain Rescue', number: '01902-252410' },
    { label: 'Ambulance', number: '108' },
    { label: 'Avalanche Warning', number: '1800-180-8080' },
  ],
  mumbai: [
    { label: 'Mumbai Police', number: '022-22621855' },
    { label: 'Tourist Helpline', number: '1364' },
    { label: 'Ambulance', number: '108' },
    { label: 'BEST Bus Helpline', number: '1800-22-9600' },
  ],
};

function getEmergencyContacts(destination: string): EmergencyContact[] {
  const key = destination.toLowerCase().split(' ')[0];
  return EMERGENCY_CONTACTS[key] || EMERGENCY_CONTACTS.default;
}

/**
 * Save a complete trip to AsyncStorage for offline use.
 * Call this when user taps "Save for Offline".
 */
export async function saveTripOffline(tripData: Omit<OfflineTripData, 'savedAt' | 'emergencyContacts'>): Promise<void> {
  const full: OfflineTripData = {
    ...tripData,
    savedAt: new Date().toISOString(),
    emergencyContacts: getEmergencyContacts(tripData.destination),
  };
  await AsyncStorage.setItem(`${TRIP_KEY_PREFIX}${tripData.id}`, JSON.stringify(full));
}

/**
 * Load a trip from offline storage.
 * Returns null if not found.
 */
export async function loadTripOffline(tripId: string): Promise<OfflineTripData | null> {
  try {
    const raw = await AsyncStorage.getItem(`${TRIP_KEY_PREFIX}${tripId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Get a list of all offline-saved trip IDs.
 */
export async function listOfflineTrips(): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys
      .filter(k => k.startsWith(TRIP_KEY_PREFIX))
      .map(k => k.replace(TRIP_KEY_PREFIX, ''));
  } catch {
    return [];
  }
}

/**
 * Delete an offline trip.
 */
export async function deleteOfflineTrip(tripId: string): Promise<void> {
  await AsyncStorage.removeItem(`${TRIP_KEY_PREFIX}${tripId}`);
}



// ── Offline spend queue ───────────────────────────────────────────────────────

export interface QueuedSpend {
  id: string;
  tripId: string;
  category: string;
  amount: number;
  description: string;
  queuedAt: string;
}

/**
 * Queue a spend entry for later sync when back online.
 */
export async function queueSpend(spend: Omit<QueuedSpend, 'id' | 'queuedAt'>): Promise<void> {
  const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  const queue: QueuedSpend[] = raw ? JSON.parse(raw) : [];
  queue.push({
    ...spend,
    id: Date.now().toString(),
    queuedAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Get all queued spend entries.
 */
export async function getQueuedSpends(): Promise<QueuedSpend[]> {
  const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Clear the queue after successful sync.
 */
export async function clearSpendQueue(): Promise<void> {
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
}

// ── Network check (no-dependency fallback) ───────────────────────────────────

/**
 * Check if the device is online.
 * Uses @react-native-community/netinfo if available,
 * falls back to a simple fetch ping.
 */
export async function isOnline(): Promise<boolean> {
  try {
    // Try NetInfo first (optional dep)
    const NetInfo = require('@react-native-community/netinfo') as any;
    const state = await NetInfo.default.fetch();
    return state.isConnected ?? true;
  } catch {
    // Fallback: ping a fast endpoint
    try {
      const res = await fetch('https://clients3.google.com/generate_204', {
        signal: AbortSignal.timeout(3000),
      });
      return res.status === 204;
    } catch {
      return false;
    }
  }
}
