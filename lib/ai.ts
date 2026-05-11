import type { SupabaseClient } from '@supabase/supabase-js';

export async function callEdgeFunction<T>(
  _name: string,
  _body?: unknown,
  _client?: SupabaseClient,
): Promise<T> {
  throw new Error('callEdgeFunction not implemented');
}
