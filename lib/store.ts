import { create } from 'zustand';

export type Locale = 'en' | 'es' | 'ru';

export interface AppState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

// Stub: defaults to 'ru' so the "default locale is 'en'" assertion in tests
// fails for the right reason (assertion failure, not import failure).
export const useAppStore = create<AppState>((_set) => ({
  locale: 'ru',
  setLocale: (_locale: Locale): void => {
    // stub — real implementation lands in feat commit
  },
}));
