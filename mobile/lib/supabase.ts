import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Graceful no-op when Supabase keys are not configured ──────────────────
// The app functions fully without Supabase using local-only mode.
// Set EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY in .env
// to enable cloud sync (optional).

const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL  || '';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON);

// ── Create client (or a safe stub when keys are missing) ───────────────────
function buildClient() {
  if (!SUPABASE_ENABLED) {
    // Return a minimal stub so all callers don't crash
    const noop = async () => ({ data: null, error: null });
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser:    () => Promise.resolve({ data: { user: null }, error: null }),
        signUp:     noop,
        signInWithPassword: noop,
        signInWithOtp: noop,
        verifyOtp:  noop,
        signOut:    noop,
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        upsert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      functions: {
        invoke: () => Promise.resolve({ data: null, error: null }),
      },
    } as any;
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = buildClient();

// ── Convenience helpers ────────────────────────────────────────────────────

export const getCurrentUser = async () => {
  if (!SUPABASE_ENABLED) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const signOut = async () => {
  if (!SUPABASE_ENABLED) return;
  await supabase.auth.signOut();
};

/**
 * Send OTP to an Indian phone number.
 * @param phone 10-digit (without +91)
 */
export const sendPhoneOTP = async (phone: string) => {
  if (!SUPABASE_ENABLED) return { data: null, error: { message: 'Cloud auth not configured.' } };
  return supabase.auth.signInWithOtp({ phone: `+91${phone}` });
};

/**
 * Verify the OTP.
 * @param phone 10-digit (without +91)
 * @param token 6-digit OTP
 */
export const verifyPhoneOTP = async (phone: string, token: string) => {
  if (!SUPABASE_ENABLED) return { data: null, error: { message: 'Cloud auth not configured.' } };
  return supabase.auth.verifyOtp({ phone: `+91${phone}`, token, type: 'sms' });
};

export const getProfile = async (userId: string) => {
  if (!SUPABASE_ENABLED) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data;
};

export const upsertProfile = async (userId: string, updates: {
  name?: string;
  phone?: string;
  language?: string;
  dietary_pref?: string;
}) => {
  if (!SUPABASE_ENABLED) return { data: null, error: null };
  return supabase.from('profiles').upsert({ id: userId, ...updates });
};
