// ─────────────────────────────────────────────────────────────────────────────
// TripWise Design Tokens — Unified Premium Dark Theme
// All semantic names are truthful. No misleading aliases.
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // ── Core Backgrounds (Dark Theme) ────────────────────────────────────
  bg:          '#060D1F',   // deepest navy — root screen background
  bgCard:      '#0F1A35',   // card surfaces
  bgMuted:     '#152240',   // slightly lighter surfaces
  bgAccent:    '#1C2E52',   // hover / selected tint

  // ── Brand — Gold / Saffron ────────────────────────────────────────────
  gold:        '#F5A623',   // primary CTA, active highlights
  goldLight:   '#FFD285',   // shimmer, gradient end
  goldDark:    '#D4851A',   // pressed state
  goldGlow:    'rgba(245,166,35,0.30)',
  gold20:      'rgba(245,166,35,0.20)',
  gold10:      'rgba(245,166,35,0.10)',

  // keep saffron aliases for compatibility
  saffron:     '#F5A623',
  saffronDark: '#D4851A',
  saffronLight:'#FFD285',
  saffronTint: 'rgba(245,166,35,0.15)',
  saffron20:   'rgba(245,166,35,0.20)',
  saffron10:   'rgba(245,166,35,0.10)',

  // ── Text (all on dark backgrounds) ────────────────────────────────────
  textPrimary:   '#F1F5F9',   // high-contrast white-ish
  textSecondary: '#94A3B8',   // muted slate
  textMuted:     '#64748B',   // very muted
  textInverse:   '#060D1F',   // dark text for use on gold/light backgrounds

  // cream = semantic light text, for use on dark surfaces
  cream:         '#F1F5F9',   // bright readable text on dark bg
  creamMuted:    '#94A3B8',   // secondary text
  creamSubtle:   '#64748B',   // placeholder / hint text

  // ── Borders ───────────────────────────────────────────────────────────
  border:        'rgba(255,255,255,0.10)',
  borderStrong:  'rgba(255,255,255,0.20)',
  navyBorder:    'rgba(255,255,255,0.10)',

  // ── Navy aliases (used heavily in existing screens) ───────────────────
  navy:          '#060D1F',   // = bg (deep dark)
  navyLight:     '#152240',   // = bgMuted
  navyCard:      '#0F1A35',   // = bgCard
  navyDeep:      '#03070F',   // deeper than navy

  // ── Status ────────────────────────────────────────────────────────────
  success:      '#22C55E',
  successLight: 'rgba(34,197,94,0.15)',
  warning:      '#F59E0B',
  warningLight: 'rgba(245,158,11,0.15)',
  danger:       '#EF4444',
  dangerLight:  'rgba(239,68,68,0.15)',
  error:        '#EF4444',
  errorLight:   'rgba(239,68,68,0.15)',

  // ── Gradients ──────────────────────────────────────────────────────────
  gradientNavy:    ['#060D1F', '#0F1A35'] as const,
  gradientGold:    ['#F5A623', '#FFD285'] as const,
  gradientAI:      ['#060D1F', '#0F1A35', '#060D1F'] as const,
  gradientCard:    ['#0F1A35', '#152240'] as const,
  gradientOverlay: ['transparent', 'rgba(6,13,31,0.92)'] as const,

  // ── Transparencies ──────────────────────────────────────────────────────
  overlay20: 'rgba(6,13,31,0.20)',
  overlay50: 'rgba(6,13,31,0.50)',
  overlay80: 'rgba(6,13,31,0.80)',
  white10:   'rgba(255,255,255,0.10)',
  white20:   'rgba(255,255,255,0.20)',

  // ── Shadow colors ──────────────────────────────────────────────────────
  shadowWarm:  '#000000',
  shadowGold:  'rgba(245,166,35,0.40)',
} as const;

export type ColorKey = keyof typeof Colors;
