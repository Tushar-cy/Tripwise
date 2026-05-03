import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Animated, Modal, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Layout } from '../constants/Layout';
import { useTripStore } from '../store/tripStore';
import { useAuthStore } from '../store/authStore';
import { addSpend } from '../lib/db';
import { getTripBudgetSummary } from '../lib/budgetGuard';
import { useQuery } from '@tanstack/react-query';
import { networkAPI } from '../lib/api';
import SkeletonCard from '../components/SkeletonCard';

const SAFFRON = '#FF9933';

// ── Circular Progress Ring ────────────────────────────────────────────────────
function CircleRing({
  score, color, size = 140,
}: { score: number; color: string; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;
  const rotation = useRef(new Animated.Value(0)).current;

  const label =
    score >= 80 ? 'Excellent 🏆' :
    score >= 60 ? 'Good 👍' :
    score >= 40 ? 'Tight ⚠️' : 'Over Budget ❌';

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Ring using Views since SVG needs library — use border trick */}
      <View style={[
        ringStyles.track,
        { width: size, height: size, borderRadius: size / 2, borderWidth: 10, borderColor: Colors.navyBorder },
      ]}>
        {/* Filled arc approximation using a pie-cut overlay */}
        <View style={[
          ringStyles.fill,
          {
            width: size - 4, height: size - 4, borderRadius: (size - 4) / 2,
            borderWidth: 10,
            borderTopColor: score >= 25 ? color : 'transparent',
            borderRightColor: score >= 50 ? color : 'transparent',
            borderBottomColor: score >= 75 ? color : 'transparent',
            borderLeftColor: score >= 99 ? color : 'transparent',
          },
        ]} />
        <View style={ringStyles.center}>
          <Text style={[ringStyles.score, { color }]}>{score}</Text>
          <Text style={ringStyles.scoreLabel}>/ 100</Text>
        </View>
      </View>
      <Text style={[ringStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  track: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  fill: { position: 'absolute' },
  center: { position: 'absolute', alignItems: 'center' },
  score: { fontFamily: Typography.sansExtraBold, fontSize: 32 },
  scoreLabel: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted },
  label: { fontFamily: Typography.sansBold, fontSize: Typography.sm, marginTop: 8 },
});

// ── Category Row ──────────────────────────────────────────────────────────────
function CategoryRow({
  icon, label, budgeted, selected, unit = '₹',
}: { icon: string; label: string; budgeted: number; selected: number | null; unit?: string }) {
  const notSet = selected === null;
  const over = !notSet && selected > budgeted;
  const diff = notSet ? 0 : Math.abs(budgeted - selected);
  const pct = budgeted > 0 && !notSet ? Math.min(100, Math.round((selected / budgeted) * 100)) : 0;
  const barColor = over ? Colors.danger : pct > 80 ? Colors.warning : Colors.success;

  return (
    <View style={catStyles.row}>
      <Text style={catStyles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <View style={catStyles.top}>
          <Text style={catStyles.label}>{label}</Text>
          {notSet ? (
            <Text style={catStyles.notSet}>— Not set</Text>
          ) : (
            <Text style={[catStyles.status, { color: over ? Colors.danger : Colors.success }]}>
              {over ? `⚠️ +₹${diff.toLocaleString('en-IN')}` : `✅ -₹${diff.toLocaleString('en-IN')}`}
            </Text>
          )}
        </View>
        <View style={catStyles.amtRow}>
          <Text style={catStyles.budgeted}>Budget: ₹{budgeted.toLocaleString('en-IN')}</Text>
          {!notSet && (
            <Text style={[catStyles.selected, { color: over ? Colors.danger : Colors.cream }]}>
              Selected: ₹{selected!.toLocaleString('en-IN')}
            </Text>
          )}
        </View>
        {!notSet && (
          <View style={catStyles.barTrack}>
            <View style={[catStyles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
          </View>
        )}
      </View>
    </View>
  );
}

const catStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.navyBorder },
  icon: { fontSize: 22, width: 28, textAlign: 'center', marginTop: 2 },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  label: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream },
  notSet: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamSubtle },
  status: { fontFamily: Typography.sansBold, fontSize: Typography.xs },
  amtRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  budgeted: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted },
  selected: { fontFamily: Typography.sansBold, fontSize: Typography.xs },
  barTrack: { height: 4, backgroundColor: Colors.navyBorder, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
});

// ── Quick Spend Sheet ─────────────────────────────────────────────────────────
const QUICK_AMTS = [50, 100, 200, 500, 1000];
const SPEND_CATS = [
  { id: 'food', icon: '🍛', label: 'Food' },
  { id: 'transport', icon: '🚗', label: 'Auto' },
  { id: 'activity', icon: '🎭', label: 'Entry' },
  { id: 'local', icon: '🛍️', label: 'Shopping' },
  { id: 'other', icon: '💸', label: 'Other' },
];

interface SpendSheetProps {
  visible: boolean;
  tripId: string;
  day: number;
  onClose: () => void;
  onSaved: () => void;
}

function DaySpendSheet({ visible, tripId, day, onClose, onSaved }: SpendSheetProps) {
  const [amt, setAmt] = useState('');
  const [cat, setCat] = useState('food');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleQuick = (v: number) => setAmt(String(v));

  const handleAdd = async () => {
    const amount = Number(amt);
    if (!amount || amount <= 0) { Alert.alert('Invalid', 'Enter a valid amount.'); return; }
    setSaving(true);
    try {
      await addSpend({ tripId, category: cat, amount, description: `Day ${day}: ${note || cat}` });
      setAmt(''); setNote('');
      onSaved();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.handle} />
          <Text style={sheetStyles.title}>Day {day} — Add Spend</Text>

          {/* Quick amounts */}
          <Text style={sheetStyles.sectionLabel}>QUICK AMOUNT</Text>
          <View style={sheetStyles.quickRow}>
            {QUICK_AMTS.map(v => (
              <TouchableOpacity
                key={v}
                style={[sheetStyles.quickBtn, amt === String(v) && sheetStyles.quickBtnActive]}
                onPress={() => handleQuick(v)}
              >
                <Text style={[sheetStyles.quickText, amt === String(v) && { color: Colors.navy }]}>₹{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom amount */}
          <View style={sheetStyles.amtRow}>
            <Text style={sheetStyles.rupee}>₹</Text>
            <TextInput
              style={sheetStyles.amtInput}
              placeholder="Custom"
              placeholderTextColor={Colors.creamSubtle}
              value={amt}
              onChangeText={setAmt}
              keyboardType="number-pad"
            />
          </View>

          {/* Category */}
          <Text style={sheetStyles.sectionLabel}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {SPEND_CATS.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[sheetStyles.catChip, cat === c.id && sheetStyles.catChipActive]}
                  onPress={() => setCat(c.id)}
                >
                  <Text style={sheetStyles.catIcon}>{c.icon}</Text>
                  <Text style={[sheetStyles.catLabel, cat === c.id && { color: Colors.navy }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Note */}
          <TextInput
            style={sheetStyles.noteInput}
            placeholder="Note (optional) e.g. Amber Fort entry"
            placeholderTextColor={Colors.creamSubtle}
            value={note}
            onChangeText={setNote}
          />

          <TouchableOpacity style={sheetStyles.addBtn} onPress={handleAdd} disabled={saving} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={sheetStyles.addBtnGrad}>
              {saving ? <ActivityIndicator color={Colors.navy} /> : <Text style={sheetStyles.addBtnText}>Add Spend →</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  sheet: { backgroundColor: Colors.navyCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Layout.md, paddingBottom: 36, borderTopWidth: 1, borderColor: Colors.navyBorder },
  handle: { width: 36, height: 4, backgroundColor: Colors.navyBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontFamily: Typography.serif, fontSize: Typography.xl, color: Colors.cream, marginBottom: 16 },
  sectionLabel: { fontFamily: Typography.sansBold, fontSize: 10, color: Colors.creamSubtle, letterSpacing: 1, marginBottom: 8 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  quickBtn: { flex: 1, backgroundColor: Colors.navyLight, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.navyBorder },
  quickBtnActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  quickText: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream },
  amtRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.navyLight, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: Colors.gold, marginBottom: 14 },
  rupee: { fontFamily: Typography.sansExtraBold, fontSize: 22, color: Colors.gold, marginRight: 6 },
  amtInput: { flex: 1, fontFamily: Typography.sansExtraBold, fontSize: 22, color: Colors.cream, paddingVertical: 12 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.navyLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: Colors.navyBorder },
  catChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  catIcon: { fontSize: 14 },
  catLabel: { fontFamily: Typography.sansSemiBold, fontSize: Typography.xs, color: Colors.cream },
  noteInput: { backgroundColor: Colors.navyLight, borderRadius: 10, padding: 12, fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.cream, borderWidth: 1, borderColor: Colors.navyBorder, marginBottom: 14 },
  addBtn: { borderRadius: 14, overflow: 'hidden' },
  addBtnGrad: { paddingVertical: 15, alignItems: 'center' },
  addBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.navy },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function TripHealthScreen() {
  const insets = useSafeAreaInsets();
  const store = useTripStore();
  const { user } = useAuthStore();
  const summary = getTripBudgetSummary();

  const {
    destination, days, travellers, totalBudgetPerDay,
    budgetResult, selectedHotel,
  } = store;

  const [spendDay, setSpendDay] = useState<number | null>(null);

  const { data: networkData, isLoading: networkLoading } = useQuery({
    queryKey: ['network', destination],
    queryFn: () => networkAPI.get(destination || ''),
    enabled: !!destination,
  });

  // Categories data
  const hotelBudget = budgetResult?.hotel_inr ?? 0;
  const transportBudget = budgetResult?.transport_inr ?? 0;
  const foodBudget = budgetResult?.food_inr ?? 0;
  const localBudget = budgetResult?.local_inr ?? 0;

  const hotelSelected = selectedHotel ? selectedHotel.pricePerNight * days : null;

  // Health score: percentage of set categories within budget
  const categories = [
    { budgeted: hotelBudget, selected: hotelSelected },
    { budgeted: transportBudget, selected: null },
    { budgeted: foodBudget, selected: null },
    { budgeted: localBudget, selected: null },
  ];
  const setCats = categories.filter(c => c.selected !== null);
  const withinBudget = setCats.filter(c => c.selected! <= c.budgeted).length;
  const healthScore = setCats.length === 0 ? 100 : Math.round((withinBudget / setCats.length) * 100);

  const totalBudget = totalBudgetPerDay * travellers * days;
  const estimatedTotal = (hotelSelected || 0) + (transportBudget * 0.7) + foodBudget + localBudget;
  const underBy = totalBudget - estimatedTotal;

  // Smart alerts
  const alerts: string[] = [];
  if (hotelSelected && hotelSelected > hotelBudget) {
    const over = hotelSelected - hotelBudget;
    alerts.push(`🏨 Hotel is ₹${over.toLocaleString('en-IN')} over budget. Consider a mid-range option to save ₹${Math.round(over * 0.8).toLocaleString('en-IN')}.`);
  }
  if (transportBudget === 0) {
    alerts.push(`🚂 Transport not set. Run the AI budget to get a transport allocation.`);
  }

  // Health score color
  const scoreColor = healthScore >= 80 ? Colors.success : healthScore >= 50 ? Colors.warning : Colors.danger;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.cream} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Trip Health Report</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Layout.md, paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>
        {/* Trip header */}
        <LinearGradient colors={['#162035', '#0B1426']} style={styles.tripHeader}>
          <Text style={styles.tripDest}>📍 {destination || 'Your Trip'}</Text>
          <Text style={styles.tripMeta}>{days} days · {travellers} traveller{travellers > 1 ? 's' : ''} · ₹{totalBudgetPerDay.toLocaleString('en-IN')}/day</Text>
        </LinearGradient>

        {/* Health score ring */}
        <View style={styles.scoreSection}>
          <CircleRing score={healthScore} color={scoreColor} size={156} />
          <Text style={styles.scoreSub}>Based on {setCats.length} of 4 categories set</Text>
        </View>

        {/* Category breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📊 Category Breakdown</Text>
          <CategoryRow icon="🏨" label="Hotel" budgeted={hotelBudget} selected={hotelSelected} />
          <CategoryRow icon="🚂" label="Transport" budgeted={transportBudget} selected={null} />
          <CategoryRow icon="🍛" label="Food" budgeted={foodBudget} selected={null} />
          <View style={{ borderBottomWidth: 0 }}>
            <CategoryRow icon="🛍️" label="Local & Shopping" budgeted={localBudget} selected={null} />
          </View>
        </View>

        {/* Smart alerts */}
        {alerts.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>⚡ Smart Alerts</Text>
            {alerts.map((a, i) => (
              <View key={i} style={styles.alertRow}>
                <Text style={styles.alertText}>{a}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Total projection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>💰 Total Cost Projection</Text>
          <View style={styles.projRow}>
            <Text style={styles.projLabel}>Estimated total</Text>
            <Text style={styles.projAmt}>₹{estimatedTotal.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.projRow}>
            <Text style={styles.projLabel}>Your budget</Text>
            <Text style={[styles.projAmt, { color: Colors.gold }]}>₹{totalBudget.toLocaleString('en-IN')}</Text>
          </View>
          <LinearGradient
            colors={underBy >= 0 ? [Colors.success + '20', Colors.success + '05'] : [Colors.danger + '20', Colors.danger + '05']}
            style={styles.projResult}
          >
            <Text style={[styles.projResultText, { color: underBy >= 0 ? Colors.success : Colors.danger }]}>
              {underBy >= 0
                ? `🎉 You're ₹${underBy.toLocaleString('en-IN')} under budget — great trip ahead!`
                : `⚠️ ₹${Math.abs(underBy).toLocaleString('en-IN')} over budget. Adjust categories.`
              }
            </Text>
          </LinearGradient>
          <Text style={styles.projNote}>
            Estimated total across {days} days for {travellers} {travellers > 1 ? 'people' : 'person'}
          </Text>
        </View>

        {/* Network Health */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📶 Network & Connectivity</Text>
          {networkLoading ? (
            <SkeletonCard height={80} borderRadius={12} dark />
          ) : networkData ? (
            <>
              <View style={styles.networkHeader}>
                <View style={styles.networkBadge}>
                  <Text style={styles.networkBadgeText}>{networkData.overall} Coverage</Text>
                </View>
                <Text style={styles.networkSim}>{networkData.simSuggestion}</Text>
              </View>
              {networkData.tips && networkData.tips.map((tip: string, i: number) => (
                <View key={i} style={styles.networkTip}>
                  <Text style={styles.networkTipText}>{tip}</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.projNote}>Network data unavailable</Text>
          )}
        </View>

        {/* Day-wise spend buttons */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📅 Day-wise Spend Track</Text>
          <Text style={styles.projNote}>Tap any day to log actual spending</Text>
          <View style={styles.daysGrid}>
            {Array.from({ length: days }, (_, i) => i + 1).map(d => (
              <TouchableOpacity
                key={d}
                style={styles.dayBtn}
                onPress={() => setSpendDay(d)}
                activeOpacity={0.8}
              >
                <Text style={styles.dayBtnLabel}>Day {d}</Text>
                <Text style={styles.dayBtnSub}>Tap to log</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Day Spend Modal */}
      <DaySpendSheet
        visible={spendDay !== null}
        tripId={user?.id || 'local'}
        day={spendDay || 1}
        onClose={() => setSpendDay(null)}
        onSaved={() => setSpendDay(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.md, paddingVertical: Layout.sm, borderBottomWidth: 1, borderBottomColor: Colors.navyBorder },
  backBtn: { width: 38, height: 38, backgroundColor: Colors.navyLight, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.cream },

  tripHeader: { borderRadius: 16, padding: Layout.md, marginBottom: Layout.lg, borderWidth: 1, borderColor: Colors.navyBorder },
  tripDest: { fontFamily: Typography.serif, fontSize: Typography.xl, color: Colors.cream },
  tripMeta: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, marginTop: 4 },

  scoreSection: { alignItems: 'center', padding: Layout.xl, gap: 8 },
  scoreSub: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted },

  card: { backgroundColor: Colors.navyCard, borderRadius: 16, padding: Layout.md, borderWidth: 1, borderColor: Colors.navyBorder, marginBottom: Layout.md },
  sectionTitle: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.cream, marginBottom: 12 },

  alertRow: { backgroundColor: Colors.warningLight, borderRadius: 10, padding: 12, marginBottom: 8 },
  alertText: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.warning, lineHeight: 20 },

  projRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.navyBorder },
  projLabel: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted },
  projAmt: { fontFamily: Typography.sansExtraBold, fontSize: Typography.base, color: Colors.cream },
  projResult: { borderRadius: 10, padding: 14, marginTop: 12, marginBottom: 8 },
  projResultText: { fontFamily: Typography.sansBold, fontSize: Typography.sm, lineHeight: 20, textAlign: 'center' },
  projNote: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamSubtle, textAlign: 'center', marginTop: 4 },

  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayBtn: { backgroundColor: Colors.navyLight, borderRadius: 12, padding: 14, alignItems: 'center', minWidth: 80, borderWidth: 1, borderColor: Colors.navyBorder },
  dayBtnLabel: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.gold },
  dayBtnSub: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamSubtle, marginTop: 2 },

  networkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  networkBadge: { backgroundColor: Colors.success + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.success + '50' },
  networkBadgeText: { fontFamily: Typography.sansBold, fontSize: 11, color: Colors.success },
  networkSim: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream },
  networkTip: { backgroundColor: Colors.navyLight, borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: Colors.navyBorder },
  networkTipText: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, lineHeight: 18 },
});
