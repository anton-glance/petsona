/**
 * Segmented — pill-shaped toggle with a floating active "thumb".
 *
 * Generic over the option value type `T extends string`. Each option is
 * `{ value: T; label: string }`. The active option carries a translucent
 * thumb fill; inactive options sit on the muted glass track.
 *
 * Variants:
 *  - default — 7px vertical padding, 13px font (matches `.seg` at
 *    components.css line 267).
 *  - `tight` — 4px vertical padding, 11px font (matches `.seg.tight`
 *    at line 284). Used for compact contexts like the AI-review form.
 *
 * The floating-thumb cross-fade is a polish item deferred to R1-M3 if it
 * lands as a usability concern; at MVP the active state is rendered as a
 * static background fill so consumers can iterate on visuals without a
 * Reanimated dependency in the test surface.
 *
 * Backed by tokens: `glass.fillReduced.thick` (active thumb fill),
 * `glass.stroke.dark`, `radii.pill`, `colors.textMuted`, `colors.textDefault`.
 */
import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, glass, radii } from '../../lib/theme';
import { Text } from './Text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  tight?: boolean;
  accessibilityLabel?: string;
}

export function Segmented<T extends string>(props: SegmentedProps<T>): React.JSX.Element {
  const { options, value, onChange, tight = false, accessibilityLabel } = props;
  const verticalPadding = tight ? 4 : 7;
  const fontSize = tight ? 11 : 13;
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={styles.track}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.cell,
              { paddingVertical: verticalPadding },
              selected ? styles.thumb : undefined,
              pressed && !selected ? styles.pressed : undefined,
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  fontSize,
                  color: selected ? colors.textDefault : colors.textMuted,
                  fontWeight: '600',
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: 'rgba(38,37,34,0.06)',
    borderWidth: 0.5,
    borderColor: glass.stroke.dark,
    borderRadius: radii.pill,
    padding: 3,
    alignItems: 'stretch',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  thumb: {
    backgroundColor: glass.fillReduced.thick,
    shadowColor: '#262522',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  label: { textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
