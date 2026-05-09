import { i18n, initI18n } from './i18n';

describe('i18n', () => {
  beforeAll(async () => {
    await initI18n({ lng: 'en' });
  });

  it("t('app.name') returns \"Petsona\"", () => {
    expect(i18n.t('app.name')).toBe('Petsona');
  });

  it("t('splash.tagline') returns the English tagline by default", () => {
    expect(i18n.t('splash.tagline')).toBe("Every pet has a Petsona");
  });

  it('falls back to en when an unknown locale is requested', async () => {
    await i18n.changeLanguage('xx-unknown');
    expect(i18n.t('app.name')).toBe('Petsona');
  });
});
