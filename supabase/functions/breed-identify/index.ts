// breed-identify edge function. First capability function in the AI gateway
// (D-003, D-006, D-019). Accepts a Storage path to a pet photo, asks the
// configured adapter to identify species + breed, writes an ai_jobs row,
// and returns the wire response.
//
// MODEL_FOR_BREED selects the adapter at request time. R1 only registers
// 'hardcoded'; the env var contract is in place so R5's swap-in is a
// `supabase secrets set` away (D-018).
//
// User-side errors (missing/bad input, missing auth) return early without
// ai_jobs rows -- no AI work happened. Function-side errors (adapter throw,
// misconfiguration) write an error row before returning 500 so monitoring
// catches the failure.

import { type AuthClientFactory, getUser } from '../_shared/auth.ts';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { hardcodedAdapter } from '../_shared/ai/hardcoded.ts';
import type { VisionAIClient } from '../_shared/ai/types.ts';
import { type AiJobsInserterFactory, logAiJob } from '../_shared/logging.ts';
import type { BreedIdentifyResponse } from '../../../shared/types.ts';

export const BREED_PROMPT_V = '2026-05-08-1';

const CAPABILITY = 'breed-identify';

const JSON_HEADERS: Record<string, string> = {
  ...corsHeaders,
  'Content-Type': 'application/json',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_EXT_RE = /\.(jpg|jpeg|png|heic|webp)$/i;

export interface BreedIdentifyDeps {
  authFactory?: AuthClientFactory;
  loggerFactory?: AiJobsInserterFactory;
  adapter?: VisionAIClient;
  now?: () => number;
}

export async function handle(req: Request, deps?: BreedIdentifyDeps): Promise<Response> {
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const user = await getUser(req, deps?.authFactory);
  if (!user) {
    return jsonResponse(401, { error: 'unauthorized' });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: 'invalid_input', detail: 'malformed JSON body' });
  }

  const photoPath = extractPhotoPath(body);
  if (!photoPath) {
    return jsonResponse(400, {
      error: 'invalid_input',
      detail: 'photo_path missing or wrong type',
    });
  }
  const pathError = validatePhotoPath(photoPath, user.user_id);
  if (pathError) {
    return jsonResponse(400, { error: 'invalid_input', detail: pathError });
  }

  const envModel = Deno.env.get('MODEL_FOR_BREED');
  const explicitAdapter = deps?.adapter;
  const adapter = explicitAdapter ?? selectAdapter(envModel ?? '');
  const now = deps?.now ?? Date.now;
  const input_hash = await sha256Hex(`${CAPABILITY}:${BREED_PROMPT_V}:${photoPath}`);

  if (!adapter) {
    await logAiJob(
      {
        user_id: user.user_id,
        capability: CAPABILITY,
        model: envModel && envModel.length > 0 ? envModel : 'unset',
        prompt_version: BREED_PROMPT_V,
        status: 'error',
        latency_ms: 0,
        input_hash,
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        error_code: 'misconfiguration',
      },
      deps?.loggerFactory,
    );
    return jsonResponse(500, { error: 'misconfiguration' });
  }

  // If a test injected an adapter, default model for logging to 'hardcoded'
  // unless env says otherwise. In production, deps.adapter is never set, so
  // envModel is guaranteed non-empty here (selectAdapter would have returned
  // null and we'd be in the misconfig branch above).
  const model: string = explicitAdapter
    ? (envModel ?? 'hardcoded')
    : (envModel as string);

  const t0 = now();
  let result;
  try {
    result = await adapter.vision({ photoPath, prompt: '', model });
  } catch (err) {
    const t1 = now();
    console.error('breed-identify: adapter threw', err instanceof Error ? err.message : String(err));
    await logAiJob(
      {
        user_id: user.user_id,
        capability: CAPABILITY,
        model,
        prompt_version: BREED_PROMPT_V,
        status: 'error',
        latency_ms: Math.max(0, t1 - t0),
        input_hash,
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        error_code: 'adapter_error',
      },
      deps?.loggerFactory,
    );
    return jsonResponse(500, { error: 'internal' });
  }
  const t1 = now();

  const sorted = [...result.candidates].sort((a, b) => b.confidence - a.confidence);
  const top = sorted[0];
  if (!top) {
    await logAiJob(
      {
        user_id: user.user_id,
        capability: CAPABILITY,
        model,
        prompt_version: BREED_PROMPT_V,
        status: 'error',
        latency_ms: Math.max(0, t1 - t0),
        input_hash,
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        error_code: 'adapter_empty',
      },
      deps?.loggerFactory,
    );
    return jsonResponse(500, { error: 'internal' });
  }

  const response: BreedIdentifyResponse = {
    species: result.species,
    breed: top.breed,
    confidence: top.confidence,
    candidates: sorted,
  };

  await logAiJob(
    {
      user_id: user.user_id,
      capability: CAPABILITY,
      model,
      prompt_version: BREED_PROMPT_V,
      status: 'success',
      latency_ms: Math.max(0, t1 - t0),
      input_hash,
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
    },
    deps?.loggerFactory,
  );

  return jsonResponse(200, response);
}

function extractPhotoPath(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const candidate = (body as Record<string, unknown>).photo_path;
  return typeof candidate === 'string' ? candidate : null;
}

function validatePhotoPath(path: string, userId: string): string | null {
  const slashIdx = path.indexOf('/');
  if (slashIdx <= 0) return 'photo_path must be {user_id}/{filename}';
  const prefix = path.slice(0, slashIdx);
  const filename = path.slice(slashIdx + 1);
  if (!UUID_RE.test(prefix)) return 'photo_path user_id segment is not a UUID';
  if (prefix.toLowerCase() !== userId.toLowerCase()) {
    return 'photo_path user_id must match caller';
  }
  if (filename.length === 0) return 'photo_path filename is empty';
  if (!VALID_EXT_RE.test(filename)) {
    return 'photo_path extension must be jpg/jpeg/png/heic/webp';
  }
  return null;
}

function selectAdapter(model: string): VisionAIClient | null {
  switch (model) {
    case 'hardcoded':
      return hardcodedAdapter;
    default:
      return null;
  }
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

if (import.meta.main) {
  Deno.serve((req) => handle(req));
}
