import { assert, assertEquals } from 'jsr:@std/assert@^1.0.0';

import { type AuthClientLike } from '../_shared/auth.ts';
import {
  type AiJobRow,
  type AiJobsInserter,
  type AiJobsInserterFactory,
} from '../_shared/logging.ts';
import { type VisionAIClient, type VisionResult } from '../_shared/ai/types.ts';
import { BREED_PROMPT_V, handle } from './index.ts';

// ---------- fixtures ----------

interface FakeClientOpts {
  userId?: string;
  errorMessage?: string;
}

function fakeAuthClient(opts: FakeClientOpts = {}): AuthClientLike {
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

function capturingLogger(): { factory: AiJobsInserterFactory; calls: AiJobRow[] } {
  const calls: AiJobRow[] = [];
  const inserter: AiJobsInserter = {
    insert(row) {
      calls.push(row);
      return Promise.resolve({ error: null });
    },
  };
  return { factory: () => inserter, calls };
}

function workingAdapter(): VisionAIClient {
  return {
    vision(): Promise<VisionResult> {
      return Promise.resolve({
        species: 'dog',
        candidates: [
          { breed: 'Labrador Retriever', confidence: 0.92 },
          { breed: 'Golden Retriever', confidence: 0.05 },
          { breed: 'Beagle', confidence: 0.03 },
        ],
      });
    },
  };
}

function unsortedAdapter(): VisionAIClient {
  // Intentionally returns candidates NOT in descending order, to prove the
  // capability function (not the adapter) does the sorting.
  return {
    vision(): Promise<VisionResult> {
      return Promise.resolve({
        species: 'dog',
        candidates: [
          { breed: 'Beagle', confidence: 0.03 },
          { breed: 'Labrador Retriever', confidence: 0.92 },
          { breed: 'Golden Retriever', confidence: 0.05 },
        ],
      });
    },
  };
}

function throwingAdapter(): VisionAIClient {
  return {
    vision(): Promise<VisionResult> {
      return Promise.reject(new Error('adapter boom'));
    },
  };
}

const VALID_USER = '11111111-1111-1111-1111-111111111111';
const VALID_PATH = `${VALID_USER}/22222222-2222-2222-2222-222222222222.jpg`;

function postReq(body: unknown, opts: { auth?: string } = {}): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.auth !== undefined) headers['Authorization'] = opts.auth;
  return new Request('https://example.com/breed-identify', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// MODEL_FOR_BREED is read at request time. Tests scope env mutation with
// try/finally to avoid leaking state across tests.
function withEnv<T>(name: string, value: string | null, fn: () => Promise<T>): Promise<T> {
  const prior = Deno.env.get(name);
  if (value === null) Deno.env.delete(name);
  else Deno.env.set(name, value);
  return fn().finally(() => {
    if (prior === undefined) Deno.env.delete(name);
    else Deno.env.set(name, prior);
  });
}

// ---------- tests ----------

Deno.test('breed-identify > OPTIONS returns 204 with CORS headers', async () => {
  const res = await handle(
    new Request('https://example.com/breed-identify', { method: 'OPTIONS' }),
  );
  assertEquals(res.status, 204);
  assertEquals(res.headers.get('Access-Control-Allow-Origin'), '*');
  await res.body?.cancel();
});

Deno.test('breed-identify > POST without Authorization returns 401, no ai_jobs row', async () => {
  const logger = capturingLogger();
  const res = await handle(postReq({ photo_path: VALID_PATH }), {
    authFactory: () => fakeAuthClient(),
    loggerFactory: logger.factory,
  });
  assertEquals(res.status, 401);
  const body = (await res.json()) as { error: string };
  assertEquals(body.error, 'unauthorized');
  assertEquals(logger.calls.length, 0);
});

Deno.test('breed-identify > POST with invalid JWT returns 401, no ai_jobs row', async () => {
  const logger = capturingLogger();
  const res = await handle(postReq({ photo_path: VALID_PATH }, { auth: 'Bearer bad' }), {
    authFactory: () => fakeAuthClient({ errorMessage: 'invalid jwt' }),
    loggerFactory: logger.factory,
  });
  assertEquals(res.status, 401);
  assertEquals(logger.calls.length, 0);
});

Deno.test('breed-identify > POST with malformed JSON returns 400 invalid_input, no ai_jobs row', async () => {
  const logger = capturingLogger();
  const res = await handle(postReq('{not json', { auth: 'Bearer good' }), {
    authFactory: () => fakeAuthClient({ userId: VALID_USER }),
    loggerFactory: logger.factory,
  });
  assertEquals(res.status, 400);
  const body = (await res.json()) as { error: string };
  assertEquals(body.error, 'invalid_input');
  assertEquals(logger.calls.length, 0);
});

Deno.test('breed-identify > POST with missing photo_path returns 400, no ai_jobs row', async () => {
  const logger = capturingLogger();
  const res = await handle(postReq({}, { auth: 'Bearer good' }), {
    authFactory: () => fakeAuthClient({ userId: VALID_USER }),
    loggerFactory: logger.factory,
  });
  assertEquals(res.status, 400);
  assertEquals(logger.calls.length, 0);
});

Deno.test('breed-identify > POST with photo_path of wrong type returns 400, no ai_jobs row', async () => {
  const logger = capturingLogger();
  const res = await handle(postReq({ photo_path: 42 }, { auth: 'Bearer good' }), {
    authFactory: () => fakeAuthClient({ userId: VALID_USER }),
    loggerFactory: logger.factory,
  });
  assertEquals(res.status, 400);
  assertEquals(logger.calls.length, 0);
});

Deno.test('breed-identify > POST with photo_path of wrong format (no slash) returns 400, no ai_jobs row', async () => {
  const logger = capturingLogger();
  const res = await handle(postReq({ photo_path: 'no-slash.jpg' }, { auth: 'Bearer good' }), {
    authFactory: () => fakeAuthClient({ userId: VALID_USER }),
    loggerFactory: logger.factory,
  });
  assertEquals(res.status, 400);
  assertEquals(logger.calls.length, 0);
});

Deno.test('breed-identify > POST with photo_path of bad extension returns 400, no ai_jobs row', async () => {
  const logger = capturingLogger();
  const res = await handle(
    postReq({ photo_path: `${VALID_USER}/x.txt` }, { auth: 'Bearer good' }),
    {
      authFactory: () => fakeAuthClient({ userId: VALID_USER }),
      loggerFactory: logger.factory,
    },
  );
  assertEquals(res.status, 400);
  assertEquals(logger.calls.length, 0);
});

Deno.test("breed-identify > POST with photo_path whose user-prefix doesn't match caller user_id returns 400, no ai_jobs row", async () => {
  const logger = capturingLogger();
  const otherUserPath = `99999999-9999-9999-9999-999999999999/foo.jpg`;
  const res = await handle(
    postReq({ photo_path: otherUserPath }, { auth: 'Bearer good' }),
    {
      authFactory: () => fakeAuthClient({ userId: VALID_USER }),
      loggerFactory: logger.factory,
    },
  );
  assertEquals(res.status, 400);
  assertEquals(logger.calls.length, 0);
});

Deno.test('breed-identify > success returns 200 with the hardcoded breed payload, candidates sorted descending', async () => {
  const logger = capturingLogger();
  const res = await handle(postReq({ photo_path: VALID_PATH }, { auth: 'Bearer good' }), {
    authFactory: () => fakeAuthClient({ userId: VALID_USER }),
    loggerFactory: logger.factory,
    adapter: unsortedAdapter(),
  });
  assertEquals(res.status, 200);
  const body = (await res.json()) as {
    species: string;
    breed: string;
    confidence: number;
    candidates: Array<{ breed: string; confidence: number }>;
  };
  assertEquals(body.species, 'dog');
  assertEquals(body.candidates.length, 3);
  for (let i = 1; i < body.candidates.length; i++) {
    const prev = body.candidates[i - 1]?.confidence ?? 0;
    const cur = body.candidates[i]?.confidence ?? 0;
    assert(prev >= cur, `wire candidates not descending at ${i}: ${prev} < ${cur}`);
  }
});

Deno.test('breed-identify > success: top-level breed/confidence equal candidates[0]', async () => {
  const logger = capturingLogger();
  const res = await handle(postReq({ photo_path: VALID_PATH }, { auth: 'Bearer good' }), {
    authFactory: () => fakeAuthClient({ userId: VALID_USER }),
    loggerFactory: logger.factory,
    adapter: workingAdapter(),
  });
  const body = (await res.json()) as {
    breed: string;
    confidence: number;
    candidates: Array<{ breed: string; confidence: number }>;
  };
  assertEquals(body.breed, body.candidates[0]?.breed);
  assertEquals(body.confidence, body.candidates[0]?.confidence);
});

Deno.test('breed-identify > on success, logAiJob called once with expected row shape', async () => {
  const logger = capturingLogger();
  let nowCalls = 0;
  const clock = () => {
    nowCalls++;
    return nowCalls === 1 ? 1_000 : 1_042;
  };
  const res = await handle(postReq({ photo_path: VALID_PATH }, { auth: 'Bearer good' }), {
    authFactory: () => fakeAuthClient({ userId: VALID_USER }),
    loggerFactory: logger.factory,
    adapter: workingAdapter(),
    now: clock,
  });
  assertEquals(res.status, 200);
  assertEquals(logger.calls.length, 1);
  const row = logger.calls[0];
  assert(row !== undefined);
  assertEquals(row.capability, 'breed-identify');
  assertEquals(row.model, 'hardcoded');
  assertEquals(row.prompt_version, BREED_PROMPT_V);
  assertEquals(row.user_id, VALID_USER);
  assertEquals(row.status, 'success');
  assertEquals(row.input_tokens, 0);
  assertEquals(row.output_tokens, 0);
  assertEquals(row.cost_usd, 0);
  assert(row.latency_ms >= 0, `latency_ms should be >= 0, got ${row.latency_ms}`);
  assert(row.input_hash.length > 0, 'input_hash should be non-empty');
});

Deno.test("breed-identify > input_hash = sha256(capability + ':' + prompt_version + ':' + photo_path)", async () => {
  const logger = capturingLogger();
  await handle(postReq({ photo_path: VALID_PATH }, { auth: 'Bearer good' }), {
    authFactory: () => fakeAuthClient({ userId: VALID_USER }),
    loggerFactory: logger.factory,
    adapter: workingAdapter(),
  });
  const expected = await sha256Hex(`breed-identify:${BREED_PROMPT_V}:${VALID_PATH}`);
  assertEquals(logger.calls[0]?.input_hash, expected);
});

Deno.test('breed-identify > when adapter throws, returns 500 internal AND logs ai_jobs with status=error', async () => {
  const logger = capturingLogger();
  const res = await handle(postReq({ photo_path: VALID_PATH }, { auth: 'Bearer good' }), {
    authFactory: () => fakeAuthClient({ userId: VALID_USER }),
    loggerFactory: logger.factory,
    adapter: throwingAdapter(),
  });
  assertEquals(res.status, 500);
  const body = (await res.json()) as { error: string };
  assertEquals(body.error, 'internal');
  assertEquals(logger.calls.length, 1);
  assertEquals(logger.calls[0]?.status, 'error');
  assertEquals(logger.calls[0]?.error_code, 'adapter_error');
  assertEquals(logger.calls[0]?.user_id, VALID_USER);
});

Deno.test('breed-identify > when logger insert rejects on success path, response is still 200', async () => {
  const brokenLogger: AiJobsInserterFactory = () => ({
    insert() {
      return Promise.reject(new Error('logger boom'));
    },
  });
  const original = console.error;
  console.error = () => {};
  try {
    const res = await handle(postReq({ photo_path: VALID_PATH }, { auth: 'Bearer good' }), {
      authFactory: () => fakeAuthClient({ userId: VALID_USER }),
      loggerFactory: brokenLogger,
      adapter: workingAdapter(),
    });
    assertEquals(res.status, 200);
  } finally {
    console.error = original;
  }
});

Deno.test('breed-identify > adapter throws AND logger throws -> returns 500, no exception escapes the handler', async () => {
  const brokenLogger: AiJobsInserterFactory = () => {
    throw new Error('logger factory broken');
  };
  const original = console.error;
  console.error = () => {};
  try {
    // If any exception escapes handle(), this await rejects and the test fails.
    const res = await handle(postReq({ photo_path: VALID_PATH }, { auth: 'Bearer good' }), {
      authFactory: () => fakeAuthClient({ userId: VALID_USER }),
      loggerFactory: brokenLogger,
      adapter: throwingAdapter(),
    });
    assertEquals(res.status, 500);
    const body = (await res.json()) as { error: string };
    assertEquals(body.error, 'internal');
  } finally {
    console.error = original;
  }
});

Deno.test('breed-identify > with MODEL_FOR_BREED unset, returns 500 misconfiguration AND logs status=error', async () => {
  await withEnv('MODEL_FOR_BREED', null, async () => {
    const logger = capturingLogger();
    const res = await handle(postReq({ photo_path: VALID_PATH }, { auth: 'Bearer good' }), {
      authFactory: () => fakeAuthClient({ userId: VALID_USER }),
      loggerFactory: logger.factory,
    });
    assertEquals(res.status, 500);
    const body = (await res.json()) as { error: string };
    assertEquals(body.error, 'misconfiguration');
    assertEquals(logger.calls.length, 1);
    assertEquals(logger.calls[0]?.status, 'error');
    assertEquals(logger.calls[0]?.error_code, 'misconfiguration');
  });
});

Deno.test("breed-identify > with MODEL_FOR_BREED='mystery-model', returns 500 misconfiguration AND logs status=error", async () => {
  await withEnv('MODEL_FOR_BREED', 'mystery-model', async () => {
    const logger = capturingLogger();
    const res = await handle(postReq({ photo_path: VALID_PATH }, { auth: 'Bearer good' }), {
      authFactory: () => fakeAuthClient({ userId: VALID_USER }),
      loggerFactory: logger.factory,
    });
    assertEquals(res.status, 500);
    const body = (await res.json()) as { error: string };
    assertEquals(body.error, 'misconfiguration');
    assertEquals(logger.calls.length, 1);
    assertEquals(logger.calls[0]?.status, 'error');
    assertEquals(logger.calls[0]?.error_code, 'misconfiguration');
    assertEquals(logger.calls[0]?.model, 'mystery-model');
  });
});

Deno.test("breed-identify > with MODEL_FOR_BREED='hardcoded', uses the hardcoded adapter and returns canned payload", async () => {
  await withEnv('MODEL_FOR_BREED', 'hardcoded', async () => {
    const logger = capturingLogger();
    // No `adapter` injected: env selection drives it.
    const res = await handle(postReq({ photo_path: VALID_PATH }, { auth: 'Bearer good' }), {
      authFactory: () => fakeAuthClient({ userId: VALID_USER }),
      loggerFactory: logger.factory,
    });
    assertEquals(res.status, 200);
    const body = (await res.json()) as {
      species: string;
      breed: string;
      confidence: number;
    };
    assertEquals(body.species, 'dog');
    assertEquals(body.breed, 'Labrador Retriever');
    assertEquals(body.confidence, 0.92);
    assertEquals(logger.calls[0]?.model, 'hardcoded');
  });
});

Deno.test("breed-identify > with MODEL_FOR_BREED='claude-haiku-4-5-20251001' (no adapter wired in R1), returns 500 misconfiguration", async () => {
  await withEnv('MODEL_FOR_BREED', 'claude-haiku-4-5-20251001', async () => {
    const logger = capturingLogger();
    const res = await handle(postReq({ photo_path: VALID_PATH }, { auth: 'Bearer good' }), {
      authFactory: () => fakeAuthClient({ userId: VALID_USER }),
      loggerFactory: logger.factory,
    });
    assertEquals(res.status, 500);
    const body = (await res.json()) as { error: string };
    assertEquals(body.error, 'misconfiguration');
  });
});
