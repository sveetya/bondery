/**
 * Fail CI when any catalog code lacks a docs page on the website.
 *
 * Usage: node scripts/check/check-api-errors-catalog.mjs (pnpm run check:api-errors:catalog)
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { API_ERROR_CODES } from "@bondery/schemas/errors";

import { createCheck } from "./check-report.mjs";

const check = createCheck("check-api-errors-catalog");

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../..");
const errorsDocsRoot = join(
  repoRoot,
  "apps",
  "website",
  "src",
  "app",
  "(chromeless)",
  "docs",
  "api",
  "errors",
);
const pageTemplate = join(errorsDocsRoot, "[code]", "page.tsx");

if (!existsSync(pageTemplate)) {
  check.add(
    "Missing dynamic docs page at apps/website/src/app/(chromeless)/docs/api/errors/[code]/page.tsx",
  );
}

if (!existsSync(join(errorsDocsRoot, "page.tsx"))) {
  check.add("Missing docs index at apps/website/src/app/(chromeless)/docs/api/errors/page.tsx");
}

check.ok(`${API_ERROR_CODES.length} codes served by dynamic route`);
