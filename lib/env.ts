export interface PublicEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

export class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvError';
  }
}

export function readPublicEnv(source: NodeJS.ProcessEnv = process.env): PublicEnv {
  const url = source.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = source.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) {
    throw new EnvError('EXPO_PUBLIC_SUPABASE_URL is not set');
  }
  if (!anonKey) {
    throw new EnvError('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set');
  }
  return { SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey };
}
