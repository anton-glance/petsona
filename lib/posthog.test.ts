import { PostHog } from 'posthog-react-native';

import { resolvePostHogConfig } from './posthog';

describe('resolvePostHogConfig', () => {
  it('uses the US PostHog Cloud host', () => {
    const config = resolvePostHogConfig();
    expect(config.options.host).toBe('https://us.i.posthog.com');
  });

  it('disables session recording', () => {
    const config = resolvePostHogConfig();
    expect(config.options.disableSessionRecording).toBe(true);
  });

  it('uses flushAt: 1 in __DEV__', () => {
    const config = resolvePostHogConfig();
    // Jest sets __DEV__ to true; this branch is what we exercise in tests.
    expect(config.options.flushAt).toBe(1);
  });

  it('reads apiKey from EXPO_PUBLIC_POSTHOG_API_KEY', () => {
    const config = resolvePostHogConfig();
    expect(config.apiKey).toBe(process.env.EXPO_PUBLIC_POSTHOG_API_KEY);
  });
});

describe('posthog singleton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('constructs PostHog exactly once across multiple property accesses', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules requires sync require
      const { posthog: instance } = require('./posthog') as typeof import('./posthog');
      // Touch the singleton twice; constructor should fire once.
      void instance.capture;
      void instance.identify;
      expect(PostHog).toHaveBeenCalledTimes(1);
    });
  });

  it('passes the resolved config into the PostHog constructor', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules requires sync require
      const { posthog: instance } = require('./posthog') as typeof import('./posthog');
      void instance.capture;
      expect(PostHog).toHaveBeenCalledWith(
        process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
        expect.objectContaining({
          host: 'https://us.i.posthog.com',
          disableSessionRecording: true,
        }),
      );
    });
  });
});
