import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initI18n } from '../../i18n';
import CameraDenied from './camera-denied';

const pushMock = jest.fn();
const replaceMock = jest.fn();
const getCameraPermissionMock = jest.fn();
const openSystemSettingsMock = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock, back: jest.fn() }),
  router: { push: pushMock, replace: replaceMock, back: jest.fn() },
}));
jest.mock('../../features/onboarding/permissions', () => ({
  getCameraPermission: (...args: unknown[]) => getCameraPermissionMock(...args),
  openSystemSettings: (...args: unknown[]) => openSystemSettingsMock(...args),
  requestCameraPermission: jest.fn(),
  requestPhotoLibraryPermission: jest.fn(),
}));

function wrap(ui: React.ReactElement): React.ReactElement {
  return <SafeAreaProvider>{ui}</SafeAreaProvider>;
}

describe('CameraDenied (R1-M2 step 02b)', () => {
  beforeAll(async () => {
    await initI18n({ lng: 'en' });
  });
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    getCameraPermissionMock.mockReset();
    openSystemSettingsMock.mockReset();
  });

  it('renders title, 3 numbered steps, [Open Settings], [Try again]', () => {
    const tree = render(wrap(<CameraDenied />));
    expect(tree.getByText(/Petsona can't continue without camera/)).toBeTruthy();
    expect(tree.getByText(/Open .*Settings/)).toBeTruthy();
    expect(tree.getByText(/Find .*Petsona.* in the app list/)).toBeTruthy();
    expect(tree.getByText(/Toggle .*Camera.* on/)).toBeTruthy();
    expect(tree.getByText('Open Settings')).toBeTruthy();
    expect(tree.getByText(/Try again/)).toBeTruthy();
  });

  it('[Open Settings] calls openSystemSettings', () => {
    const tree = render(wrap(<CameraDenied />));
    fireEvent.press(tree.getByText('Open Settings'));
    expect(openSystemSettingsMock).toHaveBeenCalledTimes(1);
  });

  it("[Try again] re-checks permission; on 'granted' navigates to /onboarding/capture", async () => {
    getCameraPermissionMock.mockResolvedValue({ status: 'granted', canAskAgain: true });
    const tree = render(wrap(<CameraDenied />));
    await act(async () => {
      fireEvent.press(tree.getByText(/Try again/));
    });
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/onboarding/capture'));
  });

  it('[Try again] on still-denied stays on the same screen (no navigation)', async () => {
    getCameraPermissionMock.mockResolvedValue({ status: 'denied', canAskAgain: false });
    const tree = render(wrap(<CameraDenied />));
    await act(async () => {
      fireEvent.press(tree.getByText(/Try again/));
    });
    await waitFor(() => expect(getCameraPermissionMock).toHaveBeenCalled());
    expect(pushMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
