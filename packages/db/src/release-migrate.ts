import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { applySqlFunctions } from "./apply-sql-functions.js";

export type ReleaseMigrateHooks = {
  provisionOAuthClients: () => Promise<void>;
  provisionPlatformAdmins: () => Promise<void>;
};

function resolvePrismaBinary(): string {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const repoRoot = resolve(packageRoot, "../..");
  return resolve(repoRoot, "node_modules/.bin/prisma");
}

export async function runReleaseMigrate(hooks: ReleaseMigrateHooks): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const prismaBinary = resolvePrismaBinary();

  execFileSync(prismaBinary, ["migrate", "deploy"], {
    cwd: packageRoot,
    env: process.env,
    stdio: "inherit",
  });

  await applySqlFunctions(databaseUrl);
  await hooks.provisionOAuthClients();
  await hooks.provisionPlatformAdmins();
}
