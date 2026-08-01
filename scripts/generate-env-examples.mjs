#!/usr/bin/env node
/**
 * Regenerate committed env examples + turbo.json from packages/helpers/src/env/manifest.ts.
 *
 *   pnpm run env:examples           # write files only
 *   pnpm run env:examples -- --stage  # also `git add` outputs (pre-commit)
 */

import { execSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { dirname, join, resolve as pathResolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = pathResolve(dirname(fileURLToPath(import.meta.url)), "..");
const stage = process.argv.includes("--stage");

function run(command) {
  execSync(command, { cwd: root, shell: true, stdio: "inherit" });
}

function isEnvExampleFile(name) {
  return name === ".env.example" || (name.startsWith(".env") && name.endsWith(".example"));
}

function collectAppEnvExamples(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectAppEnvExamples(absolutePath, files);
      continue;
    }
    if (isEnvExampleFile(entry.name)) {
      files.push(relative(root, absolutePath).replaceAll("\\", "/"));
    }
  }
  return files;
}

run("node --import tsx scripts/env.ts --write-examples --write-turbo");

if (stage) {
  const pathsToStage = [
    ".env.local.example",
    "turbo.json",
    "packages/db/.env.local.example",
    "deploy/bondery/.env.example",
    "deploy/ops/.env.example",
    ...collectAppEnvExamples(join(root, "apps")),
  ];

  const existingPaths = pathsToStage.filter((path) => {
    try {
      return statSync(join(root, path)).isFile();
    } catch {
      return false;
    }
  });

  if (existingPaths.length > 0) {
    run(`git add ${existingPaths.map((path) => JSON.stringify(path)).join(" ")}`);
  }
}
