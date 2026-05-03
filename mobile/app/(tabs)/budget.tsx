import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Layout } from '../../constants/Layout';
import { useTripStore } from '../../store/tripStore';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BAR_COLORS = ['#38BDF8', '#F5A623', '#22C55E', '#C084FC'];

function AnimatedBarRow({
  icon, label, pct, inr, color,
}: { icon: string; label: string; pct: number; inr: number; color: string }) {
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: 1,
      duration: 900,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, []);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${Math.min(pct, 100)}%`],
  });

  return (
    <View style={styles.barRow}>
      <Text style={styles.barIcon}>{icon}</Text>
      <View style={styles.barContent}>
        <View style={styles.barTopRow}>
          <Text style={styles.barLabel}>{label}</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Text style={[styles.barPct, { color }]}>{pct}%</Text>
            <Text style={styles.barInr}>₹{inr.toLocaleString('en-IN')}</Text>
          </View>
        </View>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidth, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

export default function BudgetTabScreen() {
  const insets = useSafeAreaInsets();
  const { budgetResult, destination, days, travellers, totalBudgetPerDay } = useTripStore();

  if (!budgetResult) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <LinearGradient colors={['#060D1F', '#0A1628']} style={styles.emptyHeader}>
          <Text style={styles.emptyHeaderTitle}>Budget 💰</Text>
          <Text style={styles.emptyHeaderSub}>AI-powered trip budgeting</Text>
        </LinearGradient>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💡</Text>
          <Text style={styles.emptyTitle}>No budget yet</Text>
          <Text style={styles.emptyDesc}>Complete trip setup to get your AI-powered budget breakdown from Gemini</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/onboarding')} activeOpacity={0.88}>
            <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.emptyBtnGrad}>
              <Ionicons name="flash" size={16} color={Colors.navy} />
              <Text style={styles.emptyBtnText}>Plan a Trip →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Summary Hero Card */}
      <LinearGradient colors={['#060D1F', '#0A1628', '#0F1A35']} style={styles.heroSection}>
        <Text style={styles.heroLabel}>Total Budget</Text>
        <Text style={styles.heroBudget}>₹{(totalBudgetPerDay * days).toLocaleString('en-IN')}</Text>
        <Text style={styles.heroDest}>{destination}</Text>
        <Text style={styles.heroMeta}>{days} days · {travellers} traveller{travellers > 1 ? 's' : ''}</Text>

        {/* AI badge */}
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>🧠 Gemini AI · {budgetResult.source?.includes('gemini') ? 'AI-Enhanced' : 'Smart Estimate'}</Text>
        </View>

        {/* Quick stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatVal}>₹{budgetResult.transport_inr.toLocaleString('en-IN')}</Text>
            <Text style={styles.quickStatLabel}>Transport</Text>
          </View>
          <View style={[styles.quickStat, styles.quickStatMid]}>
            <Text style={styles.quickStatVal}>₹{budgetResult.hotel_inr.toLocaleString('en-IN')}</Text>
            <Text style={styles.quickStatLabel}>Hotels</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatVal}>₹{budgetResult.buffer_inr.toLocaleString('en-IN')}</Text>
            <Text style={styles.quickStatLabel}>Buffer</Text>
          </View>
        </View>
      </LinearGradient>

      {/* View Detail CTA */}
      <TouchableOpacity
        style={styles.viewDetailBtn}
        onPress={() => router.push('/budget-detail')}
        activeOpacity={0.88}
      >
        <LinearGradient colors={[Colors.gold + '20', Colors.gold + '08']} style={styles.viewDetailInner}>
          <Text style={styles.viewDetailText}>View Full AI Breakdown →</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.gold} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Animated budget bars */}
      <View style={styles.barSection}>
        <Text style={styles.barSectionTitle}>Spend Allocation</Text>
        <AnimatedBarRow icon="🚂" label="Transport" pct={budgetResult.transport_pct} inr={budgetResult.transport_inr} color={BAR_COLORS[0]} />
        <AnimatedBarRow icon="🏨" label="Hotel" pct={budgetResult.hotel_pct} inr={budgetResult.hotel_inr} color={BAR_COLORS[1]} />
        <AnimatedBarRow icon="🍛" label="Food & Bev" pct={budgetResult.food_pct} inr={budgetResult.food_inr} color={BAR_COLORS[2]} />
        <AnimatedBarRow icon="🛍️" label="Personal & Local" pct={budgetResult.local_pct} inr={budgetResult.local_inr} color={BAR_COLORS[3]} />

        {/* Buffer row */}
        <View style={[styles.barRow, { opacity: 0.6 }]}>
          <Text style={styles.barIcon}>🔒</Text>
          <View style={styles.barContent}>
            <View style={styles.barTopRow}>
              <Text style={styles.barLabel}>Emergency Buffer</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Text style={[styles.barPct, { color: Colors.creamSubtle }]}>10%</Text>
                <Text style={styles.barInr}>₹{budgetResult.buffer_inr.toLocaleString('en-IN')}</Text>
              </View>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: '10%', backgroundColor: Colors.creamSubtle }]} />
            </View>
          </View>
        </View>
      </View>

      {/* AI Insight */}
      {budgetResult.smart_insights?.verdict && (
        <View style={styles.insightCard}>
          <View style={styles.insightRow}>
            <View style={styles.insightIcon}>
              <Text style={{ fontSize: 18 }}>🧠</Text>
            </View>
            <Text style={styles.insightTitle}>Gemini's Verdict</Text>
          </View>
          <Text style={styles.insightText}>{budgetResult.smart_insights.verdict}</Text>
          {budgetResult.smart_insights.saving_tip && (
            <>
              <View style={[styles.insightRow, { marginTop: 10 }]}>
                <View style={styles.insightIcon}>
                  <Text style={{ fontSize: 16 }}>💡</Text>
                </View>
                <Text style={styles.insightTitle}>Saving Tip</Text>
              </View>
              <Text style={styles.insightText}>{budgetResult.smart_insights.saving_tip}</Text>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // Empty state
  emptyHeader: { padding: 24, paddingTop: 32, paddingBottom: 28 },
  emptyHeaderTitle: { fontFamily: Typography.serif, fontSize: Typography.xxl, color: Colors.cream },
  emptyHeaderSub: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Layout.xl, marginTop: 40 },
  emptyIcon: { fontSize: 64, marginBottom: Layout.md },
  emptyTitle: { fontFamily: Typography.serif, fontSize: 22, color: Colors.cream, textAlign: 'center', letterSpacing: -0.3 },
  emptyDesc: { fontFamily: Typography.sans, fontSize: 14, color: Colors.creamMuted, textAlign: 'center', marginTop: Layout.sm, marginBottom: Layout.xl, lineHeight: 22, maxWidth: 260 },
  emptyBtn: { borderRadius: Layout.radiusPill, overflow: 'hidden' },
  emptyBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Layout.xl, paddingVertical: Layout.md },
  emptyBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.navy },

  // Hero
  heroSection: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24 },
  heroLabel: { fontFamily: Typography.sans, fontSize: 12, color: Colors.creamMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  heroBudget: { fontFamily: Typography.sansExtraBold, fontSize: 42, color: Colors.gold, marginTop: 4 },
  heroDest: { fontFamily: Typography.serif, fontSize: Typography.xl, color: Colors.cream, marginTop: 6 },
  heroMeta: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted, marginTop: 2 },
  aiBadge: { marginTop: 12, backgroundColor: Colors.gold10, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.gold20 },
  aiBadgeText: { fontFamily: Typography.sansBold, fontSize: 11, color: Colors.gold },
  quickStats: { flexDirection: 'row', marginTop: 20, gap: 1 },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  quickStatVal: { fontFamily: Typography.sansExtraBold, fontSize: Typography.base, color: Colors.cream },
  quickStatLabel: { fontFamily: Typography.sans, fontSize: 10, color: Colors.creamMuted, marginTop: 2 },

  // View detail
  viewDetailBtn: { marginHorizontal: 16, marginTop: 16, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.gold20 },
  viewDetailInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 },
  viewDetailText: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.gold },

  // Bars section
  barSection: {
    backgroundColor: Colors.navyCard,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  barSectionTitle: { fontFamily: Typography.sansExtraBold, fontSize: Typography.base, color: Colors.cream, marginBottom: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: Layout.sm },
  barIcon: { fontSize: 20, width: 28 },
  barContent: { flex: 1 },
  barTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  barLabel: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.cream },
  barPct: { fontFamily: Typography.sansBold, fontSize: Typography.sm },
  barInr: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.creamMuted },
  barTrack: { height: 6, backgroundColor: Colors.navyLight, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },

  // Insight
  insightCard: {
    backgroundColor: Colors.navyCard,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  insightRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  insightIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.gold10, alignItems: 'center', justifyContent: 'center' },
  insightTitle: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream },
  insightText: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted, lineHeight: 22, paddingLeft: 42 },
});
