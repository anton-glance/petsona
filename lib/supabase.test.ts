import AsyncStorage from '@react-native-async-storage/async-storage';

import { EnvError } from './env';
import { createSupabaseClient, resolveClientConfig } from './supabase';

describe('createSupabaseClient', () => {
  it('constructs without error when env vars are set', () => {
    expect(() =>
      createSupabaseClient({
        url: 'https://test-project.supabase.co',
        anonKey: 'test-anon-key-1234567890',
      }),
    ).not.toThrow();
  });

  it('throws when SUPABASE_URL is missing', () => {
    expect(() => createSupabaseClient({ url: '', anonKey: 'test-anon-key-1234567890' })).toThrow(
      EnvError,
    );
  });

  it('throws when SUPABASE_ANON_KEY is missing', () => {
    expect(() =>
      createSupabaseClient({ url: 'https://test-project.supabase.co', anonKey: '' }),
    ).toThrow(EnvError);
  });
});

describe('resolveClientConfig', () => {
  it('defaults storage to AsyncStorage when none provided', () => {
    const config = resolveClientConfig({
      url: 'https://test-project.supabase.co',
      anonKey: 'test-anon-key-1234567890',
    });
    expect(config.storage).toBe(AsyncStorage);
  });

  it('uses provided storage adapter when passed', () => {
    const customStorage = {
      getItem: jest.fn(async () => null),
      setItem: jest.fn(async () => undefined),
      removeItem: jest.fn(async () => undefined),
    };
    const config = resolveClientConfig({
      url: 'https://test-project.supabase.co',
      anonKey: 'test-anon-key-1234567890',
      storage: customStorage,
    });
    expect(config.storage).toBe(customStorage);
  });

  it('reads url/anonKey from env when opts are omitted', () => {
    const config = resolveClientConfig();
    expect(config.url).toBe(process.env.EXPO_PUBLIC_SUPABASE_URL);
    expect(config.anonKey).toBe(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  });
});
