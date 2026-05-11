import type { SupabaseClient } from '@supabase/supabase-js';

import { callEdgeFunction } from './ai';

function makeMockClient(
  invokeResult: { data: unknown; error: { message: string } | null },
): SupabaseClient {
  return {
    functions: {
      invoke: jest.fn(async () => invokeResult),
    },
  } as unknown as SupabaseClient;
}

describe('callEdgeFunction', () => {
  it('invokes the named function with the provided body', async () => {
    const client = makeMockClient({ data: { ok: true }, error: null });
    const result = await callEdgeFunction<{ ok: boolean }>('hello', { foo: 1 }, client);
    expect(client.functions.invoke).toHaveBeenCalledWith('hello', { body: { foo: 1 } });
    expect(result).toEqual({ ok: true });
  });

  it('invokes without a body when none is provided', async () => {
    const client = makeMockClient({ data: { message: 'hi' }, error: null });
    const result = await callEdgeFunction<{ message: string }>('hello', undefined, client);
    expect(client.functions.invoke).toHaveBeenCalledWith('hello', { body: undefined });
    expect(result).toEqual({ message: 'hi' });
  });

  it('throws when invoke returns an error', async () => {
    const client = makeMockClient({ data: null, error: { message: 'boom' } });
    await expect(callEdgeFunction('hello', { foo: 1 }, client)).rejects.toThrow(/boom/);
  });
});
