/**
 * Image compression + JPEG normalization.
 *
 * Always re-encodes to JPEG. The re-encode strips HEIC (iOS default) and
 * EXIF orientation in one pass, normalizing the file for upload. Long-edge
 * resize is conditional on source size > 2048px; small sources still go
 * through the re-encode so the upload format is consistent.
 *
 * Test cases for portrait / landscape / square dimension handling live in
 * `compression.test.ts`.
 */
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const COMPRESSION_MAX_LONG_EDGE = 2048;
export const COMPRESSION_JPEG_QUALITY = 0.8;

export interface CompressedImage {
  uri: string;
  width: number;
  height: number;
}

export class CompressionError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'CompressionError';
    this.cause = cause;
  }
}

interface ResizeAction {
  resize: { width?: number; height?: number };
}

function pickResizeActions(dims: { width: number; height: number }): ResizeAction[] {
  const longEdge = Math.max(dims.width, dims.height);
  if (longEdge <= COMPRESSION_MAX_LONG_EDGE) {
    return [];
  }
  if (dims.width >= dims.height) {
    return [{ resize: { width: COMPRESSION_MAX_LONG_EDGE } }];
  }
  return [{ resize: { height: COMPRESSION_MAX_LONG_EDGE } }];
}

export async function compressImage(
  sourceUri: string,
  dims: { width: number; height: number },
): Promise<CompressedImage> {
  const actions = pickResizeActions(dims);
  try {
    const result = await manipulateAsync(sourceUri, actions, {
      compress: COMPRESSION_JPEG_QUALITY,
      format: SaveFormat.JPEG,
    });
    return { uri: result.uri, width: result.width, height: result.height };
  } catch (err) {
    throw new CompressionError(
      `image compression failed: ${err instanceof Error ? err.message : String(err)}`,
      err,
    );
  }
}
