/**
 * Camera permission — onboarding step 02 (D-017).
 *
 * Pre-permission rationale shown before requesting the OS prompt. The
 * `requestCameraPermission` helper triggers the system dialog; we then
 * branch:
 *   - granted     → navigate to /onboarding/capture (step 03)
 *   - denied      → navigate to /onboarding/camera-denied, track reason='denied'
 *   - undetermined → navigate to /onboarding/camera-denied, track reason='undetermined'
 *
 * The denied/undetermined split (per the C-3 correction in the Phase 1
 * review) lets the R4 funnel distinguish "user said no" from "user
 * dismissed mid-prompt." Same screen target; different signal.
 *
 * Errors thrown by the native permission call route through logger.error
 * (which → Sentry per D-021). No PostHog event for errors.
 */
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, CtaStack, ScreenContainer, Text } from '../../components/ui';
import { requestCameraPermission } from '../../features/onboarding/permissions';
import { Events } from '../../lib/events';
import { logger } from '../../lib/logger';
import { spacing } from '../../lib/theme';
import { track } from '../../lib/telemetry';

export default function CameraPermission(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const handleAllow = React.useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    track(Events.onboarding_camera_permission_requested);
    try {
      const result = await requestCameraPermission();
      if (result.status === 'granted') {
        track(Events.onboarding_camera_permission_granted);
        router.push('/onboarding/capture');
      } else {
        track(Events.onboarding_camera_permission_denied, { reason: result.status });
        router.push('/onboarding/camera-denied');
      }
    } catch (err) {
      logger.error('camera permission request failed', { err: String(err) });
    } finally {
      setSubmitting(false);
    }
  }, [router, submitting]);

  return (
    <ScreenContainer tone="light">
      <View style={styles.header}>
        <Text variant="caption" tone="muted">
          {t('onboarding.cameraPermission.stepCap')}
        </Text>
        <Text variant="displayLg" style={styles.title}>
          {t('onboarding.cameraPermission.title')}
        </Text>
        <Text variant="body" tone="muted" style={styles.intro}>
          {t('onboarding.cameraPermission.intro')}
        </Text>
      </View>

      <View style={styles.benefit}>
        <Text variant="displayMd">{t('onboarding.cameraPermission.benefit1.title')}</Text>
        <Text variant="body" tone="soft" style={styles.benefitBody}>
          {t('onboarding.cameraPermission.benefit1.body')}
        </Text>
      </View>

      <View style={styles.benefit}>
        <Text variant="displayMd">{t('onboarding.cameraPermission.benefit2.title')}</Text>
        <Text variant="body" tone="soft" style={styles.benefitBody}>
          {t('onboarding.cameraPermission.benefit2.body')}
        </Text>
      </View>

      <CtaStack>
        <Button onPress={() => void handleAllow()} loading={submitting}>
          {t('onboarding.cameraPermission.cta')}
        </Button>
      </CtaStack>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.s5, gap: spacing.s2 },
  title: { marginTop: spacing.s2 },
  intro: { marginTop: spacing.s2 },
  benefit: { marginTop: spacing.s5, gap: spacing.s1 },
  benefitBody: { marginTop: spacing.s1 },
});
