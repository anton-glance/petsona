import * as Sentry from '@sentry/react-native';

import { beforeSend, initSentry } from './sentry';

describe('initSentry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  function callInIsolation(): void {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules requires sync require
      const { initSentry: fresh } = require('./sentry') as typeof import('./sentry');
      fresh();
    });
  }

  it('calls Sentry.init with tracesSampleRate: 0 (no performance tracking)', () => {
    callInIsolation();
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ tracesSampleRate: 0 }),
    );
  });

  it('calls Sentry.init with replaysSessionSampleRate: 0 (no session replay)', () => {
    callInIsolation();
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ replaysSessionSampleRate: 0 }),
    );
  });

  it('calls Sentry.init with replaysOnErrorSampleRate: 0', () => {
    callInIsolation();
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ replaysOnErrorSampleRate: 0 }),
    );
  });

  it('tags the environment based on __DEV__', () => {
    callInIsolation();
    expect(Sentry.init).toHaveBeenCalledWith(
      // Jest sets __DEV__ = true; matches the dev branch.
      expect.objectContaining({ environment: 'development' }),
    );
  });

  it('passes an empty integrations array (no auto-loaded replay)', () => {
    callInIsolation();
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ integrations: [] }),
    );
  });

  it('passes the DSN from EXPO_PUBLIC_SENTRY_DSN', () => {
    callInIsolation();
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN }),
    );
  });

  it('is idempotent: a second call does not re-init', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules requires sync require
      const { initSentry: fresh } = require('./sentry') as typeof import('./sentry');
      fresh();
      fresh();
    });
    expect(Sentry.init).toHaveBeenCalledTimes(1);
  });
});

describe('beforeSend', () => {
  it('returns null for events with no stack trace', () => {
    const event = { exception: { values: [{ stacktrace: { frames: [] } }] } };
    expect(beforeSend(event)).toBeNull();
  });

  it('returns null for events with no exception at all', () => {
    const event = {};
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
    };
    expect(beforeSend(event)).toBe(event);
  });
});
