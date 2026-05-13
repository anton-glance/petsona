import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as React from 'react';

import { initI18n } from '../../../i18n';
import { Events } from '../../../lib/events';
import { useAppStore } from '../../../lib/store';
import type { BreedIdentifyResponse } from '../../../shared/types';
import PhotoCollection from '../../../app/onboarding/photo-collection';

const mockTrack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('../../../lib/telemetry', () => ({
  track: (...args: unknown[]) => mockTrack(...args),
  identify: jest.fn(),
  captureException: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
  router: { push: mockPush, replace: mockReplace, back: jest.fn() },
}));

const breedFixture: BreedIdentifyResponse = {
  species: 'cat',
  breed: 'Tabby',
  confidence: 0.91,
  candidates: [{ breed: 'Tabby', confidence: 0.91 }],
};

function seedFrontOnly(): void {
  useAppStore.getState().resetCaptureSession();
  useAppStore.getState().setCaptureFront({
    photoUri: 'file:///front.jpg',
    photoPath: 'user-aaa/front.jpg',
    breed: breedFixture,
  });
}

function seedFrontAndSide(): void {
  seedFrontOnly();
  useAppStore.getState().setCaptureSide({
    photoUri: 'file:///side.jpg',
    photoPath: 'user-aaa/side.jpg',
  });
}

function seedAllThree(): void {
  seedFrontAndSide();
  useAppStore.getState().setCaptureDocument({
    photoUri: 'file:///doc.jpg',
    photoPath: 'user-aaa/doc.jpg',
  });
}

describe('PhotoCollection (R1 visual redo — step 04)', () => {
  beforeAll(async () => {
    await initI18n({ lng: 'en' });
  });
  beforeEach(() => {
    mockTrack.mockReset();
    mockPush.mockReset();
    mockReplace.mockReset();
    useAppStore.getState().resetCaptureSession();
  });

  it('redirects to / via router.replace when no slots are set on mount', async () => {
    render(<PhotoCollection />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
  });

  describe('state 1 — front captured, side active', () => {
    beforeEach(() => seedFrontOnly());

    it('renders the state-1 title "Now, a side view."', () => {
      const tree = render(<PhotoCollection />);
      expect(tree.getByText(/Now, a side view/i)).toBeTruthy();
    });

    it('renders all three photo cards: front=done, side=active, doc=optional', () => {
      const tree = render(<PhotoCollection />);
      // Asserting via testID is more robust than text — "Side photo" also
      // appears in the "Capture side photo" CTA, and /Side photo/i would
      // multi-match getByText. The testIDs are unambiguous.
      expect(tree.getByTestId('photo-card-front')).toBeTruthy();
      expect(tree.getByTestId('photo-card-side')).toBeTruthy();
      expect(tree.getByTestId('photo-card-document')).toBeTruthy();
      // Each card renders its title; getAllByText accommodates the CTA collision.
      expect(tree.getAllByText(/Front photo/i).length).toBeGreaterThanOrEqual(1);
      expect(tree.getAllByText(/Side photo/i).length).toBeGreaterThanOrEqual(1);
      expect(tree.getAllByText(/Vet passport|Vet document|DNA test/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders "Capture side photo" CTA', () => {
      const tree = render(<PhotoCollection />);
      expect(tree.getByText('Capture side photo')).toBeTruthy();
    });

    it('does NOT render "Skip vet docs" in state 1', () => {
      const tree = render(<PhotoCollection />);
      expect(tree.queryByText(/Skip vet docs/i)).toBeNull();
    });

    it('tapping "Capture side photo" sets slot=side and navigates to capture', async () => {
      const tree = render(<PhotoCollection />);
      await act(async () => {
        fireEvent.press(tree.getByText('Capture side photo'));
      });
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/onboarding/capture'));
      expect(useAppStore.getState().captureSession.currentSlot).toBe('side');
    });
  });

  describe('state 2 — front + side captured, document active', () => {
    beforeEach(() => seedFrontAndSide());

    it('renders the state-2 title with the pet name placeholder', () => {
      const tree = render(<PhotoCollection />);
      expect(tree.getByText(/Got a document/i)).toBeTruthy();
    });

    it('renders "Capture document" CTA + "Skip vet docs" text button', () => {
      const tree = render(<PhotoCollection />);
      expect(tree.getByText('Capture document')).toBeTruthy();
      expect(tree.getByText(/Skip vet docs/i)).toBeTruthy();
    });

    it('tapping "Capture document" sets slot=document and navigates to capture', async () => {
      const tree = render(<PhotoCollection />);
      await act(async () => {
        fireEvent.press(tree.getByText('Capture document'));
      });
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/onboarding/capture'));
      expect(useAppStore.getState().captureSession.currentSlot).toBe('document');
    });

    it('tapping "Skip vet docs" fires the event and navigates to welcome', async () => {
      const tree = render(<PhotoCollection />);
      await act(async () => {
        fireEvent.press(tree.getByText(/Skip vet docs/i));
      });
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/onboarding/welcome'));
      expect(mockTrack).toHaveBeenCalledWith(Events.onboarding_document_skipped);
    });
  });

  describe('state 3 — all three captured', () => {
    beforeEach(() => seedAllThree());

    it('renders the state-3 title "Everything captured."', () => {
      const tree = render(<PhotoCollection />);
      expect(tree.getByText(/Everything captured/i)).toBeTruthy();
    });

    it('renders the "Meet Mochi" / generic CTA (not "Capture document")', () => {
      const tree = render(<PhotoCollection />);
      expect(tree.queryByText(/Capture document/i)).toBeNull();
      // The CTA copy uses "Meet your pet" when name is empty (R1-M3 doesn't
      // know the name yet on this screen — it lives on Welcome).
      expect(tree.getByTestId('cta-meet')).toBeTruthy();
    });

    it('tapping the meet CTA navigates to /onboarding/welcome', async () => {
      const tree = render(<PhotoCollection />);
      await act(async () => {
        fireEvent.press(tree.getByTestId('cta-meet'));
      });
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/onboarding/welcome'));
    });

    it('does NOT render "Skip vet docs" in state 3', () => {
      const tree = render(<PhotoCollection />);
      expect(tree.queryByText(/Skip vet docs/i)).toBeNull();
    });
  });
});
