import { create } from 'zustand';

export type Locale = 'en' | 'es' | 'ru';

export interface AppState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useAppStore = create<AppState>((set) => ({
  locale: 'en',
  setLocale: (locale) => set({ locale }),
}));
