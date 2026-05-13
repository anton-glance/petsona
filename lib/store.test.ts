import type { BreedIdentifyResponse } from '../shared/types';
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

  it("captureSession defaults to { currentSlot: 'front', photoUri: null, photoPath: null, breed: null }", () => {
    jest.isolateModules(() => {
      const fresh = jest.requireActual<typeof import('./store')>('./store');
      expect(fresh.useAppStore.getState().captureSession).toEqual({
        currentSlot: 'front',
        photoUri: null,
        photoPath: null,
        breed: null,
      });
    });
  });

  it('setCaptureFront updates photoUri, photoPath, and breed atomically', () => {
    const breed: BreedIdentifyResponse = {
      species: 'dog',
      breed: 'Beagle',
      confidence: 0.81,
      candidates: [{ breed: 'Beagle', confidence: 0.81 }],
    };
    useAppStore.getState().setCaptureFront({
      photoUri: 'file:///c.jpg',
      photoPath: 'user-aaa/abc.jpg',
      breed,
    });
    const session = useAppStore.getState().captureSession;
    expect(session.photoUri).toBe('file:///c.jpg');
    expect(session.photoPath).toBe('user-aaa/abc.jpg');
    expect(session.breed).toEqual(breed);
    expect(session.currentSlot).toBe('front');
  });

  it('resetCaptureSession clears photoUri/photoPath/breed and resets slot to front', () => {
    const breed: BreedIdentifyResponse = {
      species: 'cat',
      breed: 'Maine Coon',
      confidence: 0.7,
      candidates: [{ breed: 'Maine Coon', confidence: 0.7 }],
    };
    useAppStore.getState().setCaptureFront({
      photoUri: 'file:///c.jpg',
      photoPath: 'user-aaa/abc.jpg',
      breed,
    });
    useAppStore.getState().resetCaptureSession();
    expect(useAppStore.getState().captureSession).toEqual({
      currentSlot: 'front',
      photoUri: null,
      photoPath: null,
      breed: null,
    });
  });

  it('setCaptureFront does NOT touch the species slice (M2/M3 boundary)', () => {
    jest.isolateModules(() => {
      const fresh = jest.requireActual<typeof import('./store')>('./store');
      const speciesBefore = fresh.useAppStore.getState().species;
      const breed: BreedIdentifyResponse = {
        species: 'dog',
        breed: 'Beagle',
        confidence: 0.81,
        candidates: [{ breed: 'Beagle', confidence: 0.81 }],
      };
      fresh.useAppStore.getState().setCaptureFront({
        photoUri: 'file:///c.jpg',
        photoPath: 'user-aaa/abc.jpg',
        breed,
      });
      expect(fresh.useAppStore.getState().species).toBe(speciesBefore);
    });
  });
});
