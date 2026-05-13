/**
 * Button — primary onboarding CTA + variant set.
 *
 * Variants:
 *  - `primary`   forest glass capsule, white text. The "Get started" /
 *                "Welcome Mochi" CTA across onboarding. Matches `.btn` at
 *                components.css line 120.
 *  - `secondary` translucent glass with forest text. Non-destructive
 *                secondary action.
 *  - `text`      ghost — text-only, no chrome. Use for skip/cancel/inline
 *                links.
 *  - `dark`      Apple-HIG-styled near-black capsule. Sign-in screen only.
 *  - `outline`   white glass with hairline stroke. Google sign-in row.
 *  - `honeyText` inline pill-link (NOT full-width). Use for inline "Edit"
 *                / "Retake" / "Skip" actions.
 *
 * Press scale (0.985) is applied via Pressable's pressed style. The
 * scale animation drops to 0 when `useReducedMotion()` is true.
 *
 * `loading` prop swaps the children for a `<Spinner>` and disables the
 * button — used by edge-function calls (breed-identify, plan-generate).
 *
 * Backed by tokens: `colors.primary`, `radii.pill`, `motion.duration.fast`,
 * `shadow('md')`, `glass.fill.thin`, `glass.fill.regular`, `colors.night`.
 */
import * as React from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Glass } from '../../lib/glass';
import { useReducedMotion } from '../../lib/motion';
import { colors, radii, shadow, typography } from '../../lib/theme';
import { Spinner } from './Spinner';
import { Text } from './Text';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'text'
  | 'dark'
  | 'outline'
  | 'honeyText';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  variant?: ButtonVariant;
  loading?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  children: React.ReactNode;
}

interface VariantStyle {
  bg: string;
  fg: string;
  showGlass: boolean;
  fullWidth: boolean;
  minHeight: number;
  paddingV: number;
  paddingH: number;
  shadowKey: 'sm' | 'md' | null;
  glassMaterial: 'thin' | 'regular' | 'thick';
  glassOnDark: boolean;
}

const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  primary: {
    bg: colors.primary,
    fg: colors.textOnPrimary,
    showGlass: false,
    fullWidth: true,
    minHeight: 52,
    paddingV: 14,
    paddingH: 22,
    shadowKey: 'md',
    glassMaterial: 'regular',
    glassOnDark: false,
  },
  secondary: {
    bg: 'transparent',
    fg: colors.primary,
    showGlass: true,
    fullWidth: true,
    minHeight: 52,
    paddingV: 14,
    paddingH: 22,
    shadowKey: 'sm',
    glassMaterial: 'thin',
    glassOnDark: false,
  },
  text: {
    bg: 'transparent',
    fg: colors.primary,
    showGlass: false,
    fullWidth: true,
    minHeight: 42,
    paddingV: 10,
    paddingH: 16,
    shadowKey: null,
    glassMaterial: 'thin',
    glassOnDark: false,
  },
  dark: {
    bg: colors.night,
    fg: colors.white,
    showGlass: false,
    fullWidth: true,
    minHeight: 52,
    paddingV: 14,
    paddingH: 22,
    shadowKey: 'md',
    glassMaterial: 'regular',
    glassOnDark: false,
  },
  outline: {
    bg: 'transparent',
    fg: colors.textDefault,
    showGlass: true,
    fullWidth: true,
    minHeight: 52,
    paddingV: 14,
    paddingH: 22,
    shadowKey: 'sm',
    glassMaterial: 'regular',
    glassOnDark: false,
  },
  honeyText: {
    bg: 'transparent',
    fg: colors.honeyDark,
    showGlass: false,
    fullWidth: false,
    minHeight: 32,
    paddingV: 6,
    paddingH: 10,
    shadowKey: null,
    glassMaterial: 'thin',
    glassOnDark: false,
  },
};

export function Button(props: ButtonProps): React.JSX.Element {
  const {
    variant = 'primary',
    loading = false,
    disabled,
    onPress,
    accessibilityLabel,
    children,
    ...rest
  } = props;
  const v = VARIANTS[variant];
  const reduceMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  const labelNode =
    typeof children === 'string' ? (
      <Text
        style={[
          typography.body,
          { color: v.fg, fontWeight: '600', fontSize: variant === 'honeyText' ? 12.5 : 15 },
        ]}
      >
        {children}
      </Text>
    ) : (
      children
    );

  const baseStyle = [
    styles.base,
    {
      minHeight: v.minHeight,
      paddingVertical: v.paddingV,
      paddingHorizontal: v.paddingH,
      width: v.fullWidth ? ('100%' as const) : ('auto' as const),
      backgroundColor: v.bg,
    },
    v.shadowKey !== null ? shadow(v.shadowKey) : undefined,
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        ...baseStyle,
        pressed && !reduceMotion ? styles.pressed : undefined,
        isDisabled ? styles.disabled : undefined,
      ]}
      {...rest}
    >
      {v.showGlass ? (
        <Glass
          material={v.glassMaterial}
          onDark={v.glassOnDark}
          style={styles.glassFill}
        >
          {/* empty — fill only; content rendered above */}
          <></>
        </Glass>
      ) : null}
      {loading ? <Spinner tone={variant === 'primary' || variant === 'dark' ? 'dim' : 'default'} /> : labelNode}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  glassFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.pill,
  },
  pressed: { transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.5 },
});
