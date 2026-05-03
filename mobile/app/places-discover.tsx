import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Layout } from '../constants/Layout';
import { useTripStore } from '../store/tripStore';
import { placesAPI } from '../lib/api';
import SkeletonCard from '../components/SkeletonCard';

const { width } = Dimensions.get('window');

const TIME_SLOT_CONFIG = {
  morning: { icon: '🌅', color: '#F59E0B', bg: '#2E1A05', label: 'Morning' },
  afternoon: { icon: '☀️', color: '#EF4444', bg: '#2E0808', label: 'Afternoon' },
  evening: { icon: '🌇', color: '#8B5CF6', bg: '#16082E', label: 'Evening' },
};

export default function PlacesDiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { destination, days, selectedPlaces, togglePlace, budgetResult } = useTripStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSlot, setActiveSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPlaces();
  }, [destination]);

  const loadPlaces = async () => {
    setLoading(true);
    try {
      const result = await placesAPI.getNearby(destination || 'jaipur') as any;
      setData(result);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch (err: any) {
      console.error('[Places] Failed:', err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (placeId: string) => selectedPlaces.some(p => p.id === placeId);
  const totalEntryFee = selectedPlaces.reduce((sum, p) => sum + (p.entryFee || 0), 0);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.cream} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Plan Your Days</Text>
            <Text style={styles.headerSub}>{destination} · {days} nights</Text>
          </View>
        </View>
        <View style={{ padding: Layout.md, gap: Layout.md }}>
          <SkeletonCard height={80} borderRadius={16} dark />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <SkeletonCard height={36} width={100} borderRadius={18} dark />
            <SkeletonCard height={36} width={100} borderRadius={18} dark />
            <SkeletonCard height={36} width={100} borderRadius={18} dark />
          </View>
          <SkeletonCard height={140} borderRadius={16} style={{ marginTop: 10 }} dark />
          <SkeletonCard height={140} borderRadius={16} dark />
          <SkeletonCard height={140} borderRadius={16} dark />
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.emptyIcon}>📶</Text>
        <Text style={styles.emptyText}>Couldn't load places. Check your connection and try again.</Text>
        <TouchableOpacity style={[styles.itineraryBtn, { marginTop: 20 }]} onPress={loadPlaces}>
          <Text style={styles.itineraryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const clusters = data?.clusters || {};
  const currentCluster = clusters[activeSlot];
  const restaurants = data?.restaurants || [];
  const mustVisitIds = data?.mustVisit || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.cream} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Plan Your Days</Text>
          <Text style={styles.headerSub}>{destination} · {days} nights</Text>
        </View>
        <TouchableOpacity
          style={styles.itineraryBtn}
          onPress={() => router.push('/itinerary')}
        >
          <Text style={styles.itineraryBtnText}>AI Plan →</Text>
        </TouchableOpacity>
      </View>

      {/* Must visit badges */}
      {mustVisitIds.length > 0 && (
        <View style={styles.mustVisitBanner}>
          <Ionicons name="star" size={14} color={Colors.gold} />
          <Text style={styles.mustVisitText}>
            {mustVisitIds.length} must-visit places · Tap to add to your itinerary
          </Text>
        </View>
      )}

      {/* Time slot tabs */}
      <View style={styles.slotTabs}>
        {(Object.keys(TIME_SLOT_CONFIG) as Array<keyof typeof TIME_SLOT_CONFIG>).map((slot) => {
          const config = TIME_SLOT_CONFIG[slot];
          const clusterData = clusters[slot];
          return (
            <TouchableOpacity
              key={slot}
              style={[styles.slotTab, activeSlot === slot && { borderBottomColor: config.color, borderBottomWidth: 2 }]}
              onPress={() => setActiveSlot(slot)}
              activeOpacity={0.7}
            >
              <Text style={styles.slotIcon}>{config.icon}</Text>
              <Text style={[styles.slotLabel, activeSlot === slot && { color: config.color }]}>
                {config.label}
              </Text>
              <Text style={styles.slotCount}>{clusterData?.places?.length || 0}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false}>
        {/* Time tip */}
        {currentCluster?.tip && (
          <View style={[styles.tipBanner, { backgroundColor: TIME_SLOT_CONFIG[activeSlot].bg }]}>
            <Text style={styles.tipBannerIcon}>{TIME_SLOT_CONFIG[activeSlot].icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tipBannerLabel, { color: TIME_SLOT_CONFIG[activeSlot].color }]}>
                {currentCluster.label}
              </Text>
              <Text style={styles.tipBannerText}>{currentCluster.tip}</Text>
            </View>
          </View>
        )}

        {/* Places */}
        <View style={styles.placesSection}>
          {(currentCluster?.places || []).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🌙</Text>
              <Text style={styles.emptyText}>No specific places for this time slot</Text>
            </View>
          ) : (
            (currentCluster.places as any[]).map((place: any) => {
              const selected = isSelected(place.id);
              const isMust = mustVisitIds.includes(place.id);
              return (
                <TouchableOpacity
                  key={place.id}
                  style={[styles.placeCard, selected && styles.placeCardSelected]}
                  onPress={() => togglePlace({
                    id: place.id, name: place.name, category: place.category,
                    entryFee: place.entryFee, hours: place.hours,
                    duration: place.duration, image: place.image,
                    popularityScore: place.popularityScore, mustVisit: place.mustVisit,
                  })}
                  activeOpacity={0.85}
                >
                  <View style={styles.placeImageContainer}>
                    <Image
                      source={{ uri: place.image }}
                      style={styles.placeImage}
                      resizeMode="cover"
                    />
                    {isMust && (
                      <View style={styles.mustBadge}>
                        <Text style={styles.mustBadgeText}>⭐ Must</Text>
                      </View>
                    )}
                    {selected && (
                      <View style={styles.selectedOverlay}>
                        <Ionicons name="checkmark-circle" size={32} color={Colors.gold} />
                      </View>
                    )}
                  </View>
                  <View style={styles.placeInfo}>
                    <View style={styles.placeTop}>
                      <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                      <View style={styles.popularityBadge}>
                        <Ionicons name="trending-up" size={10} color={Colors.gold} />
                        <Text style={styles.popularityText}>{place.popularityScore}</Text>
                      </View>
                    </View>
                    <Text style={styles.placeCategory}>{place.category}</Text>
                    <View style={styles.placeMeta}>
                      <View style={styles.metaChip}>
                        <Ionicons name="time" size={11} color={Colors.creamMuted} />
                        <Text style={styles.metaChipText}>{place.duration}</Text>
                      </View>
                      <View style={styles.metaChip}>
                        <Ionicons name="ticket" size={11} color={Colors.creamMuted} />
                        <Text style={styles.metaChipText}>
                          {place.entryFee === 0 ? 'Free' : `₹${place.entryFee}`}
                        </Text>
                      </View>
                      <View style={[styles.metaChip, { backgroundColor: place.crowd === 'Very High' ? '#2E0808' : Colors.navyCard }]}>
                        <Text style={styles.metaChipText}>👥 {place.crowd}</Text>
                      </View>
                    </View>
                    {place.tip && (
                      <Text style={styles.placeTip} numberOfLines={2}>💡 {place.tip}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Nearby Restaurants */}
        {restaurants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🍽️ Where to Eat Nearby</Text>
            {restaurants.map((r: any, i: number) => (
              <View key={i} style={styles.restaurantCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.restaurantName}>{r.name}</Text>
                  <Text style={styles.restaurantType}>{r.type}</Text>
                  <Text style={styles.restaurantMustTry}>Must try: {r.mustTry}</Text>
                </View>
                <View style={styles.restaurantRight}>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color={Colors.gold} />
                    <Text style={styles.ratingText}>{r.rating}</Text>
                  </View>
                  <Text style={styles.restaurantCost}>~₹{r.avgCost}/person</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Bottom: selected count + CTA */}
      {selectedPlaces.length > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
          <View>
            <Text style={styles.bottomCount}>{selectedPlaces.length} places selected</Text>
            <Text style={styles.bottomFee}>Entry fees: ₹{totalEntryFee.toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity style={styles.planBtn} onPress={() => router.push('/itinerary')}>
            <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.planBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.planBtnText}>Generate Itinerary →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Layout.sm,
    paddingHorizontal: Layout.md, paddingVertical: Layout.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.navyBorder,
  },
  backBtn: {
    width: 38, height: 38, backgroundColor: Colors.navyLight,
    borderRadius: 19, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.cream },
  headerSub: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted },
  itineraryBtn: {
    backgroundColor: Colors.gold20, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.gold,
  },
  itineraryBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.xs, color: Colors.gold },
  mustVisitBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.gold20, paddingHorizontal: Layout.md, paddingVertical: 8,
  },
  mustVisitText: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.gold },
  slotTabs: {
    flexDirection: 'row', backgroundColor: Colors.navyCard,
    borderBottomWidth: 1, borderBottomColor: Colors.navyBorder,
  },
  slotTab: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 2, borderBottomColor: 'transparent', gap: 2,
  },
  slotIcon: { fontSize: 18 },
  slotLabel: { fontFamily: Typography.sansSemiBold, fontSize: Typography.xs, color: Colors.creamMuted },
  slotCount: {
    fontFamily: Typography.sansBold, fontSize: 10, color: Colors.gold,
    backgroundColor: Colors.gold20, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1,
  },
  tipBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Layout.sm,
    margin: Layout.md, borderRadius: Layout.radiusMd, padding: Layout.md,
  },
  tipBannerIcon: { fontSize: 24 },
  tipBannerLabel: { fontFamily: Typography.sansBold, fontSize: Typography.sm, marginBottom: 2 },
  tipBannerText: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, lineHeight: 18 },
  placesSection: { paddingHorizontal: Layout.md, gap: Layout.md },
  placeCard: {
    backgroundColor: Colors.navyCard, borderRadius: Layout.radiusMd,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.navyBorder,
  },
  placeCardSelected: { borderColor: Colors.gold, borderWidth: 2 },
  placeImageContainer: { position: 'relative', height: 140 },
  placeImage: { width: '100%', height: '100%' },
  mustBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: Colors.gold, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  mustBadgeText: { fontFamily: Typography.sansBold, fontSize: 10, color: Colors.navy },
  selectedOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#00000080', alignItems: 'center', justifyContent: 'center',
  },
  placeInfo: { padding: Layout.md },
  placeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  placeName: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.cream, flex: 1 },
  popularityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.gold20, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  popularityText: { fontFamily: Typography.sansBold, fontSize: 10, color: Colors.gold },
  placeCategory: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, marginBottom: Layout.sm },
  placeMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.navyLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
  },
  metaChipText: { fontFamily: Typography.sans, fontSize: 10, color: Colors.creamMuted },
  placeTip: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamSubtle, marginTop: 8, lineHeight: 17 },
  section: { padding: Layout.md },
  sectionTitle: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream, marginBottom: Layout.sm },
  restaurantCard: {
    flexDirection: 'row', backgroundColor: Colors.navyCard,
    borderRadius: Layout.radiusMd, padding: Layout.md,
    borderWidth: 1, borderColor: Colors.navyBorder, marginBottom: Layout.sm,
    gap: Layout.md,
  },
  restaurantName: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream },
  restaurantType: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, marginBottom: 2 },
  restaurantMustTry: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.gold },
  restaurantRight: { alignItems: 'flex-end', gap: 4 },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.gold20, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3,
  },
  ratingText: { fontFamily: Typography.sansBold, fontSize: Typography.xs, color: Colors.gold },
  restaurantCost: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted },
  emptyState: { alignItems: 'center', padding: Layout.xl },
  emptyIcon: { fontSize: 40, marginBottom: Layout.md },
  emptyText: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.navyCard, paddingHorizontal: Layout.md, paddingTop: Layout.md,
    borderTopWidth: 1, borderTopColor: Colors.navyBorder,
  },
  bottomCount: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream },
  bottomFee: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted },
  planBtn: { borderRadius: Layout.radiusPill, overflow: 'hidden' },
  planBtnGrad: { paddingHorizontal: Layout.lg, paddingVertical: 10 },
  planBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.navy },
  loadingText: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted, marginTop: Layout.md },
});
