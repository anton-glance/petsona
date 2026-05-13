/**
 * Camera permission — onboarding step 02 (D-017). Mockup:
 * `docs/design/02_camera_permission.html`.
 *
 * Pre-permission rationale: small-cap, display-lg title, intro line,
 * camera-preview block (gradient + corner brackets matching screens.css
 * `.camera-preview` + `.cam-brackets`), two benefit rows with forest
 * icon-marks, [Allow access] CTA.
 *
 * The `requestCameraPermission` helper triggers the system dialog;
 * we then branch:
 *   - granted     → /onboarding/capture (step 03)
 *   - denied      → /onboarding/camera-denied, track reason='denied'
 *   - undetermined → /onboarding/camera-denied, track reason='undetermined'
 *
 * Errors thrown by the native permission call route through logger.error
 * (which → Sentry per D-021). No PostHog event for errors.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Button, CtaStack, ScreenContainer, Text } from '../../components/ui';
import { requestCameraPermission } from '../../features/onboarding/permissions';
import { Events } from '../../lib/events';
import { logger } from '../../lib/logger';
import { colors, radii, spacing } from '../../lib/theme';
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
        <Text variant="caption" style={styles.smallCap}>
          {t('onboarding.cameraPermission.stepCap')}
        </Text>
        <Text variant="displayLg" style={styles.title}>
          {t('onboarding.cameraPermission.title')}
        </Text>
        <Text variant="body" tone="muted" style={styles.intro}>
          {t('onboarding.cameraPermission.intro')}
        </Text>
      </View>

      <View style={styles.previewBlock} testID="camera-preview-block">
        <LinearGradient
          colors={['#404245', '#7a7a7a', '#c8c8c8', '#8a8a8a']}
          locations={[0, 0.3, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.previewSilhouette} pointerEvents="none" />
        <CameraBrackets />
      </View>

      <View style={styles.benefit}>
        <View style={styles.benefitIcon} testID="benefit-icon-1">
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 12l2 2 4-4"
              stroke={colors.forest}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx="12" cy="12" r="10" stroke={colors.forest} strokeWidth={2} fill="none" />
          </Svg>
        </View>
        <View style={styles.benefitText}>
          <Text variant="body" style={styles.benefitTitle}>
            {t('onboarding.cameraPermission.benefit1.title')}
          </Text>
          <Text variant="body" tone="muted" style={styles.benefitBody}>
            {t('onboarding.cameraPermission.benefit1.body')}
          </Text>
        </View>
      </View>

      <View style={styles.benefit}>
        <View style={styles.benefitIcon} testID="benefit-icon-2">
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Line x1="4" y1="6" x2="20" y2="6" stroke={colors.forest} strokeWidth={2} strokeLinecap="round" />
            <Line x1="4" y1="12" x2="20" y2="12" stroke={colors.forest} strokeWidth={2} strokeLinecap="round" />
            <Line x1="4" y1="18" x2="14" y2="18" stroke={colors.forest} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </View>
        <View style={styles.benefitText}>
          <Text variant="body" style={styles.benefitTitle}>
            {t('onboarding.cameraPermission.benefit2.title')}
          </Text>
          <Text variant="body" tone="muted" style={styles.benefitBody}>
            {t('onboarding.cameraPermission.benefit2.body')}
          </Text>
        </View>
      </View>

      <CtaStack>
        <Button onPress={() => void handleAllow()} loading={submitting}>
          {t('onboarding.cameraPermission.cta')}
        </Button>
      </CtaStack>
    </ScreenContainer>
  );
}

function CameraBrackets(): React.JSX.Element {
  // Four corner brackets matching screens.css `.cam-brackets`.
  return (
    <View style={styles.bracketsRoot} pointerEvents="none">
      <View style={[styles.bracket, styles.bracketTL]} />
      <View style={[styles.bracket, styles.bracketTR]} />
      <View style={[styles.bracket, styles.bracketBL]} />
      <View style={[styles.bracket, styles.bracketBR]} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.s5, gap: 4 },
  smallCap: {
    color: colors.honeyDark,
    fontSize: 10.5,
    letterSpacing: 0.84,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  title: { marginTop: spacing.s2 },
  intro: { marginTop: spacing.s1 },
  previewBlock: {
    marginTop: spacing.s4,
    aspectRatio: 1.3,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#7a7a7a',
    position: 'relative',
  },
  previewSilhouette: {
    position: 'absolute',
    left: '22%',
    top: '32%',
    width: '56%',
    height: '56%',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 999,
  },
  bracketsRoot: { position: 'absolute', top: '14%', bottom: '14%', left: '14%', right: '14%' },
  bracket: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: colors.white,
    opacity: 0.95,
  },
  bracketTL: { top: 0, left: 0, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 4 },
  bracketTR: { top: 0, right: 0, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 4 },
  bracketBL: { bottom: 0, left: 0, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 4 },
  bracketBR: { bottom: 0, right: 0, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 4 },
  benefit: { flexDirection: 'row', gap: spacing.s3, alignItems: 'flex-start', marginTop: spacing.s4 },
  benefitIcon: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  benefitText: { flex: 1, gap: 2 },
  benefitTitle: { fontWeight: '600', fontSize: 13.5, color: colors.textDefault },
  benefitBody: { fontSize: 12, lineHeight: 18 },
});
