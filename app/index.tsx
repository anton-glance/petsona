/**
 * Splash — onboarding step 01 (D-017).
 *
 * The app's entry route. Tapping [Get started] tracks the funnel and
 * navigates to /onboarding/camera-permission (step 02).
 *
 * The R0 smoke screen that previously lived here is removed entirely — R0
 * verification is closed, and the R1-M1 breed-identify smoke button is
 * replaced by the real pipeline at step 03. Git revert is the recovery path.
 */
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, StyleSheet, View } from 'react-native';

import { Button, CtaStack, ScreenContainer, Text } from '../components/ui';
import { Events } from '../lib/events';
import { spacing } from '../lib/theme';
import { track } from '../lib/telemetry';

// PNG, not SVG: React Native's <Image> can't render SVG without
// react-native-svg-transformer (not configured at this stage). app-icon
// is the brand mark per docs/design/README.md §5.
const LOGO = require('../assets/brand/app-icon-1024.png');

export default function Splash(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  const handleGetStarted = (): void => {
    track(Events.onboarding_started);
    router.push('/onboarding/camera-permission');
  };

  return (
    <ScreenContainer tone="light">
      <View style={styles.logoWrap}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      </View>
      <View style={styles.copy}>
        <Text variant="displayXl">{t('splash.welcome')}</Text>
        <Text variant="bodyLg" tone="soft" style={styles.body}>
          {t('splash.body')}
        </Text>
      </View>
      <CtaStack>
        <Button onPress={handleGetStarted}>{t('splash.cta')}</Button>
        <View style={styles.terms}>
          <Text variant="caption" tone="muted" style={styles.termsText}>
            {t('splash.termsLead')}{' '}
            <Text
              variant="caption"
              tone="muted"
              style={styles.link}
              onPress={() => void Linking.openURL('https://petsona.app/terms')}
            >
              {t('splash.termsOfUse')}
            </Text>{' '}
            {t('splash.termsAnd')}{' '}
            <Text
              variant="caption"
              tone="muted"
              style={styles.link}
              onPress={() => void Linking.openURL('https://petsona.app/privacy')}
            >
              {t('splash.privacyPolicy')}
            </Text>
            .
          </Text>
        </View>
      </CtaStack>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    alignItems: 'center',
    marginTop: spacing.s7,
    marginBottom: spacing.s5,
  },
  logo: { width: 96, height: 96 },
  copy: {
    paddingHorizontal: spacing.s2,
    gap: spacing.s3,
  },
  body: { marginTop: spacing.s3 },
  terms: { marginTop: spacing.s2, alignItems: 'center' },
  termsText: { textAlign: 'center' },
  link: { textDecorationLine: 'underline' },
});
