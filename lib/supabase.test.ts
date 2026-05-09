import { EnvError } from './env';
import { createSupabaseClient } from './supabase';

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
