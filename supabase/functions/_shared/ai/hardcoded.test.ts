import { assert, assertEquals } from 'jsr:@std/assert@^1.0.0';

import { hardcodedAdapter } from './hardcoded.ts';

Deno.test('hardcoded.vision > returns dog/Labrador as top candidate regardless of input', async () => {
  const r1 = await hardcodedAdapter.vision({
    photoPath: 'u/photo-a.jpg',
    prompt: 'prompt-A',
    model: 'hardcoded',
  });
  const r2 = await hardcodedAdapter.vision({
    photoPath: 'completely/different.png',
    prompt: 'prompt-B',
    model: 'hardcoded',
  });

  assertEquals(r1.species, 'dog');
  assertEquals(r2.species, 'dog');
  assertEquals(r1.candidates[0]?.breed, 'Labrador Retriever');
  assertEquals(r2.candidates[0]?.breed, 'Labrador Retriever');
  assertEquals(r1.candidates[0]?.confidence, 0.92);
});

Deno.test('hardcoded.vision > returns exactly 3 candidates in descending confidence order', async () => {
  const r = await hardcodedAdapter.vision({
    photoPath: 'u/x.jpg',
    prompt: 'p',
    model: 'hardcoded',
  });
  assertEquals(r.candidates.length, 3);
  for (let i = 1; i < r.candidates.length; i++) {
    const prev = r.candidates[i - 1]?.confidence ?? 0;
    const cur = r.candidates[i]?.confidence ?? 0;
    assert(prev >= cur, `candidates not descending at index ${i}: ${prev} < ${cur}`);
  }
});

Deno.test("hardcoded.vision > top-level species is 'dog'", async () => {
  const r = await hardcodedAdapter.vision({
    photoPath: 'u/x.jpg',
    prompt: 'p',
    model: 'hardcoded',
  });
  assertEquals(r.species, 'dog');
});

Deno.test('hardcoded.vision > candidates confidences sum to within 0.05 of 1.0', async () => {
  const r = await hardcodedAdapter.vision({
    photoPath: 'u/x.jpg',
    prompt: 'p',
    model: 'hardcoded',
  });
  const sum = r.candidates.reduce((acc, c) => acc + c.confidence, 0);
  assert(Math.abs(sum - 1.0) < 0.05, `confidence sum was ${sum}, expected ~1.0`);
});

Deno.test('hardcoded.vision > ignores model and prompt arguments (same response for different inputs)', async () => {
  const r1 = await hardcodedAdapter.vision({
    photoPath: 'a/b.jpg',
    prompt: 'p1',
    model: 'hardcoded',
  });
  const r2 = await hardcodedAdapter.vision({
    photoPath: 'a/b.jpg',
    prompt: 'p2',
    model: 'claude-haiku-4-5-20251001',
  });
  assertEquals(r1, r2);
});
