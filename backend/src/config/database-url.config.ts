type DatabaseUrlEnvName =
  | 'DATABASE_URL'
  | 'DB_USER'
  | 'DB_PASS'
  | 'DB_HOST'
  | 'DB_PORT'
  | 'DB_NAME';
type DatabaseUrlEnv = Partial<Record<DatabaseUrlEnvName, string | number>>;

const REQUIRED_DB_PARTS = ['DB_USER', 'DB_HOST', 'DB_PORT', 'DB_NAME'] as const;

/**
 * Resolves the PostgreSQL connection URL used by Prisma from env variables.
 */
export function resolveDatabaseUrl(env: DatabaseUrlEnv = process.env): string {
  if (env.DATABASE_URL) {
    const databaseUrl = String(env.DATABASE_URL);
    validatePostgresUrl(databaseUrl, 'DATABASE_URL');
    return databaseUrl;
  }

  const missingParts = REQUIRED_DB_PARTS.filter((name) => !env[name]);
  if (missingParts.length > 0) {
    throw new Error(
      `Missing database environment variables: ${missingParts.join(', ')}`,
    );
  }

  const dbPort = String(env.DB_PORT);
  validatePort(dbPort, 'DB_PORT');

  const url = new URL('postgresql://localhost');
  url.username = String(env.DB_USER);
  url.password = env.DB_PASS ? String(env.DB_PASS) : '';
  url.hostname = String(env.DB_HOST);
  url.port = dbPort;
  url.pathname = `/${env.DB_NAME}`;
  url.searchParams.set('schema', 'public');

  return url.toString();
}

function validatePostgresUrl(value: string, name: string): void {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL connection URL.`);
  }

  if (!['postgresql:', 'postgres:'].includes(parsedUrl.protocol)) {
    throw new Error(`${name} must use the postgresql:// protocol.`);
  }

  if (!parsedUrl.port) {
    return;
  }

  validatePort(parsedUrl.port, `${name} port`);
}

function validatePort(value: string, name: string): void {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a numeric port, for example 5432.`);
  }

  const port = Number(value);
  if (port < 1 || port > 65535) {
    throw new Error(`${name} must be between 1 and 65535.`);
  }
}
