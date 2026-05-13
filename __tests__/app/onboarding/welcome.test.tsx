import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as React from 'react';

import { initI18n } from '../../../i18n';
import { Events } from '../../../lib/events';
import { useAppStore } from '../../../lib/store';
import type { BreedIdentifyResponse } from '../../../shared/types';
import Welcome from '../../../app/onboarding/welcome';

const mockTrack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockInsertPet = jest.fn();
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
jest.mock('../../../features/onboarding/persistPet', () => {
  // Re-expose PersistPetError as the real class so `instanceof` checks in
  // the screen work against the mock's rejections.
  const actual = jest.requireActual('../../../features/onboarding/persistPet');
  return {
    ...actual,
    insertPet: (...args: unknown[]) => mockInsertPet(...args),
  };
});
jest.mock('../../../lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
  createLogger: jest.fn(),
}));

const catFixture: BreedIdentifyResponse = {
  species: 'cat',
  breed: 'Tabby',
  confidence: 0.91,
  candidates: [{ breed: 'Tabby', confidence: 0.91 }],
};

const dogFixture: BreedIdentifyResponse = {
  species: 'dog',
  breed: 'Beagle',
  confidence: 0.81,
  candidates: [{ breed: 'Beagle', confidence: 0.81 }],
};

function seedSlice(breed: BreedIdentifyResponse): void {
  useAppStore.getState().setCaptureFront({
    photoUri: 'file:///compressed.jpg',
    photoPath: 'user-aaa/abc.jpg',
    breed,
  });
}

function seedEmptySlice(): void {
  useAppStore.getState().resetCaptureSession();
}

describe('Welcome (R1-M3 step 05)', () => {
  beforeAll(async () => {
    await initI18n({ lng: 'en' });
  });
  beforeEach(() => {
    mockTrack.mockReset();
    mockPush.mockReset();
    mockReplace.mockReset();
    mockInsertPet.mockReset();
    mockLoggerError.mockReset();
    // Reset the species slice so a leaked value from a previous test doesn't
    // interfere with the "setSpecies called from the success path" assertion.
    useAppStore.getState().setSpecies('unknown');
    seedSlice(catFixture);
  });

  it('renders "Hey 👋" hero and the body line', () => {
    const tree = render(<Welcome />);
    expect(tree.getByText(/Hey 👋/)).toBeTruthy();
    expect(tree.getByText(/what we read from your photos/i)).toBeTruthy();
  });

  it('renders the photo from useCaptureSession().photoUri', () => {
    const tree = render(<Welcome />);
    const photo = tree.getByTestId('welcome-photo');
    expect(photo.props.source).toEqual({ uri: 'file:///compressed.jpg' });
  });

  it('renders the breed name and the AI {confidence%} badge from the slice', () => {
    const tree = render(<Welcome />);
    expect(tree.getByText('Tabby')).toBeTruthy();
    expect(tree.getByText(/AI 91%/)).toBeTruthy();
  });

  it("renders the cat silhouette when slice.breed.species === 'cat'", () => {
    seedSlice(catFixture);
    const tree = render(<Welcome />);
    expect(tree.getByTestId('silhouette-cat')).toBeTruthy();
    expect(tree.queryByTestId('silhouette-dog')).toBeNull();
  });

  it("renders the dog silhouette when slice.breed.species === 'dog'", () => {
    seedSlice(dogFixture);
    const tree = render(<Welcome />);
    expect(tree.getByTestId('silhouette-dog')).toBeTruthy();
    expect(tree.queryByTestId('silhouette-cat')).toBeNull();
  });

  it('renders the Name input with a placeholder and empty initial value', () => {
    const tree = render(<Welcome />);
    const input = tree.getByTestId('welcome-name-input');
    expect(input.props.value).toBe('');
    expect(input.props.placeholder).toMatch(/name/i);
  });

  it('renders Gender, Age, Weight, Color preview rows', () => {
    const tree = render(<Welcome />);
    expect(tree.getByText('Gender')).toBeTruthy();
    expect(tree.getByText('Age')).toBeTruthy();
    expect(tree.getByText('Weight')).toBeTruthy();
    expect(tree.getByText('Color')).toBeTruthy();
  });

  it('renders the "From vet card" section with placeholder Rabies + Microchip rows (R2 OCR fills in)', () => {
    // F-1 fix from R1 visual redo review: the vet-card section IS in the
    // mockup (05_ai_review.html lines 76-86). Stays visible with placeholder
    // dashes until R2's medcard OCR populates the data.
    const tree = render(<Welcome />);
    expect(tree.getByTestId('welcome-vet-section')).toBeTruthy();
    expect(tree.getByText(/From vet card/i)).toBeTruthy();
    expect(tree.getByText(/Rabies/)).toBeTruthy();
    expect(tree.getByText(/Microchip/i)).toBeTruthy();
  });

  it('Gender, Age, Weight, Color rows are non-interactive (tap fires no handler)', () => {
    const tree = render(<Welcome />);
    // Pressing each label triggers fireEvent.press; if the row were wrapped
    // in a Pressable, a handler would run. After C-1 these rows are <View>
    // containers — assert via no observable side effect.
    for (const label of ['Gender', 'Age', 'Weight', 'Color']) {
      fireEvent.press(tree.getByText(label));
    }
    expect(mockInsertPet).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('CTA label is "Welcome your pet" when the name input is empty', () => {
    const tree = render(<Welcome />);
    expect(tree.getByText('Welcome your pet')).toBeTruthy();
  });

  it('CTA label updates live as the user types — typing "Mochi" produces "Welcome Mochi"', () => {
    const tree = render(<Welcome />);
    const input = tree.getByTestId('welcome-name-input');
    fireEvent.changeText(input, 'Mochi');
    expect(tree.getByText('Welcome Mochi')).toBeTruthy();
  });

  it('tapping the CTA: calls insertPet, calls setSpecies, fires Events.onboarding_welcome_confirmed, does NOT navigate', async () => {
    mockInsertPet.mockResolvedValue({ id: 'pet-uuid-xyz' });
    const tree = render(<Welcome />);
    fireEvent.changeText(tree.getByTestId('welcome-name-input'), 'Mochi');
    await act(async () => {
      fireEvent.press(tree.getByText('Welcome Mochi'));
    });
    await waitFor(() => expect(mockInsertPet).toHaveBeenCalled());
    expect(mockInsertPet.mock.calls[0][0]).toEqual({
      name: 'Mochi',
      species: 'cat',
      breed: 'Tabby',
      breed_confidence: 0.91,
      photo_path: 'user-aaa/abc.jpg',
    });
    expect(useAppStore.getState().species).toBe('cat');
    expect(mockTrack).toHaveBeenCalledWith(Events.onboarding_welcome_confirmed);
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('while insertPet is in flight: CTA is disabled (no double-fire on rapid taps)', async () => {
    let resolveInsert: (v: unknown) => void = () => undefined;
    mockInsertPet.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveInsert = resolve;
        }),
    );
    const tree = render(<Welcome />);
    fireEvent.changeText(tree.getByTestId('welcome-name-input'), 'Mochi');
    await act(async () => {
      fireEvent.press(tree.getByText('Welcome Mochi'));
    });
    // Second rapid tap: should not fire a second insertPet.
    await act(async () => {
      fireEvent.press(tree.getByLabelText(/Welcome Mochi/));
    });
    expect(mockInsertPet).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveInsert({ id: 'pet-uuid-xyz' });
    });
  });

  it('upsert failure: error surfaces via i18n, CTA re-enables, setSpecies NOT called, event NOT fired', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- runtime import for type-safe construction
    const { PersistPetError } = require('../../../features/onboarding/persistPet') as typeof import('../../../features/onboarding/persistPet');
    mockInsertPet.mockRejectedValue(new PersistPetError('network error'));
    const tree = render(<Welcome />);
    fireEvent.changeText(tree.getByTestId('welcome-name-input'), 'Mochi');
    await act(async () => {
      fireEvent.press(tree.getByText('Welcome Mochi'));
    });
    await waitFor(() => expect(tree.queryByText(/couldn'?t save/i)).toBeTruthy());
    expect(useAppStore.getState().species).toBe('unknown');
    expect(mockTrack).not.toHaveBeenCalledWith(Events.onboarding_welcome_confirmed);
    // CTA re-enables: a second tap should fire the insertPet again.
    mockInsertPet.mockResolvedValue({ id: 'pet-uuid-xyz' });
    await act(async () => {
      fireEvent.press(tree.getByText('Welcome Mochi'));
    });
    await waitFor(() => expect(mockInsertPet).toHaveBeenCalledTimes(2));
  });

  it('redirects to / via router.replace when captureSession.breed is null on mount', async () => {
    seedEmptySlice();
    render(<Welcome />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
  });

  it("B-3: after insertPet resolves, CTA label changes to 'Saved ✓' and stays disabled (loading=false)", async () => {
    mockInsertPet.mockResolvedValue({ id: 'pet-uuid-xyz' });
    const tree = render(<Welcome />);
    fireEvent.changeText(tree.getByTestId('welcome-name-input'), 'Mochi');
    await act(async () => {
      fireEvent.press(tree.getByText('Welcome Mochi'));
    });
    await waitFor(() => expect(tree.queryByText(/Saved/)).toBeTruthy());
    // The CTA is found by the new "Saved ✓" label. Asserting it has
    // accessibilityState.disabled=true confirms the post-success state per B-3.
    const cta = tree.getByLabelText(/Saved/);
    expect(cta.props.accessibilityState?.disabled).toBe(true);
    // A second press doesn't fire insertPet again (still gated by savedOk).
    await act(async () => {
      fireEvent.press(cta);
    });
    expect(mockInsertPet).toHaveBeenCalledTimes(1);
  });
});
