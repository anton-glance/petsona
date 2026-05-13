import type { SupabaseClient } from '@supabase/supabase-js';

import type { BreedIdentifyResponse } from '../../shared/types';
import { BreedIdentifyError, identifyBreed } from './breedIdentify';

function makeMockClient(result: {
  data: unknown;
  error: { message: string } | null;
}): SupabaseClient {
  return {
    functions: {
      invoke: jest.fn(async () => result),
    },
  } as unknown as SupabaseClient;
}

const fixture: BreedIdentifyResponse = {
  species: 'dog',
  breed: 'Labrador Retriever',
  confidence: 0.92,
  candidates: [{ breed: 'Labrador Retriever', confidence: 0.92 }],
};

describe('identifyBreed', () => {
  it('invokes breed-identify with the photo_path body', async () => {
    const client = makeMockClient({ data: fixture, error: null });
    await identifyBreed('user-aaa/abc.jpg', client);
    expect(client.functions.invoke).toHaveBeenCalledWith('breed-identify', {
      body: { photo_path: 'user-aaa/abc.jpg' },
    });
  });

  it('returns the typed BreedIdentifyResponse on success', async () => {
    const client = makeMockClient({ data: fixture, error: null });
    const result = await identifyBreed('user-aaa/abc.jpg', client);
    expect(result).toEqual(fixture);
  });

  it('throws BreedIdentifyError wrapping the underlying error', async () => {
    const client = makeMockClient({ data: null, error: { message: 'boom' } });
    await expect(identifyBreed('user-aaa/abc.jpg', client)).rejects.toBeInstanceOf(
      BreedIdentifyError,
    );
  });
});
