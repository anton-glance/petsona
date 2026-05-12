import * as Sentry from '@sentry/react-native';
import type { ErrorEvent } from '@sentry/react-native';

import { _resetForTesting, beforeSend, initSentry } from './sentry';

const initMock = Sentry.init as jest.Mock;

describe('initSentry', () => {
  beforeEach(() => {
    _resetForTesting();
    initMock.mockClear();
  });

  it('calls Sentry.init with tracesSampleRate: 0 (no performance tracking)', () => {
    initSentry();
    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({ tracesSampleRate: 0 }),
    );
  });

  it('calls Sentry.init with replaysSessionSampleRate: 0 (no session replay)', () => {
    initSentry();
    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({ replaysSessionSampleRate: 0 }),
    );
  });

  it('calls Sentry.init with replaysOnErrorSampleRate: 0', () => {
    initSentry();
    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({ replaysOnErrorSampleRate: 0 }),
    );
  });

  it('tags the environment based on __DEV__', () => {
    initSentry();
    expect(initMock).toHaveBeenCalledWith(
      // Jest sets __DEV__ = true; matches the dev branch.
      expect.objectContaining({ environment: 'development' }),
    );
  });

  it('passes an empty integrations array (no auto-loaded replay)', () => {
    initSentry();
    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({ integrations: [] }),
    );
  });

  it('passes the DSN from EXPO_PUBLIC_SENTRY_DSN', () => {
    initSentry();
    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN }),
    );
  });

  it('is idempotent: a second call does not re-init', () => {
    initSentry();
    initSentry();
    expect(initMock).toHaveBeenCalledTimes(1);
  });
});

describe('beforeSend', () => {
  it('returns null for events with no stack trace', () => {
    const event = {
      exception: { values: [{ stacktrace: { frames: [] } }] },
    } as unknown as ErrorEvent;
    expect(beforeSend(event)).toBeNull();
  });

  it('returns null for events with no exception at all', () => {
    const event = {} as unknown as ErrorEvent;
    expect(beforeSend(event)).toBeNull();
  });

  it('passes events that have a real stack trace through unchanged', () => {
    const event = {
      exception: {
        values: [
          {
            stacktrace: { frames: [{ filename: 'app.js', lineno: 42, colno: 7 }] },
          },
        ],
      },
    } as unknown as ErrorEvent;
    expect(beforeSend(event)).toBe(event);
  });
});
