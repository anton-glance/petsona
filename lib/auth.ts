import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase as defaultClient } from './supabase';

/**
 * Ensures the app has a valid Supabase session, creating an anonymous one if
 * none exists. Idempotent: subsequent calls return the existing session's
 * userId without contacting the auth server unnecessarily.
 *
 * Per D-004 (anonymous-first auth): every app launch produces an `auth.uid()`
 * for RLS. `linkIdentity` upgrades the anonymous user at the paywall (R4).
 */
export async function ensureSignedIn(
  client: SupabaseClient = defaultClient,
): Promise<{ userId: string }> {
  const { data: sessionData } = await client.auth.getSession();
  const existingId = sessionData.session?.user?.id;
  if (existingId) {
    return { userId: existingId };
  }

  const { data, error } = await client.auth.signInAnonymously();
  if (error) {
    throw new Error(`anonymous sign-in failed: ${error.message}`);
  }
  if (!data.user?.id) {
    throw new Error('anonymous sign-in returned no user');
  }
  return { userId: data.user.id };
}
