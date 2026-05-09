import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

export interface CreateSupabaseClientOptions {
  url?: string;
  anonKey?: string;
}

export function createSupabaseClient(_opts: CreateSupabaseClientOptions = {}): SupabaseClient {
  // stub — real implementation lands in feat commit
  return createClient('https://stub.invalid', 'stub-key');
}

let _instance: SupabaseClient | undefined;
function getInstance(): SupabaseClient {
  if (!_instance) {
    _instance = createSupabaseClient();
  }
  return _instance;
}

// Lazy singleton: deferring construction lets tests import this module without
// triggering a SupabaseClient (which pulls in RealtimeClient, which needs a
// WebSocket polyfill on Node 20).
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver): unknown {
    return Reflect.get(getInstance(), prop, receiver);
  },
});
