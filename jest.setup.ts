// Node 20 lacks native WebSocket; supabase-js's RealtimeClient requires it.
// Polyfill via 'ws' so createClient() doesn't throw at construction.
import { WebSocket as WsWebSocket } from 'ws';

// Deterministic env for tests so module-level reads (lib/env, lib/supabase) succeed.
process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://test-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'test-anon-key-1234567890';

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
