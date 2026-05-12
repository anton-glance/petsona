// Canned-response adapter for R1-R4 development velocity (D-019).
//
// vision() returns a Labrador-leaning payload regardless of input. Selected
// at request time when MODEL_FOR_BREED=hardcoded. In R5, MODEL_FOR_BREED is
// flipped to the real Claude vision model; this adapter is no longer
// reached for breed-identify but remains live for the medcard-ocr capability
// until R5-M2 also lands.

import type { VisionAIClient, VisionInput, VisionResult } from './types.ts';

export const hardcodedAdapter: VisionAIClient = {
  vision(_input: VisionInput): Promise<VisionResult> {
    return Promise.resolve({
      species: 'dog',
      candidates: [
        { breed: 'Labrador Retriever', confidence: 0.92 },
        { breed: 'Golden Retriever', confidence: 0.05 },
        { breed: 'Beagle', confidence: 0.03 },
      ],
    });
  },
};
