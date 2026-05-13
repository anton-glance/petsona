import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initI18n } from '../../i18n';
import { Events } from '../../lib/events';
import CameraPermission from './camera-permission';

const trackMock = jest.fn();
const pushMock = jest.fn();
const replaceMock = jest.fn();
const requestCameraPermissionMock = jest.fn();
const loggerErrorMock = jest.fn();

jest.mock('../../lib/telemetry', () => ({
  track: (...args: unknown[]) => trackMock(...args),
  identify: jest.fn(),
  captureException: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock, back: jest.fn() }),
  router: { push: pushMock, replace: replaceMock, back: jest.fn() },
}));
jest.mock('../../features/onboarding/permissions', () => ({
  requestCameraPermission: (...args: unknown[]) => requestCameraPermissionMock(...args),
  getCameraPermission: jest.fn(),
  requestPhotoLibraryPermission: jest.fn(),
  openSystemSettings: jest.fn(),
}));
jest.mock('../../lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
  createLogger: jest.fn(),
}));

function wrap(ui: React.ReactElement): React.ReactElement {
  return <SafeAreaProvider>{ui}</SafeAreaProvider>;
}

describe('CameraPermission (R1-M2 step 02)', () => {
  beforeAll(async () => {
    await initI18n({ lng: 'en' });
  });
  beforeEach(() => {
    trackMock.mockReset();
    pushMock.mockReset();
    replaceMock.mockReset();
    requestCameraPermissionMock.mockReset();
    loggerErrorMock.mockReset();
  });

  it('renders step cap, title, two benefit rows, and [Allow access]', () => {
    const tree = render(wrap(<CameraPermission />));
    expect(tree.getByText(/Petsona needs your camera/)).toBeTruthy();
    expect(tree.getByText(/Quick check-up/)).toBeTruthy();
    expect(tree.getByText(/timeline that builds itself/)).toBeTruthy();
    expect(tree.getByText('Allow access')).toBeTruthy();
  });

  it("on 'granted' navigates to /onboarding/capture and tracks granted event", async () => {
    requestCameraPermissionMock.mockResolvedValue({ status: 'granted', canAskAgain: true });
    const tree = render(wrap(<CameraPermission />));
    await act(async () => {
      fireEvent.press(tree.getByText('Allow access'));
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/onboarding/capture'));
    expect(trackMock).toHaveBeenCalledWith(Events.onboarding_camera_permission_requested);
    expect(trackMock).toHaveBeenCalledWith(Events.onboarding_camera_permission_granted);
  });

  it("on 'denied' navigates to /onboarding/camera-denied and tracks event with reason='denied'", async () => {
    requestCameraPermissionMock.mockResolvedValue({ status: 'denied', canAskAgain: false });
    const tree = render(wrap(<CameraPermission />));
    await act(async () => {
      fireEvent.press(tree.getByText('Allow access'));
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/onboarding/camera-denied'));
    expect(trackMock).toHaveBeenCalledWith(
      Events.onboarding_camera_permission_denied,
      { reason: 'denied' },
    );
  });

  it("on 'undetermined' navigates to /onboarding/camera-denied and tracks event with reason='undetermined'", async () => {
    requestCameraPermissionMock.mockResolvedValue({ status: 'undetermined', canAskAgain: true });
    const tree = render(wrap(<CameraPermission />));
    await act(async () => {
      fireEvent.press(tree.getByText('Allow access'));
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/onboarding/camera-denied'));
    expect(trackMock).toHaveBeenCalledWith(
      Events.onboarding_camera_permission_denied,
      { reason: 'undetermined' },
    );
  });

  it('permission-request errors route through logger.error and do not navigate', async () => {
    requestCameraPermissionMock.mockRejectedValue(new Error('native crash'));
    const tree = render(wrap(<CameraPermission />));
    await act(async () => {
      fireEvent.press(tree.getByText('Allow access'));
    });
    await waitFor(() => expect(loggerErrorMock).toHaveBeenCalled());
    expect(pushMock).not.toHaveBeenCalled();
    // No PostHog event for the error path per D-021.
    expect(trackMock).not.toHaveBeenCalledWith(
      Events.onboarding_camera_permission_denied,
      expect.anything(),
    );
  });
});
