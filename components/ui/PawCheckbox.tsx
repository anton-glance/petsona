/**
 * PawCheckbox — round or square checkbox where the check glyph is a paw.
 *
 * Shapes:
 *  - `round`  — circle (border-radius 999). Used for single-select (step 06
 *               personality). Matches `.checkbox-paw` at components.css
 *               line 315.
 *  - `square` — rounded square (border-radius 7). Used for multi-select
 *               (step 07 goals). Matches `.checkbox-paw-square`.
 *
 * Checked state fills with the forest primary and renders a honey paw
 * glyph via `react-native-svg`.
 *
 * Backed by tokens: `glass.fill.thick`, `glass.stroke.dark`, `colors.primary`,
 * `colors.accent`.
 */
import * as React from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

import { colors, glass } from '../../lib/theme';

export type PawCheckboxShape = 'round' | 'square';

export interface PawCheckboxProps extends Omit<PressableProps, 'children' | 'style'> {
  shape?: PawCheckboxShape;
  checked: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

const SIZE = 22;
const PAW_SIZE = 12;

function PawGlyph(props: { color: string }): React.JSX.Element {
  return (
    <Svg width={PAW_SIZE} height={PAW_SIZE} viewBox="0 0 24 24">
      <G fill={props.color}>
        <Ellipse cx="12" cy="15" rx="5.5" ry="4.5" />
        <Circle cx="6" cy="9" r="2.4" />
        <Circle cx="18" cy="9" r="2.4" />
        <Circle cx="9" cy="5" r="2" />
        <Circle cx="15" cy="5" r="2" />
      </G>
    </Svg>
  );
}

export function PawCheckbox(props: PawCheckboxProps): React.JSX.Element {
  const { shape = 'round', checked, onPress, accessibilityLabel, ...rest } = props;
  const shapeStyle = shape === 'round' ? styles.round : styles.square;
  const checkedStyle = checked ? styles.checked : undefined;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked }}
      style={[styles.base, shapeStyle, checkedStyle]}
      {...rest}
    >
      {checked ? <PawGlyph color={colors.accent} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: SIZE,
    height: SIZE,
    backgroundColor: glass.fillReduced.thick,
    borderWidth: 0.5,
    borderColor: glass.stroke.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  round: { borderRadius: 999 },
  square: { borderRadius: 7 },
  checked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
