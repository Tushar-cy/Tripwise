/**
 * useGPSLocation — auto-detect user city via device GPS
 * Falls back gracefully if permission denied or GPS unavailable.
 */
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { reverseGeocode } from './api';

export interface GPSState {
  city: string | null;
  loading: boolean;
  denied: boolean;
  error: string | null;
}

export function useGPSLocation() {
  const [state, setState] = useState<GPSState>({
    city: null,
    loading: true,
    denied: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setState({ city: null, loading: false, denied: true, error: null });
          return;
        }

        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }

        const city = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
        if (!cancelled) {
          setState({ city, loading: false, denied: false, error: null });
        }
      } catch (e: any) {
        if (!cancelled) {
          setState({ city: null, loading: false, denied: false, error: e.message });
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}
