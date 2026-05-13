/**
 * Pet-row persistence.
 *
 * Inserts a row into `public.pets` for the live `auth.uid()`. The uid is
 * resolved from `client.auth.getSession()` at write time — NOT from the
 * Zustand `authUserId` mirror — per D-020 and the pets RLS policy
 * (`auth.uid() = user_id`). A stale mirror would surface as a 403 from
 * RLS; pulling the canonical value from the session removes that failure
 * mode by construction.
 *
 * `pets` is 1:N from `user_id` per R0 design (multi-pet post-MVP). No
 * natural unique key besides `id`, so this uses `.insert()` rather than
 * `.upsert()`. Double-tap protection lives at the UI layer (the Welcome
 * screen disables the CTA synchronously before the first await).
 *
 * R1-M3 persists only what R1 captures: name (or null), species, breed,
 * breed_confidence, photo_path. birthdate and weight_kg stay null until
 * R2's combined-prompt OCR populates them.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase as defaultClient } from '../../lib/supabase';

export interface PersistPetInput {
  /** Pre-trimmed; the screen passes null when the trim result is empty. */
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

interface PetRow {
  user_id: string;
  name: string | null;
  species: 'dog' | 'cat';
  breed: string;
  breed_confidence: number;
  photo_path: string;
}

export async function insertPet(
  input: PersistPetInput,
  client: SupabaseClient = defaultClient,
): Promise<PersistPetResult> {
  const { data: sessionData } = await client.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) {
    throw new PersistPetError('no active session — cannot resolve auth.uid() for insert');
  }

  const row: PetRow = {
    user_id: userId,
    name: input.name,
    species: input.species,
    breed: input.breed,
    breed_confidence: input.breed_confidence,
    photo_path: input.photo_path,
  };

  const { data, error } = await client.from('pets').insert(row).select('id').single();
  if (error) {
    throw new PersistPetError(`pets insert failed: ${error.message}`, error);
  }
  const id = (data as { id?: unknown } | null)?.id;
  if (typeof id !== 'string') {
    throw new PersistPetError('pets insert returned no id');
  }
  return { id };
}
