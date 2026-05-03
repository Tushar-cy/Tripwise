import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Layout } from '../constants/Layout';
import { useTripStore } from '../store/tripStore';
import { weatherAPI } from '../lib/api';
import SkeletonCard from '../components/SkeletonCard';

const FALLBACK_WEATHER = {
  destination: 'Jaipur',
  weather: {
    temp: 28, condition: 'Sunny', humidity: 35, windSpeed: 12,
    uvIndex: 8, aqi: 95, feelsLike: 31,
    hourly: [
      { time: '06:00', icon: '🌅', temp: 22, rain: 0 },
      { time: '09:00', icon: '☀️', temp: 26, rain: 0 },
      { time: '12:00', icon: '🌤', temp: 32, rain: 5 },
      { time: '15:00', icon: '☀️', temp: 34, rain: 0 },
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
    packingSuggestions: [
      'Pack light cotton clothes',
      'Carry sunscreen SPF 50+',
      'Bring a wide-brim hat',
      'Sunglasses are essential',
      'Carry a reusable water bottle',
    ],
    travelAdvisory: ['✅ Weather conditions are favorable for your trip'],
    bestTimeToVisit: 'Morning hours (7–10 AM) are generally best for sightseeing',
  },
  safety: { status: 'safe', note: 'Jaipur is generally safe for tourists. The Pink City is well-patrolled.' },
  networkCoverage: { '4G': 'Excellent', '3G': 'Excellent', '2G': 'Excellent' },
};

function AQIBadge({ aqi }: { aqi: number }) {
  const color = aqi <= 50 ? Colors.success : aqi <= 100 ? Colors.warning : Colors.danger;
  const label = aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : 'Unhealthy';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ fontFamily: Typography.sansBold, fontSize: Typography.xs, color }}> AQI {aqi} — {label}</Text>
    </View>
  );
}

export default function WeatherScreen() {
  const insets = useSafeAreaInsets();
  const { destination, destinationId } = useTripStore();

  const { data, isLoading } = useQuery({
    queryKey: ['weather', destinationId],
    queryFn: () => weatherAPI.get(destinationId || 'jaipur'),
    retry: 0,
  });

  const info = (data as any) || FALLBACK_WEATHER;
  const { weather, safety, networkCoverage } = info;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>🌤 Weather & Safety</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {isLoading ? (
          <View style={{ padding: Layout.md, gap: Layout.md }}>
            <SkeletonCard height={240} borderRadius={24} dark />
            <SkeletonCard height={120} borderRadius={16} dark />
            <SkeletonCard height={300} borderRadius={16} dark />
            <SkeletonCard height={150} borderRadius={16} dark />
          </View>
        ) : (
          <>
            {/* Current Weather Hero */}
            <View style={styles.weatherHero}>
              <Text style={styles.weatherDest}>{destination || 'Jaipur'}</Text>
              <Text style={styles.weatherTemp}>{weather.temp}°C</Text>
              <Text style={styles.weatherCond}>{weather.condition}</Text>
              <Text style={styles.weatherFeels}>Feels like {weather.feelsLike}°C</Text>
              <View style={styles.weatherStatGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>💧 {weather.humidity}%</Text>
                  <Text style={styles.statLabel}>Humidity</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>💨 {weather.windSpeed} km/h</Text>
                  <Text style={styles.statLabel}>Wind</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>☀️ UV {weather.uvIndex}</Text>
                  <Text style={styles.statLabel}>UV Index</Text>
                </View>
              </View>
              <AQIBadge aqi={weather.aqi} />
            </View>

            {/* Travel Advisory & Best Time */}
            {(weather.travelAdvisory || weather.bestTimeToVisit) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Travel Advisory 🧭</Text>
                <View style={styles.packingCard}>
                  {weather.bestTimeToVisit && (
                    <View style={styles.packingItem}>
                      <View style={[styles.packingDot, { backgroundColor: Colors.success }]} />
                      <Text style={[styles.packingText, { fontFamily: Typography.sansBold }]}>{weather.bestTimeToVisit}</Text>
                    </View>
                  )}
                  {weather.travelAdvisory?.map((adv: string, i: number) => (
                    <View key={i} style={styles.packingItem}>
                      <Text style={styles.packingText}>{adv}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Hourly */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Forecast 🕐</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Layout.sm }}>
                {weather.hourly?.map((h: any) => (
                  <View key={h.time} style={styles.hourlyCard}>
                    <Text style={styles.hourlyTime}>{h.time}</Text>
                    <Text style={styles.hourlyIcon}>{h.icon}</Text>
                    <Text style={styles.hourlyTemp}>{h.temp}°</Text>
                    {h.rain > 0 && <Text style={styles.hourlyRain}>💧{h.rain}%</Text>}
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Weekly */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7-Day Forecast 📅</Text>
              <View style={styles.weeklyContainer}>
                {weather.weekly?.map((d: any) => (
                  <View key={d.day} style={styles.weekRow}>
                    <Text style={styles.weekDay}>{d.day}</Text>
                    <Text style={styles.weekIcon}>{d.icon}</Text>
                    <View style={styles.weekTempRow}>
                      <Text style={styles.weekHigh}>{d.high}°</Text>
                      <Text style={styles.weekLow}>{d.low}°</Text>
                    </View>
                    {d.rain > 0 && <Text style={styles.weekRain}>💧{d.rain}%</Text>}
                  </View>
                ))}
              </View>
            </View>

            {/* Safety */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Safety Status 🛡️</Text>
              <View style={[
                styles.safetyCard,
                { borderLeftColor: safety?.status === 'safe' ? Colors.success : safety?.status === 'caution' ? Colors.warning : Colors.danger },
              ]}>
                <View style={styles.safetyHeader}>
                  <Text style={styles.safetyIcon}>
                    {safety?.status === 'safe' ? '✅' : safety?.status === 'caution' ? '⚠️' : '🔴'}
                  </Text>
                  <Text style={[
                    styles.safetyStatus,
                    { color: safety?.status === 'safe' ? Colors.success : safety?.status === 'caution' ? Colors.warning : Colors.danger },
                  ]}>
                    {(safety?.status || 'safe').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.safetyNote}>{safety?.note}</Text>
              </View>
            </View>

            {/* Network */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Network Coverage 📶</Text>
              <View style={styles.networkCard}>
                {Object.entries(networkCoverage || {}).map(([type, coverage]) => (
                  <View key={type} style={styles.networkRow}>
                    <Text style={styles.networkType}>{type}</Text>
                    <View style={[
                      styles.coveragePill,
                      { backgroundColor: String(coverage) === 'Excellent' ? Colors.successLight : Colors.warningLight },
                    ]}>
                      <Text style={[
                        styles.coverageText,
                        { color: String(coverage) === 'Excellent' ? Colors.success : Colors.warning },
                      ]}>
                        {String(coverage)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Packing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎒 Smart Packing List</Text>
              <View style={styles.packingCard}>
                {weather.packingSuggestions?.map((item: string, i: number) => (
                  <View key={i} style={styles.packingItem}>
                    <View style={styles.packingDot} />
                    <Text style={styles.packingText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Done Button */}
            <View style={{ paddingHorizontal: Layout.md }}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)')}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.doneBtn}>
                  <Text style={styles.doneBtnText}>🏠 Back to Home</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFAF6' },
  nav: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  navTitle: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: '#1A1A2E', flex: 1, textAlign: 'center' },

  // Weather hero — sky blue tint
  weatherHero: {
    backgroundColor: '#EFF6FF',
    borderRadius: 24,
    margin: 16,
    padding: 24,
    alignItems: 'center',
    gap: Layout.sm,
    shadowColor: '#93C5FD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  weatherDest: { fontFamily: Typography.serif, fontSize: Typography.lg, color: '#3B82F6' },
  weatherTemp: { fontFamily: Typography.serif, fontSize: 80, color: '#1E40AF', lineHeight: 90 },
  weatherCond: { fontFamily: Typography.sansBold, fontSize: Typography.xl, color: '#1E40AF' },
  weatherFeels: { fontFamily: Typography.sans, fontSize: Typography.sm, color: '#3B82F6' },

  // Stat grid inside hero
  weatherStatGrid: { flexDirection: 'row', gap: 10, marginTop: Layout.sm, width: '100%' },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE8E0',
  },
  statLabel: { color: '#9B96A8', fontFamily: Typography.sans, fontSize: 11, marginTop: 2 },
  statValue: { color: '#1A1A2E', fontFamily: Typography.sansBold, fontSize: Typography.sm },

  // Sections
  section: { paddingHorizontal: Layout.md, marginBottom: Layout.md },
  sectionTitle: { fontFamily: Typography.sansExtraBold, fontSize: Typography.base, color: '#1A1A2E', marginBottom: Layout.sm },

  // Hourly
  hourlyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.radiusMd,
    padding: Layout.sm,
    alignItems: 'center',
    gap: 4,
    minWidth: 60,
    borderWidth: 1,
    borderColor: '#EDE8E0',
  },
  hourlyTime: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#9B96A8' },
  hourlyIcon: { fontSize: 22 },
  hourlyTemp: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: '#1A1A2E' },
  hourlyRain: { fontFamily: Typography.sans, fontSize: 10, color: '#3B82F6' },

  // Weekly
  weeklyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.radiusLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDE8E0',
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.sm,
    paddingHorizontal: Layout.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F4EFE8',
    gap: Layout.md,
  },
  weekDay: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: '#5C5C7A', width: 36 },
  weekIcon: { fontSize: 22, width: 28 },
  weekTempRow: { flex: 1, flexDirection: 'row', gap: Layout.md },
  weekHigh: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: '#1A1A2E' },
  weekLow: { fontFamily: Typography.sans, fontSize: Typography.sm, color: '#9B96A8' },
  weekRain: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#3B82F6' },

  // Safety card
  safetyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.radiusLg,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    borderLeftWidth: 4,
  },
  safetyHeader: { flexDirection: 'row', alignItems: 'center', gap: Layout.sm, marginBottom: 8 },
  safetyIcon: { fontSize: 24 },
  safetyStatus: { fontFamily: Typography.sansExtraBold, fontSize: Typography.md, letterSpacing: 1 },
  safetyNote: { fontFamily: Typography.sans, fontSize: Typography.sm, color: '#5C5C7A', lineHeight: 20 },

  // Network
  networkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.radiusLg,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    gap: Layout.sm,
  },
  networkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  networkType: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: '#1A1A2E' },
  coveragePill: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  coverageText: { fontFamily: Typography.sansBold, fontSize: Typography.xs },

  // Packing
  packingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.radiusLg,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    gap: Layout.sm,
  },
  packingItem: { flexDirection: 'row', alignItems: 'center', gap: Layout.sm },
  packingDot: { width: 6, height: 6, backgroundColor: Colors.gold, borderRadius: 3 },
  packingText: { fontFamily: Typography.sans, fontSize: Typography.sm, color: '#1A1A2E', flex: 1 },

  // Done button
  doneBtn: { borderRadius: Layout.radiusMd, paddingVertical: Layout.md, alignItems: 'center' },
  doneBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.navy },
});
