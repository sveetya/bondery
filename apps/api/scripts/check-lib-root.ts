// Fails when .ts files exist at lib/ root (subsystem folders only).
//
// Usage: pnpm exec tsx scripts/check-lib-root.ts

import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createCheck } from "../../../scripts/check/check-report.mjs";

const check = createCheck("check-lib-root");

const __dirname = dirname(fileURLToPath(import.meta.url));
const libRoot = join(__dirname, "..", "src", "lib");

const ALLOWLIST = new Set<string>([]);

const rootFiles = readdirSync(libRoot).filter(
  (entry) => entry.endsWith(".ts") && !ALLOWLIST.has(entry),
);

for (const file of rootFiles) {
  check.add(
    `lib/ root must contain only subdirectories — move lib/${file} into a subsystem folder`,
  );
}

check.ok();
