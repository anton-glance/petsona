// Skeleton — red phase. Implementation lands in the next commit.
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

export async function compressImage(
  _sourceUri: string,
  _dims: { width: number; height: number },
): Promise<CompressedImage> {
  throw new Error('not implemented');
}
