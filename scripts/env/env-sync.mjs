#!/usr/bin/env node
/**
 * Build helpers, regenerate committed env examples + turbo.json, verify version sync.
 *
 *   pnpm run env:sync
 *   pnpm run env:sync -- --stage   # also `git add` outputs (pre-commit)
 */

import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const stage = process.argv.includes("--stage");

function run(command) {
  execSync(command, { cwd: root, shell: true, stdio: "inherit" });
}

run("pnpm --filter @bondery/helpers run build");

const exampleArgs = stage ? " --stage" : "";
run(`node scripts/env/generate-env-examples.mjs${exampleArgs}`);

run("pnpm run check:versions");
