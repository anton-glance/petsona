/**
 * TopRow — three-column header: back / center / right.
 *
 * The center slot is always at the true horizontal center of the screen
 * regardless of the back-button width or counter width — implemented via
 * `flex: 1` outer columns + `flex: 0` center, matching the CSS grid
 * `1fr auto 1fr` recipe at components.css line 422.
 *
 * Use:
 *  - `back` — back arrow or empty
 *  - `center` — progress dots, step pill, or empty
 *  - `right` — step counter (`1/3`), action button, or empty
 *
 * Backed by tokens: `spacing.s2`.
 */
import * as React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { spacing } from '../../lib/theme';

export interface TopRowProps extends ViewProps {
  back?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}

export function TopRow(props: TopRowProps): React.JSX.Element {
  const { back, center, right, style, ...rest } = props;
  return (
    <View style={[styles.row, style]} {...rest}>
      <View style={styles.side}>{back}</View>
      <View style={styles.center}>{center}</View>
      <View style={styles.sideRight}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s1,
    gap: spacing.s2,
  },
  side: { flex: 1, alignItems: 'flex-start' },
  center: { flex: 0, alignItems: 'center' },
  sideRight: { flex: 1, alignItems: 'flex-end' },
});
