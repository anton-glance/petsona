// Node 20 lacks native WebSocket; supabase-js's RealtimeClient requires it.
// Polyfill via 'ws' so createClient() doesn't throw at construction.
import { WebSocket as WsWebSocket } from 'ws';

// Deterministic env for tests so module-level reads (lib/env, lib/supabase) succeed.
process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://test-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'test-anon-key-1234567890';
process.env.EXPO_PUBLIC_POSTHOG_API_KEY =
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? 'phc_test_key_1234567890';
process.env.EXPO_PUBLIC_SENTRY_DSN =
  process.env.EXPO_PUBLIC_SENTRY_DSN ?? 'https://test@oTEST.ingest.us.sentry.io/1234567';

if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as { WebSocket: unknown }).WebSocket = WsWebSocket;
}

// AsyncStorage ships a Jest mock that swaps the native bridge for an in-memory
// Map. supabase-js's auth client touches storage at construction time, so the
// mock has to be registered before any test imports lib/supabase.
jest.mock(
  '@react-native-async-storage/async-storage',
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory must be sync
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// PostHog and Sentry mocks: both SDKs touch native bridges at construction or
// init, neither of which exist in the Node test env. Each mock exposes the
// surface lib/posthog.ts, lib/sentry.ts, and lib/telemetry.ts actually call.
jest.mock('posthog-react-native', () => {
  const capture = jest.fn();
  const identify = jest.fn();
  const screen = jest.fn();
  const flush = jest.fn(async () => undefined);
  const PostHog = jest.fn().mockImplementation(() => ({ capture, identify, screen, flush }));
  // Also export PostHogProvider as a passthrough component for tests that
  // render the boot layer.
  const PostHogProvider = ({ children }: { children: unknown }): unknown => children;
  return { PostHog, PostHogProvider };
});

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
}));

// Importing react-native-reanimated outside the RN runtime triggers
// worklets-native init and crashes Jest. The library's own mock re-imports
// the live module so it can't be used here. Instead provide a minimal mock
// covering the surface that lib/motion.ts + components consume: Easing,
// withTiming, useSharedValue, useAnimatedStyle, useDerivedValue.
jest.mock('react-native-reanimated', () => {
  const noop = (): void => undefined;
  const identity = <T,>(x: T): T => x;
  const bezier = (
    _a: number,
    _b: number,
    _c: number,
    _d: number,
  ): ((t: number) => number) => identity;
  const Easing = {
    bezier,
    linear: identity,
    ease: identity,
    inOut: (_fn: unknown) => identity,
    out: (_fn: unknown) => identity,
    in: (_fn: unknown) => identity,
  };
  const useSharedValue = <T,>(initial: T): { value: T } => ({ value: initial });
  const useAnimatedStyle = (fn: () => unknown): unknown => fn();
  const useDerivedValue = <T,>(fn: () => T): { value: T } => ({ value: fn() });
  const withTiming = <T,>(toValue: T): T => toValue;
  const withSpring = <T,>(toValue: T): T => toValue;
  const withDelay = <T,>(_d: number, value: T): T => value;
  return {
    __esModule: true,
    default: { View: 'Animated.View', Text: 'Animated.Text' },
    Easing,
    useSharedValue,
    useAnimatedStyle,
    useDerivedValue,
    withTiming,
    withSpring,
    withDelay,
    runOnJS: identity,
    runOnUI: identity,
    cancelAnimation: noop,
  };
});
