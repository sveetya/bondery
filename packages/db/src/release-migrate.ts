import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { applySqlFunctions } from "./apply-sql-functions.js";

export type ReleaseMigrateHooks = {
  provisionOAuthClients: () => Promise<void>;
  provisionPlatformAdmins: () => Promise<void>;
};

function resolvePrismaCliEntry(): string {
  const require = createRequire(import.meta.url);
  return require.resolve("prisma/build/index.js");
}

export async function runReleaseMigrate(hooks: ReleaseMigrateHooks): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const prismaCliEntry = resolvePrismaCliEntry();

  execFileSync(process.execPath, [prismaCliEntry, "migrate", "deploy"], {
    cwd: packageRoot,
    env: process.env,
    stdio: "inherit",
  });

  await applySqlFunctions(databaseUrl);
  await hooks.provisionOAuthClients();
  await hooks.provisionPlatformAdmins();
}
