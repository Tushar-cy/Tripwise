import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image,
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
import { transportAPI, budgetAPI } from '../lib/api';
import { checkTransportBudget } from '../lib/budgetGuard';
import BudgetStatusCard from '../components/BudgetStatusCard';
import SuggestionBanner from '../components/SuggestionBanner';
import SkeletonCard from '../components/SkeletonCard';

// Mode labels replacing 'cheapest/most comfortable'
const MODE_BADGES: Record<string, { label: string; color: string }> = {
  train: { label: '🚂 Rail', color: '#38BDF8' },
  flight: { label: '✈️ Air', color: '#F5A623' },
  bus: { label: '🚌 Road', color: '#34D399' },
  cab: { label: '🚗 Cab', color: '#C084FC' },
};

const FALLBACK: any = {
  fromCity: 'Delhi',
  trains: [
    { id: 't1', name: 'Shatabdi Express', number: '12015', departure: '06:05', arrival: '10:40', duration: '4h 35m', classes: [{ name: 'CC', price: 755, availability: 'Available' }], type: 'fastest' },
    { id: 't2', name: 'Rajdhani Express', number: '12957', departure: '16:10', arrival: '22:40', duration: '6h 30m', classes: [{ name: '3AC', price: 945, availability: 'Available' }, { name: '2AC', price: 1380, availability: 'RAC' }], type: 'comfortable' },
    { id: 't3', name: 'Jaipur Express', number: '12413', departure: '18:25', arrival: '23:40', duration: '5h 15m', classes: [{ name: 'Sleeper', price: 215, availability: 'Available' }, { name: '3AC', price: 545, availability: 'Available' }], type: 'cheapest' },
  ],
  flights: [
    { id: 'f1', airline: 'IndiGo', flightNo: '6E-2165', departure: '07:30', arrival: '08:45', duration: '1h 15m', stops: 'Non-stop', price: 3850, carbon: '38 kg CO₂' },
    { id: 'f2', airline: 'Air India', flightNo: 'AI-473', departure: '14:20', arrival: '15:40', duration: '1h 20m', stops: 'Non-stop', price: 4200, carbon: '42 kg CO₂' },
  ],
  buses: [{ id: 'b1', operator: 'RSRTC Volvo', type: 'AC Sleeper', departure: '22:00', arrival: '04:30', duration: '6h 30m', price: 650 }],
  cab: { estimatedFare: 4500, distanceKm: 280, duration: '5–6 hours' },
  localTransport: [
    { mode: 'Metro', avgCostPerDay: 80, available: true },
    { mode: 'Auto Rickshaw', avgCostPerDay: 200, available: true },
    { mode: 'City Bus', avgCostPerDay: 50, available: true },
    { mode: 'Rental Bike', avgCostPerDay: 350, available: true },
    { mode: 'Cab (Ola/Uber)', avgCostPerDay: 400, available: true },
    { mode: 'Tuk-Tuk', avgCostPerDay: 250, available: true },
  ],
};

export default function TransportScreen() {
  const insets = useSafeAreaInsets();
  const [activePrice, setActivePrice] = useState(0);
  const [activeName, setActiveName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { 
    destination, fromCity, budgetResult, budgetTier,
    totalBudgetPerDay, days, travellers, tripType, travellerType,
    setBudgetResult, setSelectedTransportPrice 
  } = useTripStore();
  
  const transportBudget = budgetResult?.transport_inr || 0;

  // Remaining budget calculation
  const roundTripTotal = activePrice > 0 ? activePrice * 2 * travellers : 0;
  const remainingBudget = totalBudgetPerDay - roundTripTotal;
  const remainingPerDay = days > 0 ? Math.round(remainingBudget / days) : 0;
  const remainingColor = remainingBudget > totalBudgetPerDay * 0.6
    ? '#22C55E' : remainingBudget > totalBudgetPerDay * 0.3 ? '#F59E0B' : '#EF4444';

  const { data, isLoading } = useQuery({
    queryKey: ['transport', fromCity, destination],
    queryFn: () => transportAPI.get(fromCity || 'delhi', destination || 'jaipur'),
    retry: 0,
  });

  const transport = (data as any) || {
    ...FALLBACK,
    fromCity: fromCity || 'Delhi',
    trains: FALLBACK.trains.map((t: any) => ({ ...t, name: `${destination || 'Destination'} Express` }))
  };

  const handleApplyBudget = async () => {
    if (!activePrice) return;
    setIsUpdating(true);
    try {
      const result = await budgetAPI.generate({
        destination,
        fromCity,
        totalBudget: totalBudgetPerDay,
        days,
        travellers,
        tripType,
        travellerType,
        transportCostOverride: activePrice
      });
      setBudgetResult(result as any);
      setSelectedTransportPrice(activePrice);
      router.back();
    } catch (e) {
      console.warn('Failed to update budget', e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>🚂 Transport to {destination || 'Jaipur'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* ── Sticky Budget Guard ── */}
      <View style={{ paddingHorizontal: Layout.md, paddingTop: 4 }}>
        <BudgetStatusCard
          status={checkTransportBudget(activePrice || 0)}
          category="Transport"
        />
        {/* AI Suggestion Banner */}
        <SuggestionBanner
          context="user_selected_transport"
          selection={{ price: activePrice, name: activeName }}
          triggerKey={activePrice > 0 ? activePrice : undefined}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {isLoading ? (
          <View style={{ padding: Layout.md, gap: Layout.md }}>
            <SkeletonCard height={80} borderRadius={16} dark />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <SkeletonCard height={36} width={80} borderRadius={18} dark />
              <SkeletonCard height={36} width={80} borderRadius={18} dark />
              <SkeletonCard height={36} width={80} borderRadius={18} dark />
            </View>
            <SkeletonCard height={140} borderRadius={16} style={{ marginTop: 10 }} dark />
            <SkeletonCard height={140} borderRadius={16} dark />
            <SkeletonCard height={140} borderRadius={16} dark />
          </View>
        ) : (
          <>
        {/* Route Info */}
            <LinearGradient colors={[Colors.navyLight, Colors.navyCard]} style={styles.routeCard}>
              <View style={styles.routeRow}>
                <View style={styles.routeCity}>
                  <Text style={styles.routeCityName}>{transport.fromCity || fromCity || 'Delhi'}</Text>
                  <Text style={styles.routeCityLabel}>Origin</Text>
                </View>
                <View style={styles.routeArrow}>
                  <Text style={styles.routeArrowText}>→</Text>
                </View>
                <View style={styles.routeCity}>
                  <Text style={styles.routeCityName}>{destination || 'Destination'}</Text>
                  <Text style={styles.routeCityLabel}>Destination</Text>
                </View>
              </View>
              {budgetTier && (
                <View style={{ marginTop: 8, alignSelf: 'flex-start', backgroundColor: Colors.gold + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: Colors.gold + '40' }}>
                  <Text style={{ fontFamily: Typography.sansBold, fontSize: 11, color: Colors.gold }}>
                    {budgetTier === 'low' ? '🎒 Budget Mode — Buses shown' : budgetTier === 'premium' ? '💎 Premium Mode — Flights first' : '🌟 Comfort Mode — Trains recommended'}
                  </Text>
                </View>
              )}
            </LinearGradient>

        {/* Transport Cards */}
        <View style={{ padding: Layout.md, gap: Layout.sm }}>
          {/* ── Trains (hidden in 'low' tier) ── */}
          {budgetTier !== 'low' && (
            <>
              <Text style={styles.modeTitle}>🚂 Trains{budgetTier === 'premium' ? ' (alternative)' : ' — Recommended'}</Text>
              {transport.trains?.map((train: any) => {
                const price = train.classes?.[0]?.price || 0;
                const badge = MODE_BADGES['train'];
                return (
                  <TouchableOpacity
                    key={train.id}
                    style={[styles.card, activeName === train.name && styles.cardSelected]}
                    onPress={() => { setActivePrice(price); setActiveName(train.name); }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={styles.cardTitle}>{train.name}</Text>
                        <Text style={styles.cardSub}>#{train.number}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ backgroundColor: badge.color + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: badge.color + '60' }}>
                          <Text style={{ fontFamily: Typography.sansBold, fontSize: 10, color: badge.color }}>{badge.label}</Text>
                        </View>
                        <View style={styles.timePill}>
                          <Text style={styles.cardTime}>{train.departure} → {train.arrival}</Text>
                          <Text style={styles.cardDuration}>{train.duration}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.classRow}>
                      {train.classes?.map((cls: any) => (
                        <View key={cls.name} style={[styles.classPill, cls.availability === 'Available' ? styles.classPillGreen : styles.classPillOrange]}>
                          <Text style={styles.classText}>{cls.name} · ₹{cls.price}</Text>
                          <Text style={styles.classAvail}>{cls.availability}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* ── Flights (premium first, hidden in 'low' tier) ── */}
          {budgetTier !== 'low' && (
            <>
              <Text style={styles.modeTitle}>✈️ Flights{budgetTier === 'premium' ? ' — Recommended' : ' (upgrade option)'}</Text>
              {transport.flights?.map((flight: any) => {
                const price = flight.price || 0;
                const badge = MODE_BADGES['flight'];
                return (
                  <TouchableOpacity key={flight.id} style={[styles.card, activeName === flight.airline && styles.cardSelected]}
                    onPress={() => { setActivePrice(price); setActiveName(flight.airline); }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={styles.cardTitle}>{flight.airline}</Text>
                        <Text style={styles.cardSub}>{flight.flightNo} · {flight.stops}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ backgroundColor: badge.color + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: badge.color + '60' }}>
                          <Text style={{ fontFamily: Typography.sansBold, fontSize: 10, color: badge.color }}>{badge.label}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.cardPrice}>₹{flight.price.toLocaleString('en-IN')}</Text>
                          <Text style={styles.cardDuration}>{flight.duration}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.cardBottom}>
                      <Text style={styles.carbonText}>🌱 {flight.carbon || 'Standard emissions'}</Text>
                      <Text style={styles.timeText}>
                        {fromCity || 'Origin'} → {destination || 'Destination'} · {flight.departure === 'Multiple' ? 'Multiple times' : flight.departure} to {flight.arrival === 'Various' || flight.arrival === 'Multiple' ? 'Multiple times' : flight.arrival}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* ── Buses (always shown; primary in 'low' tier) ── */}
          <Text style={styles.modeTitle}>🚌 Buses{budgetTier === 'low' ? ' — Recommended' : ''}</Text>
          {transport.buses?.map((bus: any) => {
            const price = bus.price || 0;
            const badge = MODE_BADGES['bus'];
            return (
              <TouchableOpacity key={bus.id} style={[styles.card, activeName === bus.operator && styles.cardSelected]}
                onPress={() => { setActivePrice(price); setActiveName(bus.operator); }}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>{bus.operator}</Text>
                    <Text style={styles.cardSub}>{bus.type} · {bus.duration}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ backgroundColor: badge.color + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: badge.color + '60' }}>
                      <Text style={{ fontFamily: Typography.sansBold, fontSize: 10, color: badge.color }}>{badge.label}</Text>
                    </View>
                    <Text style={styles.cardPrice}>₹{bus.price.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
                <Text style={styles.cardSub}>
                  {fromCity || 'Origin'} → {destination || 'Destination'} · {bus.departure === 'Multiple' || bus.departure === 'Various' ? 'Multiple times' : bus.departure} to {bus.arrival === 'Various' || bus.arrival === 'Multiple' ? 'Multiple times' : bus.arrival}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Cab */}
          {transport.cab && (() => {
            const price = transport.cab.estimatedFare || 0;
            const status = checkTransportBudget(price);
            return (
              <>
                <Text style={styles.modeTitle}>🚕 Private Cab</Text>
                <TouchableOpacity 
                  style={[styles.card, activeName === 'Self-Drive / Cab' && styles.cardSelected]}
                  onPress={() => {
                    setActivePrice(price);
                    setActiveName('Self-Drive / Cab');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cardTitle}>Self-Drive / Cab</Text>
                  <Text style={styles.cardSub}>{transport.cab.distanceKm} km · {transport.cab.duration}</Text>
                  <Text style={styles.cardPrice}>~₹{transport.cab.estimatedFare.toLocaleString('en-IN')}</Text>
                  <View style={styles.budgetFit}>
                    <Text style={[
                      styles.budgetFitText,
                      { color: status.severity === 'ok' ? Colors.success : status.severity === 'tight' ? Colors.warning : Colors.danger },
                    ]}>
                      {status.message}
                    </Text>
                  </View>
                  <View style={styles.deepLinkRow}>
                    <TouchableOpacity style={styles.deepLinkBtn}>
                      <Text style={styles.deepLinkText}>🟡 Ola</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deepLinkBtn}>
                      <Text style={styles.deepLinkText}>⬛ Uber</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </>
            );
          })()}

          {/* Local Transport */}
          <Text style={styles.modeTitle}>🏙️ Getting Around {destination}</Text>
          <View style={styles.localGrid}>
            {transport.localTransport?.map((loc: any) => (
              <View key={loc.mode} style={styles.localItem}>
                <Text style={styles.localMode}>{loc.mode}</Text>
                <Text style={styles.localCost}>₹{loc.avgCostPerDay}/day</Text>
              </View>
            ))}
          </View>
        </View>
        </>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      {activePrice > 0 ? (
        <View style={[styles.floatingBar, { paddingBottom: insets.bottom + 16 }]}>
          {/* Remaining Budget Calculator */}
          <View style={{ backgroundColor: '#0F1A35', borderRadius: 12, padding: 12, marginBottom: 10, gap: 4 }}>
            <Text style={{ fontFamily: Typography.sansBold, fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>🧮 BUDGET BREAKDOWN</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: Typography.sans, fontSize: 12, color: '#CBD5E1' }}>Transport cost (both ways × {travellers} pax)</Text>
              <Text style={{ fontFamily: Typography.sansBold, fontSize: 12, color: '#F87171' }}>₹{roundTripTotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: Typography.sans, fontSize: 12, color: '#CBD5E1' }}>₹{activePrice.toLocaleString('en-IN')} × 2 trips × {travellers} people</Text>
            </View>
            <View style={{ height: 1, backgroundColor: '#1E3A5F', marginVertical: 4 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: Typography.sansBold, fontSize: 13, color: '#E2E8F0' }}>💰 Remaining Budget</Text>
              <Text style={{ fontFamily: Typography.sansBold, fontSize: 13, color: remainingColor }}>₹{remainingBudget.toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: Typography.sans, fontSize: 11, color: '#64748B' }}>📅 Per day remaining</Text>
              <Text style={{ fontFamily: Typography.sansBold, fontSize: 11, color: remainingColor }}>₹{remainingPerDay.toLocaleString('en-IN')}/day</Text>
            </View>
          </View>
          <View style={styles.floatingBarInfo}>
            <Text style={styles.floatingBarTitle}>Selected: {activeName}</Text>
            <Text style={styles.floatingBarCost}>₹{activePrice.toLocaleString('en-IN')} one-way/person</Text>
          </View>
          <TouchableOpacity 
            style={styles.applyBtn} 
            onPress={handleApplyBudget}
            disabled={isUpdating}
          >
            <Text style={styles.applyBtnText}>
              {isUpdating ? 'Updating...' : 'Update Budget →'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.budgetBar, { paddingBottom: insets.bottom + 8 }]}>
          <Text style={styles.budgetBarLabel}>Tap any option to see budget impact ↑</Text>
          <Text style={styles.budgetBarAmount}>₹{transportBudget.toLocaleString('en-IN')} allocated</Text>
        </View>
      )}
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
  routeCard: { margin: Layout.md, borderRadius: Layout.radiusLg, padding: Layout.md },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: Layout.sm },
  routeCity: { flex: 1, alignItems: 'center' },
  routeCityName: { fontFamily: Typography.serif, fontSize: Typography.lg, color: Colors.cream },
  routeCityLabel: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted },
  routeArrow: { paddingHorizontal: Layout.sm },
  routeArrowText: { fontSize: 20 },
  tabs: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8E0',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: '#F5A623' },
  tabText: { fontFamily: Typography.sansBold, fontSize: 13, color: '#9B96A8' },
  tabTextActive: { color: '#F5A623' },
  modeTitle: { fontFamily: Typography.sansExtraBold, fontSize: Typography.sm, color: Colors.creamMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: Layout.sm },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    shadowColor: '#C4A882',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: '#1A1A2E' },
  cardSub: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#5C5C7A', marginTop: 2 },
  cardTime: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: '#1A1A2E', textAlign: 'right' },
  cardDuration: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#9B96A8', textAlign: 'right' },
  cardPrice: { fontFamily: Typography.serif, fontSize: Typography.lg, color: '#F5A623' },
  timePill: { alignItems: 'flex-end' },
  classRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.xs },
  classPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, gap: 2 },
  classPillGreen: { backgroundColor: Colors.successLight, borderWidth: 1, borderColor: Colors.success },
  classPillOrange: { backgroundColor: Colors.warningLight, borderWidth: 1, borderColor: Colors.warning },
  classText: { fontFamily: Typography.sansBold, fontSize: Typography.xs, color: '#1A1A2E' },
  classAvail: { fontFamily: Typography.sans, fontSize: 10, color: '#5C5C7A' },
  budgetFit: { paddingTop: 4, borderTopWidth: 1, borderTopColor: '#EDE8E0' },
  budgetFitText: { fontFamily: Typography.sansBold, fontSize: 13 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  carbonText: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.success },
  timeText: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#9B96A8' },
  deepLinkRow: { flexDirection: 'row', gap: Layout.sm },
  deepLinkBtn: { flex: 1, backgroundColor: '#F4EFE8', borderRadius: 8, padding: Layout.sm, alignItems: 'center', borderWidth: 1, borderColor: '#EDE8E0' },
  deepLinkText: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: '#1A1A2E' },
  localGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.sm },
  localItem: { backgroundColor: '#FFFFFF', borderRadius: Layout.radiusMd, padding: Layout.sm, width: '47%', borderWidth: 1, borderColor: '#EDE8E0' },
  localMode: { fontFamily: Typography.sansBold, fontSize: Typography.xs, color: '#1A1A2E' },
  localCost: { fontFamily: Typography.sansExtraBold, fontSize: Typography.sm, color: Colors.gold, marginTop: 4 },
  budgetBar: { backgroundColor: '#F5A623', padding: Layout.md, alignItems: 'center' },
  budgetBarLabel: { fontFamily: Typography.sansBold, fontSize: Typography.xs, color: '#1A1A2E' },
  budgetBarAmount: { fontFamily: Typography.serif, fontSize: Typography.lg, color: '#1A1A2E' },
  cardSelected: {
    borderColor: '#F5A623',
    borderWidth: 2,
    backgroundColor: '#FFFAED',
    shadowColor: '#F5A623',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A2E',
    padding: Layout.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopLeftRadius: Layout.radiusLg,
    borderTopRightRadius: Layout.radiusLg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  floatingBarInfo: { flex: 1 },
  floatingBarTitle: { color: Colors.cream, fontFamily: Typography.sansBold, fontSize: 14 },
  floatingBarCost: { color: '#F5A623', fontFamily: Typography.sansBold, fontSize: 16, marginTop: 2 },
  applyBtn: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Layout.radiusMd,
  },
  applyBtnText: { color: '#1A1A2E', fontFamily: Typography.sansBold, fontSize: 15 },
});
