#!/usr/bin/env node
/**
 * Release smoke for deploy/bondery — pins a GHCR image tag and asserts health.
 *
 * Usage (from repo root):
 *   node deploy/bondery/scripts/smoke-release.mjs --service webapp --tag 1.7.5
 *   node deploy/bondery/scripts/smoke-release.mjs --service api --tag 1.7.5
 *
 * Prerequisites: docker compose v2.38+, dokploy-network, GHCR login when pulling private images.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BONDERY_DIR = resolve(__dirname, "..");

const SMOKE_DOMAINS = {
  BONDERY_INFRA_API_DOMAIN: "api.example-smoke.test",
  BONDERY_INFRA_STORAGE_DOMAIN: "storage.example-smoke.test",
  BONDERY_INFRA_WEBAPP_DOMAIN: "app.example-smoke.test",
  BONDERY_INFRA_WEBSITE_DOMAIN: "www.example-smoke.test",
};

/** Inventable OAuth values left empty in deploy/.env.example — required for api pre_start. */
const SMOKE_INVENTABLE_AUTH = {
  BONDERY_PUBLIC_OAUTH_CLIENT_ID: "fedcba0987654321fedcba0987654321",
};

/** Real SMTP from Infisical staging — overlay in CI; local smoke may use .env.example placeholders. */
const SMOKE_REMOTE_EMAIL_KEYS = [
  "BONDERY_PRIVATE_EMAIL_ADDRESS",
  "BONDERY_PRIVATE_EMAIL_HOST",
  "BONDERY_PRIVATE_EMAIL_PASS",
  "BONDERY_PRIVATE_EMAIL_PORT",
  "BONDERY_PRIVATE_EMAIL_USER",
];

const DEFAULT_IMAGES = {
  api: "ghcr.io/usebondery/api",
  webapp: "ghcr.io/usebondery/webapp",
};

function parseArgs() {
  const args = process.argv.slice(2);
  let service;
  let tag;
  let imageName;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--service") {
      service = args[++i];
    } else if (args[i] === "--tag") {
      tag = args[++i];
    } else if (args[i] === "--image") {
      imageName = args[++i];
    }
  }

  if (!service || !tag) {
    console.error(
      "Usage: smoke-release.mjs --service webapp|api --tag X.Y.Z [--image ghcr.io/usebondery/...]",
    );
    process.exit(1);
  }

  if (service !== "webapp" && service !== "api") {
    console.error(`Unknown service: ${service}`);
    process.exit(1);
  }

  return {
    imageName: imageName ?? DEFAULT_IMAGES[service],
    service,
    tag,
  };
}

function run(command, options = {}) {
  const result = spawnSync(command, {
    cwd: BONDERY_DIR,
    shell: true,
    stdio: "inherit",
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function parseEnvValue(raw) {
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value;
}

function formatEnvLine(key, value) {
  if (/[\s#="'\\]/.test(value)) {
    return `${key}="${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return `${key}=${value}`;
}

function readRemoteEmailEnv() {
  return Object.fromEntries(
    SMOKE_REMOTE_EMAIL_KEYS.filter((key) => process.env[key]?.trim()).map((key) => [
      key,
      process.env[key].trim(),
    ]),
  );
}

function assertSmokeEmailEnvInCi() {
  if (process.env.CI !== "true") {
    return;
  }

  const missing = SMOKE_REMOTE_EMAIL_KEYS.filter((key) => !process.env[key]?.trim());
  if (missing.length === 0) {
    return;
  }

  console.error(
    `Release smoke in CI requires Infisical staging email vars: ${missing.join(", ")}\n` +
      "Run ./.github/actions/shared/infisical-staging-secrets before smoke-release.mjs.",
  );
  process.exit(1);
}

function dumpComposeDiagnostics() {
  console.error("docker compose failed — collecting diagnostics");
  spawnSync("docker compose --env-file .env.smoke ps -a", {
    cwd: BONDERY_DIR,
    shell: true,
    stdio: "inherit",
  });
  spawnSync("docker compose --env-file .env.smoke logs --tail=120", {
    cwd: BONDERY_DIR,
    shell: true,
    stdio: "inherit",
  });
  console.error("Re-running release-migrate (api pre_start[0]) to capture output…");
  spawnSync(
    "docker compose --env-file .env.smoke run --rm api node apps/api/dist/cli/release-migrate.js",
    {
      cwd: BONDERY_DIR,
      shell: true,
      stdio: "inherit",
    },
  );
}

function runCompose(command) {
  const result = spawnSync(`docker compose --env-file .env.smoke ${command}`, {
    cwd: BONDERY_DIR,
    shell: true,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    dumpComposeDiagnostics();
    process.exit(result.status ?? 1);
  }
}

function curlOk(url) {
  const result = spawnSync(`curl -sf "${url}"`, { shell: true, stdio: "pipe" });
  return result.status === 0;
}

function waitFor(predicate, { attempts = 40, intervalSec = 3, label = "service" }) {
  for (let i = 1; i <= attempts; i++) {
    if (predicate()) {
      console.log(`${label} healthy`);
      return;
    }
    if (i === attempts) {
      console.error(`${label} did not become healthy after ${attempts} attempts`);
      run("docker compose --env-file .env.smoke ps");
      run("docker compose --env-file .env.smoke logs --tail=80");
      process.exit(1);
    }
    spawnSync(`sleep ${intervalSec}`, { shell: true });
  }
}

function prepareEnvSmoke() {
  assertSmokeEmailEnvInCi();
  const remoteEmail = readRemoteEmailEnv();

  copyFileSync(resolve(BONDERY_DIR, ".env.example"), resolve(BONDERY_DIR, ".env.smoke"));

  const lines = readFileSync(resolve(BONDERY_DIR, ".env.smoke"), "utf8").split("\n");
  const seen = new Set();
  const out = lines.map((line) => {
    if (!line || line.trimStart().startsWith("#") || !line.includes("=")) {
      return line;
    }
    const key = line.split("=")[0]?.trim();
    const rawValue = line.slice(line.indexOf("=") + 1);
    if (key && key in SMOKE_DOMAINS) {
      seen.add(key);
      return `${key}=${SMOKE_DOMAINS[key]}`;
    }
    if (key && key in remoteEmail) {
      seen.add(key);
      return formatEnvLine(key, remoteEmail[key]);
    }
    if (key && key in SMOKE_INVENTABLE_AUTH && !parseEnvValue(rawValue)) {
      seen.add(key);
      return `${key}=${SMOKE_INVENTABLE_AUTH[key]}`;
    }
    return line;
  });

  for (const [key, value] of Object.entries(SMOKE_DOMAINS)) {
    if (!seen.has(key)) {
      out.push(`${key}=${value}`);
    }
  }

  for (const [key, value] of Object.entries(SMOKE_INVENTABLE_AUTH)) {
    if (!seen.has(key)) {
      out.push(`${key}=${value}`);
    }
  }

  for (const key of SMOKE_REMOTE_EMAIL_KEYS) {
    if (key in remoteEmail && !seen.has(key)) {
      out.push(formatEnvLine(key, remoteEmail[key]));
    }
  }

  writeFileSync(resolve(BONDERY_DIR, ".env.smoke"), `${out.join("\n")}\n`);
  copyFileSync(resolve(BONDERY_DIR, ".env.smoke"), resolve(BONDERY_DIR, ".env"));
}

/** Pin compose image tags in smoke env (webapp smoke must not pull api:production). */
function applySmokeImageTags(service, tag) {
  const envPath = resolve(BONDERY_DIR, ".env.smoke");
  const lines = readFileSync(envPath, "utf8").split("\n");
  const imageTags =
    service === "webapp"
      ? {
          BONDERY_INFRA_API_IMAGE_TAG: tag,
          BONDERY_INFRA_WEBAPP_IMAGE_TAG: tag,
        }
      : { BONDERY_INFRA_API_IMAGE_TAG: tag };

  const seen = new Set();
  const out = lines.map((line) => {
    if (!line || line.trimStart().startsWith("#") || !line.includes("=")) {
      return line;
    }
    const key = line.split("=")[0]?.trim();
    if (key && key in imageTags) {
      seen.add(key);
      return `${key}=${imageTags[key]}`;
    }
    return line;
  });

  for (const [key, value] of Object.entries(imageTags)) {
    if (!seen.has(key)) {
      out.push(`${key}=${value}`);
    }
  }

  writeFileSync(envPath, `${out.join("\n")}\n`);
  copyFileSync(envPath, resolve(BONDERY_DIR, ".env"));
}

function writeOverride(service, imageName, tag) {
  const image = `${imageName}:${tag}`;
  let override = "services:\n";

  if (service === "webapp") {
    override += `  webapp:\n    image: ${image}\n    ports:\n      - "26632:26632"\n`;
    override += `  db:\n    ports:\n      - "54322:5432"\n`;
    override += `  seaweedfs-s3:\n    ports:\n      - "8333:8333"\n`;
  } else {
    override += `  api:\n    image: ${image}\n    ports:\n      - "26631:26631"\n`;
    override += `  db:\n    ports:\n      - "54322:5432"\n`;
    override += `  seaweedfs-s3:\n    ports:\n      - "8333:8333"\n`;
  }

  writeFileSync(resolve(BONDERY_DIR, "docker-compose.override.yml"), override);
}

function smokeWebapp() {
  runCompose("pull api webapp");
  runCompose("up -d webapp");

  waitFor(
    () =>
      curlOk("http://127.0.0.1:26632/health/live") && curlOk("http://127.0.0.1:26632/health/ready"),
    { attempts: 30, intervalSec: 2, label: "webapp" },
  );

  const body = spawnSync("curl -sf http://127.0.0.1:26632/runtime-config.json", {
    encoding: "utf8",
    shell: true,
  });
  if (body.status !== 0) {
    console.error("runtime-config.json request failed");
    process.exit(1);
  }
  if (!body.stdout.includes("api.example-smoke.test")) {
    console.error("runtime-config.json missing public API host");
    process.exit(1);
  }
  if (body.stdout.includes("api:26631")) {
    console.error("INTERNAL URL LEAKED into runtime-config.json");
    process.exit(1);
  }
}

function smokeApi() {
  runCompose("pull api");
  runCompose("up -d api");

  waitFor(
    () =>
      curlOk("http://127.0.0.1:26631/health/live") && curlOk("http://127.0.0.1:26631/health/ready"),
    { attempts: 45, intervalSec: 3, label: "api" },
  );
}

function tearDown() {
  run("docker compose --env-file .env.smoke down -v || true");
}

const { service, tag, imageName } = parseArgs();

try {
  prepareEnvSmoke();
  applySmokeImageTags(service, tag);
  writeOverride(service, imageName, tag);

  run("node scripts/check-compose.mjs");

  if (service === "webapp") {
    smokeWebapp();
  } else {
    smokeApi();
  }

  console.log(`Release smoke passed for ${service}:${tag}`);
} finally {
  tearDown();
}
