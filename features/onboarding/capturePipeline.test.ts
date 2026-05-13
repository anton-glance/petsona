import type { SupabaseClient } from '@supabase/supabase-js';

import type { BreedIdentifyResponse } from '../../shared/types';
import { BreedIdentifyError } from './breedIdentify';
import { type CapturePipelineStage, runCapturePipeline } from './capturePipeline';
import { CompressionError } from './compression';
import { UploadError } from './upload';

jest.mock('./compression', () => {
  const actual = jest.requireActual('./compression');
  return {
    ...actual,
    compressImage: jest.fn(),
  };
});
jest.mock('./upload', () => {
  const actual = jest.requireActual('./upload');
  return {
    ...actual,
    uploadPetPhoto: jest.fn(),
  };
});
jest.mock('./breedIdentify', () => {
  const actual = jest.requireActual('./breedIdentify');
  return {
    ...actual,
    identifyBreed: jest.fn(),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports -- read module-mock back
const Compression = require('./compression') as { compressImage: jest.Mock };
// eslint-disable-next-line @typescript-eslint/no-require-imports -- read module-mock back
const Upload = require('./upload') as { uploadPetPhoto: jest.Mock };
// eslint-disable-next-line @typescript-eslint/no-require-imports -- read module-mock back
const Breed = require('./breedIdentify') as { identifyBreed: jest.Mock };

const breedFixture: BreedIdentifyResponse = {
  species: 'cat',
  breed: 'Siamese',
  confidence: 0.88,
  candidates: [{ breed: 'Siamese', confidence: 0.88 }],
};

const fakeClient = {} as SupabaseClient;

beforeEach(() => {
  Compression.compressImage.mockReset();
  Upload.uploadPetPhoto.mockReset();
  Breed.identifyBreed.mockReset();
});

describe('runCapturePipeline', () => {
  it('runs compression → upload → identify in order', async () => {
    const callLog: string[] = [];
    Compression.compressImage.mockImplementation(async () => {
      callLog.push('compress');
      return { uri: 'file:///c.jpg', width: 2048, height: 1536 };
    });
    Upload.uploadPetPhoto.mockImplementation(async () => {
      callLog.push('upload');
      return { path: 'user-aaa/abc.jpg' };
    });
    Breed.identifyBreed.mockImplementation(async () => {
      callLog.push('identify');
      return breedFixture;
    });
    await runCapturePipeline('file:///source.heic', {
      dimensions: { width: 3000, height: 4000 },
      client: fakeClient,
    });
    expect(callLog).toEqual(['compress', 'upload', 'identify']);
  });

  it("emits onStage('compressing'), ('uploading'), ('identifying') in order", async () => {
    Compression.compressImage.mockResolvedValue({
      uri: 'file:///c.jpg',
      width: 2048,
      height: 1536,
    });
    Upload.uploadPetPhoto.mockResolvedValue({ path: 'user-aaa/abc.jpg' });
    Breed.identifyBreed.mockResolvedValue(breedFixture);
    const stages: CapturePipelineStage[] = [];
    await runCapturePipeline('file:///source.heic', {
      dimensions: { width: 3000, height: 4000 },
      client: fakeClient,
      onStage: (s) => stages.push(s),
    });
    expect(stages).toEqual(['compressing', 'uploading', 'identifying']);
  });

  it('does NOT call breed-identify when upload throws', async () => {
    Compression.compressImage.mockResolvedValue({
      uri: 'file:///c.jpg',
      width: 2048,
      height: 1536,
    });
    Upload.uploadPetPhoto.mockRejectedValue(new UploadError('storage 403'));
    await expect(
      runCapturePipeline('file:///source.heic', {
        dimensions: { width: 3000, height: 4000 },
        client: fakeClient,
      }),
    ).rejects.toBeInstanceOf(UploadError);
    expect(Breed.identifyBreed).not.toHaveBeenCalled();
  });

  it('does NOT call upload when compression throws', async () => {
    Compression.compressImage.mockRejectedValue(new CompressionError('decode failure'));
    await expect(
      runCapturePipeline('file:///source.heic', {
        dimensions: { width: 3000, height: 4000 },
        client: fakeClient,
      }),
    ).rejects.toBeInstanceOf(CompressionError);
    expect(Upload.uploadPetPhoto).not.toHaveBeenCalled();
    expect(Breed.identifyBreed).not.toHaveBeenCalled();
  });

  it('propagates BreedIdentifyError from the identify step', async () => {
    Compression.compressImage.mockResolvedValue({
      uri: 'file:///c.jpg',
      width: 2048,
      height: 1536,
    });
    Upload.uploadPetPhoto.mockResolvedValue({ path: 'user-aaa/abc.jpg' });
    Breed.identifyBreed.mockRejectedValue(new BreedIdentifyError('edge fn 500'));
    await expect(
      runCapturePipeline('file:///source.heic', {
        dimensions: { width: 3000, height: 4000 },
        client: fakeClient,
      }),
    ).rejects.toBeInstanceOf(BreedIdentifyError);
  });

  it('returns photoUri + photoPath + breed on success (the R1-M3 contract)', async () => {
    Compression.compressImage.mockResolvedValue({
      uri: 'file:///compressed.jpg',
      width: 2048,
      height: 1536,
    });
    Upload.uploadPetPhoto.mockResolvedValue({ path: 'user-aaa/abc.jpg' });
    Breed.identifyBreed.mockResolvedValue(breedFixture);
    const result = await runCapturePipeline('file:///source.heic', {
      dimensions: { width: 3000, height: 4000 },
      client: fakeClient,
    });
    expect(result).toEqual({
      photoUri: 'file:///compressed.jpg',
      photoPath: 'user-aaa/abc.jpg',
      breed: breedFixture,
    });
  });
});
