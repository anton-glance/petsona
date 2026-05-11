import type { SupabaseClient } from '@supabase/supabase-js';

export async function ensureSignedIn(_client?: SupabaseClient): Promise<{ userId: string }> {
  throw new Error('ensureSignedIn not implemented');
}
