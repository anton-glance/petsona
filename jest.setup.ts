// Deterministic env for tests so module-level reads (lib/env, lib/supabase) succeed.
process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://test-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'test-anon-key-1234567890';

// Node 20 lacks native WebSocket; supabase-js's RealtimeClient requires it.
// Polyfill via 'ws' so createClient() doesn't throw at construction.
import { WebSocket as WsWebSocket } from 'ws';
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as { WebSocket: unknown }).WebSocket = WsWebSocket;
}
