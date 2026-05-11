import type { SupabaseClient } from '@supabase/supabase-js';

import { ensureSignedIn } from './auth';

interface MockAuthOptions {
  existingUserId?: string | null;
  signInUserId?: string | null;
  signInError?: { message: string } | null;
}

function makeMockClient(opts: MockAuthOptions = {}): SupabaseClient {
  const session = opts.existingUserId ? { user: { id: opts.existingUserId } } : null;
  const signInResult = opts.signInError
    ? { data: { user: null, session: null }, error: opts.signInError }
    : {
        data: { user: { id: opts.signInUserId ?? 'new-anon-uid' }, session: { user: { id: opts.signInUserId ?? 'new-anon-uid' } } },
        error: null,
      };
  return {
    auth: {
      getSession: jest.fn(async () => ({ data: { session }, error: null })),
      signInAnonymously: jest.fn(async () => signInResult),
    },
  } as unknown as SupabaseClient;
}

describe('ensureSignedIn', () => {
  it('returns existing userId when a session is already present', async () => {
    const client = makeMockClient({ existingUserId: 'existing-uid' });
    const result = await ensureSignedIn(client);
    expect(result.userId).toBe('existing-uid');
    expect(client.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('calls signInAnonymously when no session exists', async () => {
    const client = makeMockClient({ existingUserId: null, signInUserId: 'fresh-uid' });
    const result = await ensureSignedIn(client);
    expect(result.userId).toBe('fresh-uid');
    expect(client.auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('throws when signInAnonymously returns an error', async () => {
    const client = makeMockClient({
      existingUserId: null,
      signInError: { message: 'anonymous sign-in disabled' },
    });
    await expect(ensureSignedIn(client)).rejects.toThrow(/anonymous sign-in/);
  });
});
