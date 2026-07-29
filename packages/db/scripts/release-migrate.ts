#!/usr/bin/env tsx
/**
 * Release migration gate — see packages/db/src/release-migrate.ts.
 *
 * Usage: tsx scripts/release-migrate.ts
 */
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runReleaseMigrate } from "../src/release-migrate.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

async function main() {
  await runReleaseMigrate({
    provisionOAuthClients: async () => {
      execFileSync("npm", ["run", "provision-oauth-clients", "-w", "api"], {
        cwd: repoRoot,
        env: process.env,
        stdio: "inherit",
      });
    },
    provisionPlatformAdmins: async () => {
      execFileSync("npm", ["run", "provision-platform-admins", "-w", "api"], {
        cwd: repoRoot,
        env: process.env,
        stdio: "inherit",
      });
    },
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
