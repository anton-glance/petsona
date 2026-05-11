import type { Event } from '@sentry/react-native';

export function beforeSend(event: Event): Event | null {
  // Stub: red phase. Implementation drops stackless events.
  void event;
  throw new Error('beforeSend not implemented');
}

export function initSentry(): void {
  throw new Error('initSentry not implemented');
}
