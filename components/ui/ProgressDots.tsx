/**
 * ProgressDots — multi-step progress indicator (dots + active pill).
 *
 * Renders `steps` dots horizontally. The dot at `active` is 34×4 forest;
 * dots before it are 22×4 forest-soft (done); dots after are 22×4 rule
 * (pending). Matches `.progress-dots` at components.css line 393.
 *
 * Backed by tokens: `colors.primary`, `colors.forestSoft`, `colors.rule`.
 */
import * as React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors } from '../../lib/theme';

export interface ProgressDotsProps extends Omit<ViewProps, 'children'> {
  steps: number;
  active: number;
}

export function ProgressDots(props: ProgressDotsProps): React.JSX.Element {
  const { steps, active, style, ...rest } = props;
  return (
    <View style={[styles.row, style]} {...rest}>
      {Array.from({ length: steps }).map((_, i) => {
        let dotStyle;
        if (i === active) dotStyle = styles.activeDot;
        else if (i < active) dotStyle = styles.doneDot;
        else dotStyle = styles.pendingDot;
        return (
          <View
            key={i}
            testID={`progress-dot-${i}`}
            accessibilityState={{ selected: i === active }}
            style={[styles.dot, dotStyle]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 4, borderRadius: 2 },
  pendingDot: { width: 22, backgroundColor: 'rgba(38,37,34,0.10)' },
  doneDot: { width: 22, backgroundColor: colors.forestSoft },
  activeDot: { width: 34, backgroundColor: colors.primary },
});
