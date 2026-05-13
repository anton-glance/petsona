/**
 * Petsona — Typed design tokens.
 *
 * Mirror of `docs/design/tokens.css` (commit 424a435, locked by D-023).
 * Single TypeScript source of truth consumed by `components/ui/`,
 * `lib/glass.ts`, `lib/motion.ts`, and `tailwind.config.js`.
 *
 * Two-layer color model:
 *   - **Raw palette** (e.g. `colors.honey`, `colors.forest`): use only when
 *     a primitive specifically needs a brand pick (gradients, icons).
 *   - **Semantic aliases** (e.g. `colors.primary`, `colors.surface`): use
 *     in every primitive. If the brand palette ever shifts, only the
 *     aliases need re-pointing.
 *
 * Cross-platform shadow gap: CSS multi-layer box-shadows (inset specular +
 * outer cast) collapse to a single cast per node in React Native. Use the
 * `shadow(level)` helper, which returns `Platform.select({ ios, android })`
 * with elevation on Android and shadowColor/radius/offset on iOS.
 *
 * If a value drifts between this file and `tailwind.config.js`, the
 * sanity test in `lib/theme.test.ts` fails CI. Update both atomically.
 */
import { Platform, type ViewStyle } from 'react-native';

/* ---------- Color ---------- */

/**
 * Raw palette + semantic aliases. Hex values mirror `tokens.css` lines 11-64.
 * Semantic aliases (primary, accent, surface, …) duplicate hex rather than
 * reference raw entries so `as const` preserves literal types.
 */
export const colors = {
  // Raw — honey
  honey: '#D4A248',
  honeyDark: '#A77E2F',
  honeySoft: '#EAD6A0',
  honeyTint: '#F5E8C4',
  // Raw — forest
  forest: '#2D4F3C',
  forestDark: '#1F3A2A',
  forestSoft: '#79A38A',
  // Raw — terracotta
  terracotta: '#C97B5C',
  terracottaDark: '#A35E42',
  terracottaSoft: '#E5B8A6',
  // Raw — neutrals
  ivory: '#FBF7EE',
  ivoryDim: '#F4EEDE',
  night: '#15130E',
  nightElev: '#1E1B14',
  ink: '#262522',
  inkSoft: '#45433D',
  muted: '#6E6A5F',
  mutedSoft: '#93907F',
  rule: '#EAE2CE',
  ruleSoft: '#F2EBD8',
  // Raw — error
  error: '#A8442A',
  errorBg: '#FBEFE7',
  // Raw — white
  white: '#FFFFFF',

  // Semantic — primary
  primary: '#2D4F3C', // = forest
  primaryPressed: '#1F3A2A', // = forestDark
  primaryOnDark: '#79A38A', // = forestSoft
  // Semantic — accent
  accent: '#D4A248', // = honey
  accentPressed: '#A77E2F', // = honeyDark
  accentOnDark: '#E0B25E',
  // Semantic — surface
  surface: '#FBF7EE', // = ivory
  surfaceElev: '#FFFFFF',
  surfaceDim: '#F4EEDE', // = ivoryDim
  surfaceInverse: '#15130E', // = night
  // Semantic — text
  textDefault: '#262522', // = ink
  textSoft: '#45433D', // = inkSoft
  textMuted: '#6E6A5F', // = muted
  textInverse: '#FBF7EE', // = ivory
  textOnPrimary: '#FBF7EE', // = ivory
  // Semantic — border
  border: '#EAE2CE', // = rule
  borderSoft: '#F2EBD8', // = ruleSoft
  // Semantic — status
  statusDanger: '#A8442A', // = error
  statusDangerBg: '#FBEFE7', // = errorBg
} as const;

export type ColorKey = keyof typeof colors;

/* ---------- Typography ---------- */

/**
 * Type-scale pair tokens. Each variant bundles `fontSize` + `lineHeight` +
 * `fontWeight` (+ optional `letterSpacing`, `textTransform`) so consumers
 * can spread the whole object as a `TextStyle`.
 *
 * Letter-spacing on display sizes is `-0.015em` per `components.css` line
 * 30, converted to RN pixels at this build-time. Caption is `+0.06em` per
 * line 45 (here as 0.72 = 0.06 × 12).
 */
export const typography = {
  displayXl: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '600',
    letterSpacing: -0.48, // = -0.015 × 32
  },
  displayLg: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    letterSpacing: -0.36, // = -0.015 × 24
  },
  displayMd: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.285, // = -0.015 × 19
  },
  bodyLg: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.72, // = 0.06 × 12
    textTransform: 'uppercase',
  },
} as const;

export type TypographyVariant = keyof typeof typography;

/** DM Sans family name as registered by `@expo-google-fonts/dm-sans`. */
export const fontFamily = {
  ui: 'DMSans_400Regular', // default weight; per-weight overrides via fontWeight
  weightToFamily: {
    '400': 'DMSans_400Regular',
    '500': 'DMSans_500Medium',
    '600': 'DMSans_600SemiBold',
    '700': 'DMSans_700Bold',
  },
} as const;

/* ---------- Spacing & radii ---------- */

/** Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48. Mirrors tokens.css --s1..--s7. */
export const spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 24,
  s6: 32,
  s7: 48,
} as const;

/** Radii: xs=6, sm=10, md=14, lg=20, xl=28, pill=999. */
export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/* ---------- Shadows ---------- */

/**
 * Shadow level → platform style. iOS uses shadow*, Android uses elevation.
 * Multi-layer CSS recipes from `tokens.css --shadow-{sm,md,lg}` collapse
 * to a single cast per node. The inset specular highlight in primitives
 * (e.g. Button) is rendered as a 0.5px top hairline when load-bearing.
 */
const SHADOW_RECIPES = {
  sm: {
    ios: {
      shadowColor: '#262522',
      shadowOpacity: 0.06,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
    },
    android: { elevation: 1 },
  },
  md: {
    ios: {
      shadowColor: '#262522',
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 4 },
  },
  lg: {
    ios: {
      shadowColor: '#262522',
      shadowOpacity: 0.28,
      shadowRadius: 48,
      shadowOffset: { width: 0, height: 24 },
    },
    android: { elevation: 12 },
  },
} as const;

export type ShadowLevel = keyof typeof SHADOW_RECIPES;

/** Returns the platform-correct shadow style for a level. */
export function shadow(level: ShadowLevel): ViewStyle {
  const recipe = SHADOW_RECIPES[level];
  return Platform.OS === 'android' ? (recipe.android as ViewStyle) : (recipe.ios as ViewStyle);
}

/* ---------- Glass materials ---------- */

/**
 * Liquid Glass fills + tints + strokes. The `Glass` component in
 * `lib/glass.ts` consumes these. `FILL_REDUCED` activates when
 * `AccessibilityInfo.isReduceTransparencyEnabled()` is true.
 */
export const glass = {
  blurIntensity: { thin: 35, regular: 70, thick: 95 },
  fill: {
    thin: 'rgba(255,255,255,0.32)',
    regular: 'rgba(255,255,255,0.58)',
    thick: 'rgba(255,255,255,0.78)',
    onDark: 'rgba(20,19,15,0.42)',
  },
  fillReduced: {
    thin: 'rgba(255,255,255,0.94)',
    regular: 'rgba(255,255,255,0.94)',
    thick: 'rgba(255,255,255,0.96)',
    onDark: 'rgba(20,19,15,0.92)',
  },
  tint: {
    honey: 'rgba(212,162,72,0.22)',
    forest: 'rgba(45,79,60,0.30)',
    terra: 'rgba(201,123,92,0.24)',
  },
  stroke: {
    light: 'rgba(255,255,255,0.55)',
    dim: 'rgba(255,255,255,0.28)',
    dark: 'rgba(38,37,34,0.10)',
  },
} as const;

export type GlassMaterial = keyof typeof glass.fill;
export type GlassTone = 'neutral' | keyof typeof glass.tint;

/* ---------- i18n slack ---------- */

/** Reserve 30% extra horizontal space for ES/RU per identity.md §6. */
export const i18nSlack = 1.3;

/* ---------- Theme bundle (convenience) ---------- */

export const theme = {
  colors,
  typography,
  fontFamily,
  spacing,
  radii,
  shadow,
  glass,
  i18nSlack,
} as const;

export type Theme = typeof theme;
