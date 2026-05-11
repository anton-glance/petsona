import { create } from 'zustand';

export type Locale = 'en' | 'es' | 'ru';

export interface AppState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  authUserId: string | null;
  setAuthUserId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  locale: 'en',
  setLocale: (locale) => set({ locale }),
  authUserId: null,
  setAuthUserId: (id) => set({ authUserId: id }),
}));
