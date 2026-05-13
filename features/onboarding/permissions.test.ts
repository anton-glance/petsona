import {
  getCameraPermission,
  openSystemSettings,
  requestCameraPermission,
  requestPhotoLibraryPermission,
} from './permissions';

// Lightweight mocks for the three native modules touched by permissions.ts.
// All factories use require() inside per the jest.mock pattern documented in
// lib/glass.test.tsx (NativeWind's transform hoists imports out of scope).
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(),
    getCameraPermissionsAsync: jest.fn(),
  },
}));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));
jest.mock('expo-linking', () => ({
  openSettings: jest.fn(async () => undefined),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports -- module mocks
const CameraModule = require('expo-camera') as {
  Camera: {
    requestCameraPermissionsAsync: jest.Mock;
    getCameraPermissionsAsync: jest.Mock;
  };
};
const Camera = CameraModule.Camera;
// eslint-disable-next-line @typescript-eslint/no-require-imports -- module mocks
const ImagePicker = require('expo-image-picker') as {
  requestMediaLibraryPermissionsAsync: jest.Mock;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports -- module mocks
const Linking = require('expo-linking') as { openSettings: jest.Mock };

describe('requestCameraPermission', () => {
  beforeEach(() => {
    Camera.requestCameraPermissionsAsync.mockReset();
    Camera.getCameraPermissionsAsync.mockReset();
  });

  it("returns 'granted' when expo-camera grants", async () => {
    Camera.requestCameraPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never',
    });
    const result = await requestCameraPermission();
    expect(result).toEqual({ status: 'granted', canAskAgain: true });
  });

  it("returns 'denied' when expo-camera denies and canAskAgain=false", async () => {
    Camera.requestCameraPermissionsAsync.mockResolvedValue({
      status: 'denied',
      granted: false,
      canAskAgain: false,
      expires: 'never',
    });
    const result = await requestCameraPermission();
    expect(result).toEqual({ status: 'denied', canAskAgain: false });
  });

  it("returns 'undetermined' when status is undetermined after prompt", async () => {
    Camera.requestCameraPermissionsAsync.mockResolvedValue({
      status: 'undetermined',
      granted: false,
      canAskAgain: true,
      expires: 'never',
    });
    const result = await requestCameraPermission();
    expect(result).toEqual({ status: 'undetermined', canAskAgain: true });
  });
});

describe('getCameraPermission', () => {
  beforeEach(() => {
    Camera.requestCameraPermissionsAsync.mockReset();
    Camera.getCameraPermissionsAsync.mockReset();
  });

  it('does not trigger a prompt (uses get*, not request*)', async () => {
    Camera.getCameraPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never',
    });
    const result = await getCameraPermission();
    expect(Camera.getCameraPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(Camera.requestCameraPermissionsAsync).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'granted', canAskAgain: true });
  });
});

describe('requestPhotoLibraryPermission', () => {
  beforeEach(() => {
    ImagePicker.requestMediaLibraryPermissionsAsync.mockReset();
  });

  it("returns 'granted' on grant", async () => {
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never',
      accessPrivileges: 'all',
    });
    const result = await requestPhotoLibraryPermission();
    expect(result).toEqual({ status: 'granted', canAskAgain: true });
  });

  it("returns 'denied' on deny", async () => {
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: 'denied',
      granted: false,
      canAskAgain: false,
      expires: 'never',
      accessPrivileges: 'none',
    });
    const result = await requestPhotoLibraryPermission();
    expect(result).toEqual({ status: 'denied', canAskAgain: false });
  });
});

describe('openSystemSettings', () => {
  it('calls Linking.openSettings()', async () => {
    Linking.openSettings.mockReset();
    Linking.openSettings.mockResolvedValue(undefined);
    await openSystemSettings();
    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
  });
});
