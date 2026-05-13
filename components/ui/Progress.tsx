/**
 * Progress — horizontal bar with brand gradient fill.
 *
 * `value` is clamped to [0, 1] and rendered as the relative width of the
 * fill. The fill uses `expo-linear-gradient` with the three-stop honey
 * gradient (`#E0B560` → honey → honeyDark) from components.css line 386.
 *
 * Backed by tokens: `colors.accent`, `colors.honeyDark`, `radii.pill`.
 */
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radii } from '../../lib/theme';

export interface ProgressProps extends Omit<ViewProps, 'children'> {
  /** 0-1 inclusive; values outside this range are clamped. */
  value: number;
  accessibilityLabel?: string;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function Progress(props: ProgressProps): React.JSX.Element {
  const { value, accessibilityLabel, style, ...rest } = props;
  const clamped = clamp01(value);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 1, now: clamped }}
      style={[styles.track, style]}
      {...rest}
    >
      <LinearGradient
        colors={['#E0B560', colors.accent, colors.honeyDark]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.fill, { width: `${clamped * 100}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    backgroundColor: 'rgba(38,37,34,0.06)',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radii.pill },
});
