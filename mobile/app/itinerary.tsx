import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated,
  Share, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator,
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
import { placesAPI } from '../lib/api';
import { streamItinerary } from '../lib/api';
import SuggestionBanner from '../components/SuggestionBanner';
import { shareTrip, buildShareText } from '../lib/shareTrip';
import { saveTripOffline } from '../lib/offlineTrip';
import { addSpend } from '../lib/db';
import { useAuthStore } from '../store/authStore';
import SkeletonCard from '../components/SkeletonCard';

const FALLBACK_PLACES = [
  { id: 'p1', name: 'Amber Fort', category: '🏰 Fort', entryFee: 550, hours: '8 AM – 5:30 PM', crowd: 'High', duration: '2–3 hours', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400' },
  { id: 'p2', name: 'Hawa Mahal', category: '🏛️ Palace', entryFee: 200, hours: '9 AM – 5 PM', crowd: 'Very High', duration: '1–1.5 hours', image: 'https://images.unsplash.com/photo-1477587458883-47145ed6979c?w=400' },
  { id: 'p3', name: 'City Palace', category: '🏛️ Palace', entryFee: 700, hours: '9:30 AM – 5 PM', crowd: 'High', duration: '2–3 hours', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400' },
  { id: 'p4', name: 'Jantar Mantar', category: '🔭 Observatory', entryFee: 200, hours: '9 AM – 4:30 PM', crowd: 'Medium', duration: '1 hour', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400' },
];

const AI_STATUS_MSGS = [
  'Analysing 🗺️ your place selections...',
  'Calculating ⏱️ optimal travel routes...',
  'Mapping 🍽️ meal slots near your locations...',
  '🧠 Building your personalised plan...',
];

export default function ItineraryScreen() {
  const insets = useSafeAreaInsets();
  const {
    destination, destinationId, days, tripType, travellerType,
    totalBudgetPerDay, selectedPlaces, togglePlace,
    generatedItinerary, setGeneratedItinerary,
  } = useTripStore();

  const [mode, setMode] = useState<'select' | 'generating' | 'view'>('select');
  const [statusMsg, setStatusMsg] = useState(AI_STATUS_MSGS[0]);
  const [streamText, setStreamText] = useState('');
  const [spendDay, setSpendDay] = useState<number | null>(null);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const brainAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['places', destinationId],
    queryFn: () => placesAPI.get(destinationId || 'jaipur'),
    retry: 0,
  });
  const places = (data as any)?.places || FALLBACK_PLACES;

  useEffect(() => {
    if (generatedItinerary) {
      setStreamText(generatedItinerary);
      setMode('view');
    }
  }, []);

  const handleGenerate = async () => {
    if (selectedPlaces.length === 0) {
      // Auto-select first 4 places
      places.slice(0, 4).forEach((p: any) => togglePlace(p));
    }
    setMode('generating');
    setStreamText('');

    Animated.loop(
      Animated.sequence([
        Animated.timing(brainAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(brainAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    let statusIdx = 0;
    const statusInterval = setInterval(() => {
      statusIdx = (statusIdx + 1) % AI_STATUS_MSGS.length;
      setStatusMsg(AI_STATUS_MSGS[statusIdx]);
    }, 2500);

    try {
      await streamItinerary(
        {
          destination,
          places: selectedPlaces.length > 0 ? selectedPlaces : places.slice(0, 4),
          days,
          tripType,
          travellerType,
          budgetPerDay: totalBudgetPerDay,
        },
        (chunk) => {
          setStreamText(prev => {
            const next = prev + chunk;
            return next;
          });
        },
        (status) => setStatusMsg(status),
        (fullText) => {
          clearInterval(statusInterval);
          setGeneratedItinerary(fullText);
          setMode('view');
        }
      );
    } catch (err) {
      clearInterval(statusInterval);
      // Fallback static itinerary
      const staticText = generateQuickItinerary(destination, selectedPlaces.length > 0 ? selectedPlaces : places.slice(0, 4), days);
      setStreamText(staticText);
      setGeneratedItinerary(staticText);
      setMode('view');
    }
  };

  if (mode === 'generating') {
    return (
      <LinearGradient colors={['#0B1426', '#1A0B2E', '#0B1426']} style={styles.generatingContainer}>
        <Animated.Text style={[styles.brainIcon, { transform: [{ scale: brainAnim }] }]}>🧠</Animated.Text>
        <Text style={styles.generatingTitle}>Building your itinerary...</Text>
        <Text style={styles.statusMsg}>{statusMsg}</Text>
        {streamText.length > 0 && (
          <View style={styles.streamPreview}>
            <Text style={styles.streamText}>{streamText.slice(-300)}</Text>
          </View>
        )}
      </LinearGradient>
    );
  }

  if (mode === 'view') {
    const store = useTripStore.getState();

    const handleShare = async () => {
      try {
        await shareTrip({
          destination,
          fromCity: store.fromCity || 'India',
          startDate: store.startDate,
          endDate: store.endDate,
          days,
          travellers: store.travellers,
          tripType,
          totalBudgetPerDay: store.totalBudgetPerDay,
          traveller_type: travellerType,
          selectedPlaces,
          itinerary: streamText || generatedItinerary || '',
        });
      } catch (e: any) {
        Alert.alert('Share failed', e.message);
      }
    };

    const handleSaveOffline = async () => {
      try {
        await saveTripOffline({
          id: user?.id || 'local_' + Date.now(),
          destination,
          fromCity: store.fromCity || '',
          days,
          travellers: store.travellers,
          tripType,
          totalBudgetPerDay: store.totalBudgetPerDay,
          budgetResult: store.budgetResult,
          selectedHotel: store.selectedHotel,
          generatedItinerary: streamText || generatedItinerary || '',
          selectedPlaces,
        });
        setOfflineSaved(true);
        Alert.alert('Saved! 📱', 'Trip is now available offline.');
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
    };

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => setMode('select')}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>📅 Day-wise Itinerary</Text>
          <TouchableOpacity onPress={() => { setStreamText(''); setMode('select'); }}>
            <Ionicons name="refresh" size={22} color={Colors.gold} />
          </TouchableOpacity>
        </View>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: Layout.md, paddingBottom: 120 }}
        >
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>🧠 Generated by TripWise AI · {destination}</Text>
          </View>
          {/* Pre-trip review suggestion */}
          <SuggestionBanner
            context="pre_trip_review"
            autoShow
          />
          <Text style={styles.itineraryText}>{streamText || generatedItinerary}</Text>

          {/* Day-wise spend buttons */}
          <View style={styles.spendSection}>
            <Text style={styles.spendTitle}>📈 Log Day Spends</Text>
            <View style={styles.spendDayRow}>
              {Array.from({ length: days }, (_, i) => i + 1).map(d => (
                <TouchableOpacity
                  key={d}
                  style={styles.spendDayBtn}
                  onPress={() => setSpendDay(d)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.spendDayLabel}>Day {d}</Text>
                  <Ionicons name="add-circle-outline" size={14} color={Colors.gold} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.8}>
              <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.actionBtnGrad}>
                <Ionicons name="share-social-outline" size={18} color={Colors.navy} />
                <Text style={styles.actionBtnText}>Share</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleSaveOffline}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={offlineSaved ? [Colors.success, '#16A34A'] : [Colors.navyLight, Colors.navyCard]}
                style={styles.actionBtnGrad}
              >
                <Ionicons name={offlineSaved ? 'checkmark-circle' : 'download-outline'} size={18} color={offlineSaved ? '#fff' : Colors.cream} />
                <Text style={[styles.actionBtnText, { color: offlineSaved ? '#fff' : Colors.cream }]}>
                  {offlineSaved ? 'Saved ✓' : 'Offline'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/trip-health' as any)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#7C3AED', '#9D5CF5']} style={styles.actionBtnGrad}>
                <Ionicons name="pulse-outline" size={18} color="#fff" />
                <Text style={[styles.actionBtnText, { color: '#fff' }]}>Health</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => router.push('/weather')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.nextBtnGrad}>
              <Text style={styles.nextBtnText}>Check Weather & Safety →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* Day Spend Sheet */}
        <DaySpend
          visible={spendDay !== null}
          day={spendDay || 1}
          tripId={user?.id || 'local'}
          onClose={() => setSpendDay(null)}
        />
      </View>
    );
  }

  // Select mode
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Pick Your Must-visits 📍</Text>
        <Text style={styles.navCount}>{selectedPlaces.length} selected</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: Layout.md, paddingBottom: 120 }}>
        <Text style={styles.selectHint}>Select places to visit — AI will build a day-wise plan around them</Text>
        <View style={{ gap: Layout.md, marginTop: Layout.sm }}>
          {isLoading ? (
            <>
              <SkeletonCard height={140} borderRadius={16} />
              <SkeletonCard height={140} borderRadius={16} />
              <SkeletonCard height={140} borderRadius={16} />
              <SkeletonCard height={140} borderRadius={16} />
            </>
          ) : (
            places.map((place: any) => {
              const isSelected = selectedPlaces.some((p: any) => p.id === place.id);
              return (
                <TouchableOpacity
                  key={place.id}
                  style={[styles.placeCard, isSelected && styles.placeCardSelected]}
                  onPress={() => togglePlace(place)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: place.image }} style={styles.placeImage} />
                  <View style={styles.placeContent}>
                    <View style={styles.placeNameRow}>
                      <Text style={styles.placeName}>{place.name}</Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={22} color={Colors.gold} />}
                    </View>
                    <Text style={styles.placeCategory}>{place.category}</Text>
                    <View style={styles.placeMeta}>
                      <View style={styles.metaPill}><Text style={styles.metaText}>⏱ {place.duration}</Text></View>
                      <View style={styles.metaPill}><Text style={styles.metaText}>🎟 ₹{place.entryFee}</Text></View>
                      <View style={styles.metaPill}><Text style={styles.metaText}>👥 {place.crowd}</Text></View>
                    </View>
                    <Text style={styles.placeHours}>🕐 {place.hours}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Layout.sm }]}>
        <Text style={styles.footerNote}>{selectedPlaces.length > 0 ? `${selectedPlaces.length} places ready` : 'Select places (AI will auto-pick if none)'}</Text>
        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} activeOpacity={0.85}>
          <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.generateBtnGrad}>
            <Text style={styles.generateBtnText}>✨ Generate AI Itinerary</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Day Spend Bottom Sheet ────────────────────────────────────────────────────
const QUICK = [50, 100, 200, 500, 1000];
const CATS = [
  { id: 'food', icon: '🍛', label: 'Food' },
  { id: 'transport', icon: '🚗', label: 'Auto' },
  { id: 'activity', icon: '🎭', label: 'Entry' },
  { id: 'shopping', icon: '🛍️', label: 'Shop' },
  { id: 'other', icon: '💸', label: 'Other' },
];

function DaySpend({
  visible, day, tripId, onClose,
}: { visible: boolean; day: number; tripId: string; onClose: () => void }) {
  const [amt, setAmt] = useState('');
  const [cat, setCat] = useState('food');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    const a = Number(amt);
    if (!a || a <= 0) return;
    setSaving(true);
    try {
      await addSpend({ tripId, category: cat, amount: a, description: `Day ${day}: ${note || cat}` });
      setAmt(''); setNote('');
      onClose();
    } catch { /* silent */ } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={ds.sheet}>
          <View style={ds.handle} />
          <Text style={ds.title}>Day {day} — Log Spend</Text>

          <View style={ds.quickRow}>
            {QUICK.map(v => (
              <TouchableOpacity key={v} style={[ds.qBtn, amt === String(v) && ds.qBtnA]} onPress={() => setAmt(String(v))}>
                <Text style={[ds.qText, amt === String(v) && { color: Colors.navy }]}>₹{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={ds.amtRow}>
            <Text style={ds.rupee}>₹</Text>
            <TextInput
              style={ds.amtInput}
              placeholder="Custom"
              placeholderTextColor={Colors.creamSubtle}
              value={amt}
              onChangeText={setAmt}
              keyboardType="number-pad"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CATS.map(c => (
                <TouchableOpacity key={c.id} style={[ds.chip, cat === c.id && ds.chipA]} onPress={() => setCat(c.id)}>
                  <Text style={ds.chipIcon}>{c.icon}</Text>
                  <Text style={[ds.chipLabel, cat === c.id && { color: Colors.navy }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TextInput
            style={ds.noteInput}
            placeholder="Note (optional)"
            placeholderTextColor={Colors.creamSubtle}
            value={note}
            onChangeText={setNote}
          />

          <TouchableOpacity style={ds.addBtn} onPress={handleAdd} disabled={saving} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={ds.addBtnGrad}>
              {saving
                ? <ActivityIndicator color={Colors.navy} />
                : <Text style={ds.addBtnText}>Add ₹{amt || '0'} →</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ds = StyleSheet.create({
  sheet: { backgroundColor: Colors.navyCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Layout.md, paddingBottom: 40, borderTopWidth: 1, borderColor: Colors.navyBorder },
  handle: { width: 36, height: 4, backgroundColor: Colors.navyBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontFamily: Typography.serif, fontSize: Typography.xl, color: Colors.cream, marginBottom: 16 },
  quickRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  qBtn: { flex: 1, backgroundColor: Colors.navyLight, borderRadius: 10, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: Colors.navyBorder },
  qBtnA: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  qText: { fontFamily: Typography.sansBold, fontSize: Typography.xs, color: Colors.cream },
  amtRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.navyLight, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: Colors.gold, marginBottom: 12 },
  rupee: { fontFamily: Typography.sansExtraBold, fontSize: 22, color: Colors.gold, marginRight: 6 },
  amtInput: { flex: 1, fontFamily: Typography.sansExtraBold, fontSize: 22, color: Colors.cream, paddingVertical: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.navyLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.navyBorder },
  chipA: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  chipIcon: { fontSize: 13 },
  chipLabel: { fontFamily: Typography.sansSemiBold, fontSize: Typography.xs, color: Colors.cream },
  noteInput: { backgroundColor: Colors.navyLight, borderRadius: 10, padding: 11, fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.cream, borderWidth: 1, borderColor: Colors.navyBorder, marginBottom: 12 },
  addBtn: { borderRadius: 14, overflow: 'hidden' },
  addBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  addBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.navy },
});

function generateQuickItinerary(destination: string, places: any[], days: number) {
  let text = `📅 ${days}-Day Itinerary for ${destination}\n\n`;
  const perDay = Math.ceil(places.length / days);
  for (let d = 1; d <= days; d++) {
    const dayPlaces = places.slice((d - 1) * perDay, d * perDay);
    text += `━━━ DAY ${d} ━━━\n`;
    text += `08:00 🍳 Breakfast at a local cafe (~₹150/person)\n`;
    let t = 9;
    for (const p of dayPlaces) {
      text += `${String(t).padStart(2,'0')}:30 ${p.category?.split(' ')[0] || '🗺️'} ${p.name}\n`;
      text += `  📝 ~${p.duration}, ₹${p.entryFee} entry, Opens ${p.hours}\n`;
      text += `  → 15 mins by auto to next stop\n`;
      t += 2;
      if (t === 13) { text += `13:00 🍛 Lunch at a local dhaba (~₹200/person)\n`; t = 14; }
    }
    text += `19:00 🌆 Evening stroll & shopping\n`;
    text += `20:00 🍽️ Dinner at recommended restaurant (~₹350/person)\n`;
    text += `\nDay ${d} total: ~₹900/person\n\n`;
  }
  return text;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFAF6' },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Layout.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#EDE8E0',
  },
  navTitle: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: '#1A1A2E', flex: 1, textAlign: 'center' },
  navCount: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.gold },
  selectHint: { fontFamily: Typography.sans, fontSize: Typography.sm, color: '#5C5C7A', marginBottom: Layout.sm },
  placeCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#EDE8E0', shadowColor: '#C4A882', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 3 },
  placeCardSelected: { borderColor: '#F5A623', borderWidth: 2 },
  placeImage: { width: 90, height: 90, resizeMode: 'cover' },
  placeContent: { flex: 1, padding: Layout.sm },
  placeNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  placeName: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: '#1A1A2E', flex: 1 },
  placeCategory: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#5C5C7A', marginBottom: 4 },
  placeMeta: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginBottom: 4 },
  metaPill: { backgroundColor: '#F4EFE8', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  metaText: { fontFamily: Typography.sans, fontSize: 10, color: '#5C5C7A' },
  placeHours: { fontFamily: Typography.sans, fontSize: 10, color: '#9B96A8' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: Layout.md, borderTopWidth: 1, borderTopColor: '#EDE8E0', gap: Layout.sm },
  footerNote: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#5C5C7A', textAlign: 'center' },
  generateBtn: { borderRadius: Layout.radiusMd, overflow: 'hidden' },
  generateBtnGrad: { paddingVertical: Layout.md, alignItems: 'center' },
  generateBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.navy },
  // Generating mode
  generatingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Layout.xl },
  brainIcon: { fontSize: 80, marginBottom: Layout.xl },
  generatingTitle: { fontFamily: Typography.serif, fontSize: Typography.xxl, color: Colors.cream, textAlign: 'center', marginBottom: Layout.sm },
  statusMsg: { fontFamily: Typography.sans, fontSize: Typography.base, color: Colors.gold, textAlign: 'center', fontStyle: 'italic' },
  streamPreview: { marginTop: Layout.xl, backgroundColor: Colors.navyCard, borderRadius: Layout.radiusMd, padding: Layout.md, maxHeight: 200, width: '100%', borderWidth: 1, borderColor: Colors.navyBorder },
  streamText: { fontFamily: 'courier', fontSize: 11, color: Colors.creamMuted },
  // View mode
  aiBadge: { backgroundColor: Colors.gold20, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: Layout.md, borderWidth: 1, borderColor: Colors.gold },
  aiBadgeText: { fontFamily: Typography.sansBold, fontSize: Typography.xs, color: Colors.gold },
  itineraryText: { fontFamily: Typography.sans, fontSize: Typography.sm, color: '#1A1A2E', lineHeight: 24 },
  nextBtn: { marginTop: Layout.xl, borderRadius: Layout.radiusMd, overflow: 'hidden' },
  nextBtnGrad: { paddingVertical: Layout.md, alignItems: 'center' },
  nextBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.navy },
  // Day spend
  spendSection: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: Layout.md, marginTop: Layout.lg, borderWidth: 1, borderColor: '#EDE8E0', shadowColor: '#C4A882', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  spendTitle: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: '#1A1A2E', marginBottom: 10 },
  spendDayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  spendDayBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F4EFE8', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#EDE8E0' },
  spendDayLabel: { fontFamily: Typography.sansBold, fontSize: Typography.xs, color: '#F5A623' },
  // Action row (Share / Offline / Health)
  actionRow: { flexDirection: 'row', gap: 8, marginTop: Layout.lg },
  actionBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  actionBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  actionBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.xs, color: Colors.navy },
});
