import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import '../global.css';
import { initI18n } from '../i18n';
import { ensureSignedIn } from '../lib/auth';
import { logger } from '../lib/logger';
import { useAppStore } from '../lib/store';

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
        }),
      ]);
      const labels = ['i18n init', 'anonymous sign-in'];
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          logger.error(`${labels[i] ?? 'boot step'} failed`, { err: String(result.reason) });
        }
      });
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

  return <Stack screenOptions={{ headerShown: false }} />;
}
