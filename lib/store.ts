import { create } from 'zustand';

export type Locale = 'en' | 'es' | 'ru';

/**
 * Pet species. `unknown` is the default until the breed-identify response
 * (R1-M3) confirms a species or the user picks one manually. Several UI
 * surfaces respect this value (background patterns, hero silhouettes,
 * watch-chip copy on step 10) — set per D-023's adaptive-theming hook.
 */
export type Species = 'cat' | 'dog' | 'unknown';

export interface AppState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  authUserId: string | null;
  setAuthUserId: (id: string | null) => void;
  species: Species;
  setSpecies: (species: Species) => void;
}

export const useAppStore = create<AppState>((set) => ({
  locale: 'en',
  setLocale: (locale) => set({ locale }),
  authUserId: null,
  setAuthUserId: (id) => set({ authUserId: id }),
  species: 'unknown',
  setSpecies: (species) => set({ species }),
}));

/** Selector hook — returns the current species from the app store. */
export const useSpecies = (): Species => useAppStore((s) => s.species);
