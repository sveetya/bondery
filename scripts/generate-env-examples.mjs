#!/usr/bin/env node
/**
 * Regenerate committed env examples + turbo.json from packages/helpers/src/env/manifest.ts.
 *
 *   npm run generate-env-examples           # write files only
 *   npm run generate-env-examples -- --stage  # also `git add` outputs (pre-commit)
 */

import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stage = process.argv.includes("--stage");

function run(command) {
  execSync(command, { cwd: root, stdio: "inherit" });
}

run("npm run build -w @bondery/helpers");
run("node --import tsx scripts/env.ts --write-examples --write-turbo");

if (stage) {
  run(
    `git add .env.local.example turbo.json packages/db/.env.local.example deploy/bondery/.env.example deploy/ops/.env.example && find apps -type f \\( -name '.env*.example' -o -name '.env.example' \\) -print0 | xargs -0 git add`,
  );
}
