import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import '../global.css';
import { initI18n } from '../i18n';
import { logger } from '../lib/logger';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore: splash may already be hidden in some launch paths.
});

export default function RootLayout(): React.JSX.Element | null {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    initI18n()
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch((err: unknown) => {
        logger.error('i18n init failed', { err: String(err) });
        if (!cancelled) {
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
