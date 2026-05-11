import * as Sentry from '@sentry/react-native';
import { PostHog } from 'posthog-react-native';

import { Events } from './events';
import { captureException, identify, track } from './telemetry';

interface PostHogMockInstance {
  capture: jest.Mock;
  identify: jest.Mock;
  screen: jest.Mock;
  flush: jest.Mock;
}

function getPostHogMockInstance(): PostHogMockInstance {
  // The mock factory in jest.setup.ts makes PostHog return the same instance
  // shape each time. We grab the latest constructed instance.
  const PostHogMock = PostHog as unknown as jest.Mock;
  const calls = PostHogMock.mock.results;
  if (calls.length === 0) {
    throw new Error('PostHog constructor was never called');
  }
  return calls[calls.length - 1]?.value as PostHogMockInstance;
}

describe('track', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards event name to PostHog capture', () => {
    track(Events.app_launch);
    const ph = getPostHogMockInstance();
    expect(ph.capture).toHaveBeenCalledWith('app_launch', undefined);
  });

  it('forwards properties to PostHog capture', () => {
    track(Events.app_launch, { locale: 'en' });
    const ph = getPostHogMockInstance();
    expect(ph.capture).toHaveBeenCalledWith('app_launch', { locale: 'en' });
  });

  it('passes test_error_thrown through unchanged', () => {
    track(Events.test_error_thrown);
    const ph = getPostHogMockInstance();
    expect(ph.capture).toHaveBeenCalledWith('test_error_thrown', undefined);
  });
});

describe('captureException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards the error to Sentry.captureException', () => {
    const err = new Error('boom');
    captureException(err);
    expect(Sentry.captureException).toHaveBeenCalledWith(err, undefined);
  });

  it('forwards context as an extras hint', () => {
    const err = new Error('boom');
    captureException(err, { requestId: 'abc-123' });
    expect(Sentry.captureException).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ extra: { requestId: 'abc-123' } }),
    );
  });
});

describe('identify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards userId to PostHog.identify', () => {
    identify('user-abc');
    const ph = getPostHogMockInstance();
    expect(ph.identify).toHaveBeenCalledWith('user-abc', undefined);
  });

  it('forwards traits to PostHog.identify', () => {
    identify('user-abc', { locale: 'en' });
    const ph = getPostHogMockInstance();
    expect(ph.identify).toHaveBeenCalledWith('user-abc', { locale: 'en' });
  });
});
