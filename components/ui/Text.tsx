/**
 * Text — the typography primitive.
 *
 * Variants (one of `displayXl | displayLg | displayMd | bodyLg | body | caption`)
 * resolve to a pair-token from `lib/theme.ts` `typography`. Each pair carries
 * fontSize + lineHeight + fontWeight (+ letterSpacing/textTransform where
 * appropriate) so cross-platform rendering is deterministic.
 *
 * Tones:
 *  - `default`  — primary body color (#262522)
 *  - `soft`     — secondary text (#45433D)
 *  - `muted`    — captions, helper text (#6E6A5F)
 *  - `inverse`  — ivory text for use over dark surfaces
 *
 * Backed by tokens: `typography.<variant>`, `colors.text*`.
 */
import * as React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, typography, type TypographyVariant } from '../../lib/theme';

export type TextTone = 'default' | 'soft' | 'muted' | 'inverse';

export interface TextProps extends Omit<RNTextProps, 'style'> {
  variant?: TypographyVariant;
  tone?: TextTone;
  style?: RNTextProps['style'];
  children: React.ReactNode;
}

const TONE_TO_COLOR: Record<TextTone, string> = {
  default: colors.textDefault,
  soft: colors.textSoft,
  muted: colors.textMuted,
  inverse: colors.textInverse,
};

export function Text(props: TextProps): React.JSX.Element {
  const { variant = 'body', tone = 'default', style, children, ...rest } = props;
  const variantStyle = typography[variant];
  const color = TONE_TO_COLOR[tone];
  return (
    <RNText style={[variantStyle, { color }, style]} {...rest}>
      {children}
    </RNText>
  );
}
