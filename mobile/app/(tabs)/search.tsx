import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, FlatList, ActivityIndicator, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Layout } from '../../constants/Layout';
import { useTripStore } from '../../store/tripStore';

interface GeoResult {
  id: number;
  name: string;
  admin1?: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
}

const FEATURED = [
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', country: 'India', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400' },
  { id: 'goa', name: 'Goa', state: 'Goa', country: 'India', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400' },
  { id: 'manali', name: 'Manali', state: 'Himachal Pradesh', country: 'India', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400' },
  { id: 'paris', name: 'Paris', state: 'Île-de-France', country: 'France', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400' },
  { id: 'bali', name: 'Bali', state: 'Bali', country: 'Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400' },
  { id: 'dubai', name: 'Dubai', state: 'Dubai', country: 'UAE', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400' },
];

const VIBES = [
  { label: 'Cultural', icon: '🏛️', color: '#C084FC', target: 'Varanasi' },
  { label: 'Adventure', icon: '🏔️', color: '#34D399', target: 'Manali' },
  { label: 'Beaches', icon: '🌊', color: '#38BDF8', target: 'Goa' },
  { label: 'Spiritual', icon: '🕌', color: '#FBBF24', target: 'Rishikesh' },
  { label: 'Luxury', icon: '💎', color: '#F5A623', target: 'Dubai' },
  { label: 'Backpacking', icon: '🎒', color: '#FB923C', target: 'Kasol' },
];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchDestinations = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=en&format=json`,
        { signal: AbortSignal.timeout(5000) }
      );
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => searchDestinations(query), 350);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [query, searchDestinations]);

  const handleSelect = (name: string, id: string) => {
    useTripStore.getState().setDestination(name, id);
    router.push('/onboarding');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <LinearGradient colors={['#060D1F', '#0A1628', '#0F1A35']} style={styles.header}>
        <Text style={styles.title}>Discover 🌍</Text>
        <Text style={styles.subtitle}>Search any city worldwide</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.gold} />
          <TextInput
            style={styles.input}
            placeholder="Search Paris, Bali, Manali..."
            placeholderTextColor={Colors.creamSubtle}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {isSearching ? (
            <ActivityIndicator size="small" color={Colors.gold} />
          ) : query.length > 0 ? (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
              <Ionicons name="close-circle" size={18} color={Colors.creamMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {query.length >= 2 ? (
          /* ── Search Results ── */
          <View style={{ padding: Layout.md, gap: Layout.sm }}>
            <Text style={styles.sectionLabel}>
              {isSearching ? 'Searching...' : `${results.length} results for "${query}"`}
            </Text>

            {results.map((dest) => (
              <TouchableOpacity
                key={dest.id}
                style={styles.destRow}
                onPress={() => handleSelect(dest.name, String(dest.id))}
                activeOpacity={0.7}
              >
                <View style={styles.destIcon}>
                  <Ionicons name="location" size={20} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.destName}>{dest.name}</Text>
                  <Text style={styles.destState}>
                    {[dest.admin1, dest.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
                <View style={styles.countryBadge}>
                  <Text style={styles.countryCode}>{dest.country_code}</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={Colors.creamSubtle} />
              </TouchableOpacity>
            ))}

            {/* Always show custom search option */}
            {!isSearching && (
              <TouchableOpacity
                style={[styles.destRow, { borderColor: Colors.gold20 }]}
                onPress={() => handleSelect(query.trim(), query.trim().toLowerCase())}
                activeOpacity={0.7}
              >
                <View style={[styles.destIcon, { backgroundColor: Colors.gold10, borderColor: Colors.gold20 }]}>
                  <Ionicons name="globe" size={20} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.destName}>Plan trip to "{query}"</Text>
                  <Text style={styles.destState}>Explore with AI recommendations</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={Colors.gold} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {/* ── Vibe Filters ── */}
            <View style={{ paddingHorizontal: Layout.md, paddingTop: Layout.md }}>
              <Text style={styles.sectionLabel}>Travel Vibes</Text>
              <View style={styles.vibeGrid}>
                {VIBES.map(v => (
                  <TouchableOpacity
                    key={v.label}
                    style={[styles.vibeChip, { borderColor: v.color + '40', backgroundColor: v.color + '12' }]}
                    onPress={() => setQuery(v.target)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.vibeIcon}>{v.icon}</Text>
                    <Text style={[styles.vibeLabel, { color: v.color }]}>{v.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Featured Destinations ── */}
            <View style={{ paddingHorizontal: Layout.md, marginTop: Layout.lg }}>
              <Text style={styles.sectionLabel}>Featured Destinations</Text>
              <View style={styles.featuredGrid}>
                {FEATURED.map((dest) => (
                  <TouchableOpacity
                    key={dest.id}
                    style={styles.featuredCard}
                    onPress={() => handleSelect(dest.name, dest.id)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: dest.image }} style={styles.featuredImage} />
                    <LinearGradient colors={['transparent', 'rgba(6,13,31,0.92)']} style={styles.featuredGrad} />
                    <View style={styles.featuredBevel} />
                    <View style={styles.featuredInfo}>
                      <Text style={styles.featuredName}>{dest.name}</Text>
                      <Text style={styles.featuredState}>{dest.country}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  title: { fontFamily: Typography.serif, fontSize: Typography.xxl, color: Colors.cream },
  subtitle: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted, marginTop: 2, marginBottom: 16 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.navyCard,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: {
    flex: 1, fontFamily: Typography.sans, fontSize: Typography.base, color: Colors.cream,
  },

  sectionLabel: {
    fontFamily: Typography.sansBold, fontSize: 11,
    color: Colors.creamSubtle,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Vibe grid
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vibeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    minWidth: '45%', flex: 1,
  },
  vibeIcon: { fontSize: 18 },
  vibeLabel: { fontFamily: Typography.sansBold, fontSize: Typography.sm },

  // Featured grid
  featuredGrid: { gap: 12 },
  featuredCard: {
    height: 130, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  featuredImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  featuredGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' },
  featuredBevel: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 16,
  },
  featuredInfo: { position: 'absolute', bottom: 12, left: 14 },
  featuredName: { fontFamily: Typography.serif, fontSize: Typography.lg, color: Colors.cream },
  featuredState: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted },

  // Search result row
  destRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.navyCard,
    borderRadius: 14, padding: 14, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  destIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.navyLight,
    borderWidth: 1, borderColor: Colors.border,
  },
  destName: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.cream },
  destState: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, marginTop: 2 },
  countryBadge: {
    backgroundColor: Colors.gold10,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.gold20,
  },
  countryCode: { fontFamily: Typography.sansBold, fontSize: 10, color: Colors.gold },
});
