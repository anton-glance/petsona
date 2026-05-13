/**
 * Petsona — Liquid Glass implementation.
 *
 * iOS path: `<BlurView>` from `expo-blur` with intensity + tint mapped from
 * theme tokens, optionally overlaid with a brand tint (honey / forest /
 * terra) and a translucent fill.
 *
 * Android path: NO BlurView. Plain `<View>` with the RGBA fill rendered
 * directly. RN's compositor handles the alpha; the result is pixel-
 * equivalent to a pre-blend when the parent surface is ivory, and
 * correctly carries through a forest/night-tinted parent (e.g. paywall).
 *
 * Both platforms honor `AccessibilityInfo.isReduceTransparencyEnabled()`.
 * When on, iOS suppresses BlurView and uses the same opaque-fill code path
 * as Android — matching `tokens.css @media (prefers-reduced-transparency)`.
 *
 * The new SDK 55 `<BlurTargetView>` API (true Android-12+ blur) is
 * deliberately NOT adopted — see D-023 for the reasoning.
 */
import { BlurView } from 'expo-blur';
import * as React from 'react';
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { glass, type GlassMaterial, type GlassTone } from './theme';

export interface GlassProps {
  /** Material thickness. Default: `'regular'`. */
  material?: GlassMaterial;
  /** Brand tint overlay. Default: `'neutral'` (no overlay). */
  tone?: GlassTone;
  /** Render against a dark surface — uses the `onDark` fill. */
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: React.ReactNode;
}

/** Subscribes to `AccessibilityInfo.reduceTransparencyChanged` and returns the live state. */
export function useReduceTransparency(): boolean {
  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((value) => {
        if (!cancelled) setReduce(value);
      })
      .catch(() => {
        // Some platforms (web) reject; default to off.
      });
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduce);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);
  return reduce;
}

function pickFill(material: GlassMaterial, reduceTransparency: boolean): string {
  const table = reduceTransparency ? glass.fillReduced : glass.fill;
  return table[material];
}

function pickTint(tone: GlassTone): string | undefined {
  if (tone === 'neutral') return undefined;
  return glass.tint[tone];
}

/**
 * Glass — translucent surface.
 *
 * Use for: cards, segmented controls, pills, icon-buttons, input chrome,
 * any UI surface that calls for the Liquid Glass material per
 * `docs/design/components.css`.
 *
 * Backed by tokens: `glass.fill[material]`, `glass.tint[tone]`,
 * `glass.blurIntensity[material]`, `glass.fillReduced[material]`.
 */
export function Glass(props: GlassProps): React.JSX.Element {
  const { material = 'regular', tone = 'neutral', onDark = false, style, testID, children } = props;
  const reduceTransparency = useReduceTransparency();

  const fillKey: GlassMaterial = onDark ? 'onDark' : material;
  const fillColor = pickFill(fillKey, reduceTransparency);
  const tintColor = pickTint(tone);
  const blurIntensity = glass.blurIntensity[material === 'onDark' ? 'regular' : material];
  const blurTint = onDark ? 'dark' : 'light';

  // iOS + no reduce-transparency: real BlurView with tint + fill overlay.
  const showBlur = Platform.OS === 'ios' && !reduceTransparency;

  return (
    <View style={[styles.root, { backgroundColor: fillColor }, style]} testID={testID}>
      {showBlur ? (
        <BlurView
          intensity={blurIntensity}
          tint={blurTint}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {tintColor !== undefined ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tintColor }]} />
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', position: 'relative' },
  content: { position: 'relative', zIndex: 1 },
});
