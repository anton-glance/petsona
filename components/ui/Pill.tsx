/**
 * Pill — small inline indicator.
 *
 * Folds `.pill` (components.css line 299) and the `watch-chip` variant
 * referenced by README §4. One component with `tone` + `size` props.
 *
 * Tones:
 *  - `honey` (default) — honey-tinted glass with `honey-dark` text
 *    (#A77E2F). Used for "NEW", "AI 91%", "Optional".
 *  - `watch` — terracotta tinted variant for the step-10 watch-chip use.
 *  - `forest` — forest tinted variant for emphasis pills over light
 *    surfaces.
 *
 * Sizes:
 *  - `sm` (default) — 10px font, 4×10 padding. Matches `.pill` exactly.
 *  - `md` — 12.5px font, 6×12 padding. Matches `.watch-chip`.
 *
 * Backed by tokens: `glass.tint.{honey,terra,forest}`, `colors.honeyDark`,
 * `radii.pill`, `colors.textOnPrimary`, `colors.forest`.
 */
import * as React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, glass, radii } from '../../lib/theme';
import { Text } from './Text';

export type PillTone = 'honey' | 'watch' | 'forest';
export type PillSize = 'sm' | 'md';

export interface PillProps extends ViewProps {
  tone?: PillTone;
  size?: PillSize;
  children: React.ReactNode;
}

const TONE_TO_BG: Record<PillTone, string> = {
  honey: glass.tint.honey,
  watch: glass.tint.terra,
  forest: glass.tint.forest,
};

const TONE_TO_TEXT: Record<PillTone, string> = {
  honey: colors.honeyDark,
  watch: colors.terracottaDark,
  forest: colors.forest,
};

const SIZE_STYLES: Record<PillSize, { paddingHorizontal: number; paddingVertical: number; fontSize: number }> = {
  sm: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 10 },
  md: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12.5 },
};

export function Pill(props: PillProps): React.JSX.Element {
  const { tone = 'honey', size = 'sm', style, children, ...rest } = props;
  const sizeStyle = SIZE_STYLES[size];
  const textColor = TONE_TO_TEXT[tone];
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: TONE_TO_BG[tone],
          paddingHorizontal: sizeStyle.paddingHorizontal,
          paddingVertical: sizeStyle.paddingVertical,
        },
        style,
      ]}
      {...rest}
    >
      {typeof children === 'string' ? (
        <Text
          variant="caption"
          style={{ color: textColor, fontSize: sizeStyle.fontSize, letterSpacing: 0.4 }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
  },
});
