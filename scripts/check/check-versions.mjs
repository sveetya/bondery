#!/usr/bin/env node
import { execSync } from "node:child_process";
/**
 * CI guard: root package.json version must match all sync targets and deploy pin.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readRootVersion() {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  return pkg.version?.trim() ?? "";
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readPackageVersion(relPath) {
  const pkg = JSON.parse(readFileSync(join(root, relPath), "utf8"));
  return pkg.version?.trim() ?? "";
}

function readMobileAppConfigVersion() {
  const content = readFileSync(join(root, "apps/mobile/app.config.ts"), "utf8");
  const match = content.match(/version:\s*"([^"]+)"/);
  return match?.[1] ?? "";
}

function readAndroidVersionName() {
  const content = readFileSync(join(root, "apps/mobile/android/app/build.gradle"), "utf8");
  const match = content.match(/versionName\s+"([^"]+)"/);
  return match?.[1] ?? "";
}

function readDeployExampleVersion() {
  const examplePath = join(root, "deploy/bondery/.env.example");
  if (!existsSync(examplePath)) {
    return "";
  }
  const content = readFileSync(examplePath, "utf8");
  const uncommented = content.match(/^BONDERY_INFRA_VERSION=(\d+\.\d+\.\d+)/m);
  if (uncommented) {
    return uncommented[1];
  }
  const commented = content.match(/^# BONDERY_INFRA_VERSION=(\d+\.\d+\.\d+)/m);
  return commented?.[1] ?? "";
}

function assertNoLegacyImageTagEnv() {
  const files = ["deploy/bondery/.env.example", "packages/helpers/src/env/manifest.ts"];
  for (const rel of files) {
    const content = readFileSync(join(root, rel), "utf8");
    if (
      content.includes("BONDERY_INFRA_API_IMAGE_TAG") ||
      content.includes("BONDERY_INFRA_WEBAPP_IMAGE_TAG")
    ) {
      fail(`Legacy image tag env still present in ${rel}`);
    }
  }
}

function checkReleaseChangelog(version) {
  const changelogPath = join(root, `docs/changelog/releases/${version}.mdx`);
  const metaPath = join(root, "docs/changelog/releases/meta.json");
  // biome-ignore lint/suspicious/noUndeclaredEnvVars: GitHub Actions PR metadata only
  const branch = process.env.GITHUB_HEAD_REF ?? "";
  const isReleaseBranch = branch.startsWith("chore/release-");

  if (!existsSync(changelogPath)) {
    if (isReleaseBranch) {
      fail(`Release branch ${branch} requires docs/changelog/releases/${version}.mdx`);
    }
    return;
  }

  if (!existsSync(metaPath)) {
    if (isReleaseBranch) {
      fail(`Release branch ${branch} requires docs/changelog/releases/meta.json`);
    }
    return;
  }

  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  const pages = meta.pages ?? [];

  if (!pages.includes(version)) {
    fail(`docs/changelog/releases/meta.json must list ${version} in pages`);
  }

  if (pages[0] !== version) {
    fail(`docs/changelog/releases/meta.json must list ${version} first (newest first)`);
  }
}

const version = readRootVersion();
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  fail(`Invalid root package.json version: ${version}`);
}

const errors = [];

const packagePaths = [
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

for (const rel of packagePaths) {
  const v = readPackageVersion(rel);
  if (v !== version) {
    errors.push(`${rel}: ${v} (expected ${version})`);
  }
}

if (readMobileAppConfigVersion() !== version) {
  errors.push(`apps/mobile/app.config.ts: ${readMobileAppConfigVersion()}`);
}
if (readAndroidVersionName() !== version) {
  errors.push(`apps/mobile/android/app/build.gradle versionName: ${readAndroidVersionName()}`);
}

const deployExampleVersion = readDeployExampleVersion();
if (deployExampleVersion && deployExampleVersion !== version) {
  errors.push(`deploy/bondery/.env.example pin: ${deployExampleVersion}`);
}

assertNoLegacyImageTagEnv();

// Delegate package.json / mobile / manifest sync check
try {
  execSync("node scripts/pkg/sync-version.mjs --check", { cwd: root, stdio: "pipe" });
} catch {
  errors.push("sync-version --check failed (see sync-version output)");
}

checkReleaseChangelog(version);

if (errors.length > 0) {
  console.error(`Version mismatch against root ${version}:`);
  for (const line of errors) {
    console.error(`  - ${line}`);
  }
  console.error("Run: pnpm run sync-version");
  process.exit(1);
}

console.log(`Version check passed (${version})`);
