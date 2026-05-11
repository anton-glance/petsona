export interface AuthClientLike {
  getUser(
    jwt: string,
  ): Promise<{
    data: { user: { id: string } | null };
    error: { message: string } | null;
  }>;
}

export type AuthClientFactory = () => AuthClientLike;

export async function getUser(
  _req: Request,
  _factory?: AuthClientFactory,
): Promise<{ user_id: string } | null> {
  return null;
}
