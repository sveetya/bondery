#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const biomeBin = require.resolve("@biomejs/biome/bin/biome");

const result = spawnSync(
  process.execPath,
  [
    biomeBin,
    "check",
    "--write",
    "--no-errors-on-unmatched",
    "--files-ignore-unknown=true",
    ".",
  ],
  { cwd: root, stdio: "inherit" },
);

process.exit(result.status ?? 1);
