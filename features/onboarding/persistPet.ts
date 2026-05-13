// Skeleton — red phase. Implementation lands in the next commit.
import type { SupabaseClient } from '@supabase/supabase-js';

export interface PersistPetInput {
  name: string | null;
  species: 'dog' | 'cat';
  breed: string;
  breed_confidence: number;
  photo_path: string;
}

export interface PersistPetResult {
  id: string;
}

export class PersistPetError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PersistPetError';
    this.cause = cause;
  }
}

export async function insertPet(
  _input: PersistPetInput,
  _client?: SupabaseClient,
): Promise<PersistPetResult> {
  throw new Error('not implemented');
}
