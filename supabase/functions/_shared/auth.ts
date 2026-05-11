import { createClient } from 'npm:@supabase/supabase-js@^2.105.0';

export interface AuthClientLike {
  getUser(
    jwt: string,
  ): Promise<{
    data: { user: { id: string } | null };
    error: { message: string } | null;
  }>;
}

export type AuthClientFactory = () => AuthClientLike;

/**
 * Extracts the verified user from the Authorization header.
 *
 * Uses the anon key + the caller's forwarded JWT (per Supabase's standard
 * server-side pattern). The platform gateway has already verified the JWT
 * before this function is invoked when verify_jwt = true (the default).
 *
 * Returns null on missing/invalid auth; callers decide whether to 401.
 */
export async function getUser(
  req: Request,
  factory: AuthClientFactory = defaultFactory,
): Promise<{ user_id: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  const jwt = match?.[1] ?? authHeader;

  const client = factory();
  const { data, error } = await client.getUser(jwt);
  if (error || !data.user?.id) return null;
  return { user_id: data.user.id };
}

function defaultFactory(): AuthClientLike {
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL or SUPABASE_ANON_KEY missing from edge runtime env');
  }
  const supabase = createClient(url, anonKey);
  return {
    getUser: (jwt: string) => supabase.auth.getUser(jwt),
  };
}
