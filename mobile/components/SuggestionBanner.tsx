import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Layout } from '../constants/Layout';
import {
  getSuggestion,
  type SuggestionContext,
  type SmartSuggestion,
} from '../lib/smartSuggestions';

interface SuggestionBannerProps {
  context: SuggestionContext;
  /** Pass the object being evaluated (hotel, transport option, etc.) */
  selection?: Record<string, any>;
  /** Optional trigger key — when it changes, the banner re-fetches */
  triggerKey?: string | number;
  /** Whether to show immediately (true) or only after first triggerKey change */
  autoShow?: boolean;
}

const SOURCE_LABEL: Record<string, string> = {
  edge: '✨ Claude AI',
  ollama: '🧠 Ollama AI',
  local: '⚡ Smart Tip',
};

export default function SuggestionBanner({
  context,
  selection = {},
  triggerKey,
  autoShow = false,
}: SuggestionBannerProps) {
  const [suggestion, setSuggestion] = useState<SmartSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(autoShow);

  const slideAnim = useRef(new Animated.Value(-120)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const prevTriggerKey = useRef<string | number | undefined>(undefined);

  // ── Fetch suggestion ──────────────────────────────────────────────────────
  const fetchSuggestion = useCallback(async () => {
    setIsLoading(true);
    setDismissed(false);
    setVisible(true);
    try {
      const result = await getSuggestion(context, selection);
      setSuggestion(result);
    } catch {
      setSuggestion({
        suggestion: 'Tip: Always keep 10% of your budget untouched as a travel safety net.',
        alternatives: [],
        savingsOpportunity: 0,
        source: 'local',
      });
    } finally {
      setIsLoading(false);
    }
  }, [context, JSON.stringify(selection)]);

  // ── Show / hide animation ─────────────────────────────────────────────────
  useEffect(() => {
    if (visible && !dismissed) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      // Animate the icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [visible, dismissed]);

  // ── Re-fetch when trigger key changes ────────────────────────────────────
  useEffect(() => {
    if (triggerKey !== undefined && triggerKey !== prevTriggerKey.current) {
      prevTriggerKey.current = triggerKey;
      fetchSuggestion();
    }
  }, [triggerKey]);

  // ── Auto-show on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (autoShow) fetchSuggestion();
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -120, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setDismissed(true));
  };

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '10deg'] });

  if (!visible || dismissed) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <LinearGradient
        colors={['rgba(26,39,68,0.98)', 'rgba(22,32,53,0.98)']}
        style={styles.gradient}
      >
        {/* Top row */}
        <View style={styles.topRow}>
          <Animated.Text style={[styles.icon, { transform: [{ rotate: spin }] }]}>
            🧠
          </Animated.Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Smart Suggestion</Text>
            {suggestion && (
              <Text style={styles.source}>{SOURCE_LABEL[suggestion.source]}</Text>
            )}
          </View>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color={Colors.creamSubtle} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={Colors.gold} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        ) : suggestion ? (
          <>
            <Text style={styles.suggestionText}>{suggestion.suggestion}</Text>

            {/* Savings chip */}
            {suggestion.savingsOpportunity > 0 && (
              <View style={styles.savingsChip}>
                <Ionicons name="trending-down" size={12} color={Colors.success} />
                <Text style={styles.savingsText}>
                  Save up to ₹{suggestion.savingsOpportunity.toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            {/* Alternatives */}
            {suggestion.alternatives.length > 0 && (
              <View style={styles.altsRow}>
                <Text style={styles.altLabel}>Try:</Text>
                {suggestion.alternatives.slice(0, 2).map((alt, i) => (
                  <View key={i} style={styles.altChip}>
                    <Text style={styles.altChipText}>{alt}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : null}
      </LinearGradient>

      {/* Gold left accent */}
      <View style={styles.leftAccent} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Layout.md,
    marginVertical: 6,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gold + '40',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  gradient: {
    padding: 14,
    paddingLeft: 18,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: Typography.sansExtraBold,
    fontSize: Typography.xs,
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  source: {
    fontFamily: Typography.sans,
    fontSize: 10,
    color: Colors.creamSubtle,
  },
  closeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white10,
    borderRadius: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  loadingText: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.creamMuted,
    fontStyle: 'italic',
  },
  suggestionText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.cream,
    lineHeight: 21,
  },
  savingsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: Colors.successLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  savingsText: {
    fontFamily: Typography.sansBold,
    fontSize: 11,
    color: Colors.success,
  },
  altsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  altLabel: {
    fontFamily: Typography.sansBold,
    fontSize: Typography.xs,
    color: Colors.creamSubtle,
  },
  altChip: {
    backgroundColor: Colors.navyLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
  },
  altChipText: {
    fontFamily: Typography.sans,
    fontSize: 11,
    color: Colors.creamMuted,
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.gold,
  },
});
