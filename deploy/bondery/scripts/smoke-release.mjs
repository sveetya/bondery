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
  copyFileSync(resolve(BONDERY_DIR, ".env.example"), resolve(BONDERY_DIR, ".env.smoke"));

  const lines = readFileSync(resolve(BONDERY_DIR, ".env.smoke"), "utf8").split("\n");
  const seen = new Set();
  const out = lines.map((line) => {
    if (!line || line.trimStart().startsWith("#") || !line.includes("=")) {
      return line;
    }
    const key = line.split("=")[0]?.trim();
    if (key && key in SMOKE_DOMAINS) {
      seen.add(key);
      return `${key}=${SMOKE_DOMAINS[key]}`;
    }
    return line;
  });

  for (const [key, value] of Object.entries(SMOKE_DOMAINS)) {
    if (!seen.has(key)) {
      out.push(`${key}=${value}`);
    }
  }

  writeFileSync(resolve(BONDERY_DIR, ".env.smoke"), `${out.join("\n")}\n`);
  copyFileSync(resolve(BONDERY_DIR, ".env.smoke"), resolve(BONDERY_DIR, ".env"));
}

function writeOverride(service, imageName, tag) {
  const image = `${imageName}:${tag}`;
  let override = "services:\n";

  if (service === "webapp") {
    override += `  webapp:\n    image: ${image}\n    ports:\n      - "26632:26632"\n`;
  } else {
    override += `  api:\n    image: ${image}\n    ports:\n      - "26631:26631"\n`;
    override += `  db:\n    ports:\n      - "54322:5432"\n`;
    override += `  seaweedfs-s3:\n    ports:\n      - "8333:8333"\n`;
  }

  writeFileSync(resolve(BONDERY_DIR, "docker-compose.override.yml"), override);
}

function smokeWebapp() {
  run("docker compose --env-file .env.smoke pull webapp");
  run("docker compose --env-file .env.smoke up -d redis webapp");

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
  run("docker compose --env-file .env.smoke pull api");
  run("docker compose --env-file .env.smoke up -d api");

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
