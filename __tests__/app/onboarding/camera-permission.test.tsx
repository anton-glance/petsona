import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as React from 'react';

import { initI18n } from '../../../i18n';
import { Events } from '../../../lib/events';
import CameraPermission from '../../../app/onboarding/camera-permission';

const mockTrack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRequestCameraPermission = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('../../../lib/telemetry', () => ({
  track: (...args: unknown[]) => mockTrack(...args),
  identify: jest.fn(),
  captureException: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
  router: { push: mockPush, replace: mockReplace, back: jest.fn() },
}));
jest.mock('../../../features/onboarding/permissions', () => ({
  requestCameraPermission: (...args: unknown[]) => mockRequestCameraPermission(...args),
  getCameraPermission: jest.fn(),
  requestPhotoLibraryPermission: jest.fn(),
  openSystemSettings: jest.fn(),
}));
jest.mock('../../../lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
  createLogger: jest.fn(),
}));

describe('CameraPermission (R1-M2 step 02)', () => {
  beforeAll(async () => {
    await initI18n({ lng: 'en' });
  });
  beforeEach(() => {
    mockTrack.mockReset();
    mockPush.mockReset();
    mockReplace.mockReset();
    mockRequestCameraPermission.mockReset();
    mockLoggerError.mockReset();
  });

  it('renders step cap, title, two benefit rows, and [Allow access]', () => {
    const tree = render(<CameraPermission />);
    expect(tree.getByText(/Petsona needs your camera/)).toBeTruthy();
    expect(tree.getByText(/Quick check-up/)).toBeTruthy();
    expect(tree.getByText(/timeline that builds itself/)).toBeTruthy();
    expect(tree.getByText('Allow access')).toBeTruthy();
  });

  it('renders the camera-preview block and two forest icon-marks (visual redo)', () => {
    const tree = render(<CameraPermission />);
    expect(tree.getByTestId('camera-preview-block')).toBeTruthy();
    expect(tree.getByTestId('benefit-icon-1')).toBeTruthy();
    expect(tree.getByTestId('benefit-icon-2')).toBeTruthy();
  });

  it('renders the "Step 1 of 3" small-cap label (visual redo)', () => {
    const tree = render(<CameraPermission />);
    expect(tree.getByText(/Step 1 of 3/i)).toBeTruthy();
  });

  it("on 'granted' navigates to /onboarding/capture and tracks granted event", async () => {
    mockRequestCameraPermission.mockResolvedValue({ status: 'granted', canAskAgain: true });
    const tree = render(<CameraPermission />);
    await act(async () => {
      fireEvent.press(tree.getByText('Allow access'));
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/onboarding/capture'));
    expect(mockTrack).toHaveBeenCalledWith(Events.onboarding_camera_permission_requested);
    expect(mockTrack).toHaveBeenCalledWith(Events.onboarding_camera_permission_granted);
  });

  it("on 'denied' navigates to /onboarding/camera-denied and tracks event with reason='denied'", async () => {
    mockRequestCameraPermission.mockResolvedValue({ status: 'denied', canAskAgain: false });
    const tree = render(<CameraPermission />);
    await act(async () => {
      fireEvent.press(tree.getByText('Allow access'));
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/onboarding/camera-denied'));
    expect(mockTrack).toHaveBeenCalledWith(
      Events.onboarding_camera_permission_denied,
      { reason: 'denied' },
    );
  });

  it("on 'undetermined' navigates to /onboarding/camera-denied and tracks event with reason='undetermined'", async () => {
    mockRequestCameraPermission.mockResolvedValue({ status: 'undetermined', canAskAgain: true });
    const tree = render(<CameraPermission />);
    await act(async () => {
      fireEvent.press(tree.getByText('Allow access'));
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/onboarding/camera-denied'));
    expect(mockTrack).toHaveBeenCalledWith(
      Events.onboarding_camera_permission_denied,
      { reason: 'undetermined' },
    );
  });

  it('permission-request errors route through logger.error and do not navigate', async () => {
    mockRequestCameraPermission.mockRejectedValue(new Error('native crash'));
    const tree = render(<CameraPermission />);
    await act(async () => {
      fireEvent.press(tree.getByText('Allow access'));
    });
    await waitFor(() => expect(mockLoggerError).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
    // No PostHog event for the error path per D-021.
    expect(mockTrack).not.toHaveBeenCalledWith(
      Events.onboarding_camera_permission_denied,
      expect.anything(),
    );
  });
});
