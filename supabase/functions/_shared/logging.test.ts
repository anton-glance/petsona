import { assert, assertEquals } from 'jsr:@std/assert@^1.0.0';

import {
  type AiJobRow,
  type AiJobsInserter,
  type AiJobsInserterFactory,
  logAiJob,
} from './logging.ts';

interface SpyOpts {
  rejects?: boolean;
  returnError?: boolean;
}

function spyInserter(opts: SpyOpts = {}): { inserter: AiJobsInserter; calls: AiJobRow[] } {
  const calls: AiJobRow[] = [];
  const inserter: AiJobsInserter = {
    insert(row) {
      calls.push(row);
      if (opts.rejects) {
        return Promise.reject(new Error('insert exploded'));
      }
      if (opts.returnError) {
        return Promise.resolve({ error: { message: 'returned error' } });
      }
      return Promise.resolve({ error: null });
    },
  };
  return { inserter, calls };
}

function baseRow(overrides: Partial<AiJobRow> = {}): AiJobRow {
  return {
    user_id: 'user-1',
    capability: 'breed-identify',
    model: 'hardcoded',
    prompt_version: '2026-05-08-1',
    status: 'success',
    latency_ms: 12,
    input_hash: 'abc123',
    input_tokens: 0,
    output_tokens: 0,
    cost_usd: 0,
    ...overrides,
  };
}

Deno.test('logAiJob > inserts a row with all required columns when status=success', async () => {
  const { inserter, calls } = spyInserter();
  await logAiJob(baseRow(), () => inserter);
  assertEquals(calls.length, 1);
  const row = calls[0];
  assert(row !== undefined);
  assertEquals(row.user_id, 'user-1');
  assertEquals(row.capability, 'breed-identify');
  assertEquals(row.model, 'hardcoded');
  assertEquals(row.prompt_version, '2026-05-08-1');
  assertEquals(row.status, 'success');
  assertEquals(row.latency_ms, 12);
  assertEquals(row.input_hash, 'abc123');
});

Deno.test('logAiJob > inserts a row with status=error and error_code when status=error', async () => {
  const { inserter, calls } = spyInserter();
  await logAiJob(
    baseRow({ status: 'error', error_code: 'adapter_error' }),
    () => inserter,
  );
  assertEquals(calls.length, 1);
  assertEquals(calls[0]?.status, 'error');
  assertEquals(calls[0]?.error_code, 'adapter_error');
});

Deno.test('logAiJob > passes through optional fields (input_tokens, output_tokens, cost_usd) when provided', async () => {
  const { inserter, calls } = spyInserter();
  await logAiJob(
    baseRow({ input_tokens: 42, output_tokens: 17, cost_usd: 0.0042 }),
    () => inserter,
  );
  assertEquals(calls[0]?.input_tokens, 42);
  assertEquals(calls[0]?.output_tokens, 17);
  assertEquals(calls[0]?.cost_usd, 0.0042);
});

Deno.test('logAiJob > does NOT throw when the insert promise rejects', async () => {
  const { inserter } = spyInserter({ rejects: true });
  const original = console.error;
  console.error = () => {};
  try {
    // If this line throws, the test fails.
    await logAiJob(baseRow(), () => inserter);
  } finally {
    console.error = original;
  }
});

Deno.test('logAiJob > does NOT throw when the insert returns { error: { message } }', async () => {
  const { inserter } = spyInserter({ returnError: true });
  const original = console.error;
  console.error = () => {};
  try {
    await logAiJob(baseRow(), () => inserter);
  } finally {
    console.error = original;
  }
});

Deno.test('logAiJob > does NOT throw when the factory itself throws', async () => {
  const brokenFactory: AiJobsInserterFactory = () => {
    throw new Error('factory exploded');
  };
  const original = console.error;
  console.error = () => {};
  try {
    await logAiJob(baseRow(), brokenFactory);
  } finally {
    console.error = original;
  }
});

Deno.test('logAiJob > logs to console.error on insert failure but does not propagate', async () => {
  const { inserter } = spyInserter({ returnError: true });
  const original = console.error;
  let logged = 0;
  console.error = () => {
    logged++;
  };
  try {
    await logAiJob(baseRow(), () => inserter);
  } finally {
    console.error = original;
  }
  assert(logged > 0, 'expected console.error to have been called');
});
