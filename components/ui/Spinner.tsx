/**
 * Spinner — loading indicator.
 *
 * Variants:
 *  - `size`: `'default'` (28px ring per components.css line 405) or `'lg'`
 *    (44px ring per line 412). The `.lg` variant is reserved for the
 *    generating screen (step 09) and other prominent waits.
 *  - `tone`: `'default'` (forest spinner on light surfaces) or `'dim'`
 *    (honey accent on dark surfaces — `.spinner.dim` from line 411).
 *
 * Wraps `<ActivityIndicator>` per README §4 RN guidance. We don't ship a
 * custom-painted ring at MVP — `ActivityIndicator` is platform-native and
 * already respects reduce-motion.
 *
 * Backed by tokens: `colors.primary`, `colors.accent`.
 */
import * as React from 'react';
import { ActivityIndicator, type ActivityIndicatorProps } from 'react-native';

import { colors } from '../../lib/theme';

export type SpinnerSize = 'default' | 'lg';
export type SpinnerTone = 'default' | 'dim';

export interface SpinnerProps extends Omit<ActivityIndicatorProps, 'size' | 'color'> {
  size?: SpinnerSize;
  tone?: SpinnerTone;
}

const SIZE_TO_RN: Record<SpinnerSize, 'small' | 'large'> = {
  default: 'small',
  lg: 'large',
};

const TONE_TO_COLOR: Record<SpinnerTone, string> = {
  default: colors.primary,
  dim: colors.accent,
};

export function Spinner(props: SpinnerProps): React.JSX.Element {
  const { size = 'default', tone = 'default', ...rest } = props;
  return <ActivityIndicator size={SIZE_TO_RN[size]} color={TONE_TO_COLOR[tone]} {...rest} />;
}
