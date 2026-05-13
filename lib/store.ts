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
 * The R1-M2 → R1-M3 handoff. R1-M2 captures the front photo and writes the
 * breed-identify response here; R1-M3's Welcome screen reads it. R2 extends
 * this by advancing `currentSlot` and adding side/document data — without
 * touching the capture screen's code.
 *
 * Router params were the alternative; rejected because typed routes serialize
 * `BreedIdentifyResponse.candidates[]` into the URL, which leaks into PostHog
 * screen autocapture.
 */
export type CaptureSlot = 'front' | 'side' | 'document';

export interface CaptureSessionState {
  currentSlot: CaptureSlot;
  photoUri: string | null;
  photoPath: string | null;
  breed: BreedIdentifyResponse | null;
}

export interface CaptureFrontPayload {
  photoUri: string;
  photoPath: string;
  breed: BreedIdentifyResponse;
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
  resetCaptureSession: () => void;
}

const INITIAL_CAPTURE_SESSION: CaptureSessionState = {
  currentSlot: 'front',
  photoUri: null,
  photoPath: null,
  breed: null,
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
        currentSlot: s.captureSession.currentSlot,
        photoUri: payload.photoUri,
        photoPath: payload.photoPath,
        breed: payload.breed,
      },
    })),
  resetCaptureSession: () => set({ captureSession: INITIAL_CAPTURE_SESSION }),
}));

/** Selector hook — returns the current species from the app store. */
export const useSpecies = (): Species => useAppStore((s) => s.species);

/** Selector hook — returns the current capture session slice. */
export const useCaptureSession = (): CaptureSessionState =>
  useAppStore((s) => s.captureSession);
