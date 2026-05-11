import type { PostHog as PostHogClient } from 'posthog-react-native';

export function resolvePostHogConfig(): {
  apiKey: string;
  options: Record<string, unknown>;
} {
  throw new Error('resolvePostHogConfig not implemented');
}

let _instance: PostHogClient | undefined;
function getInstance(): PostHogClient {
  if (!_instance) {
    throw new Error('posthog singleton not implemented');
  }
  return _instance;
}

export const posthog: PostHogClient = new Proxy({} as PostHogClient, {
  get(_target, prop, receiver): unknown {
    return Reflect.get(getInstance(), prop, receiver);
  },
});
