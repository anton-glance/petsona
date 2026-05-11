import { assertEquals } from 'jsr:@std/assert@^1.0.0';

import { type AuthClientLike } from '../_shared/auth.ts';
import { handle } from './index.ts';

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

Deno.test('hello > OPTIONS returns 204 with CORS headers', async () => {
  const res = await handle(new Request('https://example.com/hello', { method: 'OPTIONS' }));
  assertEquals(res.status, 204);
  assertEquals(res.headers.get('Access-Control-Allow-Origin'), '*');
  // Consume the body so Deno doesn't complain about resource leaks.
  await res.body?.cancel();
});

Deno.test('hello > POST without Authorization returns 401', async () => {
  const res = await handle(new Request('https://example.com/hello', { method: 'POST' }));
  assertEquals(res.status, 401);
  assertEquals(res.headers.get('Content-Type'), 'application/json');
  const body = (await res.json()) as { error: string };
  assertEquals(body.error, 'unauthorized');
});

Deno.test('hello > POST with valid JWT returns { message, user_id }', async () => {
  const req = new Request('https://example.com/hello', {
    method: 'POST',
    headers: { Authorization: 'Bearer good-jwt' },
  });
  const res = await handle(req, () => fakeClient({ userId: 'anon-xyz' }));
  assertEquals(res.status, 200);
  assertEquals(res.headers.get('Content-Type'), 'application/json');
  const body = (await res.json()) as { message: string; user_id: string };
  assertEquals(body, { message: 'hello', user_id: 'anon-xyz' });
});

Deno.test('hello > POST with invalid JWT returns 401', async () => {
  const req = new Request('https://example.com/hello', {
    method: 'POST',
    headers: { Authorization: 'Bearer bad-jwt' },
  });
  const res = await handle(req, () => fakeClient({ errorMessage: 'invalid jwt' }));
  assertEquals(res.status, 401);
});
