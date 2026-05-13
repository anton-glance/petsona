// Skeleton — red phase. Implementation lands in the next commit.
import type { SupabaseClient } from '@supabase/supabase-js';

import type { BreedIdentifyResponse } from '../../shared/types';

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
  _sourceUri: string,
  _opts: CapturePipelineOptions,
): Promise<CapturePipelineResult> {
  throw new Error('not implemented');
}
