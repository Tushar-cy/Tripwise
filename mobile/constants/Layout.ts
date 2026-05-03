import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Layout = {
  // Screen dimensions
  screenWidth: width,
  screenHeight: height,

  // Spacing scale
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Border radii
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  radiusPill: 999,

  // Component sizes
  tabBarHeight: 80,
  headerHeight: 60,
  cardWidth: width * 0.72,
  trendingCardWidth: width * 0.68,

  // Shadows (for card elevation)
  shadow: {
    shadowColor: '#C4A882',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  shadowGold: {
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  shadowSubtle: {
    shadowColor: '#C4A882',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;
