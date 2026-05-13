/**
 * Photo upload to the `pet-photos` Storage bucket.
 *
 * Path format: `{auth.uid()}/{uuid}.jpg`. The uid is resolved from the live
 * session at call time (not from the Zustand `authUserId` mirror) — the
 * `pet-photos` storage RLS policy enforces the path-prefix against the
 * live `auth.uid()` from the JWT (R0-M3 migration + D-020). A stale mirror
 * would surface as a 403, not a logic bug; pulling the canonical value
 * removes the failure mode.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase as defaultClient } from '../../lib/supabase';

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

const PET_PHOTOS_BUCKET = 'pet-photos';

function randomId(): string {
  // Per-row uniqueness sufficient; not security-bearing. Avoid pulling in a
  // uuid dep when crypto.getRandomValues is universally available.
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  // RFC 4122 v4 layout. The non-null assertions reflect the fact that bytes
  // is a fixed-length Uint8Array(16); TS's noUncheckedIndexedAccess can't
  // see that.
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

export async function uploadPetPhoto(
  localUri: string,
  client: SupabaseClient = defaultClient,
): Promise<UploadResult> {
  const { data: sessionData } = await client.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) {
    throw new UploadError('no active session — cannot resolve auth.uid() for upload path');
  }
  const path = `${userId}/${randomId()}.jpg`;

  let blob: Blob;
  try {
    const response = await fetch(localUri);
    blob = await response.blob();
  } catch (err) {
    throw new UploadError(
      `failed to read local file ${localUri}: ${err instanceof Error ? err.message : String(err)}`,
      err,
    );
  }

  const { error } = await client.storage.from(PET_PHOTOS_BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) {
    throw new UploadError(`storage upload failed: ${error.message}`, error);
  }
  return { path };
}
