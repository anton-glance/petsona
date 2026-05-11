import { type AuthClientFactory, getUser } from '../_shared/auth.ts';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const JSON_HEADERS: Record<string, string> = {
  ...corsHeaders,
  'Content-Type': 'application/json',
};

export async function handle(req: Request, factory?: AuthClientFactory): Promise<Response> {
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const user = await getUser(req, factory);
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  return new Response(JSON.stringify({ message: 'hello', user_id: user.user_id }), {
    status: 200,
    headers: JSON_HEADERS,
  });
}

if (import.meta.main) {
  Deno.serve((req) => handle(req));
}
