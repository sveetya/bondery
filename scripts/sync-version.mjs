#!/usr/bin/env node
/**
 * Propagate root package.json version to workspace packages and mobile native fields.
 * Regenerates env examples via env:sync.
 *
 *   pnpm run sync-version
 *   pnpm run sync-version -- --check   # dry-run; exit 1 on drift
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");

const PACKAGE_JSON_PATHS = [
  "package.json",
  "apps/api/package.json",
  "apps/webapp/package.json",
  "apps/chrome-extension/package.json",
  "apps/website/package.json",
  "apps/mobile/package.json",
  "packages/branding/package.json",
  "packages/db/package.json",
  "packages/emails/package.json",
  "packages/helpers/package.json",
  "packages/mantine-next/package.json",
  "packages/openapi-spec/package.json",
  "packages/schemas/package.json",
  "packages/translations/package.json",
  "packages/typescript-config/package.json",
  "packages/vcard/package.json",
];

function readRootVersion() {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const version = pkg.version?.trim();
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(`Invalid root package.json version: ${version ?? "(missing)"}`);
    process.exit(1);
  }
  return version;
}

function updatePackageJsonVersion(relPath, version) {
  const abs = join(root, relPath);
  const pkg = JSON.parse(readFileSync(abs, "utf8"));
  if (pkg.version === version) {
    return false;
  }
  if (!checkOnly) {
    pkg.version = version;
    writeFileSync(abs, `${JSON.stringify(pkg, null, 2)}\n`);
  }
  return true;
}

function updateMobileAppConfig(version) {
  const rel = "apps/mobile/app.config.ts";
  const abs = join(root, rel);
  const content = readFileSync(abs, "utf8");
  const pattern = /version:\s*"[^"]*"/;
  const next = `version: "${version}"`;
  if (!pattern.test(content)) {
    throw new Error(`Could not find expo version in ${rel}`);
  }
  const updated = content.replace(pattern, next);
  if (updated === content) {
    return false;
  }
  if (!checkOnly) {
    writeFileSync(abs, updated);
  }
  return true;
}

function updateAndroidVersionName(version) {
  const rel = "apps/mobile/android/app/build.gradle";
  const abs = join(root, rel);
  const content = readFileSync(abs, "utf8");
  const pattern = /versionName\s+"[^"]*"/;
  const next = `versionName "${version}"`;
  if (!pattern.test(content)) {
    throw new Error(`Could not find versionName in ${rel}`);
  }
  const updated = content.replace(pattern, next);
  if (updated === content) {
    return false;
  }
  if (!checkOnly) {
    writeFileSync(abs, updated);
  }
  return true;
}

function main() {
  const version = readRootVersion();
  const changes = [];

  for (const rel of PACKAGE_JSON_PATHS) {
    if (updatePackageJsonVersion(rel, version)) {
      changes.push(rel);
    }
  }
  if (updateMobileAppConfig(version)) {
    changes.push("apps/mobile/app.config.ts");
  }
  if (updateAndroidVersionName(version)) {
    changes.push("apps/mobile/android/app/build.gradle");
  }

  if (checkOnly) {
    if (changes.length > 0) {
      console.error("Version drift detected (run pnpm run sync-version):");
      for (const path of changes) {
        console.error(`  - ${path}`);
      }
      process.exit(1);
    }
    console.log(`All version targets match root ${version}`);
    return;
  }

  if (changes.length > 0) {
    console.log(`Synced version ${version} to:`);
    for (const path of changes) {
      console.log(`  - ${path}`);
    }
    execSync("pnpm run env:sync", { cwd: root, stdio: "inherit" });
  } else {
    console.log(`Version ${version} already synced across targets`);
  }
}

main();
