import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Layout } from '../constants/Layout';
import { useTripStore } from '../store/tripStore';
import { safetyAPI } from '../lib/api';

const LEVEL_CONFIG = {
  green: { color: '#16A34A', bg: '#F0FDF4', borderColor: '#16A34A', label: 'Safe to Travel', icon: '✅', gradient: ['#0A2E1E', '#0F3D28'] },
  orange: { color: '#D97706', bg: '#FFFBEB', borderColor: '#D97706', label: 'Exercise Caution', icon: '⚠️', gradient: ['#2E1A05', '#3A2210'] },
  red: { color: '#DC2626', bg: '#FEF2F2', borderColor: '#DC2626', label: 'High Alert', icon: '🚨', gradient: ['#2E0808', '#3D0F0F'] },
};

const CATEGORY_ICONS: Record<string, string> = {
  'Tourist Scam': '🎭',
  'Beach Safety': '🏖️',
  'Road Safety': '🛣️',
  'Altitude Sickness': '🏔️',
  'Flash Floods': '🌊',
  'Nightlife Safety': '🌃',
  'Scooter Rental': '🛵',
  'Crowd Safety': '👥',
  'Scam': '⚠️',
  'Air Quality': '💨',
  'River Safety': '🌊',
  'Traffic': '🚗',
  'General': '📋',
};

export default function SafetyScreen() {
  const insets = useSafeAreaInsets();
  const { destination } = useTripStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSafety();
  }, [destination]);

  const loadSafety = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await safetyAPI.get(destination || 'jaipur') as any;
      setData(result);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (err: any) {
      setError(err.message || 'Failed to load safety data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.gold} size="large" />
        <Text style={styles.loadingText}>Checking safety conditions...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error || 'No data'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadSafety}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const levelConfig = LEVEL_CONFIG[data.overallLevel as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.green;
  const redAlerts = data.alerts?.filter((a: any) => a.level === 'red') || [];
  const orangeAlerts = data.alerts?.filter((a: any) => a.level === 'orange') || [];
  const greenAlerts = data.alerts?.filter((a: any) => a.level === 'green') || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Safety & Alerts</Text>
          <Text style={styles.headerSub}>{data.destination}, {data.state}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadSafety}>
          <Ionicons name="refresh" size={18} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false}>
        {/* Alert Level Banner — light bg, colored border */}
        <View style={[styles.alertBanner, { backgroundColor: levelConfig.bg, borderColor: levelConfig.borderColor }]}>
          <Text style={styles.alertBannerIcon}>{levelConfig.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertBannerLevel, { color: levelConfig.color }]}>{levelConfig.label}</Text>
            <Text style={styles.alertBannerNote}>{data.safetyNote}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#EF4444' }]}>{redAlerts.length}</Text>
            <Text style={styles.statLabel}>Red Alerts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#D97706' }]}>{orangeAlerts.length}</Text>
            <Text style={styles.statLabel}>Caution</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#16A34A' }]}>{greenAlerts.length}</Text>
            <Text style={styles.statLabel}>Info</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: Colors.gold }]}>{data.prohibitedAreas?.length || 0}</Text>
            <Text style={styles.statLabel}>Restricted</Text>
          </View>
        </View>

        <View style={styles.section}>
          {/* Alerts */}
          {data.alerts?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>⚡ Active Alerts</Text>
              {[...redAlerts, ...orangeAlerts, ...greenAlerts].map((alert: any, i: number) => {
                const alertColors = {
                  red: { border: '#DC2626', bg: '#FEF2F2', text: '#DC2626' },
                  orange: { border: '#D97706', bg: '#FFFBEB', text: '#D97706' },
                  green: { border: '#16A34A', bg: '#F0FDF4', text: '#16A34A' },
                };
                const ac = alertColors[alert.level as keyof typeof alertColors] || alertColors.green;

                return (
                  <View key={i} style={[styles.alertCard, { borderLeftColor: ac.border, backgroundColor: ac.bg }]}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertCat}>{CATEGORY_ICONS[alert.category] || '⚠️'} {alert.category}</Text>
                      <View style={[styles.alertBadge, { backgroundColor: ac.border + '20', borderColor: ac.border }]}>
                        <Text style={[styles.alertBadgeText, { color: ac.border }]}>{alert.level.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertDesc}>{alert.description}</Text>
                    {alert.area && (
                      <View style={styles.alertArea}>
                        <Ionicons name="location" size={12} color="#9B96A8" />
                        <Text style={styles.alertAreaText}>{alert.area}</Text>
                      </View>
                    )}
                    {alert.actionable && (
                      <View style={[styles.actionableBox, { borderColor: ac.border + '50', backgroundColor: '#FFFFFF' }]}>
                        <Text style={[styles.actionableText, { color: ac.text }]}>{alert.actionable}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {/* Prohibited Areas */}
          {data.prohibitedAreas?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🚫 Restricted Areas</Text>
              {data.prohibitedAreas.map((area: string, i: number) => (
                <View key={i} style={styles.prohibitedRow}>
                  <Ionicons name="ban" size={16} color="#EF4444" />
                  <Text style={styles.prohibitedText}>{area}</Text>
                </View>
              ))}
            </>
          )}

          {/* Emergency Contacts */}
          <Text style={styles.sectionTitle}>📞 Emergency Contacts</Text>
          <View style={styles.contactsGrid}>
            {Object.entries(data.emergencyContacts || {}).map(([key, number]) => {
              const labels: Record<string, { label: string; color: string; icon: string }> = {
                police: { label: 'Police', color: '#3B82F6', icon: '👮' },
                ambulance: { label: 'Ambulance', color: '#EF4444', icon: '🚑' },
                touristHelpline: { label: 'Tourist Helpline', color: '#10B981', icon: '🎒' },
                fireStation: { label: 'Fire Station', color: '#F97316', icon: '🚒' },
                mountainRescue: { label: 'Mountain Rescue', color: '#8B5CF6', icon: '⛰️' },
                coastGuard: { label: 'Coast Guard', color: '#0EA5E9', icon: '⚓' },
                ghatsPolice: { label: 'Ghats Police', color: '#3B82F6', icon: '👮' },
                hrtcBulletin: { label: 'HRTC Bulletin', color: '#F59E0B', icon: '🗺️' },
                raftingRescue: { label: 'Rafting Rescue', color: '#06B6D4', icon: '🌊' },
              };
              const info = labels[key] || { label: key, color: Colors.gold, icon: '📞' };
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.contactCard, { borderColor: info.color + '40' }]}
                  onPress={() => Linking.openURL(`tel:${number}`)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.contactIcon}>{info.icon}</Text>
                  <Text style={styles.contactLabel}>{info.label}</Text>
                  <Text style={[styles.contactNumber, { color: info.color }]}>{String(number)}</Text>
                  <View style={[styles.callBtn, { backgroundColor: info.color }]}>
                    <Ionicons name="call" size={12} color="white" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* General Safety Tips */}
          <Text style={styles.sectionTitle}>💡 Safety Tips</Text>
          {data.safetyTips?.map((tip: string, i: number) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFAF6' },
  center: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: Layout.sm,
    paddingHorizontal: Layout.md, paddingVertical: Layout.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#EDE8E0',
  },
  backBtn: {
    width: 38, height: 38, backgroundColor: '#F4EFE8',
    borderRadius: 19, alignItems: 'center', justifyContent: 'center',
  },
  refreshBtn: {
    width: 38, height: 38, backgroundColor: '#FFFFFF',
    borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#EDE8E0',
  },
  headerTitle: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: '#1A1A2E' },
  headerSub: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#5C5C7A' },

  // Alert banner — light bg, colored border
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Layout.md,
    margin: Layout.md, borderRadius: 20, padding: Layout.md,
    borderWidth: 2,
  },
  alertBannerIcon: { fontSize: 36 },
  alertBannerLevel: { fontFamily: Typography.serif, fontSize: Typography.xxl, marginBottom: 2 },
  alertBannerNote: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#5C5C7A' },

  // Stats row
  statsRow: {
    flexDirection: 'row', gap: Layout.sm,
    paddingHorizontal: Layout.md, marginBottom: Layout.sm,
  },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: Layout.radiusMd,
    padding: Layout.sm, alignItems: 'center', borderWidth: 1, borderColor: '#EDE8E0',
  },
  statNum: { fontFamily: Typography.serif, fontSize: 24 },
  statLabel: { fontFamily: Typography.sans, fontSize: 10, color: '#9B96A8', marginTop: 2 },

  section: { paddingHorizontal: Layout.md },
  sectionTitle: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: '#1A1A2E', marginTop: Layout.lg, marginBottom: Layout.sm },

  // Alert cards — light bg based on severity
  alertCard: {
    borderLeftWidth: 4, borderRadius: Layout.radiusMd, padding: Layout.md,
    marginBottom: Layout.sm, borderWidth: 1, borderColor: 'transparent',
    shadowColor: '#C4A882', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  alertCat: { fontFamily: Typography.sansSemiBold, fontSize: Typography.xs, color: '#5C5C7A' },
  alertBadge: {
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1,
  },
  alertBadgeText: { fontFamily: Typography.sansBold, fontSize: 9, letterSpacing: 0.5 },
  alertTitle: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: '#1A1A2E', marginBottom: 4 },
  alertDesc: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#5C5C7A', lineHeight: 18 },
  alertArea: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  alertAreaText: { fontFamily: Typography.sans, fontSize: 10, color: '#9B96A8' },
  actionableBox: {
    borderWidth: 1, borderRadius: 6, padding: 8, marginTop: 8,
  },
  actionableText: { fontFamily: Typography.sans, fontSize: Typography.xs, lineHeight: 18 },

  prohibitedRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Layout.sm,
    backgroundColor: '#FEF2F2', borderRadius: Layout.radiusMd,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#FECACA',
  },
  prohibitedText: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#DC2626', flex: 1, lineHeight: 18 },

  contactsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.sm },
  contactCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: Layout.radiusMd,
    padding: Layout.sm, borderWidth: 1, alignItems: 'center', gap: 4,
    shadowColor: '#C4A882', shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  contactIcon: { fontSize: 24 },
  contactLabel: { fontFamily: Typography.sans, fontSize: 10, color: '#5C5C7A', textAlign: 'center' },
  contactNumber: { fontFamily: Typography.sansBold, fontSize: Typography.sm, textAlign: 'center' },
  callBtn: { borderRadius: 12, padding: 4, marginTop: 2 },

  tipRow: {
    backgroundColor: '#FFFFFF', borderRadius: 8, padding: 10,
    marginBottom: 6, borderWidth: 1, borderColor: '#EDE8E0',
    borderLeftWidth: 3, borderLeftColor: '#F5A623',
  },
  tipText: { fontFamily: Typography.sans, fontSize: Typography.xs, color: '#5C5C7A', lineHeight: 18 },

  loadingText: { fontFamily: Typography.sans, fontSize: Typography.sm, color: '#5C5C7A', marginTop: Layout.md },
  errorIcon: { fontSize: 48, marginBottom: Layout.md },
  errorText: { fontFamily: Typography.sans, fontSize: Typography.sm, color: '#5C5C7A', textAlign: 'center' },
  retryBtn: { marginTop: Layout.md, backgroundColor: Colors.gold, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.navy },
});
