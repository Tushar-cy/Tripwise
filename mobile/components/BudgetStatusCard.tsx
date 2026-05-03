import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Layout } from '../constants/Layout';
import type { BudgetStatus } from '../lib/budgetGuard';

// ─── Alternative hotel slice ──────────────────────────────────────────────────

interface AlternativeHotel {
  id: string;
  name: string;
  pricePerNight: number;
  stars?: number;
}

interface BudgetStatusCardProps {
  status: BudgetStatus;
  /** Label for the category (e.g. "Hotel", "Transport") */
  category: string;
  /** Pass hotel list when severity === 'over' to show alternatives */
  alternatives?: AlternativeHotel[];
  /** The currently viewed item's price — used to compute "Save ₹X" */
  currentPrice?: number;
  /** Called when user taps an alternative hotel */
  onSelectAlternative?: (hotel: AlternativeHotel) => void;
}

// ─── Severity config ──────────────────────────────────────────────────────────

const CONFIG = {
  ok: {
    bg: 'rgba(34,197,94,0.10)',
    border: Colors.success,
    iconName: 'checkmark-circle' as const,
    iconColor: Colors.success,
    barColor: Colors.success,
    textColor: Colors.success,
  },
  tight: {
    bg: 'rgba(245,158,11,0.12)',
    border: Colors.warning,
    iconName: 'warning' as const,
    iconColor: Colors.warning,
    barColor: Colors.warning,
    textColor: Colors.warning,
  },
  over: {
    bg: 'rgba(239,68,68,0.10)',
    border: Colors.danger,
    iconName: 'close-circle' as const,
    iconColor: Colors.danger,
    barColor: Colors.danger,
    textColor: Colors.danger,
  },
};

// ─── Progress bar component ───────────────────────────────────────────────────

function BudgetBar({ pct, color }: { pct: number; color: string }) {
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: Math.min(pct, 100),
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={styles.barTrack}>
      <Animated.View
        style={[
          styles.barFill,
          {
            backgroundColor: color,
            width: barAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
      {/* Overflow indicator */}
      {pct > 100 && (
        <View style={[styles.barOverflow, { backgroundColor: Colors.danger }]} />
      )}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BudgetStatusCard({
  status,
  category,
  alternatives = [],
  currentPrice = 0,
  onSelectAlternative,
}: BudgetStatusCardProps) {
  const cfg = CONFIG[status.severity];
  const slideAnim = useRef(new Animated.Value(8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [status.severity]);

  // Filter alternatives that are cheaper AND within a 90% budget threshold
  const cheaperAlternatives = alternatives
    .filter((h) => h.pricePerNight < currentPrice)
    .slice(0, 3);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* ── Header row ── */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name={cfg.iconName} size={20} color={cfg.iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.mainMessage, { color: cfg.textColor }]}>
            {status.message}
          </Text>
          {status.severity !== 'ok' && status.suggestion !== '' && (
            <Text style={styles.suggestion}>{status.suggestion}</Text>
          )}
        </View>
        {/* Percent badge */}
        <View style={[styles.pctBadge, { borderColor: cfg.border + '60' }]}>
          <Text style={[styles.pctText, { color: cfg.textColor }]}>
            {status.percentUsed}%
          </Text>
        </View>
      </View>

      {/* ── Progress bar ── */}
      <BudgetBar pct={status.percentUsed} color={cfg.barColor} />

      {/* ── Budget labels ── */}
      <View style={styles.labelsRow}>
        <Text style={styles.labelLeft}>{category} Budget</Text>
        <Text style={[styles.labelRight, { color: cfg.textColor }]}>
          {status.severity === 'over'
            ? `₹${Math.round(Math.abs(status.overBy)).toLocaleString('en-IN')} over`
            : `₹${Math.round(Math.max(status.remaining, 0)).toLocaleString('en-IN')} remaining`}
        </Text>
      </View>

      {/* ── Alternatives (only when over budget) ── */}
      {status.severity === 'over' && cheaperAlternatives.length > 0 && (
        <View style={styles.altSection}>
          <View style={styles.altDivider} />
          <Text style={styles.altTitle}>💡 Budget-friendly alternatives:</Text>
          {cheaperAlternatives.map((alt) => {
            const saving = currentPrice - alt.pricePerNight;
            return (
              <TouchableOpacity
                key={alt.id}
                style={styles.altItem}
                onPress={() => onSelectAlternative?.(alt)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.altName} numberOfLines={1}>
                    {'⭐'.repeat(alt.stars || 3)} {alt.name}
                  </Text>
                  <Text style={styles.altPrice}>
                    ₹{alt.pricePerNight.toLocaleString('en-IN')}/night
                  </Text>
                </View>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveText}>
                    Save ₹{Math.round(saving).toLocaleString('en-IN')}/night
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
}

// ─── Trip Health Summary Card ─────────────────────────────────────────────────
// Used on budget-detail.tsx to show overall trip health

interface TripHealthCardProps {
  healthLabel: string;
  healthColor: string;
  healthScore: number;
  committedBudget: number;
  totalBudget: number;
  remainingForFood: number;
  remainingForLocal: number;
  bufferRemaining: number;
  hotelSelected: number;
}

export function TripHealthCard({
  healthLabel,
  healthColor,
  healthScore,
  committedBudget,
  totalBudget,
  remainingForFood,
  remainingForLocal,
  bufferRemaining,
  hotelSelected,
}: TripHealthCardProps) {
  const pct = totalBudget > 0 ? Math.round((committedBudget / totalBudget) * 100) : 0;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, { toValue: Math.min(pct, 100), duration: 800, useNativeDriver: false }).start();
  }, [pct]);

  return (
    <View style={styles.healthCard}>
      {/* Title */}
      <View style={styles.healthTitleRow}>
        <Ionicons name="shield-checkmark" size={18} color={healthColor} />
        <Text style={styles.healthTitle}>Budget Health</Text>
        <View style={[styles.healthBadge, { backgroundColor: healthColor + '25', borderColor: healthColor + '60' }]}>
          <Text style={[styles.healthBadgeText, { color: healthColor }]}>{healthLabel}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: healthColor,
              width: barAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
      <Text style={styles.healthPct}>{pct}% of budget committed</Text>

      {/* Breakdown grid */}
      <View style={styles.healthGrid}>
        {[
          { label: '🏨 Hotel', value: hotelSelected, color: Colors.gold },
          { label: '🍛 Food Left', value: remainingForFood, color: Colors.success },
          { label: '🛍️ Local Left', value: remainingForLocal, color: Colors.creamMuted },
          { label: '🔒 Buffer', value: bufferRemaining, color: Colors.creamSubtle },
        ].map((item) => (
          <View key={item.label} style={styles.healthCell}>
            <Text style={styles.healthCellLabel}>{item.label}</Text>
            <Text style={[styles.healthCellValue, { color: item.color }]}>
              ₹{Math.round(item.value).toLocaleString('en-IN')}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 10,
    marginVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainMessage: {
    fontFamily: Typography.sansBold,
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  suggestion: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.creamMuted,
    marginTop: 3,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  pctBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pctText: {
    fontFamily: Typography.sansExtraBold,
    fontSize: 11,
  },

  // Bar
  barTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  barOverflow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 3,
  },

  // Labels
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelLeft: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.creamSubtle,
  },
  labelRight: {
    fontFamily: Typography.sansBold,
    fontSize: Typography.xs,
  },

  // Alternatives
  altSection: {
    gap: 8,
  },
  altDivider: {
    height: 1,
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  altTitle: {
    fontFamily: Typography.sansBold,
    fontSize: Typography.xs,
    color: Colors.creamMuted,
  },
  altItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  altName: {
    fontFamily: Typography.sansBold,
    fontSize: Typography.xs,
    color: Colors.cream,
  },
  altPrice: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.creamSubtle,
    marginTop: 2,
  },
  saveBadge: {
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  saveText: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    color: Colors.success,
  },

  // Health card
  healthCard: {
    backgroundColor: Colors.navyCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    marginHorizontal: Layout.md,
    marginBottom: Layout.md,
    gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  healthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthTitle: {
    fontFamily: Typography.sansExtraBold,
    fontSize: Typography.base,
    color: Colors.cream,
    flex: 1,
  },
  healthBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  healthBadgeText: {
    fontFamily: Typography.sansBold,
    fontSize: 11,
  },
  healthPct: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.creamSubtle,
    textAlign: 'right',
    marginTop: -6,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  healthCell: {
    width: '47%',
    backgroundColor: Colors.navyLight,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  healthCellLabel: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.creamSubtle,
  },
  healthCellValue: {
    fontFamily: Typography.sansExtraBold,
    fontSize: Typography.sm,
  },
});
