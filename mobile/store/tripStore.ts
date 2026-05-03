import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TripType = 'cultural' | 'fun' | 'exploring' | 'adventurous';
export type TravellerType = 'solo' | 'couple' | 'friends' | 'family';
export type BudgetTier = 'low' | 'normal' | 'premium' | 'custom';

export interface NoteItem {
  id: string;
  text: string;
  amount: number;  // positive = expense, negative = saving
  category: 'food' | 'transport' | 'hotel' | 'activity' | 'other';
  timestamp: number;
}

export interface RecommendedTransport {
  mode: 'train' | 'flight' | 'bus' | 'custom' | string;
  name: string;
  oneWayFare: number;
  roundTripPerPerson: number;
  totalFare: number;
  distanceKm: number;
  note: string;
  allFares?: {
    trainSleeper?: number;
    train3AC?: number;
    train2AC?: number;
    trainCC?: number;
    bus?: number;
    flight?: number;
  } | null;
}

export interface BudgetResult {
  // Percentages (always 0-100)
  transport_pct: number;
  transport_base_pct: number;
  transport_buffer_pct: number;
  hotel_pct: number;
  food_pct: number;
  local_pct: number;
  buffer_pct: number;
  // INR amounts (total for the whole trip)
  transport_inr: number;
  transport_base_inr: number;
  transport_buffer_inr: number;
  hotel_inr: number;
  food_inr: number;
  local_inr: number;
  buffer_inr: number;
  // Daily / per-night breakdowns
  hotel_per_night?: number;
  hotel_rooms?: number;
  food_per_day_per_person?: number;
  food_per_day_total?: number;
  per_day_budget?: number;
  // Trip totals
  total_per_day: number;
  usable_per_day: number;
  total_trip_cost: number;
  // Transport recommendation
  recommended_transport?: RecommendedTransport;
  // AI / source
  reasoning?: string;
  source: string;
  smart_insights?: {
    verdict?: string;
    saving_tip?: string;
    splurge_recommendation?: string;
    budget_warning?: string | null;
    risk_flag?: string;
  };
}

export interface SelectedPlace {
  id: string;
  name: string;
  category: string;
  entryFee: number;
  hours: string;
  duration: string;
  image: string;
  popularityScore?: number;
  mustVisit?: boolean;
}

export interface SelectedHotel {
  id: string;
  name: string;
  stars: number;
  rating: number;
  reviews: number;
  pricePerNight: number;
  taxes: number;
  amenities: string[];
  images: string[];
  location: string;
  distance: string;
  cancellation: string;
  budgetFit?: string;
}

interface TripState {
  // Onboarding flow step
  currentStep: number;

  // Step 1: From → To
  fromCity: string;
  fromCityId: string;
  destination: string;
  destinationId: string;
  destinationLat: number | null;   // resolved by geoAPI.getCoords()
  destinationLon: number | null;

  // Step 2: Dates
  startDate: Date | null;
  endDate: Date | null;
  days: number;

  // Step 3: Budget
  budgetTier: BudgetTier;
  totalBudgetPerDay: number;

  // Step 4: Group
  travellerType: TravellerType;
  travellers: number;
  withChildren: boolean;

  // Step 5: Vibe
  tripType: TripType;

  // AI Results
  budgetResult: BudgetResult | null;
  isGeneratingBudget: boolean;
  budgetError: string | null;

  // Selections
  selectedHotel: SelectedHotel | null;
  selectedTransportPrice: number | null;
  selectedPlaces: SelectedPlace[];

  // Generated itinerary
  generatedItinerary: string;

  // User info
  userName: string;
  hasSeenOnboarding: boolean;

  // Expense notes / tracker
  notes: NoteItem[];

  // Departure / return dates (ISO strings)
  departureDate: string | null;
  returnDate: string | null;

  // Saved trips
  savedTrips: Array<{
    id: string;
    destination: string;
    fromCity: string;
    dates: string;
    days: number;
    travellers: number;
    travellerType: string;
    tripType: string;
    totalBudget: number;
    budgetResult: BudgetResult;
    createdAt: string;
  }>;

  // Actions
  setStep: (step: number) => void;
  setFromCity: (name: string, id: string) => void;
  setDestination: (name: string, id: string) => void;
  setCoords: (lat: number, lon: number) => void;   // store resolved coordinates
  setDates: (start: Date, end: Date) => void;
  setBudget: (tier: BudgetTier, amount: number) => void;
  setGroup: (type: TravellerType, count: number, withChildren?: boolean) => void;
  setTripType: (type: TripType) => void;
  setBudgetResult: (result: BudgetResult) => void;
  setIsGeneratingBudget: (val: boolean) => void;
  setBudgetError: (err: string | null) => void;
  setSelectedHotel: (hotel: SelectedHotel | null) => void;
  setSelectedTransportPrice: (price: number | null) => void;
  togglePlace: (place: SelectedPlace) => void;
  setGeneratedItinerary: (text: string) => void;
  setUserName: (name: string) => void;
  markOnboardingSeen: () => void;
  saveCurrentTrip: () => void;
  resetTripFlow: () => void;
  // Notes / expense tracker
  addNote: (note: NoteItem) => void;
  removeNote: (id: string) => void;
  clearNotes: () => void;
  // Departure / return dates
  setDepartureDate: (date: string | null) => void;
  setReturnDate: (date: string | null) => void;
}

const DEFAULT_BUDGETS: Record<BudgetTier, number> = {
  low: 1500,
  normal: 4500,
  premium: 10000,
  custom: 3000,
};

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      fromCity: 'Delhi',
      fromCityId: 'delhi',
      destination: '',
      destinationId: '',
      destinationLat: null,
      destinationLon: null,
      startDate: null,
      endDate: null,
      days: 3,
      budgetTier: 'normal',
      totalBudgetPerDay: 4500,
      travellerType: 'couple',
      travellers: 2,
      withChildren: false,
      tripType: 'cultural',
      budgetResult: null,
      isGeneratingBudget: false,
      budgetError: null,
      selectedHotel: null,
      selectedTransportPrice: null,
      selectedPlaces: [],
      generatedItinerary: '',
      userName: 'Traveller',
      hasSeenOnboarding: false,
      savedTrips: [],
      notes: [],
      departureDate: null,
      returnDate: null,

      setStep: (step) => set({ currentStep: step }),

      setFromCity: (name, id) => set({ fromCity: name, fromCityId: id }),

      setDestination: (name, id) => {
        set({ destination: name, destinationId: id, destinationLat: null, destinationLon: null });
        // Resolve coordinates in background using static map + OpenCage fallback
        import('../lib/api').then(({ geoAPI }) => {
          geoAPI.getCoords(name).then((coords) => {
            if (coords) set({ destinationLat: coords.lat, destinationLon: coords.lng });
          }).catch(() => {});
        });
      },

      setCoords: (lat, lon) => set({ destinationLat: lat, destinationLon: lon }),

      setDates: (start, end) => {
        const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        set({ startDate: start, endDate: end, days });
      },

      setBudget: (tier, amount) => set({
        budgetTier: tier,
        totalBudgetPerDay: amount || DEFAULT_BUDGETS[tier],
      }),

      setGroup: (type, count, withChildren = false) => set({
        travellerType: type,
        travellers: type === 'solo' ? 1 : count,
        withChildren,
      }),

      setTripType: (type) => set({ tripType: type }),

      setBudgetResult: (result) => set({ budgetResult: result, isGeneratingBudget: false, budgetError: null }),

      setIsGeneratingBudget: (val) => set({ isGeneratingBudget: val }),

      setBudgetError: (err) => set({ budgetError: err, isGeneratingBudget: false }),

      setSelectedHotel: (hotel) => set({ selectedHotel: hotel }),

      setSelectedTransportPrice: (price) => set({ selectedTransportPrice: price }),

      togglePlace: (place) => set((state) => {
        const exists = state.selectedPlaces.find(p => p.id === place.id);
        return {
          selectedPlaces: exists
            ? state.selectedPlaces.filter(p => p.id !== place.id)
            : [...state.selectedPlaces, place],
        };
      }),

      setGeneratedItinerary: (text) => set({ generatedItinerary: text }),

      setUserName: (name) => set({ userName: name }),

      markOnboardingSeen: () => set({ hasSeenOnboarding: true }),

      saveCurrentTrip: async () => {
        const state = get();
        if (!state.budgetResult || !state.destination) return;

        const newTrip = {
          id: Date.now().toString(),
          destination: state.destination,
          fromCity: state.fromCity,
          dates: state.startDate && state.endDate
            ? `${new Date(state.startDate).toLocaleDateString('en-IN')} – ${new Date(state.endDate).toLocaleDateString('en-IN')}`
            : `${state.days} days`,
          days: state.days,
          travellers: state.travellers,
          travellerType: state.travellerType,
          tripType: state.tripType,
          totalBudget: state.totalBudgetPerDay * state.travellers * state.days,
          budgetResult: state.budgetResult,
          createdAt: new Date().toISOString(),
        };

        // Always save locally
        set((s) => ({ savedTrips: [newTrip, ...s.savedTrips].slice(0, 10) }));

        // If authenticated, also persist to Supabase
        try {
          const { useAuthStore } = await import('./authStore');
          const authState = useAuthStore.getState();
          if (authState.user && !authState.isGuest) {
            const { saveTrip, saveBudget } = await import('../lib/db');
            const dbTrip = await saveTrip({
              userId: authState.user.id,
              destination: state.destination,
              fromCity: state.fromCity,
              days: state.days,
              travellers: state.travellers,
              tripType: state.tripType,
              budgetPerDay: state.totalBudgetPerDay,
            });
            if (dbTrip) {
              await saveBudget({
                tripId: dbTrip.id,
                transportPct: state.budgetResult!.transport_pct,
                transportInr: state.budgetResult!.transport_inr,
                hotelPct: state.budgetResult!.hotel_pct,
                hotelInr: state.budgetResult!.hotel_inr,
                foodPct: state.budgetResult!.food_pct,
                foodInr: state.budgetResult!.food_inr,
                localPct: state.budgetResult!.local_pct,
                localInr: state.budgetResult!.local_inr,
                bufferInr: state.budgetResult!.buffer_inr,
                aiReasoning: state.budgetResult!.reasoning || state.budgetResult!.smart_insights?.verdict || '',
              });
            }
          }
        } catch (e) {
          // Supabase save failed silently — local save is already done
          console.warn('Supabase save skipped:', e);
        }
      },


      resetTripFlow: () => set({
        currentStep: 1,
        fromCity: 'Delhi',
        fromCityId: 'delhi',
        destination: '',
        destinationId: '',
        startDate: null,
        endDate: null,
        days: 3,
        budgetTier: 'normal',
        totalBudgetPerDay: 4500,
        travellerType: 'couple',
        travellers: 2,
        withChildren: false,
        tripType: 'cultural',
        budgetResult: null,
        isGeneratingBudget: false,
        budgetError: null,
        selectedHotel: null,
        selectedTransportPrice: null,
        selectedPlaces: [],
        generatedItinerary: '',
        notes: [],
        departureDate: null,
        returnDate: null,
      }),

      // ── Notes / Expense tracker ──────────────────────────────────────────
      addNote: (note) => set((s) => ({ notes: [note, ...s.notes] })),
      removeNote: (id) => set((s) => ({ notes: s.notes.filter(n => n.id !== id) })),
      clearNotes: () => set({ notes: [] }),

      // ── Departure / return dates ─────────────────────────────────────────
      setDepartureDate: (date) => set({ departureDate: date }),
      setReturnDate: (date) => set({ returnDate: date }),
    }),
    {
      name: 'travelguide-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userName: state.userName,
        hasSeenOnboarding: state.hasSeenOnboarding,
        savedTrips: state.savedTrips,
        destination: state.destination,
        destinationId: state.destinationId,
        fromCity: state.fromCity,
        fromCityId: state.fromCityId,
        startDate: state.startDate,
        endDate: state.endDate,
        days: state.days,
        budgetTier: state.budgetTier,
        totalBudgetPerDay: state.totalBudgetPerDay,
        travellerType: state.travellerType,
        travellers: state.travellers,
        tripType: state.tripType,
      }),
    }
  )
);
