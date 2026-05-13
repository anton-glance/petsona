/**
 * BackButton — pill-shaped back-navigation button with chevron + label.
 *
 * Separate from `IconButton` because the shape is fundamentally different:
 * BackButton is variable-width (chevron + text), IconButton is fixed 36×36.
 * Mirrors `.back-arrow` at components.css line 360.
 *
 * The label defaults to `t('common.back')` via i18n (falls back to "Back"
 * when the key is missing or i18n hasn't initialized).
 *
 * Backed by tokens: `glass.fill.thin`, `radii.pill`, `colors.textSoft`,
 * `spacing.s1`, `spacing.s2`.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { Glass } from '../../lib/glass';
import { colors, radii, spacing, typography } from '../../lib/theme';
import { Text } from './Text';

export interface BackButtonProps {
  label?: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function BackButton(props: BackButtonProps): React.JSX.Element {
  const { label, onPress, accessibilityLabel } = props;
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('common.back', { defaultValue: 'Back' });
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? resolvedLabel}
      style={({ pressed }) => [styles.wrap, pressed ? styles.pressed : undefined]}
    >
      <Glass material="thin" style={styles.glass}>
        <Text style={[styles.chevron, typography.body]}>‹</Text>
        <Text variant="body" style={styles.label}>
          {resolvedLabel}
        </Text>
      </Glass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start' },
  glass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s1,
    paddingVertical: 6,
    paddingHorizontal: spacing.s3,
    paddingLeft: spacing.s2,
    borderRadius: radii.pill,
  },
  chevron: { color: colors.textSoft, fontSize: 18, lineHeight: 18 },
  label: { color: colors.textSoft },
  pressed: { opacity: 0.85 },
});
