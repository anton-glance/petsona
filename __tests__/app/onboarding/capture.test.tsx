import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as React from 'react';

import { initI18n } from '../../../i18n';
import { Events } from '../../../lib/events';
import { useAppStore } from '../../../lib/store';
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

describe('Capture — slot: front (R1 visual redo)', () => {
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
    useAppStore.getState().resetCaptureSession();
    useAppStore.getState().setCaptureSlot('front');
  });

  it('renders viewfinder, top-pill, shutter, library button (testID), flip button', () => {
    const tree = render(<Capture />);
    // Full top-pill match — disambiguates from the tip text which also
    // contains "Front-facing photo..." (getByText(/Front/) would multi-match).
    expect(tree.getByText(/Photo 1 of 3.*Front/i)).toBeTruthy();
    expect(tree.getByLabelText('Capture')).toBeTruthy();
    expect(tree.getByTestId('capture-library-button')).toBeTruthy();
    expect(tree.getByLabelText('Flip camera')).toBeTruthy();
  });

  it('shutter press → runs pipeline with slot=front → writes captureSession.front → navigates to /onboarding/photo-collection', async () => {
    mockRunCapturePipeline.mockResolvedValue({
      slot: 'front',
      photoUri: 'file:///compressed.jpg',
      photoPath: 'user-aaa/abc.jpg',
      breed: breedFixture,
    });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Capture'));
    });
    await waitFor(() => expect(mockRunCapturePipeline).toHaveBeenCalled());
    expect(mockRunCapturePipeline.mock.calls[0][1]).toEqual(
      expect.objectContaining({ slot: 'front' }),
    );
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/onboarding/photo-collection'),
    );
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
      slot: 'front',
      photoUri: 'file:///compressed.jpg',
      photoPath: 'user-aaa/lib.jpg',
      breed: breedFixture,
    });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByTestId('capture-library-button'));
    });
    await waitFor(() => expect(mockRunCapturePipeline).toHaveBeenCalled());
    expect(mockRunCapturePipeline.mock.calls[0][0]).toBe('file:///gallery.jpg');
  });

  it('B-2: after shutter pressed, the live CameraView is unmounted (camera no longer active)', async () => {
    let resolvePipeline: (v: unknown) => void = () => undefined;
    mockRunCapturePipeline.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePipeline = resolve;
        }),
    );
    const tree = render(<Capture />);
    // CameraView is present before the shutter press.
    expect(tree.queryByTestId('camera-view')).toBeTruthy();
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Capture'));
    });
    // After the picture is taken, the CameraView must unmount (replaced by
    // the captured photo preview). This is what stops the iOS green dot.
    await waitFor(() => expect(tree.queryByTestId('camera-view')).toBeNull());
    // Resolve so jest doesn't hold open promises.
    await act(async () => {
      resolvePipeline({
        slot: 'front',
        photoUri: 'file:///c.jpg',
        photoPath: 'u/c.jpg',
        breed: breedFixture,
      });
    });
  });

  it('C-1: front slot shows a discreet spinner during the identify stage', async () => {
    let resolvePipeline: (v: unknown) => void = () => undefined;
    mockRunCapturePipeline.mockImplementation((_uri, opts: { onStage?: (s: string) => void }) => {
      // Walk through the stages to simulate progress.
      opts.onStage?.('compressing');
      opts.onStage?.('uploading');
      opts.onStage?.('identifying');
      return new Promise((resolve) => {
        resolvePipeline = resolve;
      });
    });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Capture'));
    });
    // The spinner is gated on slot===front + stage==='identifying'.
    await waitFor(() => expect(tree.queryByTestId('capture-spinner')).toBeTruthy());
    await act(async () => {
      resolvePipeline({
        slot: 'front',
        photoUri: 'file:///c.jpg',
        photoPath: 'u/c.jpg',
        breed: breedFixture,
      });
    });
  });

  it('B-5: library button has testID "capture-library-button" and fires launchImageLibraryAsync on press', async () => {
    mockRequestPhotoLibraryPermission.mockResolvedValue({
      status: 'granted',
      canAskAgain: true,
    });
    mockLaunchImageLibrary.mockResolvedValue({ canceled: true, assets: [] });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByTestId('capture-library-button'));
    });
    await waitFor(() => expect(mockLaunchImageLibrary).toHaveBeenCalledTimes(1));
  });

  it('library when photo-library permission is denied → surfaces error', async () => {
    mockRequestPhotoLibraryPermission.mockResolvedValue({
      status: 'denied',
      canAskAgain: false,
    });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByTestId('capture-library-button'));
    });
    await waitFor(() =>
      expect(tree.queryByText(/library access is needed/i)).toBeTruthy(),
    );
    expect(mockLaunchImageLibrary).not.toHaveBeenCalled();
    expect(mockRunCapturePipeline).not.toHaveBeenCalled();
  });

  it('breed-identify success fires Events.onboarding_capture_completed exactly once (front slot)', async () => {
    mockRunCapturePipeline.mockResolvedValue({
      slot: 'front',
      photoUri: 'file:///c.jpg',
      photoPath: 'u/c.jpg',
      breed: breedFixture,
    });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Capture'));
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    const calls = mockTrack.mock.calls.filter(
      (c) => c[0] === Events.onboarding_capture_completed,
    );
    expect(calls).toHaveLength(1);
  });

  it('on focus, re-checks camera permission; if revoked, navigates to /onboarding/camera-denied', async () => {
    mockGetCameraPermission.mockResolvedValue({ status: 'denied', canAskAgain: false });
    render(<Capture />);
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/onboarding/camera-denied'),
    );
  });
});

describe('Capture — slot: side', () => {
  beforeAll(async () => {
    await initI18n({ lng: 'en' });
  });
  beforeEach(() => {
    mockTrack.mockReset();
    mockPush.mockReset();
    mockReplace.mockReset();
    mockRunCapturePipeline.mockReset();
    mockGetCameraPermission.mockResolvedValue({ status: 'granted', canAskAgain: true });
    useAppStore.getState().resetCaptureSession();
    // Seed front so the side capture has the expected slice state, then advance to side.
    useAppStore.getState().setCaptureFront({
      photoUri: 'file:///front.jpg',
      photoPath: 'user-aaa/front.jpg',
      breed: breedFixture,
    });
    useAppStore.getState().setCaptureSlot('side');
  });

  it('top-pill reads "Photo 2 of 3 · Side"', () => {
    const tree = render(<Capture />);
    expect(tree.getByText(/Photo 2 of 3/i)).toBeTruthy();
    expect(tree.getByText(/Side/i)).toBeTruthy();
  });

  it('shutter → pipeline with slot=side → setCaptureSide → navigates to photo-collection', async () => {
    mockRunCapturePipeline.mockResolvedValue({
      slot: 'side',
      photoUri: 'file:///compressed-side.jpg',
      photoPath: 'user-aaa/side.jpg',
    });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Capture'));
    });
    expect(mockRunCapturePipeline.mock.calls[0][1]).toEqual(
      expect.objectContaining({ slot: 'side' }),
    );
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/onboarding/photo-collection'),
    );
    expect(useAppStore.getState().captureSession.sidePhotoUri).toBe(
      'file:///compressed-side.jpg',
    );
    expect(useAppStore.getState().captureSession.sidePhotoPath).toBe('user-aaa/side.jpg');
  });

  it('fires Events.onboarding_side_captured exactly once on success', async () => {
    mockRunCapturePipeline.mockResolvedValue({
      slot: 'side',
      photoUri: 'file:///s.jpg',
      photoPath: 'u/s.jpg',
    });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Capture'));
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    const calls = mockTrack.mock.calls.filter(
      (c) => c[0] === Events.onboarding_side_captured,
    );
    expect(calls).toHaveLength(1);
  });

  it('C-1: side slot does NOT show the identify spinner (no identify stage emitted)', async () => {
    let resolvePipeline: (v: unknown) => void = () => undefined;
    mockRunCapturePipeline.mockImplementation((_uri, opts: { onStage?: (s: string) => void }) => {
      opts.onStage?.('compressing');
      opts.onStage?.('uploading');
      // No 'identifying' stage for non-front slots
      return new Promise((resolve) => {
        resolvePipeline = resolve;
      });
    });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Capture'));
    });
    // Give the stages time to flush; spinner should still NOT be visible
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(tree.queryByTestId('capture-spinner')).toBeNull();
    await act(async () => {
      resolvePipeline({ slot: 'side', photoUri: 'file:///s.jpg', photoPath: 'u/s.jpg' });
    });
  });
});

describe('Capture — slot: document', () => {
  beforeAll(async () => {
    await initI18n({ lng: 'en' });
  });
  beforeEach(() => {
    mockTrack.mockReset();
    mockPush.mockReset();
    mockReplace.mockReset();
    mockRunCapturePipeline.mockReset();
    mockGetCameraPermission.mockResolvedValue({ status: 'granted', canAskAgain: true });
    useAppStore.getState().resetCaptureSession();
    useAppStore.getState().setCaptureFront({
      photoUri: 'file:///front.jpg',
      photoPath: 'user-aaa/front.jpg',
      breed: breedFixture,
    });
    useAppStore.getState().setCaptureSide({
      photoUri: 'file:///side.jpg',
      photoPath: 'user-aaa/side.jpg',
    });
    useAppStore.getState().setCaptureSlot('document');
  });

  it('top-pill reads "Photo 3 of 3 · Document"', () => {
    const tree = render(<Capture />);
    expect(tree.getByText(/Photo 3 of 3/i)).toBeTruthy();
    expect(tree.getByText(/Document/i)).toBeTruthy();
  });

  it('shutter → pipeline with slot=document → setCaptureDocument → navigates to photo-collection', async () => {
    mockRunCapturePipeline.mockResolvedValue({
      slot: 'document',
      photoUri: 'file:///compressed-doc.jpg',
      photoPath: 'user-aaa/doc.jpg',
    });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Capture'));
    });
    expect(mockRunCapturePipeline.mock.calls[0][1]).toEqual(
      expect.objectContaining({ slot: 'document' }),
    );
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/onboarding/photo-collection'),
    );
    expect(useAppStore.getState().captureSession.docPhotoUri).toBe(
      'file:///compressed-doc.jpg',
    );
    expect(useAppStore.getState().captureSession.docPhotoPath).toBe('user-aaa/doc.jpg');
  });

  it('fires Events.onboarding_document_captured exactly once on success', async () => {
    mockRunCapturePipeline.mockResolvedValue({
      slot: 'document',
      photoUri: 'file:///d.jpg',
      photoPath: 'u/d.jpg',
    });
    const tree = render(<Capture />);
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Capture'));
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    const calls = mockTrack.mock.calls.filter(
      (c) => c[0] === Events.onboarding_document_captured,
    );
    expect(calls).toHaveLength(1);
  });
});
