// RED PHASE stub. logAiJob is a no-op so tests asserting "insert was called
// with X" fail. Real implementation lands in the next commit.

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

export function logAiJob(_row: AiJobRow, _factory?: AiJobsInserterFactory): Promise<void> {
  return Promise.resolve();
}
