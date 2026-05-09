import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import { EnvError, readPublicEnv } from './env';

export interface CreateSupabaseClientOptions {
  url?: string;
  anonKey?: string;
}

export function createSupabaseClient(opts: CreateSupabaseClientOptions = {}): SupabaseClient {
  const env = (() => {
    if (opts.url !== undefined || opts.anonKey !== undefined) {
      // Caller passed explicit values: validate them (don't fall through to env).
      if (!opts.url) {
        throw new EnvError('SUPABASE_URL is empty');
      }
      if (!opts.anonKey) {
        throw new EnvError('SUPABASE_ANON_KEY is empty');
      }
      return { SUPABASE_URL: opts.url, SUPABASE_ANON_KEY: opts.anonKey };
    }
    return readPublicEnv();
  })();

  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      // The client is shared across screens; let the SDK manage session storage.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
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
