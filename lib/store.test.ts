import { useAppStore } from './store';

describe('useAppStore', () => {
  it("default locale is 'en'", () => {
    jest.isolateModules(() => {
      const fresh = jest.requireActual<typeof import('./store')>('./store');
      expect(fresh.useAppStore.getState().locale).toBe('en');
    });
  });

  it('setLocale updates the locale', () => {
    useAppStore.getState().setLocale('es');
    expect(useAppStore.getState().locale).toBe('es');
  });
});
