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

  it("default species is 'unknown'", () => {
    jest.isolateModules(() => {
      const fresh = jest.requireActual<typeof import('./store')>('./store');
      expect(fresh.useAppStore.getState().species).toBe('unknown');
    });
  });

  it("setSpecies updates to 'cat'", () => {
    useAppStore.getState().setSpecies('cat');
    expect(useAppStore.getState().species).toBe('cat');
  });

  it("setSpecies updates to 'dog'", () => {
    useAppStore.getState().setSpecies('dog');
    expect(useAppStore.getState().species).toBe('dog');
  });

  it("setSpecies updates back to 'unknown'", () => {
    useAppStore.getState().setSpecies('dog');
    useAppStore.getState().setSpecies('unknown');
    expect(useAppStore.getState().species).toBe('unknown');
  });
});
