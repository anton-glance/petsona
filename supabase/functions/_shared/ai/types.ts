// Capability-segregated AI client interfaces (D-006, D-019, AC-8 of R1-M1).
//
// Each capability owns its own interface. Adapters implement whichever
// subset(s) they support. R1-M1 ships VisionAIClient only; R2-M1 adds
// OcrAIClient; R3-M3 adds CompletionAIClient. Adapters grow over time:
// hardcoded.ts will implement VisionAIClient + OcrAIClient after R2;
// claude.ts will implement CompletionAIClient (R3) + VisionAIClient (R5);
// mistral.ts will implement OcrAIClient (R5).
//
// The adapter returns a structured result; the capability function shapes
// it into the wire response (sorts candidates, picks top, etc.). Adapters
// stay decoupled from the HTTP boundary.

export interface VisionAIClient {
  vision(input: VisionInput): Promise<VisionResult>;
}

export interface VisionInput {
  // {user_id}/{uuid}.{ext} -- key into the pet-photos storage bucket.
  photoPath: string;
  // Versioned prompt text the adapter sends to the model. Hardcoded ignores;
  // real adapters use it. Pinning prompt-version flow through ai_jobs is
  // the responsibility of the capability function, not the adapter.
  prompt: string;
  // The exact model identifier (e.g. "claude-haiku-4-5-20251001"). One
  // adapter may back multiple models -- the Claude adapter in R5 will
  // route between Haiku and Sonnet via this field.
  model: string;
}

export interface VisionCandidate {
  breed: string;
  confidence: number;
}

export interface VisionResult {
  species: 'dog' | 'cat';
  // Unsorted from the adapter's perspective; the capability function sorts
  // descending by confidence before building the wire response.
  candidates: VisionCandidate[];
}
