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

  it('authUserId defaults to null', () => {
    jest.isolateModules(() => {
      const fresh = jest.requireActual<typeof import('./store')>('./store');
      expect(fresh.useAppStore.getState().authUserId).toBeNull();
    });
  });

  it('setAuthUserId updates authUserId', () => {
    useAppStore.getState().setAuthUserId('abc-123');
    expect(useAppStore.getState().authUserId).toBe('abc-123');
    useAppStore.getState().setAuthUserId(null);
    expect(useAppStore.getState().authUserId).toBeNull();
  });
});
