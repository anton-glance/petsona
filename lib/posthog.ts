import { PostHog } from 'posthog-react-native';
import type { PostHog as PostHogClient } from 'posthog-react-native';

interface PostHogOptions {
  host: string;
  disableSessionRecording: boolean;
  flushAt: number;
  captureAppLifecycleEvents: boolean;
  captureNativeAppLifecycleEvents: boolean;
  sendFeatureFlagEvents: boolean;
}

const POSTHOG_KEY_PATTERN = /^phc_/;

export function resolvePostHogConfig(): { apiKey: string; options: PostHogOptions } {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '';
  if (!POSTHOG_KEY_PATTERN.test(apiKey)) {
    // eslint-disable-next-line no-console -- early-boot diagnostic, before logger is ready
    console.warn('[posthog] API key does not start with phc_; events may not arrive');
  }
  return {
    apiKey,
    options: {
      host: 'https://us.i.posthog.com',
      disableSessionRecording: true,
      flushAt: typeof __DEV__ !== 'undefined' && __DEV__ ? 1 : 20,
      captureAppLifecycleEvents: true,
      captureNativeAppLifecycleEvents: true,
      sendFeatureFlagEvents: false,
    },
  };
}

let _instance: PostHogClient | undefined;
function getInstance(): PostHogClient {
  if (!_instance) {
    const { apiKey, options } = resolvePostHogConfig();
    _instance = new PostHog(apiKey, options);
  }
  return _instance;
}

/** Test-only: drops the cached singleton so a fresh property access rebuilds it. */
export function _resetForTesting(): void {
  _instance = undefined;
}

// Lazy singleton via Proxy: tests import this module without spinning up a
// real PostHog client. Same pattern as lib/supabase.ts.
export const posthog: PostHogClient = new Proxy({} as PostHogClient, {
  get(_target, prop, receiver): unknown {
    return Reflect.get(getInstance(), prop, receiver);
  },
});
