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

export function readPublicEnv(_source: NodeJS.ProcessEnv = process.env): PublicEnv {
  // stub — real implementation lands in feat commit
  return { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' };
}
