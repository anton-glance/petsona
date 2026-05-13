/**
 * Splash — onboarding step 01 (D-017). Mockup: `docs/design/01_splash.html`.
 *
 * Ivory→honey gradient background, paw-pattern overlay, 170×170 brand
 * logo, headline + body copy, primary CTA, Terms / Privacy footer.
 *
 * The R0 smoke screen that previously lived here was removed at R1-M2
 * close. Git revert is the recovery path if needed.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, StyleSheet, View } from 'react-native';

import { Button, CtaStack, PetPattern, ScreenContainer, Text } from '../components/ui';
import { Events } from '../lib/events';
import { colors, spacing } from '../lib/theme';
import { track } from '../lib/telemetry';

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
      <LinearGradient
        testID="splash-gradient"
        colors={[colors.ivory, '#F5E8C4', '#EAD6A0']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <PetPattern species="unknown" opacity={0.22} testID="splash-paw-pattern" />

      <View style={styles.logoWrap}>
        <Image
          testID="splash-logo"
          source={LOGO}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.copy}>
        <Text variant="displayLg" style={styles.headline}>
          {t('splash.welcome')}
        </Text>
        <Text variant="body" tone="soft" style={styles.body}>
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  logo: { width: 170, height: 170 },
  copy: {
    paddingHorizontal: spacing.s2,
    gap: spacing.s2,
    alignItems: 'center',
    marginBottom: spacing.s5,
    zIndex: 2,
  },
  headline: { color: colors.forestDark, textAlign: 'center', fontWeight: '700' },
  body: { textAlign: 'center', maxWidth: 280 },
  terms: { marginTop: spacing.s2, alignItems: 'center' },
  termsText: { textAlign: 'center', fontSize: 10.5, letterSpacing: 0.04, textTransform: 'none' },
  link: { textDecorationLine: 'underline', color: colors.forest, fontWeight: '500' },
});
