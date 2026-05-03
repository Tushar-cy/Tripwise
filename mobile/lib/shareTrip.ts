/**
 * TripWise — Share Trip
 * 
 * Generates a beautiful shareable card and shares it via the native Share sheet.
 * Uses react-native-view-shot to capture a View as an image, then Share.share().
 * 
 * Usage:
 *   const cardRef = useRef<View>(null);
 *   await shareTrip(cardRef, tripData);
 */

import { Share, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ShareableTripData {
  destination: string;
  fromCity: string;
  startDate: Date | null;
  endDate: Date | null;
  days: number;
  travellers: number;
  tripType: string;
  totalBudgetPerDay: number;
  traveller_type: string;
  selectedPlaces: { name: string; category: string }[];
  itinerary?: string;   // first 3 day highlights
}

/**
 * Extract the first N day highlights lines from a raw itinerary string.
 */
function extractDayHighlights(itinerary: string, maxLines = 6): string {
  if (!itinerary) return '';
  const lines = itinerary
    .split('\n')
    .filter(l => l.trim().length > 0 && !l.startsWith('━') && !l.startsWith('Day'))
    .slice(0, maxLines);
  return lines.join('\n');
}

/**
 * Build the text summary for WhatsApp/Instagram sharing.
 * Used as fallback when ViewShot is not available, and also as share text.
 */
export function buildShareText(trip: ShareableTripData): string {
  const dateRange = trip.startDate && trip.endDate
    ? `${new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : `${trip.days} days`;

  const budget = `₹${(trip.totalBudgetPerDay * trip.travellers * trip.days).toLocaleString('en-IN')}`;

  const topPlaces = trip.selectedPlaces
    .slice(0, 3)
    .map(p => `  📍 ${p.name}`)
    .join('\n');

  const highlights = trip.itinerary ? extractDayHighlights(trip.itinerary) : '';

  return [
    `✈️ TripWise Trip Plan`,
    ``,
    `🗺️  ${trip.fromCity} → ${trip.destination}`,
    `📅  ${dateRange}  ·  ${trip.days} ${trip.days === 1 ? 'night' : 'nights'}`,
    `👥  ${trip.travellers} ${trip.travellers === 1 ? 'Traveller' : 'Travellers'}  ·  ${trip.tripType}`,
    `💰  Budget: ${budget}  (₹${trip.totalBudgetPerDay.toLocaleString('en-IN')}/day)`,
    ``,
    topPlaces.length > 0 ? `Must-visits:\n${topPlaces}` : '',
    highlights.length > 0 ? `\nDay 1 highlights:\n${highlights}` : '',
    ``,
    `🇮🇳 Planned with TripWise — India's AI Trip Planner`,
    `Download & plan your trip free 📲`,
  ].filter(Boolean).join('\n');
}

/**
 * Share a trip using the native Share sheet.
 * Shows the trip summary as text — works on WhatsApp, Instagram, Messages, etc.
 * 
 * For image-based sharing (requires react-native-view-shot installation):
 *   Pass a ref to a View component as the first argument.
 * 
 * @param trip  Trip data to share
 * @param imageUri Optional: pre-captured image URI (from ViewShot)
 */
export async function shareTrip(
  trip: ShareableTripData,
  imageUri?: string,
): Promise<void> {
  const text = buildShareText(trip);

  try {
    if (imageUri && Platform.OS !== 'web') {
      // Share with image if available
      await Share.share({
        url: imageUri,      // iOS
        message: text,      // Android, WhatsApp
        title: `My ${trip.destination} Trip Plan`,
      });
    } else {
      await Share.share({
        message: text,
        title: `My ${trip.destination} Trip Plan`,
      });
    }
  } catch (e: any) {
    if (e.message !== 'The user did not share') {
      throw e;
    }
  }
}

/**
 * Capture a React Native View as an image and share it.
 * 
 * Requires: npx expo install react-native-view-shot
 * 
 * Pass a ref to the shareable card View:
 *   const cardRef = useRef<View>(null);
 *   <View ref={cardRef} collapsable={false}> ... </View>
 */
export async function captureAndShare(
  cardRef: React.RefObject<any>,
  trip: ShareableTripData,
): Promise<void> {
  try {
    // Dynamically require to avoid crash if not installed
    const { captureRef } = require('react-native-view-shot') as any;
    const uri = await captureRef(cardRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
    await shareTrip(trip, uri);
  } catch {
    // Fallback to text-only share if ViewShot not installed
    await shareTrip(trip);
  }
}

/**
 * Generate a WhatsApp-specific deep link for the trip summary.
 * Opens WhatsApp with the trip text pre-filled.
 */
export function buildWhatsAppLink(trip: ShareableTripData): string {
  const text = encodeURIComponent(buildShareText(trip));
  return `whatsapp://send?text=${text}`;
}
