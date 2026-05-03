import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
  /** Use dark=true on navy/dark background screens (budget, hotels, weather, transport) */
  dark?: boolean;
}

export default function SkeletonCard({
  width = '100%',
  height = 100,
  borderRadius = 12,
  style,
  dark = false,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: dark ? [0.15, 0.35] : [0.3, 0.65],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: dark ? '#4A5568' : '#D1D5DB',
          opacity,
        },
        style,
      ]}
    />
  );
}
