import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase as defaultClient } from './supabase';

/**
 * Calls a Supabase Edge Function with the current session's JWT attached.
 *
 * Wraps supabase.functions.invoke so callers don't manage Authorization
 * headers or session lookup. Throws on non-2xx with the response body as
 * error message (per D-003 AI gateway pattern).
 */
export async function callEdgeFunction<T>(
  name: string,
  body?: Record<string, unknown>,
  client: SupabaseClient = defaultClient,
): Promise<T> {
  const { data, error } = await client.functions.invoke<T>(name, { body });
  if (error) {
    throw new Error(`edge function ${name} failed: ${error.message}`);
  }
  return data as T;
}
