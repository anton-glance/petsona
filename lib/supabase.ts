import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient, SupportedStorage } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import { EnvError, readPublicEnv } from './env';

export interface CreateSupabaseClientOptions {
  url?: string;
  anonKey?: string;
  storage?: SupportedStorage;
}

export interface ResolvedClientConfig {
  url: string;
  anonKey: string;
  storage: SupportedStorage;
}

export function resolveClientConfig(opts: CreateSupabaseClientOptions = {}): ResolvedClientConfig {
  let url: string;
  let anonKey: string;
  if (opts.url !== undefined || opts.anonKey !== undefined) {
    if (!opts.url) {
      throw new EnvError('SUPABASE_URL is empty');
    }
    if (!opts.anonKey) {
      throw new EnvError('SUPABASE_ANON_KEY is empty');
    }
    url = opts.url;
    anonKey = opts.anonKey;
  } else {
    const env = readPublicEnv();
    url = env.SUPABASE_URL;
    anonKey = env.SUPABASE_ANON_KEY;
  }
  return {
    url,
    anonKey,
    storage: opts.storage ?? AsyncStorage,
  };
}

export function createSupabaseClient(opts: CreateSupabaseClientOptions = {}): SupabaseClient {
  const config = resolveClientConfig(opts);
  return createClient(config.url, config.anonKey, {
    auth: {
      storage: config.storage,
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

// Lazy singleton via Proxy: deferring construction lets tests import this
// module without triggering a SupabaseClient (which pulls in RealtimeClient,
// which needs a WebSocket polyfill on Node 20).
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver): unknown {
    return Reflect.get(getInstance(), prop, receiver);
  },
});
