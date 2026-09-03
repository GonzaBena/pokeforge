import { createClient, type Client } from "@libsql/client/web";

let cachedClient: Client | null = null;

export function isTursoConfigured(): boolean {
  const url = process.env.TURSO_DATABASE_URL || (import.meta.env && import.meta.env.TURSO_DATABASE_URL);
  const authToken = process.env.TURSO_AUTH_TOKEN || (import.meta.env && import.meta.env.TURSO_AUTH_TOKEN);
  return Boolean(url && authToken);
}

export function getTursoClient(): Client | null {
  if (!isTursoConfigured()) {
    return null;
  }

  if (cachedClient) {
    return cachedClient;
  }

  const url = (process.env.TURSO_DATABASE_URL || (import.meta.env && import.meta.env.TURSO_DATABASE_URL)) as string;
  const authToken = (process.env.TURSO_AUTH_TOKEN || (import.meta.env && import.meta.env.TURSO_AUTH_TOKEN)) as string;

  cachedClient = createClient({
    url,
    authToken,
  });

  return cachedClient;
}
