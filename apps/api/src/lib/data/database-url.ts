const DATABASE_URL_ENV = "DATABASE_URL";
const DATABASE_URL_REQUIRED_MESSAGE = "DATABASE_URL must be set";

let boundDatabaseUrl: string | null = null;

/**
 * Pin the Postgres URL from Fastify config at boot. Falls back to process.env until bound.
 * Throws if the URL changes after binding (same contract as Redis / email transporter).
 */
export function bindDatabaseUrl(url: string): void {
  const trimmed = url.trim();
  if (boundDatabaseUrl !== null && boundDatabaseUrl !== trimmed) {
    throw new Error("DATABASE_URL changed after bind; restart the process");
  }
  boundDatabaseUrl = trimmed;
}

/** Resolved URL: bound value first, then process.env. */
export function getDatabaseUrl(): string | undefined {
  const fromBind = boundDatabaseUrl?.trim();
  if (fromBind) {
    return fromBind;
  }

  const fromEnv = process.env[DATABASE_URL_ENV]?.trim();
  return fromEnv || undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export function requireDatabaseUrl(): string {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(DATABASE_URL_REQUIRED_MESSAGE);
  }
  return url;
}

/** @internal Test-only reset. */
export function resetDatabaseUrlBindingForTests(): void {
  boundDatabaseUrl = null;
}
