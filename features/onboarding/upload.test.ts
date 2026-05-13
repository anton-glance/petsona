import type { SupabaseClient } from '@supabase/supabase-js';

import { UploadError, uploadPetPhoto } from './upload';

// B-1 fix: upload reads the local file via expo-file-system's File(uri).arrayBuffer().
// Mock that API so tests don't hit the native filesystem.
jest.mock('expo-file-system', () => {
  const mockArrayBuffer = jest.fn(async () => new ArrayBuffer(8));
  return {
    File: jest.fn().mockImplementation((_uri: string) => ({
      arrayBuffer: mockArrayBuffer,
    })),
    __mockArrayBuffer: mockArrayBuffer,
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports -- read module-mock back
const FsModule = require('expo-file-system') as {
  File: jest.Mock;
  __mockArrayBuffer: jest.Mock;
};

interface MockClient {
  client: SupabaseClient;
  getSession: jest.Mock;
  upload: jest.Mock;
}

function makeMockClient(
  opts: {
    userId?: string | null;
    uploadResult?: { data: unknown; error: { message: string } | null };
  } = {},
): MockClient {
  const userId = opts.userId === undefined ? 'user-aaa' : opts.userId;
  const uploadResult = opts.uploadResult ?? { data: { path: 'ignored' }, error: null };
  const getSession = jest.fn(async () => ({
    data: { session: userId !== null ? { user: { id: userId } } : null },
  }));
  const upload = jest.fn(async () => uploadResult);
  const from = jest.fn(() => ({ upload }));
  const client = {
    auth: { getSession },
    storage: { from },
  } as unknown as SupabaseClient;
  return { client, getSession, upload };
}

beforeEach(() => {
  FsModule.File.mockClear();
  FsModule.__mockArrayBuffer.mockReset();
  FsModule.__mockArrayBuffer.mockResolvedValue(new ArrayBuffer(8));
});

describe('uploadPetPhoto', () => {
  it('constructs path as {auth_uid}/{uuid}.jpg targeting the pet-photos bucket', async () => {
    const { client, upload } = makeMockClient({ userId: 'user-aaa' });
    const result = await uploadPetPhoto('file:///compressed.jpg', client);
    expect(result.path).toMatch(/^user-aaa\/[0-9a-f-]+\.jpg$/);
    const fromMock = (client.storage.from as jest.Mock).mock.calls[0][0];
    expect(fromMock).toBe('pet-photos');
    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload.mock.calls[0][0]).toBe(result.path);
  });

  it('reads auth.uid() from client.auth.getSession() (not from the Zustand store)', async () => {
    // The Zustand `authUserId` mirror exists to drive UI (e.g. conditional
    // rendering on the smoke screen). It is NOT canonical for auth context —
    // per D-020, edge functions and storage policies key off the live
    // auth.uid() in the JWT. The `pet-photos` storage RLS policy enforces
    // path-prefix `{auth.uid()}/...` at write time, so this helper must
    // resolve the uid from the session at the moment of upload, not from a
    // possibly-stale Zustand hydration. This test guards against future
    // refactors that paper over the boundary by passing in the cached id.
    const { client, getSession } = makeMockClient({ userId: 'live-session-uid' });
    const result = await uploadPetPhoto('file:///compressed.jpg', client);
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(result.path.startsWith('live-session-uid/')).toBe(true);
  });

  it('reads the local file via expo-file-system File(uri).arrayBuffer() — B-1 Android fix', async () => {
    // The previous `fetch(uri).blob()` path produced an opaque RN polyfill
    // blob on Android that Supabase serialized to JSON instead of uploading.
    // The current path uses the modern expo-file-system File API which
    // returns a real ArrayBuffer. Test asserts the new code path is taken.
    const { client } = makeMockClient();
    await uploadPetPhoto('file:///compressed.jpg', client);
    expect(FsModule.File).toHaveBeenCalledWith('file:///compressed.jpg');
    expect(FsModule.__mockArrayBuffer).toHaveBeenCalledTimes(1);
  });

  it('uploads the ArrayBuffer body (not a Blob)', async () => {
    const fakeBuffer = new ArrayBuffer(123);
    FsModule.__mockArrayBuffer.mockResolvedValue(fakeBuffer);
    const { client, upload } = makeMockClient();
    await uploadPetPhoto('file:///compressed.jpg', client);
    expect(upload.mock.calls[0][1]).toBe(fakeBuffer);
  });

  it('sets contentType to image/jpeg and upsert=false', async () => {
    const { client, upload } = makeMockClient();
    await uploadPetPhoto('file:///compressed.jpg', client);
    const options = upload.mock.calls[0][2] as { contentType?: string; upsert?: boolean };
    expect(options.contentType).toBe('image/jpeg');
    expect(options.upsert).toBe(false);
  });

  it('throws UploadError when no session is available', async () => {
    const { client } = makeMockClient({ userId: null });
    await expect(uploadPetPhoto('file:///compressed.jpg', client)).rejects.toBeInstanceOf(
      UploadError,
    );
  });

  it('throws UploadError when File.arrayBuffer() throws (filesystem read failure)', async () => {
    FsModule.__mockArrayBuffer.mockRejectedValue(new Error('file not found'));
    const { client } = makeMockClient();
    await expect(uploadPetPhoto('file:///compressed.jpg', client)).rejects.toBeInstanceOf(
      UploadError,
    );
  });

  it('throws UploadError wrapping the Supabase error when storage rejects', async () => {
    const { client } = makeMockClient({
      uploadResult: { data: null, error: { message: 'storage 403' } },
    });
    await expect(uploadPetPhoto('file:///compressed.jpg', client)).rejects.toBeInstanceOf(
      UploadError,
    );
  });

  it('returns the path on success', async () => {
    const { client } = makeMockClient({ userId: 'user-bbb' });
    const result = await uploadPetPhoto('file:///compressed.jpg', client);
    expect(result.path.startsWith('user-bbb/')).toBe(true);
    expect(result.path.endsWith('.jpg')).toBe(true);
  });
});
