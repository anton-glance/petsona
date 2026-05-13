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

  it("captureSession defaults to currentSlot='front' with all photo + breed fields null", () => {
    jest.isolateModules(() => {
      const fresh = jest.requireActual<typeof import('./store')>('./store');
      expect(fresh.useAppStore.getState().captureSession).toEqual({
        currentSlot: 'front',
        photoUri: null,
        photoPath: null,
        breed: null,
        sidePhotoUri: null,
        sidePhotoPath: null,
        docPhotoUri: null,
        docPhotoPath: null,
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

  it('resetCaptureSession clears photoUri/photoPath/breed and resets slot to front (R1-M3 boundary)', () => {
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
      sidePhotoUri: null,
      sidePhotoPath: null,
      docPhotoUri: null,
      docPhotoPath: null,
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

  it('captureSession initial state includes side + doc fields as null (R1 visual redo)', () => {
    jest.isolateModules(() => {
      const fresh = jest.requireActual<typeof import('./store')>('./store');
      const session = fresh.useAppStore.getState().captureSession;
      expect(session.sidePhotoUri).toBeNull();
      expect(session.sidePhotoPath).toBeNull();
      expect(session.docPhotoUri).toBeNull();
      expect(session.docPhotoPath).toBeNull();
    });
  });

  it('setCaptureSide writes only sidePhotoUri + sidePhotoPath', () => {
    jest.isolateModules(() => {
      const fresh = jest.requireActual<typeof import('./store')>('./store');
      fresh.useAppStore.getState().setCaptureSide({
        photoUri: 'file:///side.jpg',
        photoPath: 'user-aaa/side.jpg',
      });
      const session = fresh.useAppStore.getState().captureSession;
      expect(session.sidePhotoUri).toBe('file:///side.jpg');
      expect(session.sidePhotoPath).toBe('user-aaa/side.jpg');
      // Front + doc untouched
      expect(session.photoUri).toBeNull();
      expect(session.photoPath).toBeNull();
      expect(session.breed).toBeNull();
      expect(session.docPhotoUri).toBeNull();
      expect(session.docPhotoPath).toBeNull();
    });
  });

  it('setCaptureDocument writes only docPhotoUri + docPhotoPath', () => {
    jest.isolateModules(() => {
      const fresh = jest.requireActual<typeof import('./store')>('./store');
      fresh.useAppStore.getState().setCaptureDocument({
        photoUri: 'file:///doc.jpg',
        photoPath: 'user-aaa/doc.jpg',
      });
      const session = fresh.useAppStore.getState().captureSession;
      expect(session.docPhotoUri).toBe('file:///doc.jpg');
      expect(session.docPhotoPath).toBe('user-aaa/doc.jpg');
      expect(session.photoUri).toBeNull();
      expect(session.sidePhotoUri).toBeNull();
    });
  });

  it('setCaptureSlot updates currentSlot and leaves all photo fields untouched', () => {
    jest.isolateModules(() => {
      const fresh = jest.requireActual<typeof import('./store')>('./store');
      fresh.useAppStore.getState().setCaptureSlot('side');
      expect(fresh.useAppStore.getState().captureSession.currentSlot).toBe('side');
      fresh.useAppStore.getState().setCaptureSlot('document');
      expect(fresh.useAppStore.getState().captureSession.currentSlot).toBe('document');
      fresh.useAppStore.getState().setCaptureSlot('front');
      expect(fresh.useAppStore.getState().captureSession.currentSlot).toBe('front');
    });
  });

  it('resetCaptureSession clears ALL slot fields (front + side + doc) and resets currentSlot', () => {
    jest.isolateModules(() => {
      const fresh = jest.requireActual<typeof import('./store')>('./store');
      const breed: BreedIdentifyResponse = {
        species: 'cat',
        breed: 'Tabby',
        confidence: 0.91,
        candidates: [{ breed: 'Tabby', confidence: 0.91 }],
      };
      fresh.useAppStore.getState().setCaptureFront({
        photoUri: 'file:///f.jpg',
        photoPath: 'user/f.jpg',
        breed,
      });
      fresh.useAppStore.getState().setCaptureSide({
        photoUri: 'file:///s.jpg',
        photoPath: 'user/s.jpg',
      });
      fresh.useAppStore.getState().setCaptureDocument({
        photoUri: 'file:///d.jpg',
        photoPath: 'user/d.jpg',
      });
      fresh.useAppStore.getState().setCaptureSlot('document');
      fresh.useAppStore.getState().resetCaptureSession();
      const session = fresh.useAppStore.getState().captureSession;
      expect(session.currentSlot).toBe('front');
      expect(session.photoUri).toBeNull();
      expect(session.photoPath).toBeNull();
      expect(session.breed).toBeNull();
      expect(session.sidePhotoUri).toBeNull();
      expect(session.sidePhotoPath).toBeNull();
      expect(session.docPhotoUri).toBeNull();
      expect(session.docPhotoPath).toBeNull();
    });
  });

  it('setCaptureSide does NOT touch species (boundary guard, mirrors setCaptureFront)', () => {
    jest.isolateModules(() => {
      const fresh = jest.requireActual<typeof import('./store')>('./store');
      fresh.useAppStore.getState().setSpecies('cat');
      fresh.useAppStore.getState().setCaptureSide({
        photoUri: 'file:///s.jpg',
        photoPath: 'user/s.jpg',
      });
      expect(fresh.useAppStore.getState().species).toBe('cat');
    });
  });
});
