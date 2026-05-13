// Skeleton — red phase. Implementation lands in the next commit.
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PermissionResult {
  status: PermissionStatus;
  canAskAgain: boolean;
}

export async function requestCameraPermission(): Promise<PermissionResult> {
  throw new Error('not implemented');
}

export async function getCameraPermission(): Promise<PermissionResult> {
  throw new Error('not implemented');
}

export async function requestPhotoLibraryPermission(): Promise<PermissionResult> {
  throw new Error('not implemented');
}

export async function openSystemSettings(): Promise<void> {
  throw new Error('not implemented');
}
