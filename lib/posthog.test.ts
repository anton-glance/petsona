import { PostHog } from 'posthog-react-native';

import { _resetForTesting, posthog, resolvePostHogConfig } from './posthog';

const PostHogMock = PostHog as unknown as jest.Mock;

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
    _resetForTesting();
    PostHogMock.mockClear();
  });

  it('constructs PostHog exactly once across multiple property accesses', () => {
    // Touch the singleton twice; constructor should fire once.
    void posthog.capture;
    void posthog.identify;
    expect(PostHogMock).toHaveBeenCalledTimes(1);
  });

  it('passes the resolved config into the PostHog constructor', () => {
    void posthog.capture;
    expect(PostHogMock).toHaveBeenCalledWith(
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
      expect.objectContaining({
        host: 'https://us.i.posthog.com',
        disableSessionRecording: true,
      }),
    );
  });
});
