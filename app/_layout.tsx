import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { PostHogProvider } from 'posthog-react-native';
import { useEffect, useState } from 'react';

import '../global.css';
import { initI18n } from '../i18n';
import { ensureSignedIn } from '../lib/auth';
import { Events } from '../lib/events';
import { logger } from '../lib/logger';
import { posthog } from '../lib/posthog';
import { initSentry } from '../lib/sentry';
import { useAppStore } from '../lib/store';
import { identify, track } from '../lib/telemetry';

// Module-level: Sentry must initialize before any code that could throw,
// including the React tree itself. Idempotent (D-009 + R0-M4).
initSentry();

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore: splash may already be hidden in some launch paths.
});

export default function RootLayout(): React.JSX.Element | null {
  const [ready, setReady] = useState(false);
  const setAuthUserId = useAppStore((s) => s.setAuthUserId);

  useEffect(() => {
    let cancelled = false;

    const boot = async (): Promise<void> => {
      const results = await Promise.allSettled([
        initI18n(),
        ensureSignedIn().then((r) => {
          if (!cancelled) {
            setAuthUserId(r.userId);
          }
          return r;
        }),
      ]);
      const labels = ['i18n init', 'anonymous sign-in'];
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          logger.error(`${labels[i] ?? 'boot step'} failed`, { err: String(result.reason) });
        }
      });

      const locale = useAppStore.getState().locale;
      const signInResult = results[1];
      if (signInResult?.status === 'fulfilled') {
        identify(signInResult.value.userId, { locale });
        track(Events.app_launch, { locale });
      } else {
        // Sign-in failed; still fire app_launch under PostHog's anon distinct_id
        // so failed-boot funnel telemetry is preserved.
        track(Events.app_launch, { locale, signin_failed: true });
      }

      if (!cancelled) {
        setReady(true);
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [setAuthUserId]);

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync().catch(() => {
        // Ignore.
      });
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <PostHogProvider client={posthog} autocapture={{ captureScreens: true, captureTouches: false }}>
      <Stack screenOptions={{ headerShown: false }} />
    </PostHogProvider>
  );
}
