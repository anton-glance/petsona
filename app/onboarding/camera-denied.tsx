/**
 * Camera permission denied — onboarding step 02b (D-017).
 *
 * Reached when the user denied or dismissed the OS camera prompt. Primary
 * CTA deep-links into the per-app Settings page; secondary CTA re-checks
 * the live permission status (no prompt) and advances to capture on grant.
 */
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, CtaStack, ScreenContainer, Text } from '../../components/ui';
import {
  getCameraPermission,
  openSystemSettings,
} from '../../features/onboarding/permissions';
import { logger } from '../../lib/logger';
import { spacing } from '../../lib/theme';

export default function CameraDenied(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const [checking, setChecking] = React.useState(false);

  const handleOpenSettings = (): void => {
    void openSystemSettings().catch((err) => {
      logger.error('openSystemSettings failed', { err: String(err) });
    });
  };

  const handleTryAgain = React.useCallback(async () => {
    if (checking) return;
    setChecking(true);
    try {
      const result = await getCameraPermission();
      if (result.status === 'granted') {
        router.replace('/onboarding/capture');
      }
    } catch (err) {
      logger.error('getCameraPermission failed', { err: String(err) });
    } finally {
      setChecking(false);
    }
  }, [router, checking]);

  return (
    <ScreenContainer tone="light">
      <View style={styles.header}>
        <Text variant="caption" tone="muted">
          {t('onboarding.cameraDenied.smallCap')}
        </Text>
        <Text variant="displayLg" style={styles.title}>
          {t('onboarding.cameraDenied.title')}
        </Text>
        <Text variant="body" tone="muted" style={styles.body}>
          {t('onboarding.cameraDenied.body')}
        </Text>
      </View>

      <View style={styles.steps}>
        <NumberedStep num={1} text={t('onboarding.cameraDenied.step1')} />
        <NumberedStep num={2} text={t('onboarding.cameraDenied.step2')} />
        <NumberedStep num={3} text={t('onboarding.cameraDenied.step3')} />
      </View>

      <CtaStack>
        <Button onPress={handleOpenSettings}>
          {t('onboarding.cameraDenied.openSettings')}
        </Button>
        <Button variant="text" onPress={() => void handleTryAgain()} loading={checking}>
          {t('onboarding.cameraDenied.tryAgain')}
        </Button>
      </CtaStack>
    </ScreenContainer>
  );
}

function NumberedStep(props: { num: number; text: string }): React.JSX.Element {
  return (
    <View style={styles.step}>
      <View style={styles.numWrap}>
        <Text variant="caption">{String(props.num)}</Text>
      </View>
      <Text variant="body" style={styles.stepText}>
        {props.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.s5, gap: spacing.s2 },
  title: { marginTop: spacing.s2 },
  body: { marginTop: spacing.s2 },
  steps: { marginTop: spacing.s6, gap: spacing.s3 },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.s3 },
  numWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,162,72,0.22)',
  },
  stepText: { flex: 1 },
});
