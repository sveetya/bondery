#!/usr/bin/env tsx
/**
 * Release migration gate — runs `prisma migrate deploy`, applies
 * prisma/sql/functions.sql, then provisions the first-party OAuth
 * clients/resource against DATABASE_URL. Used as the one-shot `migrate`
 * Compose service in deploy/bondery so schema and trusted-client state are
 * in place before api/webapp start, for both self-host and production.
 *
 * OAuth provisioning runs from this package's script (not
 * `apps/api/scripts/provision-oauth-clients.ts` directly) because the
 * `migrate` Compose service only has this package's dependencies available;
 * `apps/api` is spawned as a separate workspace script via `npm -w api run`.
 *
 * Usage: tsx scripts/release-migrate.ts
 */
import { execFileSync } from "node:child_process";
import { applySqlFunctions } from "./apply-sql-functions.js";

async function main() {
  // biome-ignore lint/suspicious/noUndeclaredEnvVars: release migration requires DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  execFileSync("prisma", ["migrate", "deploy"], {
    cwd: new URL("..", import.meta.url).pathname,
    stdio: "inherit",
  });
  await applySqlFunctions(databaseUrl);
  execFileSync("npm", ["run", "provision-oauth-clients", "-w", "api"], {
    cwd: new URL("../../..", import.meta.url).pathname,
    stdio: "inherit",
  });
  execFileSync("npm", ["run", "provision-platform-admins", "-w", "api"], {
    cwd: new URL("../../..", import.meta.url).pathname,
    stdio: "inherit",
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
