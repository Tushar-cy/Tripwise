import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  supabase, SUPABASE_ENABLED,
  sendPhoneOTP, verifyPhoneOTP, getProfile, upsertProfile,
} from '../lib/supabase';

const LOCAL_AUTH_KEY = 'tripwise_local_auth';

interface LocalAuth {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
  userName: string;
  userPhone: string | null;
  isLocalUser: boolean; // true when using local-only auth (no Supabase)

  initialize: () => Promise<void>;
  // Phone OTP (requires Supabase)
  sendOTP: (phone: string) => Promise<{ error: string | null }>;
  verifyOTP: (phone: string, token: string) => Promise<{ error: string | null; isNewUser: boolean }>;
  saveName: (name: string) => Promise<void>;
  // Email/password
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setGuest: (name: string) => void;
}

// ── Simple local auth helpers (when Supabase is not configured) ────────────

async function localSignUp(email: string, password: string, name: string): Promise<{ error: string | null }> {
  try {
    const existing = await AsyncStorage.getItem(LOCAL_AUTH_KEY);
    if (existing) {
      const parsed: LocalAuth = JSON.parse(existing);
      if (parsed.email === email) return { error: 'Account already exists. Please sign in.' };
    }
    const localUser: LocalAuth = { id: `local_${Date.now()}`, name, email, createdAt: new Date().toISOString() };
    // Store as: email → {id, name, password_hash}
    await AsyncStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ ...localUser, password }));
    await AsyncStorage.setItem('tripwise_current_user', JSON.stringify(localUser));
    return { error: null };
  } catch (e: any) {
    return { error: e.message || 'Sign up failed' };
  }
}

async function localSignIn(email: string, password: string): Promise<{ error: string | null; user: LocalAuth | null }> {
  try {
    const stored = await AsyncStorage.getItem(LOCAL_AUTH_KEY);
    if (!stored) return { error: 'No account found. Please sign up first.', user: null };
    const parsed = JSON.parse(stored);
    if (parsed.email !== email) return { error: 'Incorrect email or password.', user: null };
    if (parsed.password !== password) return { error: 'Incorrect email or password.', user: null };
    const localUser: LocalAuth = { id: parsed.id, name: parsed.name, email: parsed.email, createdAt: parsed.createdAt };
    await AsyncStorage.setItem('tripwise_current_user', JSON.stringify(localUser));
    return { error: null, user: localUser };
  } catch (e: any) {
    return { error: e.message || 'Sign in failed', user: null };
  }
}

async function localGetCurrentUser(): Promise<LocalAuth | null> {
  try {
    const stored = await AsyncStorage.getItem('tripwise_current_user');
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

async function localSignOut() {
  await AsyncStorage.removeItem('tripwise_current_user');
}

// ── Zustand store ─────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isGuest: false,
  isLocalUser: false,
  userName: 'Traveller',
  userPhone: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      if (SUPABASE_ENABLED) {
        // ── Cloud auth path ──
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await getProfile(session.user.id).catch(() => null);
          set({
            session,
            user: session.user,
            userName: profile?.name || session.user.phone || session.user.email?.split('@')[0] || 'Traveller',
            userPhone: session.user.phone || null,
            isGuest: false,
            isLocalUser: false,
          });
        } else {
          // Check local user as fallback
          const localUser = await localGetCurrentUser();
          if (localUser) {
            set({ userName: localUser.name, isLocalUser: true, isGuest: false });
          }
        }

        supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
          if (session?.user) {
            const profile = await getProfile(session.user.id).catch(() => null);
            set({
              session,
              user: session.user,
              userName: profile?.name || session.user.phone || session.user.email?.split('@')[0] || 'Traveller',
              userPhone: session.user.phone || null,
              isGuest: false,
              isLocalUser: false,
            });
          } else {
            set({ user: null, session: null, userPhone: null });
          }
        });
      } else {
        // ── Local-only auth path (no Supabase keys) ──
        const localUser = await localGetCurrentUser();
        if (localUser) {
          set({
            userName: localUser.name,
            isLocalUser: true,
            isGuest: false,
          });
        }
      }
    } catch (e) {
      console.warn('[AuthStore] Init error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  sendOTP: async (phone) => {
    if (!SUPABASE_ENABLED) return { error: 'Phone auth requires Supabase. Please use email/password.' };
    const { error } = await sendPhoneOTP(phone);
    return { error: error?.message || null };
  },

  verifyOTP: async (phone, token) => {
    if (!SUPABASE_ENABLED) return { error: 'Phone auth requires Supabase.', isNewUser: false };
    try {
      const { data, error } = await verifyPhoneOTP(phone, token);
      if (error) return { error: error.message, isNewUser: false };
      const isNewUser = !data?.user?.created_at || (
        new Date().getTime() - new Date(data.user.created_at).getTime() < 30_000
      );
      if (data?.user) {
        const profile = await getProfile(data.user.id).catch(() => null);
        set({
          user: data.user,
          session: data.session,
          userName: profile?.name || 'Traveller',
          userPhone: `+91${phone}`,
          isGuest: false,
          isLocalUser: false,
        });
      }
      return { error: null, isNewUser };
    } catch (e: any) {
      return { error: e.message || 'OTP verification failed', isNewUser: false };
    }
  },

  saveName: async (name) => {
    const { user, isLocalUser } = get();
    set({ userName: name });
    if (user && SUPABASE_ENABLED) {
      await upsertProfile(user.id, { name, phone: user.phone || undefined });
    }
    if (isLocalUser) {
      const stored = await AsyncStorage.getItem('tripwise_current_user').catch(() => null);
      if (stored) {
        const parsed = JSON.parse(stored);
        await AsyncStorage.setItem('tripwise_current_user', JSON.stringify({ ...parsed, name }));
      }
    }
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true });
    try {
      if (SUPABASE_ENABLED) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return { error: error.message };
        if (data.user) {
          await supabase.from('profiles').upsert({ id: data.user.id, name }).catch(() => {});
          set({ user: data.user, session: data.session, userName: name, isLocalUser: false });
        }
        return { error: null };
      } else {
        // Local-only signup
        const result = await localSignUp(email, password, name);
        if (!result.error) {
          set({ userName: name, isLocalUser: true, isGuest: false });
        }
        return result;
      }
    } catch (e: any) {
      return { error: e.message || 'Sign up failed' };
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      if (SUPABASE_ENABLED) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        if (data.user) {
          set({ user: data.user, session: data.session, isLocalUser: false });
        }
        return { error: null };
      } else {
        // Local-only signin
        const result = await localSignIn(email, password);
        if (result.error) return { error: result.error };
        if (result.user) {
          set({ userName: result.user.name, isLocalUser: true, isGuest: false });
        }
        return { error: null };
      }
    } catch (e: any) {
      return { error: e.message || 'Sign in failed' };
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    if (SUPABASE_ENABLED) await supabase.auth.signOut().catch(() => {});
    await localSignOut().catch(() => {});
    set({ user: null, session: null, isGuest: false, isLocalUser: false, userName: 'Traveller', userPhone: null });
  },

  setGuest: (name) => {
    set({ isGuest: true, userName: name || 'Traveller', isLoading: false, isLocalUser: false });
  },
}));
