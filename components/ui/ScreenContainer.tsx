/**
 * ScreenContainer — the root for every onboarding screen.
 *
 * Wraps children in a `<SafeAreaView>` with the ivory or night surface
 * color and 16px horizontal padding (`spacing.s4`). Every onboarding
 * step extends this — see `docs/design/components.css` `.screen` (line 89).
 *
 * Tones:
 *  - `light`  — ivory surface, dark text (default).
 *  - `dark`   — night surface, ivory text. Used by the camera-capture and
 *               paywall screens. Pair with `<StatusBar.dim>` higher up the
 *               tree to flip status-bar text/icons to ivory.
 *
 * Backed by tokens: `colors.surface`, `colors.surfaceInverse`, `spacing.s4`.
 */
import * as React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../../lib/theme';

export type ScreenTone = 'light' | 'dark';

export interface ScreenContainerProps extends ViewProps {
  tone?: ScreenTone;
  children: React.ReactNode;
}

const TONE_TO_BG: Record<ScreenTone, string> = {
  light: colors.surface,
  dark: colors.surfaceInverse,
};

export function ScreenContainer(props: ScreenContainerProps): React.JSX.Element {
  const { tone = 'light', style, children, ...rest } = props;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: TONE_TO_BG[tone] }]} {...rest}>
      <View style={[styles.inner, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: spacing.s4 },
});
