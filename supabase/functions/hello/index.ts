import { type AuthClientFactory, getUser } from '../_shared/auth.ts';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

export async function handle(_req: Request, _factory?: AuthClientFactory): Promise<Response> {
  return new Response('not implemented', { status: 501, headers: corsHeaders });
}

// Suppress unused warnings while stubs are in place.
void getUser;
void handleCorsPreflightRequest;

if (import.meta.main) {
  Deno.serve((req) => handle(req));
}
