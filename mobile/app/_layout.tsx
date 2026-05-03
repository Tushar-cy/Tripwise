import { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../constants/Colors';
import { useAuthStore } from '../store/authStore';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

export default function RootLayout() {
  const { initialize, user, isGuest, isLoading, isLocalUser } = useAuthStore();
  const hasNavigated = useRef(false); // ← prevents re-navigation on HMR

  const [fontsLoaded, fontError] = useFonts({
    DMSerifDisplay_400Regular,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // Initialise auth once on mount
  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    // Only navigate once: wait for both fonts AND auth to settle
    if (hasNavigated.current) return;
    if ((!fontsLoaded && !fontError) || isLoading) return;

    hasNavigated.current = true;
    SplashScreen.hideAsync();

    if (user || isGuest || isLocalUser) {
      router.replace('/(tabs)');
    } else {
      router.replace('/auth' as any);
    }
  }, [fontsLoaded, fontError, isLoading, user, isGuest, isLocalUser]);

  if ((!fontsLoaded && !fontError) || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style="light" />
        <Text style={{ fontSize: 48, marginBottom: 16 }}>✈️</Text>
        <Text style={{ color: Colors.gold, fontFamily: 'System', fontSize: 22, fontWeight: 'bold', letterSpacing: 1 }}>
          TripWise
        </Text>
        <Text style={{ color: Colors.creamMuted, fontFamily: 'System', fontSize: 13, marginTop: 6 }}>
          Intelligent travel planning
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor={Colors.bg} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="auth" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
          <Stack.Screen name="budget-detail" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="transport" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="hotels" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="hotel-detail" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="itinerary" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="weather" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="safety" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="places-discover" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="trip-health" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
