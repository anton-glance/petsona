// RED PHASE stub. handle() returns 500 not_implemented so every functional
// test asserts the wrong status/body. Real implementation lands next commit.

import type { AuthClientFactory } from '../_shared/auth.ts';
import type { VisionAIClient } from '../_shared/ai/types.ts';
import type { AiJobsInserterFactory } from '../_shared/logging.ts';

export const BREED_PROMPT_V = '2026-05-08-1';

export interface BreedIdentifyDeps {
  authFactory?: AuthClientFactory;
  loggerFactory?: AiJobsInserterFactory;
  adapter?: VisionAIClient;
  now?: () => number;
}

export function handle(_req: Request, _deps?: BreedIdentifyDeps): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify({ error: 'not_implemented' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

if (import.meta.main) {
  Deno.serve((req) => handle(req));
}
