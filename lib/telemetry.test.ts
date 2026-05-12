import * as Sentry from '@sentry/react-native';
import { PostHog } from 'posthog-react-native';

import { Events } from './events';
import { _resetForTesting, posthog } from './posthog';
import { captureException, identify, track } from './telemetry';

const PostHogMock = PostHog as unknown as jest.Mock;

interface PostHogMockInstance {
  capture: jest.Mock;
  identify: jest.Mock;
  screen: jest.Mock;
  flush: jest.Mock;
}

function getPostHogMockInstance(): PostHogMockInstance {
  // Touch the proxy to force singleton construction.
  void posthog.capture;
  const calls = PostHogMock.mock.results;
  if (calls.length === 0) {
    throw new Error('PostHog constructor was never called');
  }
  return calls[calls.length - 1]?.value as PostHogMockInstance;
}

describe('track', () => {
  beforeEach(() => {
    _resetForTesting();
    PostHogMock.mockClear();
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
  const captureMock = Sentry.captureException as jest.Mock;

  beforeEach(() => {
    captureMock.mockClear();
  });

  it('forwards the error to Sentry.captureException', () => {
    const err = new Error('boom');
    captureException(err);
    expect(captureMock).toHaveBeenCalledWith(err, undefined);
  });

  it('forwards context as an extras hint', () => {
    const err = new Error('boom');
    captureException(err, { requestId: 'abc-123' });
    expect(captureMock).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ extra: { requestId: 'abc-123' } }),
    );
  });
});

describe('identify', () => {
  beforeEach(() => {
    _resetForTesting();
    PostHogMock.mockClear();
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
