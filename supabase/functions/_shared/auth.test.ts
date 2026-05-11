import { assertEquals } from 'jsr:@std/assert@^1.0.0';

import { type AuthClientLike, getUser } from './auth.ts';

interface FakeClientOpts {
  userId?: string;
  errorMessage?: string;
}

function fakeClient(opts: FakeClientOpts = {}): AuthClientLike {
  return {
    getUser(_jwt: string) {
      if (opts.errorMessage) {
        return Promise.resolve({
          data: { user: null },
          error: { message: opts.errorMessage },
        });
      }
      return Promise.resolve({
        data: { user: opts.userId ? { id: opts.userId } : null },
        error: null,
      });
    },
  };
}

Deno.test('getUser > returns null when Authorization header is missing', async () => {
  const req = new Request('https://example.com/hello', { method: 'POST' });
  const result = await getUser(req, () => fakeClient({ userId: 'should-not-be-used' }));
  assertEquals(result, null);
});

Deno.test('getUser > returns null when supabase auth.getUser returns no user', async () => {
  const req = new Request('https://example.com/hello', {
    method: 'POST',
    headers: { Authorization: 'Bearer bad-jwt' },
  });
  const result = await getUser(req, () => fakeClient({ errorMessage: 'invalid jwt' }));
  assertEquals(result, null);
});

Deno.test('getUser > returns { user_id } when supabase auth.getUser returns a user', async () => {
  const req = new Request('https://example.com/hello', {
    method: 'POST',
    headers: { Authorization: 'Bearer good-jwt' },
  });
  const result = await getUser(req, () => fakeClient({ userId: 'anon-abc' }));
  assertEquals(result, { user_id: 'anon-abc' });
});

Deno.test('getUser > tolerates lowercase "bearer" prefix', async () => {
  const req = new Request('https://example.com/hello', {
    method: 'POST',
    headers: { Authorization: 'bearer good-jwt' },
  });
  const result = await getUser(req, () => fakeClient({ userId: 'anon-mixed' }));
  assertEquals(result, { user_id: 'anon-mixed' });
});
