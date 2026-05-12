// RED PHASE stub. Tests assert specific values; this returns wrong values so
// assertions fire. Real implementation lands in the next commit.

import type { VisionAIClient, VisionInput, VisionResult } from './types.ts';

export const hardcodedAdapter: VisionAIClient = {
  vision(_input: VisionInput): Promise<VisionResult> {
    return Promise.resolve({
      species: 'cat',
      candidates: [],
    });
  },
};
