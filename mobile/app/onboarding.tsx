import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Animated, Dimensions, ActivityIndicator, Platform, KeyboardAvoidingView, Keyboard
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
import { useGPSLocation } from '../lib/useGPSLocation';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 5;

const INDIAN_CITIES = [
  { id: 'delhi', name: 'Delhi', state: 'Delhi', isOrigin: true },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', isOrigin: true },
  { id: 'bangalore', name: 'Bangalore', state: 'Karnataka', isOrigin: true },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', isOrigin: true },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan' },
  { id: 'goa', name: 'Goa', state: 'Goa' },
  { id: 'manali', name: 'Manali', state: 'Himachal Pradesh' },
  { id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh' },
  { id: 'udaipur', name: 'Udaipur', state: 'Rajasthan' },
  { id: 'rishikesh', name: 'Rishikesh', state: 'Uttarakhand' },
  { id: 'coorg', name: 'Coorg', state: 'Karnataka' },
  { id: 'ooty', name: 'Ooty', state: 'Tamil Nadu' },
  { id: 'ladakh', name: 'Ladakh', state: 'Ladakh' },
  { id: 'andaman', name: 'Andaman Islands', state: 'A&N Islands' },
  { id: 'mysuru', name: 'Mysuru', state: 'Karnataka' },
  { id: 'agra', name: 'Agra', state: 'Uttar Pradesh' },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', isOrigin: true },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', isOrigin: true },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', isOrigin: true },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', isOrigin: true },
];



const TRAVELLER_TYPES = [
  { id: 'solo', label: 'Solo', icon: '🧍', count: 1 },
  { id: 'couple', label: 'Couple', icon: '👫', count: 2 },
  { id: 'friends', label: 'Friends', icon: '👥', count: 3 },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧', count: 4 },
];

const TRIP_VIBES = [
  { id: 'cultural', icon: '🏛️', label: 'Cultural', desc: 'Temples, forts, heritage & history', color: '#8B5CF6' },
  { id: 'fun', icon: '🎉', label: 'Leisure & Fun', desc: 'Nightlife, parks, experiences & events', color: '#EC4899' },
  { id: 'exploring', icon: '🌿', label: 'Exploring', desc: 'Offbeat, nature, slow & mindful travel', color: '#10B981' },
  { id: 'adventurous', icon: '🏔️', label: 'Adventurous', desc: 'Trekking, rafting, camping & thrills', color: '#F59E0B' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const {
    currentStep, setStep,
    fromCity, fromCityId, setFromCity,
    destination, destinationId, setDestination,
    startDate, endDate, days, setDates,
    budgetTier, totalBudgetPerDay: totalBudget, setBudget,
    travellerType, travellers, withChildren, setGroup,
    tripType, setTripType,
    setBudgetResult, setIsGeneratingBudget,
    isGeneratingBudget,
  } = useTripStore();

  const AI_MESSAGES = [
    'Locking your 10% safety buffer...',
    `Finding transport from ${fromCity} to ${destination}...`,
    'Calculating hotel range for your budget...',
    'Splitting food budget by meal type...',
    'Discovering top places to visit...',
    'Building your complete trip plan...',
  ];

  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const brainAnim = useRef(new Animated.Value(1)).current;
  const brainRotate = useRef(new Animated.Value(0)).current;

  // GPS auto-location
  const gps = useGPSLocation();
  const gpsApplied = useRef(false);
  useEffect(() => {
    if (!gps.loading && gps.city && !gpsApplied.current && !fromCityId) {
      gpsApplied.current = true;
      setFromCity(gps.city, gps.city.toLowerCase().replace(/\s+/g, ''));
      setFromQuery(gps.city);
    }
  }, [gps.loading, gps.city]);

  const [fromQuery, setFromQuery] = useState(fromCity);
  const [toQuery, setToQuery] = useState(destination);
  const [activeField, setActiveField] = useState<'from' | 'to'>('from');
  const [customBudget, setCustomBudget] = useState(String(totalBudget));
  const [aiMessage, setAiMessage] = useState(AI_MESSAGES[0]);
  const [aiMessageIdx, setAiMessageIdx] = useState(0);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / TOTAL_STEPS,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const [options, setOptions] = useState<any[]>(INDIAN_CITIES);

  useEffect(() => {
    const query = activeField === 'from' ? fromQuery : toQuery;
    if (query.trim().length < 2) {
      setOptions(INDIAN_CITIES);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const normQuery = normalize(query);
      const localMatches = INDIAN_CITIES.filter(c => normalize(c.name).includes(normQuery));
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=7&language=en&format=json`);
        const data = await res.json();
        if (data.results) {
          const fetchedCities = data.results.map((c: any) => ({
            id: c.id.toString(),
            name: c.name,
            state: c.country + (c.admin1 ? `, ${c.admin1}` : ''),
            lat: c.latitude,
            lng: c.longitude
          }));
          const localNames = new Set(localMatches.map(m => normalize(m.name)));
          const uniqueFetched: any[] = [];
          const seenKeys = new Set<string>();
          
          for (const f of fetchedCities) {
            const normName = normalize(f.name);
            const key = `${normName}-${normalize(f.state)}`;
            if (!localNames.has(normName) && !seenKeys.has(key)) {
              seenKeys.add(key);
              uniqueFetched.push(f);
            }
          }
          
          setOptions([...localMatches, ...uniqueFetched]);
        } else {
          setOptions(localMatches);
        }
      } catch (err) {
        setOptions(localMatches);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [fromQuery, toQuery, activeField]);

  const goNext = () => {
    if (currentStep === 1 && !destination) return;
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -20, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    if (currentStep < TOTAL_STEPS) {
      setStep(currentStep + 1);
    } else {
      handleGenerate();
    }
  };

  const goBack = () => {
    if (currentStep > 1) setStep(currentStep - 1);
    else router.back();
  };

  const handleGenerate = async () => {
    setIsGeneratingBudget(true);

    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % AI_MESSAGES.length;
      setAiMessage(AI_MESSAGES[msgIdx]);
      setAiMessageIdx(msgIdx);
    }, 1800);

    // Brain pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(brainAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(brainAnim, { toValue: 0.95, duration: 700, useNativeDriver: true }),
      ])
    ).start();

    // Brain spin slow
    Animated.loop(
      Animated.timing(brainRotate, { toValue: 1, duration: 3000, useNativeDriver: true })
    ).start();

    try {
      const minLoadTime = 1800 * AI_MESSAGES.length;
      const startLoad = Date.now();
      
      const result = await budgetAPI.generate({
        destination,
        fromCity,
        totalBudget,
        days,
        travellers,
        tripType,
        travellerType,
      }) as any;

      const elapsed = Date.now() - startLoad;
      if (elapsed < minLoadTime) {
        await new Promise(r => setTimeout(r, minLoadTime - elapsed));
      }

      clearInterval(interval);
      setBudgetResult(result);
      router.replace('/budget-detail');
    } catch (err: any) {
      clearInterval(interval);
      console.error('[Onboarding] Budget generation failed:', err.message);
      // Fallback: build a simple deterministic budget so user still gets to budget-detail
      const A = totalBudget;
      const transportPct = 30, hotelPct = 35, foodPct = 20, localPct = 5;
      setBudgetResult({
        transport_pct: transportPct, transport_base_pct: 25, transport_buffer_pct: 5,
        hotel_pct: hotelPct, food_pct: foodPct, local_pct: localPct, buffer_pct: 10,
        transport_inr: Math.round(A * transportPct / 100),
        transport_base_inr: Math.round(A * 0.25),
        transport_buffer_inr: Math.round(A * 0.05),
        hotel_inr: Math.round(A * hotelPct / 100),
        food_inr: Math.round(A * foodPct / 100),
        local_inr: Math.round(A * localPct / 100),
        buffer_inr: Math.round(A * 0.10),
        total_per_day: A, usable_per_day: Math.round(A * 0.9), total_trip_cost: A,
        source: 'deterministic',
        smart_insights: {
          verdict: `Estimated budget for ${destination}. Server unavailable — using smart defaults.`,
          saving_tip: 'Book transport and hotels early to save 15-20% on average.',
          splurge_recommendation: 'Spend a little extra on at least one authentic local dining experience.',
        },
      });
      router.replace('/budget-detail');
    }
  };

  const spin = brainRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handleSwap = useCallback(() => {
    const tempCity = fromCity;
    const tempId = fromCityId;
    const tempQuery = fromQuery;
    
    setFromCity(destination, destinationId);
    setFromQuery(toQuery || '');
    
    setDestination(tempCity, tempId);
    setToQuery(tempQuery || '');
  }, [fromCity, fromCityId, fromQuery, destination, destinationId, toQuery]);

  if (isGeneratingBudget) {
    return (
      <LinearGradient colors={['#060D1F', '#12082B', '#060D1F']} style={styles.aiOverlay}>
        <View style={styles.aiContent}>
          <Animated.Text style={[styles.brainIcon, {
            transform: [{ scale: brainAnim }, { rotate: spin }]
          }]}>🧠</Animated.Text>
          <Text style={styles.aiTitle}>Travel Guide AI is{'\n'}planning your trip</Text>
          <View style={styles.routeTag}>
            <Ionicons name="navigate" size={14} color={Colors.gold} />
            <Text style={styles.routeTagText}>{fromCity} → {destination}</Text>
          </View>
          <Text style={styles.aiMessage}>{aiMessage}</Text>
          <ActivityIndicator color={Colors.gold} size="large" style={{ marginTop: Layout.lg }} />
          <View style={styles.aiSteps}>
            {AI_MESSAGES.slice(0, 5).map((msg, i) => (
              <View key={i} style={styles.aiStep}>
                <Text style={styles.aiStepDot}>{i < aiMessageIdx ? '✅' : i === aiMessageIdx ? '⏳' : '◻️'}</Text>
                <Text style={[styles.aiStepText, i < aiMessageIdx && { color: Colors.gold }]}>{msg}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.aiNote}>10% emergency buffer is locked automatically</Text>
        </View>
      </LinearGradient>
    );
  }



  let canProceed = true;
  if (currentStep === 1 && (!fromCity || !destination)) canProceed = false;
  if (currentStep === 4) {
    const minRequired = travellers * days * 1000;
    const budgetVal = Number(customBudget) || totalBudget || 0;
    if (budgetVal < minRequired) canProceed = false;
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top, paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0 }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={20} color={Colors.cream} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
        <Text style={styles.stepCounter}>{currentStep}/{TOTAL_STEPS}</Text>
      </View>

      {/* Steps */}
      <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {currentStep === 1 && (
            <Step1
              fromQuery={fromQuery}
              setFromQuery={setFromQuery}
              toQuery={toQuery}
              setToQuery={setToQuery}
              activeField={activeField}
              setActiveField={setActiveField}
              fromCity={fromCity}
              destination={destination}
              options={options}
              onSelectFrom={(city: any) => { setFromQuery(city.name); setFromCity(city.name, city.id); setActiveField('to'); }}
              onSelectTo={(city: any) => { setToQuery(city.name); setDestination(city.name, city.id); }}
              fromCityId={fromCityId}
              destinationId={destinationId}
              gpsLoading={gps.loading}
              gpsDenied={gps.denied}
              gpsCity={gps.city}
            />
          )}
          {currentStep === 2 && <Step2 startDate={startDate} endDate={endDate} setDates={setDates} />}
          {currentStep === 3 && (
            <StepGroup
              travellerType={travellerType}
              travellers={travellers}
              withChildren={withChildren}
              onSelect={(type: any, count: number, wc: boolean) => setGroup(type, count, wc)}
              fromCity={fromCity}
              destination={destination}
              days={days}
            />
          )}
          {currentStep === 4 && (
            <StepBudget
              totalBudget={totalBudget}
              customBudget={customBudget}
              setCustomBudget={setCustomBudget}
              onSelect={(tier: any, amount: number) => setBudget(tier, amount)}
              days={days}
              travellers={travellers}
            />
          )}
          {currentStep === 5 && (
            <Step5
              tripType={tripType}
              onSelect={(type: any) => setTripType(type)}
              fromCity={fromCity}
              destination={destination}
              days={days}
              travellers={travellers}
              totalBudget={totalBudget}
            />
          )}
        </ScrollView>
      </Animated.View>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Layout.md }]}>
        <TouchableOpacity
          style={[
            styles.nextBtn,
            canProceed ? styles.nextBtnActive : styles.nextBtnDisabledStyle,
          ]}
          onPress={goNext}
          disabled={!canProceed}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextBtnText, !canProceed && { color: '#9B96A8' }]}>
            {currentStep === TOTAL_STEPS ? '✨ Generate AI Budget Plan' : `Continue  →`}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Step 1: From → To ────────────────────────────────────────────────────
function Step1({ fromQuery, setFromQuery, toQuery, setToQuery, activeField, setActiveField,
  fromCity, destination, options, onSelectFrom, onSelectTo, fromCityId, destinationId,
  gpsLoading, gpsDenied, gpsCity, onSwap }: any) {

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Plan your{'\n'}route 🗺️</Text>
      <Text style={styles.stepSubtitle}>Where are you travelling from and to?</Text>

      {/* GPS status badge */}
      {gpsLoading && (
        <View style={styles.gpsBadge}>
          <ActivityIndicator size="small" color={Colors.gold} />
          <Text style={styles.gpsBadgeText}>Detecting your location…</Text>
        </View>
      )}
      {!gpsLoading && gpsCity && !gpsDenied && (
        <View style={[styles.gpsBadge, styles.gpsBadgeSuccess]}>
          <Ionicons name="location" size={14} color="#10B981" />
          <Text style={[styles.gpsBadgeText, { color: '#10B981' }]}>Auto-detected: {gpsCity}</Text>
        </View>
      )}
      {!gpsLoading && gpsDenied && (
        <View style={[styles.gpsBadge, styles.gpsBadgeDenied]}>
          <Ionicons name="location-outline" size={14} color={Colors.creamMuted} />
          <Text style={[styles.gpsBadgeText, { color: Colors.creamMuted }]}>Location access denied — enter city manually</Text>
        </View>
      )}

      {/* From */}
      <Text style={styles.fieldLabel}>FROM</Text>
      <TouchableOpacity
        style={[styles.routeField, activeField === 'from' && styles.routeFieldActive]}
        onPress={() => setActiveField('from')}
        activeOpacity={0.8}
      >
        <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
        <TextInput
          style={styles.routeInput}
          placeholder="Your starting city"
          placeholderTextColor={Colors.creamSubtle}
          value={fromQuery}
          onChangeText={(v) => { setFromQuery(v); setActiveField('from'); }}
          onFocus={() => setActiveField('from')}
          returnKeyType="next"
        />
        {fromCity ? <Ionicons name="checkmark-circle" size={20} color="#10B981" /> : null}
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.routeDivider}>
        <View style={styles.routeLine} />
        <TouchableOpacity style={styles.routeSwap} onPress={onSwap} activeOpacity={0.8}>
          <Ionicons name="swap-vertical" size={16} color={Colors.gold} />
        </TouchableOpacity>
        <View style={styles.routeLine} />
      </View>

      {/* To */}
      <Text style={styles.fieldLabel}>TO</Text>
      <TouchableOpacity
        style={[styles.routeField, activeField === 'to' && styles.routeFieldActive]}
        onPress={() => setActiveField('to')}
        activeOpacity={0.8}
      >
        <View style={[styles.routeDot, { backgroundColor: Colors.gold }]} />
        <TextInput
          style={styles.routeInput}
          placeholder="Your destination city"
          placeholderTextColor={Colors.creamSubtle}
          value={toQuery}
          onChangeText={(v) => { setToQuery(v); setActiveField('to'); }}
          onFocus={() => setActiveField('to')}
          returnKeyType="done"
        />
        {destination ? <Ionicons name="checkmark-circle" size={20} color={Colors.gold} /> : null}
      </TouchableOpacity>

      {/* City list */}
      <View style={{ gap: 6, marginTop: Layout.sm }}>
        {options.slice(0, 7).map((city: any) => {
          const selected = activeField === 'from' ? fromCity === city.name : destination === city.name;
          return (
            <TouchableOpacity
              key={city.id}
              style={[styles.cityRow, selected && styles.cityRowSelected]}
              onPress={() => activeField === 'from' ? onSelectFrom(city) : onSelectTo(city)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={activeField === 'from' ? 'radio-button-on' : 'location'}
                size={16}
                color={selected ? Colors.gold : Colors.creamMuted}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.cityName, selected && { color: Colors.gold }]}>{city.name}</Text>
                <Text style={styles.cityState}>{city.state}</Text>
              </View>
              {selected && <Ionicons name="checkmark-circle" size={18} color={Colors.gold} />}
            </TouchableOpacity>
          );
        })}
        {/* Fallback Custom City Option */}
        {(activeField === 'from' ? fromQuery : toQuery).trim().length > 0 && (
          <TouchableOpacity
            style={styles.cityRow}
            onPress={() => {
              const query = (activeField === 'from' ? fromQuery : toQuery).trim();
              const customCity = { id: query.toLowerCase(), name: query, state: 'Custom Search' };
              if (activeField === 'from') onSelectFrom(customCity);
              else onSelectTo(customCity);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="globe" size={16} color={Colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cityName}>Use "{(activeField === 'from' ? fromQuery : toQuery).trim()}"</Text>
              <Text style={styles.cityState}>Live Global Search</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {fromCity && destination && (
        <View style={styles.routeSummary}>
          <Text style={styles.routeSummaryText}>✈️  {fromCity}  →  {destination}</Text>
          <Text style={styles.routeSummaryNote}>AI will calculate route-specific transport costs</Text>
        </View>
      )}
    </View>
  );
}

// ─── Step 2: Duration / Dates ────────────────────────────────────────────────
function Step2({ startDate, endDate, setDates }: any) {
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const start = startDate ? new Date(startDate) : new Date(Date.now() + 86400000);
  const end = endDate ? new Date(endDate) : new Date(Date.now() + 86400000 * 4);
  const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));

  useEffect(() => {
    // Initialize dates if null
    if (!startDate || !endDate) {
      setDates(start, end);
    }
  }, []);

  const onStartChange = (event: any, selectedDate?: Date) => {
    setShowStart(Platform.OS === 'ios');
    if (selectedDate) {
      if (selectedDate > end) {
        const newEnd = new Date(selectedDate);
        newEnd.setDate(newEnd.getDate() + 1);
        setDates(selectedDate, newEnd);
      } else {
        setDates(selectedDate, end);
      }
    }
  };

  const onEndChange = (event: any, selectedDate?: Date) => {
    setShowEnd(Platform.OS === 'ios');
    if (selectedDate) {
      if (selectedDate < start) {
        const newStart = new Date(selectedDate);
        newStart.setDate(newStart.getDate() - 1);
        setDates(newStart, selectedDate);
      } else {
        setDates(start, selectedDate);
      }
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>When are you{'\n'}travelling? 📅</Text>
      <Text style={styles.stepSubtitle}>Select your trip dates for accurate budget planning.</Text>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => setShowStart(true)}>
          <Text style={{ fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, marginBottom: 8 }}>Departure Date</Text>
          <View style={{ backgroundColor: Colors.navyCard, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.navyBorder }}>
            <Text style={{ fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream }}>
              {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => setShowEnd(true)}>
          <Text style={{ fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, marginBottom: 8 }}>Return Date</Text>
          <View style={{ backgroundColor: Colors.navyCard, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.navyBorder }}>
            <Text style={{ fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream }}>
              {end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ backgroundColor: Colors.navyLight, padding: 16, borderRadius: 12, marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted }}>Total Trip Duration</Text>
        <Text style={{ fontFamily: Typography.sansExtraBold, fontSize: Typography.base, color: Colors.gold }}>{nights} {nights === 1 ? 'night' : 'nights'}</Text>
      </View>

      {(showStart || showEnd) && Platform.OS !== 'ios' && (
        <DateTimePicker
          value={showStart ? start : end}
          mode="date"
          display="default"
          minimumDate={showStart ? new Date() : start}
          onChange={showStart ? onStartChange : onEndChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <View style={{ marginTop: 20 }}>
          {showStart && (
            <DateTimePicker
              value={start}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={onStartChange}
              textColor={Colors.cream}
            />
          )}
          {showEnd && (
            <DateTimePicker
              value={end}
              mode="date"
              display="spinner"
              minimumDate={start}
              onChange={onEndChange}
              textColor={Colors.cream}
            />
          )}
        </View>
      )}
      <Text style={styles.noteText}>🔒 10% of your budget is automatically reserved as emergency buffer</Text>
    </View>
  );
}

// ─── Step 4 (New): Budget ───────────────────────────────────────────────────────
function StepBudget({ totalBudget, customBudget, setCustomBudget, onSelect, days, travellers }: any) {
  const budgetVal = Number(customBudget) || totalBudget || 0;
  const buffer = Math.round(budgetVal * 0.1);
  const usable = budgetVal - buffer;
  const transportEst = Math.round(usable * 0.25);
  const remaining = usable - transportEst;

  const minRequired = travellers * days * 1000; // Minimum ₹1000 per person per day

  let tierLabel = '🔵 Normal';
  let tierColor = '#F5A623';
  if (remaining < 5000) {
    tierLabel = '🟢 Budget';
    tierColor = '#10B981';
  } else if (remaining > 15000) {
    tierLabel = '🟣 Premium';
    tierColor = '#8B5CF6';
  }

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your total{'\n'}trip budget? 💰</Text>
      
      <View style={{ gap: Layout.sm }}>
        <View style={styles.customInputBox}>
          <Text style={styles.customPrefix}>₹</Text>
          <TextInput
            style={styles.customInput}
            value={customBudget}
            onChangeText={(v) => { 
              setCustomBudget(v); 
              onSelect('custom', Number(v) || 0); 
            }}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={Colors.creamSubtle}
          />
        </View>

        {budgetVal > 0 && budgetVal < minRequired && (
          <View style={{ backgroundColor: '#FF4C4C15', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FF4C4C30', marginTop: 8 }}>
            <Text style={{ color: '#FF4C4C', fontFamily: Typography.sansBold, fontSize: Typography.sm }}>
              ⚠️ Highly Unrealistic Budget
            </Text>
            <Text style={{ color: '#FF4C4C', fontFamily: Typography.sans, fontSize: Typography.xs, marginTop: 4 }}>
              You have {travellers} people for {days} days. Even basic dorms and local transport will require at least ₹{minRequired.toLocaleString('en-IN')} total. Please increase your budget to get genuine AI recommendations.
            </Text>
          </View>
        )}

        {budgetVal > 0 && (
          <View style={styles.budgetPreview}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Layout.md }}>
              <Text style={styles.budgetPreviewTitle}>Live Breakdown</Text>
              <View style={[styles.popularBadge, { borderColor: tierColor, backgroundColor: tierColor + '15' }]}>
                <Text style={[styles.popularText, { color: tierColor }]}>{tierLabel}</Text>
              </View>
            </View>
            <View style={styles.budgetPreviewRow}>
              <Text style={styles.budgetPreviewLabel}>🔒 Buffer (10%)</Text>
              <Text style={styles.budgetPreviewVal}>₹{buffer.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.budgetPreviewRow}>
              <Text style={styles.budgetPreviewLabel}>✅ Available to spend</Text>
              <Text style={[styles.budgetPreviewVal, { color: '#10B981' }]}>₹{usable.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.budgetPreviewRow}>
              <Text style={styles.budgetPreviewLabel}>🚂 Estimated transport</Text>
              <Text style={styles.budgetPreviewVal}>~₹{transportEst.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.budgetPreviewRow}>
              <Text style={styles.budgetPreviewLabel}>🏨 Hotel + Food</Text>
              <Text style={styles.budgetPreviewVal}>~₹{remaining.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        )}
        <Text style={styles.noteText}>💡 AI will optimise exact split for your specific route</Text>
      </View>
    </View>
  );
}

// ─── Step 3 (New): Group ────────────────────────────────────────────────────────
function StepGroup({ travellerType, travellers, withChildren, onSelect, fromCity, destination, days }: any) {
  const [count, setCount] = useState(travellers);
  const [wc, setWc] = useState(withChildren);
  const [minEst, setMinEst] = useState<any>(null);
  const [loadingEst, setLoadingEst] = useState(false);

  const fetchEstimate = async (type: string, cnt: number) => {
    if (!destination) return;
    setLoadingEst(true);
    try {
      const data = await budgetAPI.estimateMin({
        from: fromCity, to: destination,
        days, travellers: type === 'solo' ? 1 : cnt, travellerType: type,
      }) as any;
      setMinEst(data);
    } catch { setMinEst(null); }
    finally { setLoadingEst(false); }
  };

  // Fetch on mount
  useEffect(() => { fetchEstimate(travellerType, travellers); }, []);

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Who's{'\n'}travelling? 👥</Text>
      <Text style={styles.stepSubtitle}>Affects hotel type, food portions, and AI recommendations.</Text>

      <View style={styles.groupGrid}>
        {TRAVELLER_TYPES.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.groupCard, travellerType === t.id && styles.groupCardSelected]}
            onPress={() => { onSelect(t.id, t.id === 'solo' ? 1 : count, wc); fetchEstimate(t.id, t.id === 'solo' ? 1 : count); }}
            activeOpacity={0.8}
          >
            <Text style={styles.groupIcon}>{t.icon}</Text>
            <Text style={[styles.groupLabel, travellerType === t.id && { color: Colors.gold }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {travellerType !== 'solo' && travellerType !== 'couple' && (
        <View>
          <Text style={styles.fieldLabel}>NUMBER OF PEOPLE</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => { const v = Math.max(2, count - 1); setCount(v); onSelect(travellerType, v, wc); fetchEstimate(travellerType, v); }}>
              <Ionicons name="remove" size={24} color={Colors.cream} />
            </TouchableOpacity>
            <View style={styles.stepperValue}>
              <Text style={styles.stepperNum}>{count}</Text>
              <Text style={styles.stepperLabel}>people</Text>
            </View>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => { const v = Math.min(12, count + 1); setCount(v); onSelect(travellerType, v, wc); fetchEstimate(travellerType, v); }}>
              <Ionicons name="add" size={24} color={Colors.cream} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {travellerType === 'family' && (
        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => { setWc(!wc); onSelect(travellerType, count, !wc); }}
          activeOpacity={0.7}
        >
          <View>
            <Text style={styles.toggleLabel}>Travelling with children?</Text>
            <Text style={styles.toggleNote}>Affects hotel type & activity suggestions</Text>
          </View>
          <View style={[styles.toggle, wc && styles.toggleActive]}>
            <Text style={styles.toggleText}>{wc ? '✓' : ''}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Minimum budget estimate */}
      {destination ? (
        <View style={styles.minBudgetCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.minBudgetTitle}>💡 Estimated Minimum Budget</Text>
            {loadingEst && <ActivityIndicator size="small" color={Colors.gold} />}
          </View>
          {minEst ? (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.minBudgetLabel}>Minimum (budget travel)</Text>
                <Text style={styles.minBudgetVal}>₹{minEst.minBudget?.toLocaleString('en-IN')}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={styles.minBudgetLabel}>Comfortable</Text>
                <Text style={[styles.minBudgetVal, { color: Colors.gold }]}>₹{minEst.comfortBudget?.toLocaleString('en-IN')}</Text>
              </View>
              <Text style={{ fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamSubtle }}>
                📍 {minEst.distanceKm} km · {minEst.days} nights · {minEst.travellers} pax
              </Text>
            </>
          ) : (
            !loadingEst && <Text style={{ fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted }}>Select a destination first to see budget estimate</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

// ─── Step 5: Vibe + Summary ───────────────────────────────────────────────
function Step5({ tripType, onSelect, fromCity, destination, days, travellers, totalBudget }: any) {

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your{'\n'}trip vibe? ✨</Text>
      <Text style={styles.stepSubtitle}>Affects place suggestions, hotel picks & AI reasoning.</Text>

      <View style={{ gap: Layout.sm }}>
        {TRIP_VIBES.map((vibe) => (
          <TouchableOpacity
            key={vibe.id}
            style={[styles.vibeCard, tripType === vibe.id && { borderColor: vibe.color, borderWidth: 2 }]}
            onPress={() => onSelect(vibe.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.vibeCardInner, tripType === vibe.id && { backgroundColor: vibe.color + '12' }]}>
              <Text style={styles.vibeIcon}>{vibe.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.vibeLabel, tripType === vibe.id && { color: vibe.color }]}>{vibe.label}</Text>
                <Text style={styles.vibeDesc}>{vibe.desc}</Text>
              </View>
              {tripType === vibe.id && <Ionicons name="checkmark-circle" size={22} color={vibe.color} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trip summary card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>📋 Trip Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Route</Text>
          <Text style={styles.summaryVal}>{fromCity} → {destination}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Duration</Text>
          <Text style={styles.summaryVal}>{days} nights</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Travellers</Text>
          <Text style={styles.summaryVal}>{travellers} person{travellers > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Budget</Text>
          <Text style={[styles.summaryVal, { color: Colors.gold }]}>₹{totalBudget.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.summaryLabel}>Emergency Buffer</Text>
          <Text style={[styles.summaryVal, { color: '#10B981' }]}>₹{Math.round(totalBudget * 0.1).toLocaleString('en-IN')} locked</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Layout.md, paddingVertical: Layout.sm, gap: Layout.sm,
  },
  backBtn: {
    width: 38, height: 38, backgroundColor: Colors.navyCard,
    borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  progressContainer: {
    flex: 1, height: 5, backgroundColor: Colors.navyLight,
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: 5, backgroundColor: Colors.gold, borderRadius: 3 },
  stepCounter: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.creamMuted, minWidth: 28, textAlign: 'right' },
  content: { flex: 1 },
  stepContainer: { padding: Layout.md, paddingBottom: 100 },
  stepTitle: { fontFamily: Typography.serif, fontSize: 32, color: Colors.cream, lineHeight: 42, marginBottom: 4 },
  stepSubtitle: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted, marginBottom: Layout.lg },
  fieldLabel: { fontFamily: Typography.sansBold, fontSize: 11, color: Colors.creamSubtle, letterSpacing: 1.2, marginBottom: 6, marginTop: Layout.sm },

  // GPS badge
  gpsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.navyCard, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.gold20,
    marginBottom: Layout.sm, alignSelf: 'flex-start',
  },
  gpsBadgeSuccess: { borderColor: '#10B98130', backgroundColor: '#10B98110' },
  gpsBadgeDenied:  { borderColor: Colors.navyBorder },
  gpsBadgeText: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.gold },

  // Route fields
  routeField: {
    flexDirection: 'row', alignItems: 'center', gap: Layout.sm,
    backgroundColor: Colors.navyCard, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  routeFieldActive: { borderColor: Colors.gold, borderWidth: 2 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeInput: { flex: 1, fontFamily: Typography.sans, fontSize: Typography.base, color: Colors.cream },
  routeDivider: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 4, paddingLeft: Layout.md,
  },
  routeLine: { flex: 1, height: 1, backgroundColor: Colors.navyBorder },
  routeSwap: {
    width: 28, height: 28, backgroundColor: Colors.navyCard,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.gold, marginHorizontal: 8,
  },
  routeSummary: {
    backgroundColor: Colors.navyCard, borderRadius: Layout.radiusMd,
    padding: Layout.md, marginTop: Layout.md, borderWidth: 1,
    borderColor: Colors.gold20, alignItems: 'center',
  },
  routeSummaryText: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.gold },
  routeSummaryNote: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, marginTop: 4 },

  cityRow: {
    flexDirection: 'row', alignItems: 'center', gap: Layout.sm,
    backgroundColor: Colors.navyCard, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: Colors.border,
  },
  cityRowSelected: { 
    borderColor: Colors.gold, borderWidth: 2, backgroundColor: Colors.gold10,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  cityName: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream },
  cityState: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted },

  // Duration
  nightGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.sm, marginBottom: Layout.lg },
  nightTile: {
    width: (width - Layout.md * 2 - Layout.sm * 3) / 4, aspectRatio: 1,
    backgroundColor: Colors.navyCard, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  nightTileSelected: { 
    backgroundColor: Colors.gold, borderColor: Colors.gold,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  nightTileNum: { fontFamily: Typography.sansExtraBold, fontSize: Typography.xl, color: Colors.cream },
  nightTileLabel: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Layout.xl, marginVertical: Layout.md,
  },
  stepperBtn: {
    width: 48, height: 48, backgroundColor: Colors.navyLight,
    borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.navyBorder,
  },
  stepperValue: { alignItems: 'center' },
  stepperNum: { fontFamily: Typography.serif, fontSize: 48, color: Colors.gold },
  stepperLabel: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted },

  // Budget
  budgetCard: {
    flexDirection: 'row', alignItems: 'center', gap: Layout.sm,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: Layout.md, borderWidth: 1.5, borderColor: '#EDE8E0',
    marginBottom: 10,
  },
  budgetCardSelected: { 
    borderColor: '#F5A623', backgroundColor: '#FFF3DC',
    shadowColor: '#F5A623', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  budgetEmoji: { fontSize: 22 },
  budgetLabel: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.cream },
  budgetRange: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, marginTop: 2 },
  popularBadge: {
    backgroundColor: Colors.gold20, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: Colors.gold,
  },
  popularText: { fontFamily: Typography.sans, fontSize: 10, color: Colors.navy },
  customInputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.navyLight, borderRadius: Layout.radiusMd,
    padding: Layout.md, gap: Layout.sm, borderWidth: 1, borderColor: Colors.gold,
  },
  customPrefix: { fontFamily: Typography.sansExtraBold, fontSize: Typography.xl, color: Colors.gold },
  customInput: { flex: 1, fontFamily: Typography.sansExtraBold, fontSize: Typography.xl, color: Colors.cream },
  customSuffix: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted },
  budgetPreview: {
    backgroundColor: Colors.navyCard, borderRadius: Layout.radiusMd,
    padding: Layout.md, borderWidth: 1, borderColor: Colors.navyBorder, marginTop: Layout.sm,
  },
  budgetPreviewTitle: { fontFamily: Typography.sansBold, fontSize: Typography.xs, color: Colors.creamMuted, marginBottom: Layout.sm },
  budgetPreviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetPreviewLabel: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted },
  budgetPreviewVal: { fontFamily: Typography.sansBold, fontSize: Typography.xs, color: Colors.cream },

  // Min budget estimate card
  minBudgetCard: {
    backgroundColor: Colors.navyCard, borderRadius: 14,
    padding: Layout.md, marginTop: Layout.lg,
    borderWidth: 1, borderColor: Colors.gold20,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 3,
  },
  minBudgetTitle: { fontFamily: Typography.sansBold, fontSize: Typography.xs, color: Colors.cream },
  minBudgetLabel: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted },
  minBudgetVal: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream },

  // Group
  groupGrid: { flexDirection: 'row', gap: Layout.sm, marginBottom: Layout.lg },
  groupCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.navyCard, borderRadius: 12,
    paddingVertical: Layout.lg, borderWidth: 1.5, borderColor: Colors.border, gap: Layout.xs,
  },
  groupCardSelected: { 
    borderColor: Colors.gold, backgroundColor: Colors.gold10,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  groupIcon: { fontSize: 26 },
  groupLabel: { fontFamily: Typography.sansSemiBold, fontSize: Typography.xs, color: Colors.cream, textAlign: 'center' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.navyCard, borderRadius: Layout.radiusMd,
    padding: Layout.md, borderWidth: 1, borderColor: Colors.navyBorder, marginTop: Layout.md,
  },
  toggleLabel: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.cream },
  toggleNote: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, marginTop: 2 },
  toggle: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.navyBorder, alignItems: 'center', justifyContent: 'center',
  },
  toggleActive: { backgroundColor: Colors.gold },
  toggleText: { fontFamily: Typography.sansBold, fontSize: 14, color: Colors.navy },

  vibeCard: {
    borderRadius: 16,
    backgroundColor: Colors.navyCard,
    borderWidth: 1.5, borderColor: Colors.border,
    marginBottom: 10, overflow: 'hidden',
  },
  vibeCardInner: { flexDirection: 'row', alignItems: 'center', padding: Layout.md, gap: Layout.md },
  vibeIcon: { fontSize: 28 },
  vibeLabel: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.cream },
  vibeDesc: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted, marginTop: 4 },

  summaryCard: {
    backgroundColor: Colors.navyCard, borderRadius: 16,
    padding: 18, marginTop: Layout.xl,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  summaryTitle: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.cream, marginBottom: Layout.md },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  summaryLabel: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted },
  summaryVal: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.cream },

  footer: {
    paddingHorizontal: Layout.md, paddingTop: Layout.sm,
    backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  nextBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  nextBtnActive: { 
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
  },
  nextBtnDisabledStyle: { backgroundColor: Colors.navyLight },
  nextBtnDisabled: {},
  nextBtnGrad: { paddingVertical: Layout.md + 2, alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.cream, letterSpacing: 0.3 },
  noteText: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamSubtle, textAlign: 'center', marginTop: Layout.md },

  // AI thinking overlay
  aiOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Layout.xl },
  aiContent: { alignItems: 'center', width: '100%' },
  brainIcon: { fontSize: 72, marginBottom: Layout.lg },
  aiTitle: { fontFamily: Typography.serif, fontSize: 26, color: Colors.cream, textAlign: 'center', marginBottom: Layout.sm, lineHeight: 34 },
  routeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.gold20, borderRadius: 20,
    paddingHorizontal: Layout.md, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.gold, marginBottom: Layout.md,
  },
  routeTagText: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.gold },
  aiMessage: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted, textAlign: 'center', marginTop: Layout.sm },
  aiSteps: { width: '100%', marginTop: Layout.xl, gap: 10 },
  aiStep: { flexDirection: 'row', alignItems: 'center', gap: Layout.sm },
  aiStepDot: { fontSize: 16, width: 24 },
  aiStepText: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.creamMuted, flex: 1 },
  aiNote: {
    fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.gold,
    marginTop: Layout.xl, opacity: 0.7, textAlign: 'center',
  },
});
