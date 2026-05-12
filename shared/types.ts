// Wire types shared between the Expo client and the Deno edge functions.
//
// First occupants of shared/: the breed-identify request/response shapes.
// Locking the contract here at R1-M1 means R1-M3 client wiring imports the
// same types the edge function returns -- no drift across the boundary.

export interface BreedIdentifyRequest {
  photo_path: string;
}

export interface BreedIdentifyCandidate {
  breed: string;
  confidence: number;
}

export interface BreedIdentifyResponse {
  species: 'dog' | 'cat';
  breed: string;
  confidence: number;
  candidates: BreedIdentifyCandidate[];
}
