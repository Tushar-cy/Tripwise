/**
 * Skeleton.tsx
 * Shimmer skeleton loader — replaces ActivityIndicator on data-loading screens.
 *
 * Usage:
 *   <SkeletonBlock height={120} borderRadius={16} />
 *   <SkeletonRow />   — thin line skeleton
 *   <SkeletonCard />  — full card preset
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Layout } from '../constants/Layout';

interface SkeletonBlockProps {
  height: number;
  width?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBlock({ height, width, borderRadius = 12, style }: SkeletonBlockProps) {
  const shimmerAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 300,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View
      style={[
        {
          height,
          width: width as any,
          borderRadius,
          backgroundColor: '#F4EFE8',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'rgba(255,255,255,0.6)',
            transform: [{ translateX: shimmerAnim }],
          },
        ]}
      />
    </View>
  );
}

// ── Preset: single thin line ────────────────────────────────────────────────
export function SkeletonRow({ width = '70%' }: { width?: string | number }) {
  return <SkeletonBlock height={14} width={width} borderRadius={8} />;
}

// ── Preset: full card (image thumb + two rows of text) ──────────────────────
export function SkeletonCard() {
  return (
    <View style={skStyles.card}>
      {/* Image area */}
      <SkeletonBlock height={130} borderRadius={0} />
      {/* Text rows */}
      <View style={skStyles.content}>
        <SkeletonRow width="60%" />
        <SkeletonRow width="40%" />
        <View style={skStyles.rowGroup}>
          <SkeletonBlock height={28} width={80} borderRadius={20} />
          <SkeletonBlock height={28} width={90} borderRadius={20} />
        </View>
      </View>
    </View>
  );
}

// ── Preset: horizontal strip of 3 cards ─────────────────────────────────────
export function SkeletonCardStrip() {
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: 200,
            borderRadius: 16,
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#EDE8E0',
          }}
        >
          <SkeletonBlock height={130} borderRadius={0} />
          <View style={{ padding: 12, gap: 8 }}>
            <SkeletonRow width="65%" />
            <SkeletonRow width="45%" />
          </View>
        </View>
      ))}
    </View>
  );
}

const skStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDE8E0',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  content: { padding: 14, gap: 10 },
  rowGroup: { flexDirection: 'row', gap: 8, marginTop: 4 },
});
