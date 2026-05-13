/**
 * IconButton — 36×36 round glass capsule for icon-only actions.
 *
 * Tones:
 *  - `light` (default) — translucent glass on light surfaces (e.g. status
 *    bar, photo capture overlay). Matches `.iconbtn` at components.css
 *    line 349.
 *  - `dark` — darker glass for camera-screen contexts (`.iconbtn-dark`).
 *
 * Always require `accessibilityLabel` — there's no visible text and
 * screen readers need a name.
 *
 * Backed by tokens: `glass.fill.regular`, `radii.pill`, `shadow('sm')`,
 * `colors.textSoft`.
 */
import * as React from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Glass } from '../../lib/glass';
import { radii, shadow } from '../../lib/theme';

export type IconButtonTone = 'light' | 'dark';

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  tone?: IconButtonTone;
  accessibilityLabel: string;
  onPress: () => void;
  children: React.ReactNode;
}

export function IconButton(props: IconButtonProps): React.JSX.Element {
  const { tone = 'light', accessibilityLabel, onPress, children, ...rest } = props;
  const onDark = tone === 'dark';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.wrap, pressed ? styles.pressed : undefined]}
      {...rest}
    >
      <Glass material="regular" onDark={onDark} style={[styles.glass, shadow('sm')]}>
        {children}
      </Glass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 36, height: 36 },
  glass: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});
