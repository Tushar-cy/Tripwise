import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList,
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
import { hotelsAPI } from '../lib/api';
import { checkHotelBudget } from '../lib/budgetGuard';
import BudgetStatusCard from '../components/BudgetStatusCard';
import SuggestionBanner from '../components/SuggestionBanner';
import SkeletonCard from '../components/SkeletonCard';

const TIERS = ['All', 'Budget', 'Mid', 'Premium', 'Luxury'];

const FALLBACK_HOTELS = [
  { id: 'j1', name: 'The Pink Pearl Heritage', stars: 4, rating: 4.5, reviews: 1842, pricePerNight: 3200, tier: 'premium', distance: '1.2 km from City Centre', amenities: ['WiFi', 'Pool', 'AC', 'Breakfast', 'Spa'], images: ['https://images.unsplash.com/photo-1582719478250-c89404bb8a0e?w=600'], taxes: 576, cancellation: 'Free until 24h before', location: 'Near Hawa Mahal', budgetFit: 'within', overBy: 0 },
  { id: 'j2', name: 'Rajputana Haveli Stay', stars: 3, rating: 4.2, reviews: 956, pricePerNight: 1800, tier: 'mid', distance: '2.1 km from City Centre', amenities: ['WiFi', 'AC', 'Breakfast'], images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600'], taxes: 324, cancellation: 'Free until 48h before', location: 'Amber Fort Road', budgetFit: 'within', overBy: 0 },
  { id: 'j3', name: 'Budget Backpackers Inn', stars: 2, rating: 3.8, reviews: 412, pricePerNight: 850, tier: 'budget', distance: '3.5 km from City Centre', amenities: ['WiFi', 'AC'], images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600'], taxes: 153, cancellation: 'Non-refundable', location: 'Near Railway Station', budgetFit: 'within', overBy: 0 },
];

export default function HotelsScreen() {
  const insets = useSafeAreaInsets();
  const { destination, destinationId, budgetResult, days, setSelectedHotel } = useTripStore();
  const [selectedTier, setSelectedTier] = useState('All');
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);
  const [activeHotelObj, setActiveHotelObj] = useState<any>(null);
  const hotelBudget = budgetResult?.hotel_inr || 0;

  const { data, isLoading } = useQuery({
    queryKey: ['hotels', destination],
    queryFn: () => hotelsAPI.search(destination || 'jaipur', hotelBudget / days),
    retry: 0,
  });

  const hotels = (data as any)?.hotels || FALLBACK_HOTELS;
  const filtered = selectedTier === 'All' ? hotels : hotels.filter((h: any) => h.tier === selectedTier.toLowerCase());

  // Budget status for the currently-tapped hotel
  const activeHotel = useMemo(
    () => filtered.find((h: any) => h.id === activeHotelId) || filtered[0],
    [activeHotelId, filtered],
  );
  const budgetStatus = useMemo(
    () => checkHotelBudget(activeHotel?.pricePerNight || 0),
    [activeHotel],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.cream} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>🏨 Hotels in {destination || 'Jaipur'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* ── Sticky Budget Guard ── always above the fold */}
      <View style={styles.guardWrap}>
        <BudgetStatusCard
          status={budgetStatus}
          category="Hotel / Night"
          alternatives={filtered.filter((h: any) => h.id !== activeHotelId)}
          currentPrice={activeHotel?.pricePerNight || 0}
          onSelectAlternative={(alt) => {
            const full = filtered.find((h: any) => h.id === alt.id);
            if (full) {
              setSelectedHotel(full);
              router.push('/hotel-detail');
            }
          }}
        />
        {/* AI Suggestion Banner — slides in after first hotel tap */}
        <SuggestionBanner
          context="user_selected_hotel"
          selection={activeHotelObj || {}}
          triggerKey={activeHotelId || undefined}
        />
      </View>

      {/* Tier Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Layout.md, gap: Layout.sm, paddingVertical: Layout.sm }}
      >
        {TIERS.map((tier) => (
          <TouchableOpacity
            key={tier}
            style={[styles.tierBtn, selectedTier === tier && styles.tierBtnActive]}
            onPress={() => setSelectedTier(tier)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tierText, selectedTier === tier && styles.tierTextActive]}>
              {tier}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={{ padding: Layout.md, gap: Layout.md }}>
          <SkeletonCard height={280} borderRadius={16} dark />
          <SkeletonCard height={280} borderRadius={16} dark />
          <SkeletonCard height={280} borderRadius={16} dark />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: Layout.md, gap: Layout.md, paddingBottom: 120 }}
          renderItem={({ item }: { item: any }) => {
            const status = checkHotelBudget(item.pricePerNight);
            return (
            <TouchableOpacity
              style={[
                styles.hotelCard,
                activeHotelId === item.id && styles.hotelCardActive,
              ]}
              onPress={() => {
                setActiveHotelId(item.id);
                setActiveHotelObj(item);
                setSelectedHotel(item);
                router.push('/hotel-detail');
              }}
              activeOpacity={0.9}
            >
              {/* Image */}
              <Image source={{ uri: item.images?.[0] }} style={styles.hotelImage} />
              <LinearGradient
                colors={['transparent', 'rgba(11,20,38,0.85)']}
                style={styles.imageOverlay}
              />
              <View style={styles.imageStars}>
                {Array.from({ length: item.stars || 3 }).map((_, i) => (
                  <Text key={i} style={{ fontSize: 12 }}>⭐</Text>
                ))}
              </View>

              {/* Budget fit badge — uses real budget guard */}
              {status.severity === 'ok' && (
                <View style={styles.fitBadge}>
                  <Text style={styles.fitText}>✅ In Budget</Text>
                </View>
              )}
              {status.severity === 'tight' && (
                <View style={[styles.fitBadge, { backgroundColor: Colors.warningLight, borderColor: Colors.warning }]}>
                  <Text style={[styles.fitText, { color: Colors.warning }]}>⚠️ Tight</Text>
                </View>
              )}
              {status.severity === 'over' && (
                <View style={[styles.fitBadge, { backgroundColor: Colors.dangerLight, borderColor: Colors.danger }]}>
                  <Text style={[styles.fitText, { color: Colors.danger }]}>❌ Over Budget</Text>
                </View>
              )}

              {/* Content */}
              <View style={styles.hotelContent}>
                <View style={styles.hotelNameRow}>
                  <Text style={styles.hotelName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.ratingPill}>
                    <Text style={styles.ratingText}>⭐ {item.rating}</Text>
                  </View>
                </View>
                <Text style={styles.hotelLocation}>{item.location}</Text>
                <Text style={styles.hotelDistance}>{item.distance}</Text>
                <View style={styles.amenitiesRow}>
                  {item.amenities?.slice(0, 4).map((a: string) => (
                    <View key={a} style={styles.amenity}>
                      <Text style={styles.amenityText}>{a}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.price}>₹{item.pricePerNight.toLocaleString('en-IN')}</Text>
                    <Text style={styles.priceSub}>+ ₹{item.taxes} taxes/night</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.selectBtn}
                    onPress={() => {
                      setActiveHotelId(item.id);
                      setActiveHotelObj(item);
                      setSelectedHotel(item);
                      router.push('/hotel-detail');
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.selectBtnGrad}>
                      <Text style={styles.selectBtnText}>View →</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  nav: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  navTitle: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.cream, flex: 1, textAlign: 'center' },
  guardWrap: { paddingHorizontal: Layout.md, paddingTop: 4 },
  tierBtn: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: Colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBtnActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  tierText: { fontWeight: '600', fontSize: 13, color: '#FFFFFF' },
  tierTextActive: { color: '#000000', fontWeight: 'bold' },
  hotelCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.navyCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 0,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  hotelCardActive: { 
    borderColor: Colors.gold, borderWidth: 2,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 12,
  },
  hotelImage: { width: '100%', height: 180, resizeMode: 'cover' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  imageStars: { position: 'absolute', top: Layout.sm, left: Layout.sm, flexDirection: 'row', gap: 2 },
  fitBadge: { position: 'absolute', top: Layout.sm, right: Layout.sm, backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.success },
  fitText: { fontFamily: Typography.sansBold, fontSize: Typography.xs, color: Colors.success },
  hotelContent: { padding: Layout.md },
  hotelNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  hotelName: { fontFamily: Typography.serif, fontSize: Typography.lg, color: Colors.cream, flex: 1 },
  ratingPill: { backgroundColor: 'rgba(245,166,35,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  ratingText: { fontFamily: Typography.sansBold, fontSize: 12, color: Colors.gold },
  hotelLocation: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted },
  hotelDistance: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamSubtle, marginBottom: Layout.sm },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Layout.sm },
  amenity: { backgroundColor: Colors.navyLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  amenityText: { fontFamily: Typography.sansBold, color: Colors.creamMuted, fontSize: 11 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontFamily: Typography.serif, fontSize: Typography.xxl, color: Colors.cream },
  priceSub: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamSubtle },
  selectBtn: { borderRadius: Layout.radiusMd, overflow: 'hidden' },
  selectBtnGrad: { paddingHorizontal: Layout.md, paddingVertical: Layout.sm },
  selectBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.navy },
});
