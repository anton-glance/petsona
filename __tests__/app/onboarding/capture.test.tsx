import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as React from 'react';

import { initI18n } from '../../../i18n';
import { Events } from '../../../lib/events';
import type { BreedIdentifyResponse } from '../../../shared/types';
import Capture from '../../../app/onboarding/capture';

const mockTrack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRunCapturePipeline = jest.fn();
const mockRequestPhotoLibraryPermission = jest.fn();
const mockGetCameraPermission = jest.fn();
const mockLoggerError = jest.fn();
const mockLaunchImageLibrary = jest.fn();

jest.mock('../../../lib/telemetry', () => ({
  track: (...args: unknown[]) => mockTrack(...args),
  identify: jest.fn(),
  captureException: jest.fn(),
}));
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory
  const R = require('react');
  return {
    useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
    router: { push: mockPush, replace: mockReplace, back: jest.fn() },
    useFocusEffect: (cb: () => unknown) => {
      // Run once synchronously on mount to mirror screen-focus.
      R.useEffect(() => {
        const cleanup = cb();
        return typeof cleanup === 'function' ? (cleanup as () => void) : undefined;
      }, []);
    },
  };
});
jest.mock('../../../features/onboarding/capturePipeline', () => ({
  runCapturePipeline: (...args: unknown[]) => mockRunCapturePipeline(...args),
}));
jest.mock('../../../features/onboarding/permissions', () => ({
  requestPhotoLibraryPermission: (...args: unknown[]) =>
    mockRequestPhotoLibraryPermission(...args),
  getCameraPermission: (...args: unknown[]) => mockGetCameraPermission(...args),
  requestCameraPermission: jest.fn(),
  openSystemSettings: jest.fn(),
}));
jest.mock('expo-camera', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory
  const RN = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory
  const R = require('react');
  // CameraView is a class component; expose a forwardRef stub that allows
  // ref.takePictureAsync() to resolve a captured picture.
  const CameraView = R.forwardRef(
    (props: { children?: unknown }, ref: { current?: unknown }) => {
      R.useImperativeHandle(ref, () => ({
        takePictureAsync: async (): Promise<{
          uri: string;
          width: number;
          height: number;
        }> => ({ uri: 'file:///capture.jpg', width: 3000, height: 4000 }),
      }));
      return R.createElement(RN.View, { testID: 'camera-view' }, props.children);
    },
  );
  return { CameraView };
});
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibrary(...args),
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

const breedFixture: BreedIdentifyResponse = {
  species: 'cat',
  breed: 'Siamese',
  confidence: 0.88,
  candidates: [{ breed: 'Siamese', confidence: 0.88 }],
};

describe('Capture (R1-M2 step 03)', () => {
  beforeAll(async () => {
    await initI18n({ lng: 'en' });
  });
  beforeEach(() => {
    mockTrack.mockReset();
    mockPush.mockReset();
    mockReplace.mockReset();
    mockRunCapturePipeline.mockReset();
    mockRequestPhotoLibraryPermission.mockReset();
    mockGetCameraPermission.mockReset();
    mockLoggerError.mockReset();
    mockLaunchImageLibrary.mockReset();
    mockGetCameraPermission.mockResolvedValue({ status: 'granted', canAskAgain: true });
  });

  it('renders viewfinder, top-pill, shutter, library button, flip button', () => {
    const tree = render(<Capture />);
    expect(tree.getByText(/Photo 1 of 3 · Front/)).toBeTruthy();
    expect(tree.getByLabelText('Capture')).toBeTruthy();
    expect(tree.getByLabelText('Photo library')).toBeTruthy();
    expect(tree.getByLabelText('Flip camera')).toBeTruthy();
  });

  it('shutter press → runs capture pipeline → writes captureSession → navigates to /onboarding/welcome', async () => {
    mockRunCapturePipeline.mockResolvedValue({
      photoUri: 'file:///compressed.jpg',
      photoPath: 'user-aaa/abc.jpg',
      breed: breedFixture,
    });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Capture'));
    });
    await waitFor(() => expect(mockRunCapturePipeline).toHaveBeenCalled());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/onboarding/welcome'));

    // The R1-M3 contract: the captureSession slice now carries the breed.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- runtime read of fresh store
    const { useAppStore } = require('../../../lib/store') as typeof import('../../../lib/store');
    expect(useAppStore.getState().captureSession.breed).toEqual(breedFixture);
    expect(useAppStore.getState().captureSession.photoUri).toBe('file:///compressed.jpg');
    expect(useAppStore.getState().captureSession.photoPath).toBe('user-aaa/abc.jpg');
  });

  it('library button → permission granted → picks image → runs SAME pipeline as shutter', async () => {
    mockRequestPhotoLibraryPermission.mockResolvedValue({
      status: 'granted',
      canAskAgain: true,
    });
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///gallery.jpg', width: 4000, height: 3000 }],
    });
    mockRunCapturePipeline.mockResolvedValue({
      photoUri: 'file:///compressed.jpg',
      photoPath: 'user-aaa/lib.jpg',
      breed: breedFixture,
    });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Photo library'));
    });
    await waitFor(() => expect(mockRunCapturePipeline).toHaveBeenCalled());
    expect(mockRunCapturePipeline.mock.calls[0][0]).toBe('file:///gallery.jpg');
  });

  it('while pipeline is in flight, shutter is disabled and Spinner is visible', async () => {
    let resolvePipeline: (v: unknown) => void = () => undefined;
    mockRunCapturePipeline.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePipeline = resolve;
        }),
    );
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Capture'));
    });
    // Spinner has accessibilityRole=progressbar via ActivityIndicator.
    await waitFor(() => expect(tree.UNSAFE_queryAllByType).toBeTruthy());
    expect(tree.getByLabelText('Capture').props.accessibilityState?.disabled).toBe(true);
    await act(async () => {
      resolvePipeline({
        photoUri: 'file:///c.jpg',
        photoPath: 'u/c.jpg',
        breed: breedFixture,
      });
    });
  });

  it('CompressionError surfaces an error message and logger.error is called', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- runtime import for type-safe construction
    const { CompressionError } = require('../../../features/onboarding/compression') as typeof import('../../../features/onboarding/compression');
    mockRunCapturePipeline.mockRejectedValue(new CompressionError('decode fail'));
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Capture'));
    });
    await waitFor(() => expect(mockLoggerError).toHaveBeenCalled());
    expect(tree.queryByText(/couldn'?t process/i)).toBeTruthy();
  });

  it('UploadError surfaces an error message and Retry is available', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- runtime import
    const { UploadError } = require('../../../features/onboarding/upload') as typeof import('../../../features/onboarding/upload');
    mockRunCapturePipeline.mockRejectedValue(new UploadError('storage 403'));
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Capture'));
    });
    await waitFor(() => expect(tree.queryByText(/upload/i)).toBeTruthy());
    expect(tree.getByText(/Retry|Try again/)).toBeTruthy();
  });

  it('BreedIdentifyError surfaces an error message and Retry re-runs the pipeline', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- runtime import
    const { BreedIdentifyError } = require('../../../features/onboarding/breedIdentify') as typeof import('../../../features/onboarding/breedIdentify');
    mockRunCapturePipeline.mockRejectedValueOnce(new BreedIdentifyError('edge fn 500'));
    mockRunCapturePipeline.mockResolvedValueOnce({
      photoUri: 'file:///c.jpg',
      photoPath: 'u/c.jpg',
      breed: breedFixture,
    });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Capture'));
    });
    await waitFor(() => expect(tree.queryByText(/identify/i)).toBeTruthy());
    await act(async () => {
      fireEvent.press(tree.getByText(/Retry|Try again/));
    });
    await waitFor(() => expect(mockRunCapturePipeline).toHaveBeenCalledTimes(2));
  });

  it('library button when photo-library permission is denied → surfaces an error message', async () => {
    mockRequestPhotoLibraryPermission.mockResolvedValue({
      status: 'denied',
      canAskAgain: false,
    });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Photo library'));
    });
    // Use a regex specific to the libraryDenied error so it doesn't collide
    // with "Photo 1 of 3 · Front" in the top-pill (queryByText throws on
    // multiple matches). The error contract is: the screen surfaces the
    // libraryDenied i18n string.
    await waitFor(() =>
      expect(tree.queryByText(/library access is needed/i)).toBeTruthy(),
    );
    expect(mockLaunchImageLibrary).not.toHaveBeenCalled();
    expect(mockRunCapturePipeline).not.toHaveBeenCalled();
  });

  it('breed-identify success fires Events.onboarding_capture_completed exactly once', async () => {
    mockRunCapturePipeline.mockResolvedValue({
      photoUri: 'file:///c.jpg',
      photoPath: 'u/c.jpg',
      breed: breedFixture,
    });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Capture'));
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    const completedCalls = mockTrack.mock.calls.filter(
      (c) => c[0] === Events.onboarding_capture_completed,
    );
    expect(completedCalls).toHaveLength(1);
  });

  it('on focus, re-checks camera permission; if revoked, navigates to /onboarding/camera-denied', async () => {
    mockGetCameraPermission.mockResolvedValue({ status: 'denied', canAskAgain: false });
    render(<Capture />);
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/onboarding/camera-denied'),
    );
  });
});
