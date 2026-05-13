/**
 * Camera and photo-library permission helpers.
 *
 * Thin wrappers over `expo-camera` and `expo-image-picker` that normalize the
 * SDK's PermissionResponse (status enum + canAskAgain + granted + expires)
 * into a smaller shape the onboarding screens consume. Screens never import
 * the expo modules directly — they go through this file so the boundary is
 * mockable in tests and the permission semantics are documented in one place.
 *
 * `undetermined` after a request call means the OS dialog was dismissed
 * without a choice (rare; iOS allows this if the user backgrounds the app
 * mid-prompt). The camera-permission screen treats `undetermined` and
 * `denied` as the same routing target (the denied-recovery screen) but
 * fires distinct PostHog `reason` properties so the R4 funnel can split.
 */
import { Camera } from 'expo-camera';
import { requestMediaLibraryPermissionsAsync } from 'expo-image-picker';
import { openSettings } from 'expo-linking';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PermissionResult {
  status: PermissionStatus;
  /** False when the OS will not show the prompt again (Android "Don't ask"). */
  canAskAgain: boolean;
}

interface RawPermissionResponse {
  status: string;
  canAskAgain: boolean;
}

function normalize(raw: RawPermissionResponse): PermissionResult {
  const status: PermissionStatus =
    raw.status === 'granted'
      ? 'granted'
      : raw.status === 'undetermined'
        ? 'undetermined'
        : 'denied';
  return { status, canAskAgain: raw.canAskAgain };
}

export async function requestCameraPermission(): Promise<PermissionResult> {
  const raw = await Camera.requestCameraPermissionsAsync();
  return normalize(raw);
}

export async function getCameraPermission(): Promise<PermissionResult> {
  const raw = await Camera.getCameraPermissionsAsync();
  return normalize(raw);
}

export async function requestPhotoLibraryPermission(): Promise<PermissionResult> {
  const raw = await requestMediaLibraryPermissionsAsync();
  return normalize(raw);
}

export async function openSystemSettings(): Promise<void> {
  await openSettings();
}
