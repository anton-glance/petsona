import { create } from 'zustand';

import type { BreedIdentifyResponse } from '../shared/types';

export type Locale = 'en' | 'es' | 'ru';

/**
 * Pet species. `unknown` is the default until the breed-identify response
 * (R1-M3) confirms a species or the user picks one manually. Several UI
 * surfaces respect this value (background patterns, hero silhouettes,
 * watch-chip copy on step 10) — set per D-023's adaptive-theming hook.
 */
export type Species = 'cat' | 'dog' | 'unknown';

/**
 * Capture slot state machine. R1's onboarding captures three photos in
 * sequence: front (drives breed-identify per D-019), side (R2 OCR input),
 * document (optional, R2 OCR input). The Welcome screen reads only the
 * front photo + breed; the photo-collection screen reads all three.
 *
 * Router params were the alternative; rejected because typed routes
 * serialize `BreedIdentifyResponse.candidates[]` into the URL, which leaks
 * into PostHog screen autocapture.
 */
export type CaptureSlot = 'front' | 'side' | 'document';

export interface CaptureSessionState {
  currentSlot: CaptureSlot;
  /** Front photo: local compressed JPEG URI. */
  photoUri: string | null;
  /** Front photo: Storage path under pet-photos/{auth.uid()}/... */
  photoPath: string | null;
  /** Hardcoded BreedIdentifyResponse for the front photo (D-019). */
  breed: BreedIdentifyResponse | null;
  /** Side photo: local URI + Storage path. R2's combined-prompt VLM input. */
  sidePhotoUri: string | null;
  sidePhotoPath: string | null;
  /** Document photo: optional. R2's OCR input. */
  docPhotoUri: string | null;
  docPhotoPath: string | null;
}

export interface CaptureFrontPayload {
  photoUri: string;
  photoPath: string;
  breed: BreedIdentifyResponse;
}

export interface CaptureSidePayload {
  photoUri: string;
  photoPath: string;
}

export interface CaptureDocumentPayload {
  photoUri: string;
  photoPath: string;
}

export interface AppState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  authUserId: string | null;
  setAuthUserId: (id: string | null) => void;
  species: Species;
  setSpecies: (species: Species) => void;
  captureSession: CaptureSessionState;
  setCaptureFront: (payload: CaptureFrontPayload) => void;
  setCaptureSide: (payload: CaptureSidePayload) => void;
  setCaptureDocument: (payload: CaptureDocumentPayload) => void;
  setCaptureSlot: (slot: CaptureSlot) => void;
  resetCaptureSession: () => void;
}

const INITIAL_CAPTURE_SESSION: CaptureSessionState = {
  currentSlot: 'front',
  photoUri: null,
  photoPath: null,
  breed: null,
  sidePhotoUri: null,
  sidePhotoPath: null,
  docPhotoUri: null,
  docPhotoPath: null,
};

export const useAppStore = create<AppState>((set) => ({
  locale: 'en',
  setLocale: (locale) => set({ locale }),
  authUserId: null,
  setAuthUserId: (id) => set({ authUserId: id }),
  species: 'unknown',
  setSpecies: (species) => set({ species }),
  captureSession: INITIAL_CAPTURE_SESSION,
  setCaptureFront: (payload) =>
    set((s) => ({
      captureSession: {
        ...s.captureSession,
        photoUri: payload.photoUri,
        photoPath: payload.photoPath,
        breed: payload.breed,
      },
    })),
  setCaptureSide: (payload) =>
    set((s) => ({
      captureSession: {
        ...s.captureSession,
        sidePhotoUri: payload.photoUri,
        sidePhotoPath: payload.photoPath,
      },
    })),
  setCaptureDocument: (payload) =>
    set((s) => ({
      captureSession: {
        ...s.captureSession,
        docPhotoUri: payload.photoUri,
        docPhotoPath: payload.photoPath,
      },
    })),
  setCaptureSlot: (slot) =>
    set((s) => ({ captureSession: { ...s.captureSession, currentSlot: slot } })),
  resetCaptureSession: () => set({ captureSession: INITIAL_CAPTURE_SESSION }),
}));

/** Selector hook — returns the current species from the app store. */
export const useSpecies = (): Species => useAppStore((s) => s.species);

/** Selector hook — returns the current capture session slice. */
export const useCaptureSession = (): CaptureSessionState =>
  useAppStore((s) => s.captureSession);
