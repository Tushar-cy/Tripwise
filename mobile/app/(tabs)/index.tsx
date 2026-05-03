import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Animated, Dimensions, Image, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Layout } from '../../constants/Layout';
import { trendingAPI } from '../../lib/api';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { useGPSLocation } from '../../lib/useGPSLocation';

const { width } = Dimensions.get('window');
const CARD_W = width * 0.72;

const FALLBACK_TRENDING = [
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', trendingRank: 1, avgBudgetPerDay: 2800, temp: 28, condition: 'Sunny',
    image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600' },
  { id: 'goa', name: 'Goa', state: 'Goa', trendingRank: 2, avgBudgetPerDay: 3200, temp: 32, condition: 'Partly Cloudy',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600' },
  { id: 'manali', name: 'Manali', state: 'Himachal Pradesh', trendingRank: 3, avgBudgetPerDay: 2200, temp: 8, condition: 'Snowy',
    image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600' },
  { id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', trendingRank: 4, avgBudgetPerDay: 1800, temp: 26, condition: 'Hazy',
    image: 'https://images.unsplash.com/photo-1591018533945-9a2f97773a41?w=600' },
  { id: 'coorg', name: 'Coorg', state: 'Karnataka', trendingRank: 5, avgBudgetPerDay: 2500, temp: 20, condition: 'Misty',
    image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=600' },
];

function DestinationCard({ item, anim, onPress }: { item: any; anim: any; onPress: () => void }) {
  const FALLBACK_IMGS: Record<string, string> = {
    jaipur: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600',
    goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600',
    manali: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600',
    varanasi: 'https://images.unsplash.com/photo-1591018533945-9a2f97773a41?w=600',
    coorg: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=600',
  };
  const imgUrl = item.image || FALLBACK_IMGS[item.id] || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600';

  return (
    <Animated.View style={{ transform: [{ translateY: anim.y }], opacity: anim.opacity }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={{ width: CARD_W, marginRight: 14 }}>
        <View style={{ height: 260, borderRadius: 20, overflow: 'hidden' }}>
          <Image
            source={{ uri: imgUrl }}
            style={{ flex: 1 }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 }}
          >
            <Text style={{ fontFamily: Typography.serif, fontSize: 22, color: '#FFFFFF' }}>{item.name}</Text>
            <Text style={{ fontFamily: Typography.sans, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{item.state} · ₹{item.avgBudgetPerDay}/day</Text>
            <Text style={{ fontFamily: Typography.sans, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{item.weather?.temp ?? item.temp}°C · {item.weather?.condition ?? item.condition} · See Details →</Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const TRIP_VIBES = [
  { label: 'Cultural', icon: '🏛️', color: '#C084FC', vibe: 'cultural' },
  { label: 'Adventure', icon: '🏔️', color: '#34D399', vibe: 'adventurous' },
  { label: 'Beaches', icon: '🌊', color: '#38BDF8', vibe: 'fun' },
  { label: 'Spiritual', icon: '🕌', color: '#FBBF24', vibe: 'exploring' },
];

// Live safety/travel updates from server, with robust static fallback
const STATIC_UPDATES = [
  { icon: 'information-circle', iconBg: 'rgba(59,130,246,0.15)', iconColor: '#60A5FA', title: 'TripWise AI Active', desc: 'Gemini AI is powering your budget & itinerary generation.' },
  { icon: 'shield-checkmark', iconBg: 'rgba(34,197,94,0.12)', iconColor: '#22C55E', title: 'Budget Guard Live', desc: 'Smart budget validation enabled. Realistic plans only.' },
  { icon: 'globe', iconBg: 'rgba(245,166,35,0.12)', iconColor: Colors.gold, title: 'Global Destinations', desc: 'Plan trips to 1M+ cities worldwide via live geocoding.' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userName, savedTrips, fromCity, setFromCity } = useTripStore();
  const { user } = useAuthStore();
  const gps = useGPSLocation();
  const glowAnim = useRef(new Animated.Value(1)).current;
  const headerY = useRef(new Animated.Value(-20)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const [activeVibe, setActiveVibe] = useState(0);
  const gpsApplied = useRef(false);

  // Auto-set FROM city from GPS when home screen loads
  useEffect(() => {
    if (!gps.loading && gps.city && !gpsApplied.current) {
      gpsApplied.current = true;
      if (!fromCity || fromCity === 'Delhi') {
        setFromCity(gps.city, gps.city.toLowerCase().replace(/\s+/g, ''));
      }
    }
  }, [gps.loading, gps.city]);

  const { data: trendingData } = useQuery({
    queryKey: ['trending'],
    queryFn: () => trendingAPI.get(),
    retry: 1,
  });
  const trending = (trendingData as any)?.destinations || FALLBACK_TRENDING;

  const cardAnims = useRef(Array.from({ length: 15 }, () => ({
    y: new Animated.Value(40),
    opacity: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerY, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.stagger(100, cardAnims.slice(0, Math.min(trending.length, 15)).map(a =>
      Animated.parallel([
        Animated.timing(a.y, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(a.opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    )).start();

    // Search glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.015, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Vibe auto-cycle
    const interval = setInterval(() => setActiveVibe(v => (v + 1) % TRIP_VIBES.length), 2500);
    return () => clearInterval(interval);
  }, []);

  const HOUR = new Date().getHours();
  const greeting = HOUR < 5 ? 'Night Owl 🦉' : HOUR < 12 ? 'Good Morning' : HOUR < 17 ? 'Good Afternoon' : 'Good Evening';
  const displayName = userName || user?.email?.split('@')[0] || 'Traveller';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
        bounces
      >
        {/* ══════════ HERO HEADER ══════════ */}
        <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerY }] }}>
          <LinearGradient
            colors={['#060D1F', '#0A1628', '#0F1A35']}
            style={styles.heroBg}
          >
            {/* Top Bar */}
            <View style={styles.topBar}>
              <View>
                <Text style={styles.logoText}>TripWise ✈️</Text>
                <Text style={styles.greetingText}>{greeting}, {displayName} 👋</Text>
              </View>
              <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/profile')}>
                <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.avatarGrad}>
                  <Text style={styles.avatarLetter}>{displayName.charAt(0).toUpperCase()}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Hero Search CTA */}
            <Animated.View style={{ transform: [{ scale: glowAnim }] }}>
              <TouchableOpacity
                style={styles.searchCTA}
                onPress={() => router.push('/onboarding')}
                activeOpacity={0.92}
              >
                <BlurView intensity={25} tint="dark" style={{ flex: 1 }}>
                  <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']} style={styles.searchInner}>
                    <View style={styles.searchLeft}>
                      <View style={styles.searchIconCircle}>
                        <Ionicons name="search" size={18} color={Colors.gold} />
                      </View>
                      <View>
                        <Text style={styles.searchTitle}>Where to next? 🌍</Text>
                        <Text style={styles.searchSub}>
                          {gps.loading ? 'Detecting your city…' : gps.city ? `From ${gps.city} · Plan with AI` : 'Tap to plan with Gemini AI'}
                        </Text>
                      </View>
                    </View>
                    <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.searchBtn}>
                      <Ionicons name="arrow-forward" size={20} color={Colors.navy} />
                    </LinearGradient>
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>
            </Animated.View>

            {/* Vibe chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 20, paddingBottom: 4 }}>
              <View style={styles.chipRow}>
                {TRIP_VIBES.map((v, i) => (
                  <TouchableOpacity
                    key={v.label}
                    style={[styles.vibeChip, activeVibe === i && { borderColor: v.color, backgroundColor: v.color + '20' }]}
                    onPress={() => {
                      setActiveVibe(i);
                      router.push('/onboarding');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.vibeIcon}>{v.icon}</Text>
                    <Text style={[styles.vibeLabel, activeVibe === i && { color: v.color }]}>{v.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </LinearGradient>
        </Animated.View>

        {/* ══════════ TRENDING DESTINATIONS ══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Trending This Season 🔥</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={trending}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={{ paddingHorizontal: Layout.md }}
            renderItem={({ item, index }: { item: any; index: number }) => {
              const anim = cardAnims[index] || { y: new Animated.Value(0), opacity: new Animated.Value(1) };
              return (
                <DestinationCard
                  item={item}
                  anim={anim}
                  onPress={() => {
                    useTripStore.getState().setDestination(item.name, item.id);
                    router.push('/onboarding');
                  }}
                />
              );
            }}
          />
        </View>

        {/* ══════════ PLAN NOW CTA ══════════ */}
        <View style={styles.ctaSection}>
          <TouchableOpacity onPress={() => router.push('/onboarding')} activeOpacity={0.9}>
            <LinearGradient
              colors={[Colors.gold, '#FFD166', Colors.goldLight]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.ctaCard}
            >
              <View style={styles.ctaLeft}>
                <Text style={styles.ctaEmoji}>🧠</Text>
                <View>
                  <Text style={styles.ctaTitle}>Plan in 30 seconds</Text>
                  <Text style={styles.ctaSub}>Gemini AI reasons, not just calculates</Text>
                </View>
              </View>
              <View style={styles.ctaArrow}>
                <Ionicons name="arrow-forward" size={22} color={Colors.navy} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ══════════ MY TRIPS ══════════ */}
        {savedTrips.length === 0 ? (
          <TouchableOpacity style={styles.emptyBanner} onPress={() => router.push('/onboarding')} activeOpacity={0.88}>
            <Text style={{ fontSize: 32 }}>🗺️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyBannerTitle}>Ready to explore the world?</Text>
              <Text style={styles.emptyBannerSub}>Tell us where you want to go and Gemini AI handles the rest</Text>
            </View>
            <View style={styles.emptyBannerBtn}>
              <Ionicons name="arrow-forward" size={18} color={Colors.navy} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Your Trips 🗺️</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/trips')}>
                <Text style={styles.seeAll}>View all →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Layout.md, gap: 12 }}>
              {savedTrips.slice(0, 5).map((trip) => (
                <TouchableOpacity
                  key={trip.id}
                  style={styles.recentCard}
                  onPress={() => router.push('/budget-detail')}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#0F1A35', '#152240']} style={styles.recentGrad}>
                    <Text style={styles.recentEmoji}>✈️</Text>
                    <Text style={styles.recentDest} numberOfLines={1}>{trip.fromCity} → {trip.destination}</Text>
                    <Text style={styles.recentMeta}>{trip.days}d · {trip.travellers} pax</Text>
                    <Text style={styles.recentBudget}>₹{trip.totalBudget?.toLocaleString('en-IN')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ══════════ LIVE STATUS / UPDATES ══════════ */}
        <View style={[styles.section, { paddingHorizontal: Layout.md }]}>
          <Text style={styles.sectionTitle}>App Status & Info 📡</Text>
          <View style={{ gap: 10, marginTop: 12 }}>
            {STATIC_UPDATES.map((u, i) => (
              <View key={i} style={styles.updateCard}>
                <View style={[styles.updateIcon, { backgroundColor: u.iconBg }]}>
                  <Ionicons name={u.icon as any} size={16} color={u.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.updateTitle}>{u.title}</Text>
                  <Text style={styles.updateDesc}>{u.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ══════════ FOOTER ══════════ */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>✈️ TripWise — Intelligent Travel</Text>
          <Text style={styles.footerSub}>Powered by Gemini AI · Open-Meteo Weather</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // ── Hero ──
  heroBg: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  logoText: { fontFamily: Typography.serif, fontSize: Typography.xl, color: Colors.cream, letterSpacing: 0.5 },
  greetingText: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted, marginTop: 2 },
  avatar: { borderRadius: 24, overflow: 'hidden' },
  avatarGrad: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontFamily: Typography.sansBold, fontSize: Typography.lg, color: Colors.navy },

  searchCTA: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    overflow: 'hidden',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
    backgroundColor: 'rgba(25, 33, 54, 0.4)',
  },
  blurCTA: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
  },
  searchLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  searchIconCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.gold10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.gold20,
  },
  searchTitle: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.cream },
  searchSub: { fontFamily: Typography.sans, fontSize: 11, color: Colors.creamMuted, marginTop: 2 },
  searchBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  chipRow: { flexDirection: 'row', gap: 10, paddingRight: Layout.md, paddingLeft: 2 },
  vibeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  vibeIcon: { fontSize: 14 },
  vibeLabel: { fontFamily: Typography.sansBold, fontSize: 12, color: Colors.creamMuted },

  // ── Sections ──
  section: { marginTop: 28 },
  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Layout.md, marginBottom: 14,
  },
  sectionTitle: { fontFamily: Typography.sansExtraBold, fontSize: 16, color: Colors.cream, letterSpacing: -0.3 },
  seeAll: { fontFamily: Typography.sansBold, fontSize: 13, color: Colors.gold },

  // ── Destination card ──
  destCard: {
    width: CARD_W, height: 230,
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 12,
  },
  destImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  destGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '75%' },
  glassBevel: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
  },
  rankTag: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: Colors.navy + 'CC',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.gold + '50',
  },
  rankNum: { fontFamily: Typography.sansBold, fontSize: 11, color: Colors.gold },
  tempTag: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  tempText: { fontFamily: Typography.sansBold, fontSize: 11, color: Colors.cream },
  destInfo: { position: 'absolute', bottom: 14, left: 14, right: 14 },
  destName: { fontFamily: Typography.serif, fontSize: Typography.xl, color: Colors.cream, letterSpacing: 0.3 },
  destState: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, marginBottom: 8 },
  destPriceRow: { flexDirection: 'row' },
  pricePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.gold + '30',
  },
  priceText: { fontFamily: Typography.sansBold, fontSize: 10, color: Colors.gold },

  // ── CTA ──
  ctaSection: { marginTop: 24, paddingHorizontal: Layout.md },
  ctaCard: {
    borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 10,
  },
  ctaLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ctaEmoji: { fontSize: 36 },
  ctaTitle: { fontFamily: Typography.sansExtraBold, fontSize: Typography.lg, color: Colors.navy },
  ctaSub: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.navy + 'CC', marginTop: 2 },
  ctaArrow: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.navy + '25',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Empty banner ──
  emptyBanner: {
    backgroundColor: Colors.navyCard,
    borderRadius: 16,
    margin: 16,
    marginTop: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.gold20,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyBannerTitle: { fontFamily: Typography.sansBold, color: Colors.cream, fontSize: 15 },
  emptyBannerSub: { fontFamily: Typography.sans, color: Colors.creamMuted, fontSize: 12, marginTop: 3, lineHeight: 18 },
  emptyBannerBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 10, padding: 10,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },

  // ── Recent trips ──
  recentCard: {
    borderRadius: 16, width: 160, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.borderStrong,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  recentGrad: { padding: 14, gap: 4 },
  recentEmoji: { fontSize: 22, marginBottom: 4 },
  recentDest: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream },
  recentMeta: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted },
  recentBudget: { fontFamily: Typography.sansExtraBold, fontSize: Typography.base, color: Colors.gold, marginTop: 4 },

  // ── Updates ──
  updateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyCard,
    padding: 14,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updateIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  updateTitle: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream, marginBottom: 2 },
  updateDesc: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, lineHeight: 16 },

  // ── Footer ──
  footer: { alignItems: 'center', marginTop: 32, marginBottom: 8, gap: 4 },
  footerText: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.creamMuted },
  footerSub: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamSubtle },
});
