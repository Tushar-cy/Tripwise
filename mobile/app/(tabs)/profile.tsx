import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Layout } from '../../constants/Layout';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';

interface MenuItem {
  icon: string;
  label: string;
  sub: string;
  action: (() => void) | null;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}


export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { savedTrips } = useTripStore();
  const { user, isGuest, isLocalUser, userName, userPhone, signOut } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);

  const displayName = userName || 'Traveller';
  const displayContact = userPhone
    ? `+91 ${userPhone.replace('+91', '').slice(0, 5)}xxxxx`
    : user?.email || (isLocalUser ? 'Local Account' : isGuest ? 'Guest Mode' : '');
  const initial = displayName.charAt(0).toUpperCase();
  const totalDays = savedTrips.reduce((a, t) => a + (t.days || 0), 0);
  const totalSpend = savedTrips.reduce((a, t) => a + (t.totalBudget || 0), 0);

  const handleSignOut = () => {
    Alert.alert(
      isGuest ? 'Leave Guest Mode' : 'Sign Out',
      isGuest
        ? 'Your local trip data will be cleared.'
        : 'You will be signed out. Your trips are safely saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isGuest ? 'Leave' : 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            await signOut();
            router.replace('/auth' as any);
          },
        },
      ]
    );
  };

  const handlePreference = (label: string, options: string[]) => {
    Alert.alert(
      label,
      `Select your preferred ${label.toLowerCase()}`,
      options.map(opt => ({
        text: opt,
        onPress: () => Alert.alert('Saved', `${label} set to ${opt}`),
      })).concat([{ text: 'Cancel', style: 'cancel', onPress: () => {} }] as any) as any
    );
  };

  const MENU_SECTIONS: MenuSection[] = [
    {
      title: 'Preferences',
      items: [
        { icon: 'moon', label: 'Appearance', sub: 'Dark theme', action: () => handlePreference('Appearance', ['System Default', 'Light Theme', 'Dark Theme']) },
        { icon: 'language', label: 'Language', sub: 'English', action: () => handlePreference('Language', ['English', 'Hindi', 'Marathi']) },
        { icon: 'restaurant', label: 'Dietary Preference', sub: 'All cuisines', action: () => handlePreference('Dietary Preference', ['All Cuisines', 'Pure Veg', 'Jain', 'Vegan']) },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: 'notifications', label: 'Notifications', sub: 'All alerts on', action: () => handlePreference('Notifications', ['All Alerts', 'Important Only', 'Mute All']) },
        { icon: 'shield-checkmark', label: 'Privacy & Data', sub: 'DPDP Act compliant', action: () => Alert.alert('Privacy & Data', 'Your data is securely stored and complies with the DPDP Act.') },
        { icon: 'help-circle', label: 'Help & Support', sub: 'FAQs & contact', action: () => Alert.alert('Help & Support', 'Email us at support@tripwise.com for assistance.') },
      ],
    },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Premium Dark Header ── */}
        <LinearGradient
          colors={['#060D1F', '#0A1628', '#0F1A35']}
          style={styles.profileHeader}
        >
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </LinearGradient>
            <View style={styles.avatarGlow} />
          </View>

          <Text style={styles.profileName}>{displayName}</Text>

          {/* Badge */}
          <View style={styles.badgeRow}>
            {isGuest ? (
              <View style={[styles.badge, { borderColor: 'rgba(245,166,35,0.3)', backgroundColor: 'rgba(245,166,35,0.08)' }]}>
                <Ionicons name="person-outline" size={12} color={Colors.gold} />
                <Text style={[styles.badgeText, { color: Colors.gold }]}>Guest Mode</Text>
              </View>
            ) : (
              <View style={[styles.badge, { borderColor: 'rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.08)' }]}>
                <Ionicons name={isLocalUser ? 'phone-portrait-outline' : 'cloud-done-outline'} size={12} color={Colors.success} />
                <Text style={[styles.badgeText, { color: Colors.success }]}>{isLocalUser ? 'Local Account' : 'Cloud Synced'}</Text>
              </View>
            )}
            {displayContact && displayContact !== 'Guest Mode' && (
              <Text style={styles.profileContact}>{displayContact}</Text>
            )}
          </View>
        </LinearGradient>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {[
            { value: savedTrips.length, label: 'Trips', icon: '🗺️' },
            { value: totalDays, label: 'Days Planned', icon: '📅' },
            { value: `₹${totalSpend > 0 ? (totalSpend / 1000).toFixed(0) + 'k' : '0'}`, label: 'Budgeted', icon: '💰' },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statEmoji}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Guest upgrade ── */}
        {isGuest && (
          <TouchableOpacity
            style={styles.upgradeCard}
            onPress={() => router.replace('/auth' as any)}
            activeOpacity={0.88}
          >
            <LinearGradient colors={[Colors.gold + '20', Colors.gold + '08']} style={styles.upgradeInner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.upgradeTitle}>☁️ Sync trips to cloud</Text>
                <Text style={styles.upgradeSub}>Create a free account to save & access trips on any device</Text>
              </View>
              <View style={styles.upgradeBtn}>
                <Text style={styles.upgradeBtnText}>Sign Up</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── Pro Card ── */}
        {!isGuest && (
          <TouchableOpacity
            style={styles.proCard}
            activeOpacity={0.9}
            onPress={() => Alert.alert('TripWise Pro Upgrade', 'Pro unlocks unlimited AI plans, group sharing, and priority bookings.', [
              { text: 'Not Now', style: 'cancel' },
              { text: 'Upgrade - ₹499/mo', style: 'default', onPress: () => Alert.alert('Success', 'Welcome to TripWise Pro!') }
            ])}
          >
            <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.proGrad}>
              <View style={{ flex: 1 }}>
                <Text style={styles.proTitle}>✨ TripWise Pro</Text>
                <Text style={styles.proSubtitle}>Unlimited AI plans · Group trips · Priority support</Text>
              </View>
              <View style={styles.proBtn}>
                <Text style={styles.proBtnText}>Upgrade</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── Menu Sections ── */}
        {MENU_SECTIONS.map((section, si) => (
          <View key={si} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            {section.items.map((item, ii) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, ii === section.items.length - 1 && { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    Alert.alert(item.label, `${item.label} settings coming soon.`);
                  }
                }}
              >
                <View style={styles.menuIconCircle}>
                  <Ionicons name={item.icon as any} size={18} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.creamSubtle} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* ── Sign Out ── */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
          {signingOut ? (
            <ActivityIndicator size="small" color={Colors.danger} />
          ) : (
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          )}
          <Text style={styles.signOutText}>
            {isGuest ? 'Leave Guest Mode' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>TripWise v1.0.0 · Powered by Gemini AI ✨</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  profileHeader: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  avatarGlow: {
    position: 'absolute', top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: 44, borderWidth: 1.5, borderColor: Colors.gold20,
  },
  avatarLetter: { fontFamily: Typography.sansExtraBold, fontSize: 32, color: Colors.navy },
  profileName: { fontFamily: Typography.serif, fontSize: Typography.xxl, color: Colors.cream, marginTop: 4 },
  profileContact: { color: Colors.creamMuted, fontFamily: Typography.sans, fontSize: Typography.xs, marginTop: 2 },
  badgeRow: { alignItems: 'center', gap: 6, marginTop: 4 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  badgeText: { fontFamily: Typography.sansBold, fontSize: 11 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    margin: Layout.md,
    backgroundColor: Colors.navyCard,
    borderRadius: Layout.radiusLg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 18, paddingHorizontal: 4 },
  statEmoji: { fontSize: 20, marginBottom: 6 },
  statValue: { fontFamily: Typography.sansExtraBold, fontSize: Typography.lg, color: Colors.gold },
  statLabel: { fontFamily: Typography.sans, fontSize: 10, color: Colors.creamMuted, textAlign: 'center', marginTop: 2 },

  // Guest upgrade
  upgradeCard: { marginHorizontal: Layout.md, marginBottom: Layout.sm, borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.gold20 },
  upgradeInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  upgradeTitle: { fontFamily: Typography.sansBold, fontSize: Typography.sm, color: Colors.gold },
  upgradeSub: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, marginTop: 3, lineHeight: 17 },
  upgradeBtn: { backgroundColor: Colors.gold, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  upgradeBtnText: { fontFamily: Typography.sansBold, fontSize: Typography.xs, color: Colors.navy },

  // Pro card
  proCard: {
    marginHorizontal: Layout.md,
    marginBottom: Layout.sm,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  proGrad: {
    padding: 20, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  proTitle: { fontFamily: Typography.serif, fontSize: Typography.lg, color: Colors.navy },
  proSubtitle: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.navy + 'CC', marginTop: 2 },
  proBtn: {
    backgroundColor: Colors.navy,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  proBtnText: { color: Colors.gold, fontFamily: Typography.sansBold, fontSize: 13 },

  // Menu
  menuSection: {
    backgroundColor: Colors.navyCard,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    shadowOffset: { width: 0, height: 4 },
  },
  menuSectionTitle: {
    fontFamily: Typography.sansBold,
    fontSize: 11,
    color: Colors.creamSubtle,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 14,
  },
  menuIconCircle: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.gold10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.gold20,
  },
  menuLabel: { fontFamily: Typography.sansBold, fontSize: Typography.base, color: Colors.cream },
  menuSub: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamMuted, marginTop: 1 },

  // Sign out
  signOutBtn: {
    margin: 16,
    marginTop: 4,
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.danger + '40',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  signOutText: { color: Colors.danger, fontFamily: Typography.sansBold, fontSize: Typography.base },

  version: { textAlign: 'center', fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.creamSubtle, marginTop: Layout.sm, marginBottom: 8 },
});
