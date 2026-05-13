// Skeleton — red phase. Implementation lands in the next commit.
import type { SupabaseClient } from '@supabase/supabase-js';

export interface UploadResult {
  path: string;
}

export class UploadError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'UploadError';
    this.cause = cause;
  }
}

export async function uploadPetPhoto(
  _localUri: string,
  _client?: SupabaseClient,
): Promise<UploadResult> {
  throw new Error('not implemented');
}
