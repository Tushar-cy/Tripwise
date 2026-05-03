import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Alert, Dimensions, Modal, TextInput, Share, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Layout } from '../constants/Layout';
import { useTripStore } from '../store/tripStore';
import { budgetAPI } from '../lib/api';
import { getTripBudgetSummary } from '../lib/budgetGuard';
import { TripHealthCard } from '../components/BudgetStatusCard';
import SkeletonCard from '../components/SkeletonCard';

const { width: SCREEN_W } = Dimensions.get('window');
const DONUT_SIZE = 200;
const DONUT_STROKE = 26;

const CATEGORIES = [
  { key: 'transport', icon: '🚂', label: 'Transport', pctKey: 'transport_pct', inrKey: 'transport_inr', color: '#F59E0B', nav: '/transport' },
  { key: 'hotel',     icon: '🏨', label: 'Hotel',     pctKey: 'hotel_pct',     inrKey: 'hotel_inr',     color: '#38BDF8', nav: '/hotels' },
  { key: 'food',      icon: '🍛', label: 'Food & Bev', pctKey: 'food_pct',     inrKey: 'food_inr',      color: '#34D399', nav: null },
  { key: 'local',     icon: '🛍️', label: 'Local & Personal', pctKey: 'local_pct', inrKey: 'local_inr', color: '#C084FC', nav: null },
] as const;

// ── Donut Chart (pure RN, no SVG library) ─────────────────────────────────────
// Renders coloured arc segments using the "border trick" with clip paths
function DonutChart({ segments, totalBudget }: {
  segments: { color: string; pct: number; label: string; icon: string; key: string }[];
  totalBudget: number;
}) {
  const animValue = useRef(new Animated.Value(0)).current;
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 900,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, []);

  // Build conic-gradient-like segments as stacked Views using rotation + clip
  // Simpler approach: SVG-like segments using strokeDashoffset on border
  const R = (DONUT_SIZE - DONUT_STROKE) / 2;
  const circumference = 2 * Math.PI * R;

  // Cumulative angles
  let cumulativePct = 0;
  const segmentsData = segments.map((s, i) => {
    const start = cumulativePct;
    cumulativePct += s.pct;
    return { ...s, startPct: start, endPct: cumulativePct, idx: i };
  });

  const active = activeIdx !== null ? segments[activeIdx] : null;

  return (
    <View style={styles.donutWrapper}>
      {/* Segment rings stacked */}
      <View style={styles.donutContainer}>
        {segmentsData.map((seg) => {
          const dashArray = circumference;
          const dashOffset = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [circumference, circumference * (1 - seg.pct / 100)],
          });
          const rotation = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [`${seg.startPct * 3.6 - 90}deg`, `${seg.startPct * 3.6 - 90}deg`],
          });

          return (
            <TouchableOpacity
              key={seg.key}
              style={[StyleSheet.absoluteFillObject, styles.segmentTouchable]}
              activeOpacity={0.8}
              onPress={() => setActiveIdx(activeIdx === seg.idx ? null : seg.idx)}
            >
              {/* We use a border trick: a circle with only 2 borders coloured */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: DONUT_SIZE,
                  height: DONUT_SIZE,
                  borderRadius: DONUT_SIZE / 2,
                  borderWidth: DONUT_STROKE,
                  borderColor: 'transparent',
                  borderTopColor: seg.color,
                  borderRightColor: seg.pct > 25 ? seg.color : 'transparent',
                  borderBottomColor: seg.pct > 50 ? seg.color : 'transparent',
                  borderLeftColor: seg.pct > 75 ? seg.color : 'transparent',
                  transform: [{ rotate: rotation }],
                  opacity: activeIdx === null || activeIdx === seg.idx ? 1 : 0.35,
                }}
              />
            </TouchableOpacity>
          );
        })}

        {/* Inner circle (hole) */}
        <View style={styles.donutHole}>
          {active ? (
            <>
              <Text style={{ fontSize: 26 }}>{active.icon}</Text>
              <Text style={styles.donutCenterLabel}>{active.label}</Text>
              <Text style={styles.donutCenterPct}>{active.pct}%</Text>
            </>
          ) : (
            <>
              <Text style={styles.donutCenterTotal}>₹{(totalBudget / 1000).toFixed(0)}K</Text>
              <Text style={styles.donutCenterSub}>Total Budget</Text>
            </>
          )}
        </View>
      </View>

      {/* Legend dots */}
      <View style={styles.donutLegend}>
        {segments.map((s, i) => (
          <TouchableOpacity
            key={s.key}
            style={styles.legendItem}
            onPress={() => setActiveIdx(activeIdx === i ? null : i)}
          >
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={[styles.legendLabel, activeIdx === i && { color: s.color }]}>
              {s.icon} {s.pct}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Category Row ──────────────────────────────────────────────────────────────
function CategoryRow({ cat, pct, inr, onPress, isSelected }: {
  cat: typeof CATEGORIES[number];
  pct: number; inr: number;
  onPress?: () => void;
  isSelected?: boolean;
}) {
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: pct,
      duration: 700,
      delay: 300,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <TouchableOpacity
      style={styles.catRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      <View style={[styles.catIconBadge, { backgroundColor: cat.color + '20' }]}>
        <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.catLabelRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.catLabel}>{cat.label}</Text>
            {isSelected && <Text style={{ fontSize: 14 }}>✅</Text>}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.catPctPill, { borderColor: cat.color + '60', backgroundColor: cat.color + '15' }]}>
              <Text style={[styles.catPctText, { color: cat.color }]}>{pct}%</Text>
            </View>
            <Text style={styles.catInr}>₹{inr.toLocaleString('en-IN')}</Text>
          </View>
        </View>
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              {
                backgroundColor: cat.color,
                width: barAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
              },
            ]}
          />
        </View>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.creamSubtle} />}
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function BudgetDetailScreen() {
  const insets = useSafeAreaInsets();
  const {
    budgetResult, destination, fromCity, days, travellers, tripType, travellerType,
    totalBudgetPerDay, setBudgetResult, saveCurrentTrip,
    selectedHotel, selectedTransportPrice,
    notes, addNote, removeNote, budgetResult: br,
  } = useTripStore();

  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteAmount, setNoteAmount] = useState('');
  const [noteCategory, setNoteCategory] = useState<'food'|'transport'|'hotel'|'activity'|'other'>('other');
  const [isSaving, setIsSaving] = useState(false);

  const totalNotesExpense = notes.reduce((sum, n) => sum + n.amount, 0);
  const adjustedBudget = totalBudgetPerDay - totalNotesExpense;
  const percentUsed = totalBudgetPerDay > 0 ? Math.round((totalNotesExpense / totalBudgetPerDay) * 100) : 0;
  const trackerColor = percentUsed < 50 ? '#22C55E' : percentUsed < 80 ? '#F59E0B' : '#EF4444';

  const NOTE_CATS: { key: 'food'|'transport'|'hotel'|'activity'|'other'; emoji: string }[] = [
    { key: 'food', emoji: '🍛' }, { key: 'transport', emoji: '🚌' },
    { key: 'hotel', emoji: '🏨' }, { key: 'activity', emoji: '🎥' }, { key: 'other', emoji: '📦' },
  ];

  const handleAddNote = () => {
    const amt = parseFloat(noteAmount);
    if (!noteText.trim() || isNaN(amt)) return;
    addNote({ id: Date.now().toString(), text: noteText.trim(), amount: amt, category: noteCategory, timestamp: Date.now() });
    setNoteText(''); setNoteAmount(''); setNoteCategory('other'); setShowNoteModal(false);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `TripWise Trip: ${fromCity} → ${destination}
📅 ${days} days · ${travellers} traveller(s)
💰 Total Budget: ₹${totalBudgetPerDay?.toLocaleString('en-IN')}
🚀 Transport: ₹${budgetResult?.transport_inr?.toLocaleString('en-IN')}
🏨 Hotel: ₹${budgetResult?.hotel_inr?.toLocaleString('en-IN')}
🍛 Food: ₹${budgetResult?.food_inr?.toLocaleString('en-IN')}
— Generated by TripWise AI`,
      });
    } catch {}
  };

  // Simulated graph data based on budget context
  const graphData = [
    { value: Math.max(10, budgetResult?.transport_pct || 0), color: Colors.gold, label: 'Transport' },
    { value: Math.max(10, budgetResult?.hotel_pct || 0), color: '#3B82F6', label: 'Stay' },
    { value: Math.max(10, budgetResult?.food_pct || 0), color: '#10B981', label: 'Food' },
    { value: Math.max(5, budgetResult?.local_pct || 0), color: '#8B5CF6', label: 'Local' },
  ];
  const health = getTripBudgetSummary();
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);



  const reRunAI = async () => {
    setIsRecalculating(true);
    try {
      const result = await budgetAPI.generate({
        destination, fromCity, totalBudget: totalBudgetPerDay,
        days, travellers, tripType, travellerType,
      }) as any;
      setBudgetResult(result);
    } catch {
      Alert.alert('AI Unavailable', 'Could not reach the AI server. Using existing allocation.');
    }
    setIsRecalculating(false);
  };

  if (!budgetResult || Object.keys(budgetResult).length === 0 || !budgetResult.total_trip_cost) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: Colors.cream, fontFamily: Typography.sans }}>
          No budget data available. Please check your connection and run the trip setup again.
        </Text>
        <TouchableOpacity onPress={() => router.replace('/onboarding')} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.gold, fontFamily: Typography.sansBold }}>← Go to Setup</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isRecalculating) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.cream} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Budget Breakdown</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, padding: Layout.md, gap: Layout.md }}>
          <SkeletonCard height={180} borderRadius={20} dark />
          <SkeletonCard height={220} borderRadius={20} dark />
          <SkeletonCard height={300} borderRadius={20} dark />
        </View>
      </View>
    );
  }

  const donutSegments = CATEGORIES.map(cat => ({
    key: cat.key,
    icon: cat.icon,
    label: cat.label,
    color: cat.color,
    pct: budgetResult[cat.pctKey as keyof typeof budgetResult] as number,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.cream} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Budget Breakdown</Text>
        <TouchableOpacity onPress={() => { saveCurrentTrip(); Alert.alert('Saved!', 'Trip saved to My Trips ✅'); }}>
          <Ionicons name="bookmark-outline" size={24} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* ── Hero Header Card ── */}
        <LinearGradient colors={[Colors.gold, '#FFD166', Colors.goldLight]} style={styles.headerCard}>
          <View style={styles.routeHeader}>
            <Text style={styles.headerFrom}>{fromCity}</Text>
            <Ionicons name="airplane" size={16} color={Colors.navy + 'AA'} />
            <Text style={styles.headerDest}>{destination}</Text>
          </View>
          <Text style={styles.headerBudget}>₹{totalBudgetPerDay.toLocaleString('en-IN')}</Text>
          <Text style={styles.headerMeta}>
            {days} nights · {travellers} traveller{travellers > 1 ? 's' : ''} · {tripType}
          </Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>🧠 TripWise AI · Source: {budgetResult.source}</Text>
          </View>
        </LinearGradient>

        {/* ── Budget Warning Banner ── */}
        {budgetResult.smart_insights?.budget_warning && (
          <View style={[styles.section, { marginBottom: Layout.sm }]}>
            <View style={{ backgroundColor: '#EF444420', borderRadius: Layout.radiusMd, padding: Layout.md, borderWidth: 1, borderColor: '#EF444440', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 20 }}>⚠️</Text>
              <Text style={{ fontFamily: Typography.sansSemiBold, fontSize: Typography.sm, color: '#FCA5A5', flex: 1, lineHeight: 20 }}>
                {budgetResult.smart_insights.budget_warning}
              </Text>
            </View>
          </View>
        )}

        {/* ── Smart Transport Recommendation ── */}
        {budgetResult.recommended_transport && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transport Recommendation</Text>
            <View style={[styles.insightCard, { borderColor: Colors.gold + '40', backgroundColor: Colors.navyCard }]}>
              <View style={styles.insightHeader}>
                <View style={[styles.insightIconBadge, { backgroundColor: Colors.gold + '20' }]}>
                  <Text style={{ fontSize: 20 }}>
                    {budgetResult.recommended_transport.mode === 'flight' ? '✈️' : 
                     budgetResult.recommended_transport.mode === 'train' ? '🚂' : 
                     budgetResult.recommended_transport.mode === 'bus' ? '🚌' : '🚗'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightLabel}>{budgetResult.recommended_transport.name}</Text>
                  <Text style={{ fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted }}>
                    ~{budgetResult.recommended_transport.distanceKm} km distance
                  </Text>
                </View>
              </View>
              <Text style={[styles.insightText, { paddingLeft: 0, marginBottom: 12 }]}>
                {budgetResult.recommended_transport.note}
              </Text>
              <View style={{ backgroundColor: Colors.navyLight, borderRadius: Layout.radiusSm, padding: Layout.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted }}>One-way (per person)</Text>
                  <Text style={{ fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream }}>₹{budgetResult.recommended_transport.oneWayFare.toLocaleString('en-IN')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted }}>Total (Round-trip × {travellers})</Text>
                  <Text style={{ fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.gold }}>₹{budgetResult.recommended_transport.totalFare.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Donut Chart Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allocation Breakdown</Text>
          <View style={styles.donutCard}>
            <DonutChart segments={donutSegments} totalBudget={totalBudgetPerDay} />
          </View>
        </View>

        {/* ── Category Rows ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tap to explore each category</Text>
          <View style={styles.catList}>
            {CATEGORIES.map((cat) => {
              const pct = budgetResult[cat.pctKey as keyof typeof budgetResult] as number;
              const inr = budgetResult[cat.inrKey as keyof typeof budgetResult] as number;
              let isSelected = false;
              if (cat.key === 'hotel' && selectedHotel) isSelected = true;
              if (cat.key === 'transport' && selectedTransportPrice) isSelected = true;

              return (
                <CategoryRow
                  key={cat.key}
                  cat={cat}
                  pct={pct}
                  inr={inr}
                  isSelected={isSelected}
                  onPress={cat.nav ? () => router.push(cat.nav as any) : undefined}
                />
              );
            })}

            {/* Buffer row (locked) */}
            <View style={[styles.catRow, { opacity: 0.6 }]}>
              <View style={[styles.catIconBadge, { backgroundColor: Colors.navyBorder + '40' }]}>
                <Text style={{ fontSize: 18 }}>🔒</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.catLabelRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.catLabel}>Emergency Buffer</Text>
                    <View style={styles.lockedBadge}>
                      <Text style={styles.lockedText}>LOCKED</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.catPctPill, { borderColor: Colors.navyBorder }]}>
                      <Text style={[styles.catPctText, { color: Colors.creamMuted }]}>10%</Text>
                    </View>
                    <Text style={styles.catInr}>₹{budgetResult.buffer_inr.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '10%', backgroundColor: Colors.navyBorder }]} />
                </View>
              </View>
            </View>
          </View>
          <Text style={styles.bufferNote}>
            🔒 10% emergency buffer auto-applied and locked. Cannot be reallocated.
          </Text>
        </View>

        {/* ── Smart Insights ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Smart Insights</Text>
          <View style={{ gap: Layout.sm }}>
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={[styles.insightIconBadge, { backgroundColor: Colors.gold + '20' }]}>
                  <Text style={{ fontSize: 16 }}>🎯</Text>
                </View>
                <Text style={styles.insightLabel}>Verdict</Text>
              </View>
              <Text style={styles.insightText}>{budgetResult.smart_insights?.verdict}</Text>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={[styles.insightIconBadge, { backgroundColor: '#34D39920' }]}>
                  <Text style={{ fontSize: 16 }}>💡</Text>
                </View>
                <Text style={styles.insightLabel}>Money-Saving Hack</Text>
              </View>
              <Text style={styles.insightText}>{budgetResult.smart_insights?.saving_tip}</Text>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={[styles.insightIconBadge, { backgroundColor: '#C084FC20' }]}>
                  <Text style={{ fontSize: 16 }}>✨</Text>
                </View>
                <Text style={styles.insightLabel}>Splurge Recommendation</Text>
              </View>
              <Text style={styles.insightText}>{budgetResult.smart_insights?.splurge_recommendation}</Text>
            </View>
          </View>
        </View>

        {/* ── Total Cost Card & Daily Breakdowns ── */}
        <View style={styles.section}>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Estimated Total Trip Cost</Text>
            <Text style={styles.totalAmount}>₹{totalBudgetPerDay.toLocaleString('en-IN')}</Text>
            <View style={styles.rangeRow}>
              <Text style={styles.rangeText}>
                Range: ₹{Math.round(totalBudgetPerDay * 0.88).toLocaleString('en-IN')} – ₹{Math.round(totalBudgetPerDay * 1.12).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.accuracyNote}>±12%</Text>
            </View>
            
            {(budgetResult.hotel_per_night || budgetResult.food_per_day_per_person) && (
              <View style={{ width: '100%', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', gap: 8 }}>
                {budgetResult.hotel_per_night && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted }}>Estimated Stay Cost</Text>
                    <Text style={{ fontFamily: Typography.sansBold, fontSize: Typography.xs, color: Colors.cream }}>₹{budgetResult.hotel_per_night.toLocaleString('en-IN')} / night per room</Text>
                  </View>
                )}
                {budgetResult.food_per_day_per_person && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted }}>Estimated Food Cost</Text>
                    <Text style={{ fontFamily: Typography.sansBold, fontSize: Typography.xs, color: Colors.cream }}>₹{budgetResult.food_per_day_per_person.toLocaleString('en-IN')} / person per day</Text>
                  </View>
                )}
                {budgetResult.per_day_budget && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted }}>Available to Spend</Text>
                    <Text style={{ fontFamily: Typography.sansBold, fontSize: Typography.xs, color: Colors.gold }}>₹{budgetResult.per_day_budget.toLocaleString('en-IN')} / day</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* ── Trip Health ── */}
        <TripHealthCard
          healthLabel={health.healthLabel}
          healthColor={health.healthColor}
          healthScore={health.healthScore}
          committedBudget={health.committedBudget}
          totalBudget={health.totalBudget}
          remainingForFood={health.remainingForFood}
          remainingForLocal={health.remainingForLocal}
          bufferRemaining={health.bufferRemaining}
          hotelSelected={health.hotelSelected}
        />

        {/* ── Action Buttons ── */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => router.push('/hotels')} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.actionBtnGrad}>
              <Text style={styles.actionTextDark}>🏨 Find Hotels Within Budget →</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => router.push('/transport')} activeOpacity={0.8}>
              <LinearGradient colors={[Colors.navyLight, Colors.navyCard]} style={styles.actionBtnGrad}>
                <Text style={styles.actionIcon}>🚂</Text>
                <Text style={styles.actionText}>Transport</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => router.push('/places-discover')} activeOpacity={0.8}>
              <LinearGradient colors={[Colors.navyLight, Colors.navyCard]} style={styles.actionBtnGrad}>
                <Text style={styles.actionIcon}>🗺️</Text>
                <Text style={styles.actionText}>Discover</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => router.push('/safety')} activeOpacity={0.8}>
              <LinearGradient colors={[Colors.navyLight, Colors.navyCard]} style={styles.actionBtnGrad}>
                <Text style={styles.actionIcon}>🛡️</Text>
                <Text style={styles.actionText}>Safety</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.actionBtnPrimary, { marginTop: Layout.md }]} onPress={() => router.push('/chat')} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.actionBtnGrad}>
              <Text style={styles.actionIcon}>✨</Text>
              <Text style={styles.actionTextDark}>Ask TripWise AI</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { marginTop: Layout.sm }]} onPress={handleShare} activeOpacity={0.8}>
            <LinearGradient colors={[Colors.navyLight, Colors.navyCard]} style={styles.actionBtnGrad}>
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={styles.actionText}>Share Trip Summary</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── 📝 Expense Tracker ── */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>📝 Trip Expense Tracker</Text>

          {/* Progress Bar */}
          <View style={{ backgroundColor: Colors.navyCard, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.navyBorder }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted }}>
                ₹{totalNotesExpense.toLocaleString('en-IN')} spent of ₹{totalBudgetPerDay.toLocaleString('en-IN')}
              </Text>
              <Text style={{ fontFamily: Typography.sansBold, fontSize: Typography.xs, color: trackerColor }}>{percentUsed}%</Text>
            </View>
            <View style={{ height: 8, backgroundColor: Colors.navyLight, borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ height: 8, width: `${Math.min(percentUsed, 100)}%`, backgroundColor: trackerColor, borderRadius: 4 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream }}>
                💰 ₹{adjustedBudget.toLocaleString('en-IN')} remaining
              </Text>
            </View>
          </View>

          {/* Add Note Button */}
          <TouchableOpacity
            onPress={() => setShowNoteModal(true)}
            activeOpacity={0.85}
            style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}
          >
            <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 }}>
              <Ionicons name="add-circle" size={20} color={Colors.navy} />
              <Text style={{ fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.navy }}>+ Add Expense or Note</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Notes List */}
          {notes.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 20, opacity: 0.5 }}>
              <Text style={{ fontSize: 28 }}>📋</Text>
              <Text style={{ fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted, marginTop: 8 }}>No expenses logged yet</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {notes.map((note) => {
                const catEmoji = NOTE_CATS.find(c => c.key === note.category)?.emoji || '📦';
                return (
                  <View key={note.id} style={{ backgroundColor: Colors.navyCard, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: Colors.navyBorder }}>
                    <Text style={{ fontSize: 20 }}>{catEmoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream }}>{note.text}</Text>
                      <Text style={{ fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted }}>
                        {new Date(note.timestamp).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: Typography.sansBold, fontSize: Typography.sm, color: note.amount >= 0 ? '#F87171' : '#22C55E' }}>
                      {note.amount >= 0 ? '-' : '+'}₹{Math.abs(note.amount).toLocaleString('en-IN')}
                    </Text>
                    <TouchableOpacity onPress={() => removeNote(note.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={18} color={Colors.creamSubtle} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* ── Add Note Modal ── */}
      <Modal visible={showNoteModal} transparent animationType="slide" onRequestClose={() => setShowNoteModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowNoteModal(false)} />
          <View style={{ backgroundColor: Colors.navy, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: Colors.navyBorder }}>
            <Text style={{ fontFamily: Typography.sansBold, fontSize: Typography.lg, color: Colors.cream, marginBottom: 16 }}>Add Expense</Text>

            {/* Category Chips */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {NOTE_CATS.map(c => (
                <TouchableOpacity key={c.key} onPress={() => setNoteCategory(c.key)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: noteCategory === c.key ? Colors.gold : Colors.navyCard, borderWidth: 1, borderColor: noteCategory === c.key ? Colors.gold : Colors.navyBorder }}>
                  <Text style={{ fontSize: 18 }}>{c.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Description (e.g. Entry fee, Dinner)"
              placeholderTextColor={Colors.creamMuted}
              style={{ backgroundColor: Colors.navyCard, borderRadius: 12, padding: 14, color: Colors.cream, fontFamily: Typography.sans, fontSize: Typography.sm, borderWidth: 1, borderColor: Colors.navyBorder, marginBottom: 12 }}
            />
            <TextInput
              value={noteAmount}
              onChangeText={setNoteAmount}
              placeholder="Amount (₹) — use negative for savings"
              placeholderTextColor={Colors.creamMuted}
              keyboardType="numeric"
              style={{ backgroundColor: Colors.navyCard, borderRadius: 12, padding: 14, color: Colors.cream, fontFamily: Typography.sans, fontSize: Typography.sm, borderWidth: 1, borderColor: Colors.navyBorder, marginBottom: 16 }}
            />
            <TouchableOpacity onPress={handleAddNote} activeOpacity={0.85} style={{ borderRadius: 12, overflow: 'hidden' }}>
              <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.navy }}>Add to Tracker</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Layout.md, paddingVertical: Layout.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.navyBorder,
  },
  navTitle: { fontFamily: Typography.sansBold, fontSize: Layout.md, color: Colors.cream },

  // Header
  headerCard: { 
    margin: Layout.md, borderRadius: Layout.radiusLg, padding: Layout.lg,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 4,
  },
  routeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  headerFrom: { fontFamily: Typography.serif, fontSize: Typography.xl, color: Colors.navy + 'CC' },
  headerDest: { fontFamily: Typography.serif, fontSize: Typography.xl, color: Colors.navy },
  headerBudget: { fontFamily: Typography.sansExtraBold, fontSize: 36, color: Colors.navy, marginTop: 4 },
  headerMeta: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.navyLight, marginTop: 4, textTransform: 'capitalize' },
  aiBadge: { marginTop: Layout.md, backgroundColor: 'rgba(11,20,38,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' },
  aiBadgeText: { fontFamily: Typography.sans, fontSize: 10, color: Colors.navy },

  // Section
  section: { paddingHorizontal: Layout.md, marginBottom: Layout.md },
  sectionTitle: { fontFamily: Typography.sansExtraBold, fontSize: Typography.base, color: Colors.cream, marginBottom: Layout.md },

  // Donut
  donutCard: {
    backgroundColor: Colors.navyCard, borderRadius: Layout.radiusLg, padding: Layout.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 12,
  },
  donutWrapper: { alignItems: 'center', gap: 20 },
  donutContainer: {
    width: DONUT_SIZE, height: DONUT_SIZE, position: 'relative',
    alignItems: 'center', justifyContent: 'center',
  },
  segmentTouchable: { alignItems: 'center', justifyContent: 'center' },
  donutHole: {
    width: DONUT_SIZE - DONUT_STROKE * 2 - 8,
    height: DONUT_SIZE - DONUT_STROKE * 2 - 8,
    borderRadius: (DONUT_SIZE - DONUT_STROKE * 2 - 8) / 2,
    backgroundColor: Colors.navyCard,
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
  },
  donutCenterTotal: { fontFamily: Typography.sansExtraBold, fontSize: 22, color: Colors.gold },
  donutCenterSub: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted },
  donutCenterLabel: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream, marginTop: 2 },
  donutCenterPct: { fontFamily: Typography.sansExtraBold, fontSize: 20, color: Colors.gold },
  donutLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontFamily: Typography.sansSemiBold, fontSize: Typography.xs, color: Colors.creamMuted },

  // Category rows
  catList: { 
    gap: Layout.sm, backgroundColor: Colors.navyCard, borderRadius: Layout.radiusLg, padding: Layout.md, 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: Layout.sm, paddingVertical: 6 },
  catIconBadge: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catLabel: { fontFamily: Typography.sansSemiBold, fontSize: Typography.sm, color: Colors.cream },
  catPctPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
  catPctText: { fontFamily: Typography.sansBold, fontSize: 11 },
  catInr: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.creamMuted, minWidth: 74, textAlign: 'right' },
  barTrack: { height: 6, backgroundColor: Colors.navyBorder, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  lockedBadge: { backgroundColor: Colors.navyBorder, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  lockedText: { fontFamily: Typography.sansBold, fontSize: 9, color: Colors.creamSubtle, letterSpacing: 1 },
  bufferNote: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamSubtle, textAlign: 'center', marginTop: Layout.md },

  // Smart Insights
  insightCard: {
    backgroundColor: Colors.navyCard, borderRadius: Layout.radiusLg,
    padding: Layout.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  insightIconBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  insightLabel: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream },
  insightText: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted, lineHeight: 22, paddingLeft: 42 },

  // Total
  totalCard: {
    backgroundColor: Colors.navyLight, borderRadius: Layout.radiusLg,
    padding: Layout.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  totalLabel: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted },
  totalAmount: { fontFamily: Typography.sansExtraBold, fontSize: 36, color: Colors.gold, marginTop: 4 },
  rangeRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  rangeText: { fontFamily: Typography.sansSemiBold, fontSize: Typography.xs, color: Colors.creamMuted },
  accuracyNote: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamSubtle },

  // Actions
  actions: { paddingHorizontal: Layout.md, gap: Layout.sm, paddingBottom: Layout.xl },
  actionRow: { flexDirection: 'row', gap: Layout.sm },
  actionBtn: { borderRadius: Layout.radiusMd, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  actionBtnPrimary: { 
    borderRadius: Layout.radiusMd, overflow: 'hidden',
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
  },
  actionBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: Layout.md, paddingHorizontal: Layout.lg },
  actionIcon: { fontSize: 20 },
  actionText: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream },
  actionTextDark: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.navy },
});
