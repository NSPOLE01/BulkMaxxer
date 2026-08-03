// Sunset Surplus — warm cream & terracotta theme, from the BulkMaxxer Claude Design.

export const colors = {
  bg: '#F8ECD9',
  bgGradientTop: '#FDF2E1',
  bgGradientBottom: '#F5DDB7',
  card: '#FFF9F0',
  cardAlt: '#FBEFDA',
  primary: '#DD6B35',
  primaryDark: '#B04E22',
  secondary: '#6B8552',
  accent: '#EFA94E',
  text: '#3A2A18',
  muted: '#9C8968',
  border: 'rgba(90,70,48,0.28)',
  borderLight: 'rgba(90,70,48,0.14)',
  track: 'rgba(58,42,24,0.08)',
  white: '#FFFFFF',
  danger: '#C1442E',
  dangerDark: '#96331F',
  dangerBg: '#FBE2D8',
  dangerBorder: 'rgba(150,51,31,0.32)',
};

export const gradients = {
  background: [colors.bgGradientTop, colors.bgGradientBottom] as const,
  primary: [colors.primary, colors.primaryDark] as const,
  danger: [colors.danger, colors.dangerDark] as const,
};

export const fonts = {
  headline: 'Poppins_700Bold',
  headlineSemiBold: 'Poppins_600SemiBold',
  headlineMedium: 'Poppins_500Medium',
  body: 'Nunito_400Regular',
  bodySemiBold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyExtraBold: 'Nunito_800ExtraBold',
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 22,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#3A2A18',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  soft: {
    shadowColor: '#3A2A18',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
};
