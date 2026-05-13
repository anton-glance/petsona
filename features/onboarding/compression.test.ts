import {
  COMPRESSION_JPEG_QUALITY,
  COMPRESSION_MAX_LONG_EDGE,
  CompressionError,
  compressImage,
} from './compression';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports -- module mock
const ImageManipulator = require('expo-image-manipulator') as {
  manipulateAsync: jest.Mock;
  SaveFormat: { JPEG: string };
};

describe('compressImage', () => {
  beforeEach(() => {
    ImageManipulator.manipulateAsync.mockReset();
  });

  it('portrait 3000x4000 → resizes long edge (height) to 2048', async () => {
    ImageManipulator.manipulateAsync.mockResolvedValue({
      uri: 'file:///compressed.jpg',
      width: 1536,
      height: 2048,
    });
    await compressImage('file:///source.heic', { width: 3000, height: 4000 });
    const actions = ImageManipulator.manipulateAsync.mock.calls[0][1] as {
      resize: { width?: number; height?: number };
    }[];
    expect(actions).toEqual([{ resize: { height: COMPRESSION_MAX_LONG_EDGE } }]);
  });

  it('landscape 4000x3000 → resizes long edge (width) to 2048', async () => {
    ImageManipulator.manipulateAsync.mockResolvedValue({
      uri: 'file:///compressed.jpg',
      width: 2048,
      height: 1536,
    });
    await compressImage('file:///source.jpg', { width: 4000, height: 3000 });
    const actions = ImageManipulator.manipulateAsync.mock.calls[0][1] as {
      resize: { width?: number; height?: number };
    }[];
    expect(actions).toEqual([{ resize: { width: COMPRESSION_MAX_LONG_EDGE } }]);
  });

  it('square 3000x3000 → resizes width to 2048 (square stays square)', async () => {
    ImageManipulator.manipulateAsync.mockResolvedValue({
      uri: 'file:///compressed.jpg',
      width: 2048,
      height: 2048,
    });
    await compressImage('file:///source.jpg', { width: 3000, height: 3000 });
    const actions = ImageManipulator.manipulateAsync.mock.calls[0][1] as {
      resize: { width?: number; height?: number };
    }[];
    expect(actions).toEqual([{ resize: { width: COMPRESSION_MAX_LONG_EDGE } }]);
  });

  it('forces JPEG output format and quality 0.8', async () => {
    ImageManipulator.manipulateAsync.mockResolvedValue({
      uri: 'file:///compressed.jpg',
      width: 1024,
      height: 768,
    });
    await compressImage('file:///source.heic', { width: 1024, height: 768 });
    const saveOptions = ImageManipulator.manipulateAsync.mock.calls[0][2] as {
      format?: string;
      compress?: number;
    };
    expect(saveOptions.format).toBe('jpeg');
    expect(saveOptions.compress).toBe(COMPRESSION_JPEG_QUALITY);
  });

  it('always re-encodes (no resize op when source ≤ 2048 long edge, but JPEG re-save still runs)', async () => {
    ImageManipulator.manipulateAsync.mockResolvedValue({
      uri: 'file:///compressed.jpg',
      width: 1024,
      height: 768,
    });
    await compressImage('file:///source.heic', { width: 1024, height: 768 });
    const actions = ImageManipulator.manipulateAsync.mock.calls[0][1] as unknown[];
    expect(actions).toEqual([]); // No resize action, but manipulateAsync still invoked for JPEG re-encode.
    expect(ImageManipulator.manipulateAsync).toHaveBeenCalledTimes(1);
  });

  it('returns CompressedImage with the manipulator output uri/width/height', async () => {
    ImageManipulator.manipulateAsync.mockResolvedValue({
      uri: 'file:///compressed.jpg',
      width: 2048,
      height: 1536,
    });
    const result = await compressImage('file:///source.jpg', { width: 4000, height: 3000 });
    expect(result).toEqual({ uri: 'file:///compressed.jpg', width: 2048, height: 1536 });
  });

  it('throws CompressionError when ImageManipulator throws', async () => {
    ImageManipulator.manipulateAsync.mockRejectedValue(new Error('decode failure'));
    await expect(
      compressImage('file:///source.heic', { width: 1024, height: 768 }),
    ).rejects.toBeInstanceOf(CompressionError);
  });
});
