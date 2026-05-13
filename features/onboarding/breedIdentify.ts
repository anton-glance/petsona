// Skeleton — red phase. Implementation lands in the next commit.
import type { SupabaseClient } from '@supabase/supabase-js';

import type { BreedIdentifyResponse } from '../../shared/types';

export class BreedIdentifyError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'BreedIdentifyError';
    this.cause = cause;
  }
}

export async function identifyBreed(
  _photoPath: string,
  _client?: SupabaseClient,
): Promise<BreedIdentifyResponse> {
  throw new Error('not implemented');
}
