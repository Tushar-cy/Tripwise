export const Typography = {
  // Font families (as loaded by @expo-google-fonts)
  serif: 'DMSerifDisplay_400Regular',
  sans: 'Nunito_400Regular',
  sansSemiBold: 'Nunito_600SemiBold',
  sansBold: 'Nunito_700Bold',
  sansExtraBold: 'Nunito_800ExtraBold',

  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,
  display: 48,
  hero: 64,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,

  // Letter spacings
  tight_ls: -0.5,
  normal_ls: 0,
  wide_ls: 0.5,
  wider_ls: 1,
} as const;
