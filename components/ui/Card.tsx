/**
 * Card — translucent glass surface for content groupings.
 *
 * Variants:
 *  - `default`  — regular-material glass with hairline stroke (matches
 *                 `.card` at components.css line 245).
 *  - `selected` — honey-tinted glass (`glass.tint.honey`) used to indicate
 *                 selection in survey screens (steps 06/07).
 *  - `compact`  — same default look with tighter padding (12px instead
 *                 of 16px).
 *
 * Backed by tokens: `glass.fill.regular`, `glass.tint.honey`,
 * `spacing.s3`, `spacing.s4`, `radii.lg`, `shadow('sm')`.
 */
import * as React from 'react';
import { StyleSheet, type ViewProps } from 'react-native';

import { glass, radii, shadow, spacing } from '../../lib/theme';
import { Glass } from '../../lib/glass';

export type CardVariant = 'default' | 'selected' | 'compact';

export interface CardProps extends ViewProps {
  variant?: CardVariant;
  children: React.ReactNode;
}

export function Card(props: CardProps): React.JSX.Element {
  const { variant = 'default', style, children, ...rest } = props;
  const padding = variant === 'compact' ? spacing.s3 : spacing.s4;
  const selectedOverlay =
    variant === 'selected' ? { backgroundColor: glass.tint.honey } : undefined;
  return (
    <Glass
      material="regular"
      style={[styles.base, { padding }, shadow('sm'), selectedOverlay, style]}
      {...rest}
    >
      {children}
    </Glass>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.lg },
});
