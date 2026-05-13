/**
 * Capture pipeline — compression → upload → breed-identify.
 *
 * Single seam between the capture screen and the three feature modules. The
 * screen invokes this with a source URI + measured dimensions and receives a
 * typed result containing the local compressed URI (for thumbnail preview on
 * the Welcome screen), the storage path (for the `pets.photo_path` column
 * R1-M3 will write), and the breed-identify response.
 *
 * Failure ordering matters for the funnel: an upload failure must NOT call
 * breed-identify (no `ai_jobs` row attributable to a non-existent photo).
 * The pipeline awaits sequentially; thrown errors propagate up to the screen
 * which keys an i18n error message off the error's constructor.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { BreedIdentifyResponse } from '../../shared/types';
import { identifyBreed } from './breedIdentify';
import { compressImage } from './compression';
import { uploadPetPhoto } from './upload';

export type CapturePipelineStage = 'compressing' | 'uploading' | 'identifying';

export interface CapturePipelineResult {
  photoUri: string;
  photoPath: string;
  breed: BreedIdentifyResponse;
}

export interface CapturePipelineOptions {
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

  opts.onStage?.('identifying');
  const breed = await identifyBreed(upload.path, opts.client);

  return { photoUri: compressed.uri, photoPath: upload.path, breed };
}
