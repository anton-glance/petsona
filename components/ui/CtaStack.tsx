/**
 * CtaStack — vertical button group pinned to the bottom of the screen.
 *
 * Variants:
 *  - `position="bottom"` (default) — `marginTop: auto` pushes the stack to
 *    the bottom of its parent flex container, with `paddingBottom: 16`
 *    (`spacing.s4`) for safe-area-conscious gutter per README §6 "Global
 *    CTA position consistency."
 *  - `position="inline"` — no auto-margin or bottom-padding. Use for the
 *    centered camera shutter or any mid-screen button row.
 *
 * Vertical gap between stacked children is 8px (`spacing.s2`) per
 * components.css `.cta-stack`.
 *
 * Backed by tokens: `spacing.s2`, `spacing.s3`, `spacing.s4`.
 */
import * as React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { spacing } from '../../lib/theme';

export type CtaStackPosition = 'bottom' | 'inline';

export interface CtaStackProps extends ViewProps {
  position?: CtaStackPosition;
  children: React.ReactNode;
}

export function CtaStack(props: CtaStackProps): React.JSX.Element {
  const { position = 'bottom', style, children, ...rest } = props;
  const layoutStyle = position === 'bottom' ? styles.bottom : styles.inline;
  return (
    <View style={[styles.base, layoutStyle, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'column', gap: spacing.s2 },
  bottom: { marginTop: 'auto', paddingTop: spacing.s3, paddingBottom: spacing.s4 },
  inline: { paddingTop: 0, paddingBottom: 0 },
});
