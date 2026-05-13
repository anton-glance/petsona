import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as React from 'react';

import { initI18n } from '../../../i18n';
import CameraDenied from '../../../app/onboarding/camera-denied';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockGetCameraPermission = jest.fn();
const mockOpenSystemSettings = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
  router: { push: mockPush, replace: mockReplace, back: jest.fn() },
}));
jest.mock('../../../features/onboarding/permissions', () => ({
  getCameraPermission: (...args: unknown[]) => mockGetCameraPermission(...args),
  openSystemSettings: (...args: unknown[]) => mockOpenSystemSettings(...args),
  requestCameraPermission: jest.fn(),
  requestPhotoLibraryPermission: jest.fn(),
}));

describe('CameraDenied (R1-M2 step 02b)', () => {
  beforeAll(async () => {
    await initI18n({ lng: 'en' });
  });
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockGetCameraPermission.mockReset();
    mockOpenSystemSettings.mockReset();
    // openSystemSettings' public contract is Promise<void>; the screen
    // chains .catch() on the result. The default jest.fn() returns
    // undefined, which violates the contract — reset to a resolved
    // promise so the call site behaves as in production.
    mockOpenSystemSettings.mockResolvedValue(undefined);
  });

  it('renders title, 3 numbered steps, [Open Settings], [Try again]', () => {
    const tree = render(<CameraDenied />);
    expect(tree.getByText(/Petsona can't continue without camera/)).toBeTruthy();
    // Step 1's wording was deliberately tightened to "Open the Settings app"
    // so the test can distinguish it from the [Open Settings] CTA below
    // (both contain "Open" and "Settings"; bare /Open .*Settings/ would
    // collide via getByText's multi-match rule).
    expect(tree.getByText('Open the Settings app')).toBeTruthy();
    expect(tree.getByText(/Find .*Petsona.* in the app list/)).toBeTruthy();
    expect(tree.getByText(/Toggle .*Camera.* on/)).toBeTruthy();
    expect(tree.getByText('Open Settings')).toBeTruthy();
    expect(tree.getByText(/Try again/)).toBeTruthy();
  });

  it('[Open Settings] calls openSystemSettings', () => {
    const tree = render(<CameraDenied />);
    fireEvent.press(tree.getByText('Open Settings'));
    expect(mockOpenSystemSettings).toHaveBeenCalledTimes(1);
  });

  it("[Try again] re-checks permission; on 'granted' navigates to /onboarding/capture", async () => {
    mockGetCameraPermission.mockResolvedValue({ status: 'granted', canAskAgain: true });
    const tree = render(<CameraDenied />);
    await act(async () => {
      fireEvent.press(tree.getByText(/Try again/));
    });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/onboarding/capture'));
  });

  it('[Try again] on still-denied stays on the same screen (no navigation)', async () => {
    mockGetCameraPermission.mockResolvedValue({ status: 'denied', canAskAgain: false });
    const tree = render(<CameraDenied />);
    await act(async () => {
      fireEvent.press(tree.getByText(/Try again/));
    });
    await waitFor(() => expect(mockGetCameraPermission).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('B-4: AppState becomes active → permission re-checked → if granted, auto-advance to capture', async () => {
    // Capture the AppState listener so the test can fire it synchronously.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- runtime import
    const RN = require('react-native') as typeof import('react-native');
    let appStateListener: ((state: string) => void) | null = null;
    const addEventListenerSpy = jest
      .spyOn(RN.AppState, 'addEventListener')
      .mockImplementation((event, cb) => {
        if (event === 'change') {
          appStateListener = cb as (s: string) => void;
        }
        return { remove: jest.fn() } as unknown as ReturnType<
          typeof RN.AppState.addEventListener
        >;
      });

    mockGetCameraPermission.mockResolvedValue({ status: 'granted', canAskAgain: true });
    render(<CameraDenied />);
    expect(appStateListener).not.toBeNull();
    await act(async () => {
      appStateListener?.('active');
    });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/onboarding/capture'));

    addEventListenerSpy.mockRestore();
  });

  it('B-4: AppState becomes active but permission still denied → no navigation', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- runtime import
    const RN = require('react-native') as typeof import('react-native');
    let appStateListener: ((state: string) => void) | null = null;
    const addEventListenerSpy = jest
      .spyOn(RN.AppState, 'addEventListener')
      .mockImplementation((event, cb) => {
        if (event === 'change') {
          appStateListener = cb as (s: string) => void;
        }
        return { remove: jest.fn() } as unknown as ReturnType<
          typeof RN.AppState.addEventListener
        >;
      });

    mockGetCameraPermission.mockResolvedValue({ status: 'denied', canAskAgain: false });
    render(<CameraDenied />);
    await act(async () => {
      appStateListener?.('active');
    });
    await waitFor(() => expect(mockGetCameraPermission).toHaveBeenCalled());
    expect(mockReplace).not.toHaveBeenCalled();

    addEventListenerSpy.mockRestore();
  });
});
