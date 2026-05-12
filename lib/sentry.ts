import * as Sentry from '@sentry/react-native';
import type { ErrorEvent } from '@sentry/react-native';

const SENTRY_DSN_PATTERN = /^https?:\/\/[^@]+@[^/]+\/\d+$/;

export function beforeSend(event: ErrorEvent): ErrorEvent | null {
  const firstException = event.exception?.values?.[0];
  const frames = firstException?.stacktrace?.frames;
  if (!frames || frames.length === 0) {
    return null;
  }
  return event;
}

let _initialized = false;

/** Test-only: resets the idempotency guard so a fresh `initSentry()` re-runs. */
export function _resetForTesting(): void {
  _initialized = false;
}

export function initSentry(): void {
  if (_initialized) return;
  _initialized = true;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
  if (!SENTRY_DSN_PATTERN.test(dsn)) {
    // logger is unsafe here: it would route into Sentry.captureException which
    // isn't yet initialized. Use console directly for this single early-boot
    // diagnostic. (eslint allowance for lib/logger.ts is the only console; here
    // we intentionally bypass via a disable comment scoped to one line.)
    // eslint-disable-next-line no-console -- early-boot diagnostic, before logger is ready
    console.warn('[sentry] DSN does not match expected format; events may not arrive');
  }

  Sentry.init({
    dsn,
    environment: typeof __DEV__ !== 'undefined' && __DEV__ ? 'development' : 'production',
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
    integrations: [],
    beforeSend,
  });
}
