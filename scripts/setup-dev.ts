/**
 * First-time local env setup.
 *
 *   npm run setup:dev
 *   # edit .env.local (optional integrations)
 *   npm run env
 *   npm run dev
 */

import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCliLogger } from "@bondery/helpers/cli";
import { EXAMPLE_POSTGRES_PASSWORD } from "../packages/helpers/src/env/index.ts";
import { upsertEnvAssignments } from "./env-upsert.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const log = createCliLogger("setup:dev");

/** Inventable first-party OAuth values — empty in `.env.local.example`, required for `npm run env`. */
const INVENTABLE_AUTH = [
  { bytes: 16, key: "BONDERY_PUBLIC_OAUTH_CLIENT_ID" },
  { bytes: 16, key: "BONDERY_PUBLIC_WEBAPP_OAUTH_CLIENT_ID" },
  { bytes: 32, key: "BONDERY_PRIVATE_WEBAPP_OAUTH_CLIENT_SECRET" },
] as const;

function generatePostgresPassword(): string {
  return randomBytes(24).toString("base64").replace(/[/+=]/g, "").slice(0, 32);
}

function isPostgresPasswordPlaceholder(value: string | undefined): boolean {
  if (!value) {
    return true;
  }
  return value === EXAMPLE_POSTGRES_PASSWORD || value === "password";
}

function run(cmd: string) {
  execSync(cmd, { cwd: repoRoot, stdio: "inherit" });
}

function readEnvAssignment(content: string, key: string): string | undefined {
  const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match) {
    return undefined;
  }
  let raw = match[1].trim();
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1);
  }
  return raw;
}

/** Fill empty inventable OAuth client id/secret placeholders so env check can pass. */
function seedInventableAuthSecrets(envPath: string) {
  const content = readFileSync(envPath, "utf-8");
  const updates: Record<string, string> = {};

  for (const { key, bytes } of INVENTABLE_AUTH) {
    const current = readEnvAssignment(content, key);
    if (current) {
      continue;
    }
    updates[key] = randomBytes(bytes).toString("hex");
  }

  if (Object.keys(updates).length === 0) {
    return;
  }

  upsertEnvAssignments(envPath, updates);
  log.warn(`Generated ${Object.keys(updates).length} local OAuth client value(s) in .env.local`);
  for (const key of Object.keys(updates)) {
    log.info(`  ${key}`);
  }
}

/** Seed bundled local Postgres password when still on the example placeholder. */
function seedPostgresPassword(envPath: string) {
  const content = readFileSync(envPath, "utf-8");
  const current = readEnvAssignment(content, "BONDERY_PRIVATE_POSTGRES_PASSWORD");
  if (!isPostgresPasswordPlaceholder(current)) {
    return;
  }

  const password = generatePostgresPassword();
  upsertEnvAssignments(envPath, { BONDERY_PRIVATE_POSTGRES_PASSWORD: password });
  log.warn("Generated BONDERY_PRIVATE_POSTGRES_PASSWORD in .env.local");
  log.info("  npm run env will derive DATABASE_URL for api/db");
}

function main() {
  const rootEnv = join(repoRoot, ".env.local");
  const example = join(repoRoot, ".env.local.example");

  // Apps import `@bondery/*/dist` — stale packages make `scripts/env.ts` crash (e.g. SYNC_TARGETS).
  log.step(1, 3, "Compile workspace packages");
  run("npm run build:packages");

  log.step(2, 3, "Ensure .env.local exists");
  if (!existsSync(example)) {
    log.info("Generating examples from manifest…");
    run("node --import tsx scripts/env.ts --write-examples");
  }
  if (!existsSync(rootEnv)) {
    copyFileSync(example, rootEnv);
    log.warn("Created .env.local from example — edit optional integrations as needed");
  } else {
    log.info(".env.local already present");
  }
  seedInventableAuthSecrets(rootEnv);
  seedPostgresPassword(rootEnv);

  log.step(3, 3, "Sync app env files (development + production) → check");
  run("npm run env");

  log.success("Dev env ready");
  log.info("Next: npm run start:postgres && npm run start:redis && npm run start:seaweedfs");
  log.info(
    "Then: npm run env && npm run dev (set BONDERY_DEV_SKIP_RELEASE_MIGRATE=true if you already migrated locally)",
  );
}

main();
