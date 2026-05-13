import type { SupabaseClient } from '@supabase/supabase-js';

import { insertPet, PersistPetError } from './persistPet';

interface MockClient {
  client: SupabaseClient;
  getSession: jest.Mock;
  insert: jest.Mock;
  select: jest.Mock;
  single: jest.Mock;
}

function makeMockClient(
  opts: {
    userId?: string | null;
    insertResult?: { data: unknown; error: { message: string } | null };
  } = {},
): MockClient {
  const userId = opts.userId === undefined ? 'user-aaa' : opts.userId;
  const insertResult =
    opts.insertResult ?? { data: { id: 'pet-uuid-123' }, error: null };
  const getSession = jest.fn(async () => ({
    data: { session: userId !== null ? { user: { id: userId } } : null },
  }));
  const single = jest.fn(async () => insertResult);
  const select = jest.fn(() => ({ single }));
  const insert = jest.fn(() => ({ select }));
  const from = jest.fn(() => ({ insert }));
  const client = {
    auth: { getSession },
    from,
  } as unknown as SupabaseClient;
  return { client, getSession, insert, select, single };
}

describe('insertPet', () => {
  it('inserts a pets row with name, species, breed, breed_confidence, photo_path and the live auth uid', async () => {
    const { client, insert } = makeMockClient({ userId: 'user-aaa' });
    await insertPet(
      {
        name: 'Mochi',
        species: 'cat',
        breed: 'Tabby',
        breed_confidence: 0.91,
        photo_path: 'user-aaa/abc.jpg',
      },
      client,
    );
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0]).toEqual({
      user_id: 'user-aaa',
      name: 'Mochi',
      species: 'cat',
      breed: 'Tabby',
      breed_confidence: 0.91,
      photo_path: 'user-aaa/abc.jpg',
    });
    const fromMock = (client.from as jest.Mock).mock.calls[0][0];
    expect(fromMock).toBe('pets');
  });

  it('reads auth.uid() from client.auth.getSession() (not from the Zustand store)', async () => {
    // The Zustand `authUserId` mirror exists to drive UI (e.g. conditional
    // rendering, display strings). It is NOT canonical for auth context —
    // per D-020 and the pets RLS policy (`auth.uid() = user_id`), the
    // write must resolve the uid from the session at insert time. A stale
    // mirror would surface as a 403 from RLS, not a logic bug. This test
    // guards against future refactors that paper over the boundary by
    // passing in the cached id.
    const { client, getSession, insert } = makeMockClient({ userId: 'live-session-uid' });
    await insertPet(
      {
        name: 'Mochi',
        species: 'cat',
        breed: 'Tabby',
        breed_confidence: 0.91,
        photo_path: 'live-session-uid/abc.jpg',
      },
      client,
    );
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0].user_id).toBe('live-session-uid');
  });

  it("returns the inserted row's id on success", async () => {
    const { client } = makeMockClient({
      insertResult: { data: { id: 'pet-uuid-xyz' }, error: null },
    });
    const result = await insertPet(
      {
        name: 'Mochi',
        species: 'cat',
        breed: 'Tabby',
        breed_confidence: 0.91,
        photo_path: 'user-aaa/abc.jpg',
      },
      client,
    );
    expect(result).toEqual({ id: 'pet-uuid-xyz' });
  });

  it('throws PersistPetError wrapping the Supabase error on failure', async () => {
    const { client } = makeMockClient({
      insertResult: { data: null, error: { message: 'rls violation' } },
    });
    await expect(
      insertPet(
        {
          name: 'Mochi',
          species: 'cat',
          breed: 'Tabby',
          breed_confidence: 0.91,
          photo_path: 'user-aaa/abc.jpg',
        },
        client,
      ),
    ).rejects.toBeInstanceOf(PersistPetError);
  });

  it('throws PersistPetError when no session is available', async () => {
    const { client } = makeMockClient({ userId: null });
    await expect(
      insertPet(
        {
          name: 'Mochi',
          species: 'cat',
          breed: 'Tabby',
          breed_confidence: 0.91,
          photo_path: 'user-aaa/abc.jpg',
        },
        client,
      ),
    ).rejects.toBeInstanceOf(PersistPetError);
  });

  it('persists null when name is an empty or whitespace-only string', async () => {
    const { client, insert } = makeMockClient({ userId: 'user-aaa' });
    await insertPet(
      {
        name: null,
        species: 'dog',
        breed: 'Beagle',
        breed_confidence: 0.81,
        photo_path: 'user-aaa/abc.jpg',
      },
      client,
    );
    expect(insert.mock.calls[0][0].name).toBeNull();
  });
});
