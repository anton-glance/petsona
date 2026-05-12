// ai_jobs writer (D-019). Uses the service-role key to bypass RLS on
// ai_jobs (the table grants INSERT only to service_role per D-020 and the
// R0-M3 migration). Service-role is referenced ONLY in this file outside
// tests -- AC-9 of R1-M1.
//
// Telemetry must never break the user flow: every kind of failure (factory
// throw, insert rejection, { error } return) is swallowed and surfaced via
// console.error (Supabase function logs capture stderr). Never throws.

import { createClient } from 'npm:@supabase/supabase-js@^2.105.0';

export interface AiJobRow {
  user_id: string;
  capability: string;
  model: string;
  prompt_version: string;
  status: 'success' | 'error';
  latency_ms: number;
  input_hash: string;
  input_tokens?: number;
  output_tokens?: number;
  pages?: number;
  cost_usd?: number;
  error_code?: string;
}

export interface AiJobsInserter {
  insert(row: AiJobRow): Promise<{ error: { message: string } | null }>;
}

export type AiJobsInserterFactory = () => AiJobsInserter;

export async function logAiJob(
  row: AiJobRow,
  factory: AiJobsInserterFactory = defaultFactory,
): Promise<void> {
  try {
    const inserter = factory();
    const { error } = await inserter.insert(row);
    if (error) {
      console.error('logAiJob: insert returned error', error.message);
    }
  } catch (err) {
    console.error(
      'logAiJob: insert failed',
      err instanceof Error ? err.message : String(err),
    );
  }
}

function defaultFactory(): AiJobsInserter {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from edge runtime env');
  }
  const supabase = createClient(url, serviceRoleKey);
  return {
    async insert(row: AiJobRow) {
      const { error } = await supabase.from('ai_jobs').insert(row);
      return { error: error ? { message: error.message } : null };
    },
  };
}
