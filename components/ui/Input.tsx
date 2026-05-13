/**
 * Input — text input with optional label + error message.
 *
 * Mirrors `.input` (components.css line 211) + `.input-label` (line 206)
 * + `.input-error` (line 232) as one React component. The errored state
 * tints the border + adds a 3px outer ring.
 *
 * Use the standard RN TextInput API for `value` / `onChangeText` /
 * `placeholder` / `secureTextEntry` / `keyboardType`.
 *
 * Backed by tokens: `glass.fill.thick`, `radii.md`, `colors.textDefault`,
 * `colors.textMuted`, `colors.statusDanger`, `colors.primary`.
 */
import * as React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, glass, radii, spacing, typography } from '../../lib/theme';
import { Text } from './Text';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
}

export function Input(props: InputProps): React.JSX.Element {
  const { label, error, ...rest } = props;
  const hasError = error !== undefined && error.length > 0;
  return (
    <View style={styles.row}>
      {label !== undefined ? (
        <Text variant="caption" tone="muted" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[styles.input, hasError ? styles.inputError : undefined]}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        {...rest}
      />
      {hasError ? (
        <Text variant="body" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'column', gap: 3 },
  label: { marginBottom: 4 },
  input: {
    backgroundColor: glass.fillReduced.thick,
    borderWidth: 0.5,
    borderColor: glass.stroke.dark,
    borderRadius: radii.md,
    paddingHorizontal: spacing.s3 + 2,
    paddingVertical: 11,
    fontSize: 14.5,
    fontWeight: '500',
    lineHeight: typography.body.lineHeight,
    color: colors.textDefault,
  },
  inputError: {
    borderColor: colors.statusDanger,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.statusDanger,
    marginTop: 4,
  },
});
