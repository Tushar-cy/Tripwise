import React, { useCallback, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, StatusBar, ActivityIndicator, Image,
  Modal, TextInput, Keyboard, KeyboardAvoidingView, Platform,
  ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Layout } from '../../constants/Layout';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import {
  getMyTrips, addSpend, getSpendSummary,
} from '../../lib/db';

// ── Destination → cover photo (Unsplash) ────────────────────────────────────
const DEST_PHOTOS: Record<string, string> = {
  jaipur: 'https://images.unsplash.com/photo-1477587458883-47145ed6979c?w=600',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600',
  manali: 'https://images.unsplash.com/photo-1544015759-62c91fb6d8e3?w=600',
  varanasi: 'https://images.unsplash.com/photo-1561361058-c24e021e0e14?w=600',
  udaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600',
  rishikesh: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?w=600',
  delhi: 'https://images.unsplash.com/photo-1597040663342-45b6af3d91a5?w=600',
  mumbai: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=600',
  bangalore: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600',
  agra: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600',
  ooty: 'https://images.unsplash.com/photo-1580994584651-ad94fb7ddb94?w=600',
  coorg: 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=600',
  ladakh: 'https://images.unsplash.com/photo-1502400549429-8e26e0d896e6?w=600',
  andaman: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
  default: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
};

function getPhoto(destination: string) {
  const key = destination?.toLowerCase().trim().split(' ')[0] || 'default';
  return DEST_PHOTOS[key] || DEST_PHOTOS.default;
}



// ── Spend Log Modal ───────────────────────────────────────────────────────────
const SPEND_CATS = [
  { id: 'transport', icon: '🚂', label: 'Transport' },
  { id: 'hotel', icon: '🏨', label: 'Hotel' },
  { id: 'food', icon: '🍛', label: 'Food' },
  { id: 'local', icon: '🛍️', label: 'Local' },
  { id: 'activity', icon: '🎭', label: 'Activity' },
  { id: 'other', icon: '💸', label: 'Other' },
];

interface SpendModalProps {
  tripId: string;
  tripBudget: number;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function SpendModal({ tripId, tripBudget, visible, onClose, onSaved }: SpendModalProps) {
  const [cat, setCat] = useState('food');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuthStore();

  const handleLog = async () => {
    Keyboard.dismiss();
    const amt = Number(amount);
    if (!amt || amt <= 0) { Alert.alert('Invalid amount', 'Please enter a positive amount.'); return; }
    setIsSaving(true);
    try {
      await addSpend({ tripId, category: cat, amount: amt, description: desc.trim() || cat });
      setAmount(''); setDesc('');
      onSaved();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save spend.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={modalStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={modalStyles.sheet}>
          {/* Handle */}
          <View style={modalStyles.handle} />

          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>Log Actual Spend</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.creamMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Category grid */}
            <Text style={modalStyles.sectionLabel}>CATEGORY</Text>
            <View style={modalStyles.catGrid}>
              {SPEND_CATS.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[modalStyles.catChip, cat === c.id && modalStyles.catChipActive]}
                  onPress={() => setCat(c.id)}
                  activeOpacity={0.8}
                >
                  <Text style={modalStyles.catIcon}>{c.icon}</Text>
                  <Text style={[modalStyles.catLabel, cat === c.id && { color: Colors.navy }]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount */}
            <Text style={modalStyles.sectionLabel}>AMOUNT (₹)</Text>
            <View style={modalStyles.amtWrap}>
              <Text style={modalStyles.rupee}>₹</Text>
              <TextInput
                style={modalStyles.amtInput}
                placeholder="0"
                placeholderTextColor={Colors.creamSubtle}
                value={amount}
                onChangeText={setAmount}
                keyboardType="number-pad"
                returnKeyType="next"
              />
            </View>

            {/* Description */}
            <Text style={modalStyles.sectionLabel}>DESCRIPTION (optional)</Text>
            <TextInput
              style={modalStyles.descInput}
              placeholder="e.g. Auto ride to Amber Fort"
              placeholderTextColor={Colors.creamSubtle}
              value={desc}
              onChangeText={setDesc}
              returnKeyType="done"
              onSubmitEditing={handleLog}
            />

            <TouchableOpacity
              style={[modalStyles.logBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleLog}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={modalStyles.logBtnGrad}>
                {isSaving
                  ? <ActivityIndicator color={Colors.navy} size="small" />
                  : <Text style={modalStyles.logBtnText}>Log Spend →</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: Colors.navyCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Layout.md, paddingBottom: 40, maxHeight: '85%',
    borderTopWidth: 1, borderColor: Colors.navyBorder,
  },
  handle: { width: 36, height: 4, backgroundColor: Colors.navyBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Layout.lg },
  modalTitle: { fontFamily: Typography.serif, fontSize: Typography.xl, color: Colors.cream },
  sectionLabel: { fontFamily: Typography.sansBold, fontSize: 10, color: Colors.creamSubtle, letterSpacing: 1.2, marginBottom: 8, marginTop: 12 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.navyLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.navyBorder,
  },
  catChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  catIcon: { fontSize: 14 },
  catLabel: { fontFamily: Typography.sansSemiBold, fontSize: Typography.xs, color: Colors.cream },
  amtWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.navyLight, borderRadius: 12, padding: Layout.md,
    borderWidth: 1.5, borderColor: Colors.gold, marginBottom: 8,
  },
  rupee: { fontFamily: Typography.sansExtraBold, fontSize: 22, color: Colors.gold },
  amtInput: { flex: 1, fontFamily: Typography.sansExtraBold, fontSize: 26, color: Colors.cream },
  descInput: {
    backgroundColor: Colors.navyLight, borderRadius: 12, padding: Layout.md,
    fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.cream,
    borderWidth: 1, borderColor: Colors.navyBorder, marginBottom: Layout.lg,
  },
  logBtn: { borderRadius: 14, overflow: 'hidden' },
  logBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  logBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.navy },
});

// ── Main TripCard ─────────────────────────────────────────────────────────────
function TripCard({ item, isCloud, onSpendLog, onRefresh }: {
  item: any; isCloud: boolean; onSpendLog: (id: string, budget: number) => void; onRefresh: () => void;
}) {
  const budget = item.trip_budgets?.[0] || item.budgetResult;
  const dest = item.destination || '';
  const fromCity = item.from_city || item.fromCity || '';
  const totalBudget = isCloud
    ? (item.budget_per_day || 0) * (item.travellers || 1) * (item.days || 1)
    : item.totalBudget || 0;
  const tripId = item.id;



  // Spend summary
  const { data: spendSummary } = useQuery({
    queryKey: ['spends', tripId],
    queryFn: () => getSpendSummary(tripId),
    enabled: isCloud && !!tripId,
    staleTime: 30_000,
  });

  const totalSpent = spendSummary?.total || 0;
  const spendPct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;
  const spendColor =
    spendPct > 90 ? Colors.danger :
    spendPct > 70 ? Colors.warning : Colors.success;



  const handleGoToItinerary = () => {
    router.push('/itinerary');
  };


  return (
    <View style={cardStyles.container}>
      {/* Cover photo */}
      <View style={cardStyles.photoWrap}>
        <Image source={{ uri: getPhoto(dest) }} style={cardStyles.photo} />
        <LinearGradient
          colors={['transparent', 'rgba(11,20,38,0.92)']}
          style={cardStyles.photoOverlay}
        />
        {/* Cloud / local badge */}
        <View style={[cardStyles.cloudBadge, isCloud
          ? { backgroundColor: Colors.successLight, borderColor: Colors.success + '50' }
          : { backgroundColor: Colors.warningLight, borderColor: Colors.warning + '50' }
        ]}>
          <Ionicons
            name={isCloud ? 'cloud-done-outline' : 'phone-portrait-outline'}
            size={10}
            color={isCloud ? Colors.success : Colors.warning}
          />
          <Text style={[cardStyles.cloudBadgeText, { color: isCloud ? Colors.success : Colors.warning }]}>
            {isCloud ? 'Synced' : 'Local'}
          </Text>
        </View>

        {/* Destination title over photo */}
        <View style={cardStyles.photoTitleWrap}>
          <Text style={cardStyles.photoDest}>{fromCity} → {dest}</Text>
          <Text style={cardStyles.photoMeta}>
            {item.days || item.days} nights · {item.travellers} traveller{item.travellers > 1 ? 's' : ''} · {item.trip_type || item.tripType || 'cultural'}
          </Text>
        </View>
      </View>

      <View style={cardStyles.body}>
        {/* Budget health bar */}
        <View style={cardStyles.budgetRow}>
          <Text style={cardStyles.budgetLabel}>
            {totalSpent > 0 ? `₹${totalSpent.toLocaleString('en-IN')} spent` : 'Budget'}
          </Text>
          <Text style={[cardStyles.budgetAmt, { color: Colors.gold }]}>
            ₹{totalBudget.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={cardStyles.progressTrack}>
          <View style={[cardStyles.progressFill, { width: `${spendPct}%`, backgroundColor: spendColor }]} />
        </View>
        {totalSpent > 0 && (
          <Text style={cardStyles.budgetNote}>
            ₹{(totalBudget - totalSpent).toLocaleString('en-IN')} remaining
          </Text>
        )}



        {/* Budget split pills */}
        {budget && (
          <View style={cardStyles.splits}>
            {[
              { label: '🚂', pct: budget.transport_pct, inr: budget.transport_inr },
              { label: '🏨', pct: budget.hotel_pct, inr: budget.hotel_inr },
              { label: '🍛', pct: budget.food_pct, inr: budget.food_inr },
              { label: '🛍️', pct: budget.local_pct, inr: budget.local_inr },
            ].map((s) => (
              <View key={s.label} style={cardStyles.splitPill}>
                <Text style={cardStyles.splitIcon}>{s.label}</Text>
                <Text style={cardStyles.splitPct}>{s.pct}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action buttons */}
        <View style={cardStyles.actions}>
          <TouchableOpacity style={cardStyles.actionBtn} onPress={handleGoToItinerary} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={15} color={Colors.gold} />
            <Text style={cardStyles.actionBtnText}>Itinerary</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={cardStyles.actionBtn}
            onPress={() => onSpendLog(tripId, totalBudget)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={15} color={Colors.gold} />
            <Text style={cardStyles.actionBtnText}>Add Spend</Text>
          </TouchableOpacity>

        </View>

        {/* Date */}
        <Text style={cardStyles.date}>
          Planned {new Date(item.created_at || Date.now()).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </Text>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF', borderRadius: 20,
    borderWidth: 1, borderColor: '#EDE8E0', overflow: 'hidden',
    shadowColor: '#C4A882',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  photoWrap: { height: 160, position: 'relative' },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoOverlay: { ...StyleSheet.absoluteFillObject },
  cloudBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1,
  },
  cloudBadgeText: { fontFamily: Typography.sans, fontSize: 10 },
  photoTitleWrap: { position: 'absolute', bottom: 12, left: 14, right: 14 },
  photoDest: { fontFamily: Typography.serif, fontSize: Typography.xl, color: '#fff' },
  photoMeta: { fontFamily: Typography.sans, fontSize: Typography.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  body: { padding: Layout.md, gap: 10 },

  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetLabel: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#9B96A8' },
  budgetAmt: { fontFamily: Typography.sansExtraBold, fontSize: Typography.base, color: '#F5A623' },
  progressTrack: { height: 5, backgroundColor: '#EDE8E0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  budgetNote: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#5C5C7A' },

  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

  splits: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  splitPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F4EFE8', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  splitIcon: { fontSize: 12 },
  splitPct: { fontFamily: Typography.sansBold, fontSize: 11, color: '#1A1A2E' },

  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, backgroundColor: '#F4EFE8', borderRadius: 10, paddingVertical: 10,
    borderWidth: 1, borderColor: '#EDE8E0',
  },
  actionBtnText: { fontFamily: Typography.sansSemiBold, fontSize: Typography.xs, color: Colors.gold },
  date: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#9B96A8', textAlign: 'right' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const { savedTrips } = useTripStore();
  const { user, isGuest, isLocalUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [spendModalTripId, setSpendModalTripId] = useState<string | null>(null);
  const [spendModalBudget, setSpendModalBudget] = useState(0);

  const {
    data: cloudTrips,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['myTrips', user?.id],
    queryFn: () => getMyTrips(user!.id),
    enabled: !!user && !isGuest && !isLocalUser,
    retry: 1,
  });

  const trips = cloudTrips && cloudTrips.length > 0 ? cloudTrips : savedTrips;
  const isCloud = !!cloudTrips && cloudTrips.length > 0;

  const totalTrips = trips.length;
  const completedTrips = isCloud
    ? (cloudTrips || []).filter((t: any) => t.status === 'completed').length
    : 0;

  const handleSpendLog = useCallback((tripId: string, budget: number) => {
    setSpendModalTripId(tripId);
    setSpendModalBudget(budget);
  }, []);

  const handleSpendSaved = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['spends'] });
    queryClient.invalidateQueries({ queryKey: ['myTrips'] });
  }, []);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TripCard
      item={item}
      isCloud={isCloud}
      onSpendLog={handleSpendLog}
      onRefresh={refetch}
    />
  ), [isCloud, handleSpendLog]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFAF6" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>My Trips 🗺️</Text>
            <Text style={styles.subtitle}>
              {isLoading
                ? 'Loading...'
                : `${totalTrips} trip${totalTrips !== 1 ? 's' : ''} planned`
              }
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newTripBtn}
            onPress={() => router.push('/onboarding')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.newTripBtnGrad}>
              <Ionicons name="add" size={18} color={Colors.navy} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Summary pills */}
        {totalTrips > 0 && (
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={styles.pillNum}>{totalTrips}</Text>
              <Text style={styles.pillLabel}>Planned</Text>
            </View>
            {isCloud && (
              <>
                <View style={styles.pillDivider} />
                <View style={styles.pill}>
                  <Text style={[styles.pillNum, { color: Colors.success }]}>{completedTrips}</Text>
                  <Text style={styles.pillLabel}>Completed</Text>
                </View>
                <View style={styles.pillDivider} />
                <View style={styles.pill}>
                  <Text style={[styles.pillNum, { color: Colors.gold }]}>{totalTrips - completedTrips}</Text>
                  <Text style={styles.pillLabel}>Upcoming</Text>
                </View>
              </>
            )}
            {isCloud && (
              <View style={[styles.pill, { marginLeft: 'auto' }]}>
                <Ionicons name="cloud-done-outline" size={12} color={Colors.success} />
                <Text style={[styles.pillLabel, { color: Colors.success }]}>Synced</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>Loading your trips...</Text>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✈️</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyDesc}>Plan your first AI-powered trip with smart budget management</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/onboarding')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.emptyBtnGrad}>
              <Text style={styles.emptyBtnText}>✨ Start Planning →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: Layout.md, gap: Layout.md, paddingBottom: insets.bottom + 80 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.gold}
              colors={[Colors.gold]}
            />
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Spend Modal */}
      <SpendModal
        tripId={spendModalTripId || ''}
        tripBudget={spendModalBudget}
        visible={!!spendModalTripId}
        onClose={() => setSpendModalTripId(null)}
        onSaved={handleSpendSaved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFAF6' },

  header: {
    paddingHorizontal: Layout.lg,
    paddingTop: Layout.sm,
    paddingBottom: Layout.lg,
    backgroundColor: '#FDFAF6',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8E0',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontFamily: Typography.serif, fontSize: Typography.xxl, color: '#1B2B4B' },
  subtitle: { fontFamily: Typography.sans, fontSize: Typography.sm, color: '#5C5C7A', marginTop: 2 },
  newTripBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 4 },
  newTripBtnGrad: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: Layout.md },
  pill: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  pillNum: { fontFamily: Typography.sansExtraBold, fontSize: Typography.base, color: '#1A1A2E' },
  pillLabel: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#5C5C7A' },
  pillDivider: { width: 1, height: 16, backgroundColor: '#EDE8E0' },

  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Layout.xl },
  emptyIcon: { fontSize: 64, marginBottom: Layout.md },
  emptyTitle: { fontFamily: Typography.serif, fontSize: Typography.xl, color: '#1A1A2E', textAlign: 'center' },
  emptyDesc: {
    fontFamily: Typography.sans, fontSize: Typography.sm, color: '#5C5C7A',
    textAlign: 'center', marginTop: Layout.sm, marginBottom: Layout.xl, lineHeight: 22,
  },
  emptyBtn: { borderRadius: Layout.radiusPill, overflow: 'hidden' },
  emptyBtnGrad: { paddingHorizontal: Layout.xl, paddingVertical: Layout.md },
  emptyBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.navy },
});
