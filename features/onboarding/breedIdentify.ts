/**
 * breed-identify edge function client wrapper.
 *
 * Wraps `callEdgeFunction<BreedIdentifyResponse>('breed-identify', ...)` from
 * `lib/ai.ts` (per D-003 AI gateway) and re-throws as `BreedIdentifyError`
 * so the capture screen can branch on error type without parsing strings.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import { callEdgeFunction } from '../../lib/ai';
import type { BreedIdentifyRequest, BreedIdentifyResponse } from '../../shared/types';

export class BreedIdentifyError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'BreedIdentifyError';
    this.cause = cause;
  }
}

export async function identifyBreed(
  photoPath: string,
  client?: SupabaseClient,
): Promise<BreedIdentifyResponse> {
  const body: BreedIdentifyRequest = { photo_path: photoPath };
  try {
    return await callEdgeFunction<BreedIdentifyResponse>(
      'breed-identify',
      body as unknown as Record<string, unknown>,
      client,
    );
  } catch (err) {
    throw new BreedIdentifyError(
      err instanceof Error ? err.message : String(err),
      err,
    );
  }
}
