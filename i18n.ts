import i18next, { type i18n as I18n } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import ru from './locales/ru.json';

export const resources = {
  en: { common: en },
  es: { common: es },
  ru: { common: ru },
} as const;

export type SupportedLocale = keyof typeof resources;

export interface InitI18nOptions {
  lng?: SupportedLocale;
}

export async function initI18n(opts: InitI18nOptions = {}): Promise<I18n> {
  if (!i18next.isInitialized) {
    // eslint-disable-next-line import/no-named-as-default-member -- i18next default export is the singleton; .use() returns it for chaining
    await i18next.use(initReactI18next).init({
      lng: opts.lng ?? 'en',
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: ['common'],
      resources,
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });
  } else if (opts.lng !== undefined) {
    // eslint-disable-next-line import/no-named-as-default-member -- see above
    await i18next.changeLanguage(opts.lng);
  }
  return i18next;
}

export const i18n: I18n = i18next;
