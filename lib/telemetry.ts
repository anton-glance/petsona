import * as Sentry from '@sentry/react-native';

import type { EventName } from './events';
import { posthog } from './posthog';

/**
 * Facade for product analytics + error reporting. Feature code should import
 * track/captureException/identify from this file rather than from
 * posthog-react-native or @sentry/react-native directly. This keeps the SDK
 * imports concentrated in one place per D-009 discipline.
 *
 * Callers pass Record<string, unknown> at the boundary; PostHog's capture/
 * identify signatures want a stricter JSON-typed record. Non-JSON values still
 * serialize on the wire (PostHog stringifies), so a cast at the boundary keeps
 * the public API ergonomic without changing runtime behavior.
 */

type PostHogProperties = Parameters<typeof posthog.capture>[1];

export function track(event: EventName, properties?: Record<string, unknown>): void {
  posthog.capture(event, properties as PostHogProperties);
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function identify(userId: string, traits?: Record<string, unknown>): void {
  posthog.identify(userId, traits as PostHogProperties);
}
