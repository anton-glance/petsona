import type { SupabaseClient } from '@supabase/supabase-js';

import type { BreedIdentifyResponse } from '../../shared/types';
import { BreedIdentifyError } from './breedIdentify';
import { type CapturePipelineStage, runCapturePipeline } from './capturePipeline';
import { CompressionError } from './compression';
import { UploadError } from './upload';

jest.mock('./compression', () => {
  const actual = jest.requireActual('./compression');
  return { ...actual, compressImage: jest.fn() };
});
jest.mock('./upload', () => {
  const actual = jest.requireActual('./upload');
  return { ...actual, uploadPetPhoto: jest.fn() };
});
jest.mock('./breedIdentify', () => {
  const actual = jest.requireActual('./breedIdentify');
  return { ...actual, identifyBreed: jest.fn() };
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

describe('runCapturePipeline — slot: front', () => {
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
      slot: 'front',
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
      slot: 'front',
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
        slot: 'front',
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
        slot: 'front',
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
        slot: 'front',
        dimensions: { width: 3000, height: 4000 },
        client: fakeClient,
      }),
    ).rejects.toBeInstanceOf(BreedIdentifyError);
  });

  it("returns { slot: 'front', photoUri, photoPath, breed } on success", async () => {
    Compression.compressImage.mockResolvedValue({
      uri: 'file:///compressed.jpg',
      width: 2048,
      height: 1536,
    });
    Upload.uploadPetPhoto.mockResolvedValue({ path: 'user-aaa/abc.jpg' });
    Breed.identifyBreed.mockResolvedValue(breedFixture);
    const result = await runCapturePipeline('file:///source.heic', {
      slot: 'front',
      dimensions: { width: 3000, height: 4000 },
      client: fakeClient,
    });
    expect(result).toEqual({
      slot: 'front',
      photoUri: 'file:///compressed.jpg',
      photoPath: 'user-aaa/abc.jpg',
      breed: breedFixture,
    });
  });
});

describe('runCapturePipeline — slot: side', () => {
  it('runs compress → upload only; identify is NEVER called', async () => {
    Compression.compressImage.mockResolvedValue({
      uri: 'file:///side.jpg',
      width: 2048,
      height: 1536,
    });
    Upload.uploadPetPhoto.mockResolvedValue({ path: 'user-aaa/side.jpg' });
    await runCapturePipeline('file:///source.heic', {
      slot: 'side',
      dimensions: { width: 3000, height: 4000 },
      client: fakeClient,
    });
    expect(Compression.compressImage).toHaveBeenCalledTimes(1);
    expect(Upload.uploadPetPhoto).toHaveBeenCalledTimes(1);
    expect(Breed.identifyBreed).not.toHaveBeenCalled();
  });

  it("does NOT emit onStage('identifying')", async () => {
    Compression.compressImage.mockResolvedValue({
      uri: 'file:///side.jpg',
      width: 2048,
      height: 1536,
    });
    Upload.uploadPetPhoto.mockResolvedValue({ path: 'user-aaa/side.jpg' });
    const stages: CapturePipelineStage[] = [];
    await runCapturePipeline('file:///source.heic', {
      slot: 'side',
      dimensions: { width: 3000, height: 4000 },
      client: fakeClient,
      onStage: (s) => stages.push(s),
    });
    expect(stages).toEqual(['compressing', 'uploading']);
  });

  it("returns { slot: 'side', photoUri, photoPath } with no breed field", async () => {
    Compression.compressImage.mockResolvedValue({
      uri: 'file:///side.jpg',
      width: 2048,
      height: 1536,
    });
    Upload.uploadPetPhoto.mockResolvedValue({ path: 'user-aaa/side.jpg' });
    const result = await runCapturePipeline('file:///source.heic', {
      slot: 'side',
      dimensions: { width: 3000, height: 4000 },
      client: fakeClient,
    });
    expect(result).toEqual({
      slot: 'side',
      photoUri: 'file:///side.jpg',
      photoPath: 'user-aaa/side.jpg',
    });
    expect((result as { breed?: unknown }).breed).toBeUndefined();
  });
});

describe('runCapturePipeline — slot: document', () => {
  it('runs compress → upload only; identify is NEVER called', async () => {
    Compression.compressImage.mockResolvedValue({
      uri: 'file:///doc.jpg',
      width: 2048,
      height: 1536,
    });
    Upload.uploadPetPhoto.mockResolvedValue({ path: 'user-aaa/doc.jpg' });
    await runCapturePipeline('file:///source.heic', {
      slot: 'document',
      dimensions: { width: 3000, height: 4000 },
      client: fakeClient,
    });
    expect(Breed.identifyBreed).not.toHaveBeenCalled();
  });

  it("returns { slot: 'document', photoUri, photoPath }", async () => {
    Compression.compressImage.mockResolvedValue({
      uri: 'file:///doc.jpg',
      width: 2048,
      height: 1536,
    });
    Upload.uploadPetPhoto.mockResolvedValue({ path: 'user-aaa/doc.jpg' });
    const result = await runCapturePipeline('file:///source.heic', {
      slot: 'document',
      dimensions: { width: 3000, height: 4000 },
      client: fakeClient,
    });
    expect(result).toEqual({
      slot: 'document',
      photoUri: 'file:///doc.jpg',
      photoPath: 'user-aaa/doc.jpg',
    });
  });
});
