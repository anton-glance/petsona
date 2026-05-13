/**
 * Capture pipeline — compress → upload → (front only) breed-identify.
 *
 * Slot-aware per R1 visual redo:
 *   - `slot === 'front'`: compress → upload → identify. The breed result
 *     drives the Welcome screen (R1-M3). D-019 hardcoded payload in R1.
 *   - `slot === 'side'`: compress → upload. NO identify call. R2's
 *     combined-prompt VLM will consume this photo.
 *   - `slot === 'document'`: compress → upload. NO identify call. R2's
 *     OCR will consume this.
 *
 * Return type is a discriminated union keyed on `slot` so callers branch
 * on the slot field to access the breed (front only).
 *
 * Failure ordering matters for the funnel: an upload failure must NOT call
 * breed-identify (no `ai_jobs` row attributable to a non-existent photo).
 * The pipeline awaits sequentially; thrown errors propagate up to the
 * screen which keys an i18n error message off the error's constructor.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { BreedIdentifyResponse } from '../../shared/types';
import { identifyBreed } from './breedIdentify';
import { compressImage } from './compression';
import { uploadPetPhoto } from './upload';

export type CapturePipelineStage = 'compressing' | 'uploading' | 'identifying';

export type CaptureSlot = 'front' | 'side' | 'document';

export type CapturePipelineResult =
  | { slot: 'front'; photoUri: string; photoPath: string; breed: BreedIdentifyResponse }
  | { slot: 'side'; photoUri: string; photoPath: string }
  | { slot: 'document'; photoUri: string; photoPath: string };

export interface CapturePipelineOptions {
  slot: CaptureSlot;
  dimensions: { width: number; height: number };
  onStage?: (stage: CapturePipelineStage) => void;
  client?: SupabaseClient;
}

export async function runCapturePipeline(
  sourceUri: string,
  opts: CapturePipelineOptions,
): Promise<CapturePipelineResult> {
  opts.onStage?.('compressing');
  const compressed = await compressImage(sourceUri, opts.dimensions);

  opts.onStage?.('uploading');
  const upload = await uploadPetPhoto(compressed.uri, opts.client);

  if (opts.slot !== 'front') {
    return { slot: opts.slot, photoUri: compressed.uri, photoPath: upload.path };
  }

  opts.onStage?.('identifying');
  const breed = await identifyBreed(upload.path, opts.client);
  return { slot: 'front', photoUri: compressed.uri, photoPath: upload.path, breed };
}
