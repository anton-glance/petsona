/**
 * Camera permission denied — onboarding step 02b (D-017). Mockup:
 * `docs/design/02b_permission_denied.html`.
 *
 * Small-cap (error tone), display-lg title, body, big camera-slash icon
 * in an ivory-dim circle, three glass-card numbered instruction steps,
 * [Open Settings] primary CTA + [Already granted. Try again] text button.
 *
 * B-4: AppState listener auto-advances to capture when the user returns
 * from Settings with camera permission granted. Mirrors the existing
 * capture-screen pattern but in reverse: capture revokes on lost
 * permission, this screen grants on re-acquired permission.
 */
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Button, CtaStack, ScreenContainer, Text } from '../../components/ui';
import { Glass } from '../../lib/glass';
import {
  getCameraPermission,
  openSystemSettings,
} from '../../features/onboarding/permissions';
import { logger } from '../../lib/logger';
import { colors, shadow, spacing } from '../../lib/theme';

export default function CameraDenied(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const [checking, setChecking] = React.useState(false);

  // B-4: when the user returns from iOS/Android Settings after granting
  // camera permission, AppState transitions to 'active'. Re-check the
  // permission and auto-advance if granted — saves the user from tapping
  // [Try again] manually.
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void (async () => {
        try {
          const result = await getCameraPermission();
          if (result.status === 'granted') {
            router.replace('/onboarding/capture');
          }
        } catch (err) {
          logger.error('AppState-triggered permission check failed', { err: String(err) });
        }
      })();
    });
    return () => {
      subscription.remove();
    };
  }, [router]);

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
        <Text variant="caption" style={styles.smallCap}>
          {t('onboarding.cameraDenied.smallCap')}
        </Text>
        <Text variant="displayLg" style={styles.title}>
          {t('onboarding.cameraDenied.title')}
        </Text>
        <Text variant="body" tone="muted" style={styles.body}>
          {t('onboarding.cameraDenied.body')}
        </Text>
      </View>

      <View style={styles.iconCircle}>
        <Svg viewBox="0 0 256 256" width={84} height={84} fill="none">
          <Path
            d="M48 80 L 48 200 A 8 8 0 0 0 56 208 L 184 208"
            stroke={colors.mutedSoft}
            strokeWidth={12}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M72 80 L 88 56 L 168 56 L 184 80 L 200 80 A 8 8 0 0 1 208 88 L 208 188"
            stroke={colors.mutedSoft}
            strokeWidth={12}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx={128}
            cy={132}
            r={32}
            stroke={colors.mutedSoft}
            strokeWidth={12}
            fill="none"
          />
          <Line x1={40} y1={40} x2={216} y2={216} stroke={colors.mutedSoft} strokeWidth={14} strokeLinecap="round" />
        </Svg>
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
    <Glass material="regular" style={[styles.stepCard, shadow('sm')]}>
      <View style={styles.numBadge}>
        <Text variant="caption" tone="inverse" style={styles.numText}>
          {String(props.num)}
        </Text>
      </View>
      <Text variant="body" tone="soft" style={styles.stepText}>
        {props.text}
      </Text>
    </Glass>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.s5, alignItems: 'center', gap: 4 },
  smallCap: {
    color: colors.statusDanger,
    fontSize: 10.5,
    letterSpacing: 0.84,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  title: { marginTop: spacing.s2, textAlign: 'center' },
  body: { marginTop: spacing.s2, textAlign: 'center' },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: colors.ivoryDim,
    alignSelf: 'center',
    marginTop: spacing.s4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: { marginTop: spacing.s4, gap: spacing.s2 },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    padding: 12,
    borderRadius: 16,
  },
  numBadge: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: colors.ivory, fontSize: 11, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 12.5 },
});
