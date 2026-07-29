#!/usr/bin/env node
/**
 * Mechanical checks for deploy/bondery compose:
 * - webapp must never receive PRIVATE_* / BONDERY_PRIVATE_* secrets (except allowed PostHog)
 * - api and webapp must carry Traefik Host() rules and derive public URLs from domains
 * - redis must not carry Traefik labels or join dokploy-network
 * - db (Postgres) must not carry Traefik labels or join dokploy-network
 * - api must wait for db healthy (not legacy kong)
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mainPath = resolve(root, "docker-compose.yml");
const postgresPath = resolve(root, "docker-compose.postgres.yml");
const mainText = readFileSync(mainPath, "utf8");
const postgresText = readFileSync(postgresPath, "utf8");
const text = `${mainText}\n${postgresText}`;

const errors = [];

if (!/^\s*include:\s*$/m.test(mainText) || !mainText.includes("docker-compose.postgres.yml")) {
  errors.push("docker-compose.yml must include path: docker-compose.postgres.yml");
}

if (!mainText.includes("docker-compose.seaweedfs.yml")) {
  errors.push("docker-compose.yml must include path: docker-compose.seaweedfs.yml");
}

const seaweedPath = resolve(root, "docker-compose.seaweedfs.yml");
const seaweedText = readFileSync(seaweedPath, "utf8");

if (seaweedText.includes("s3.json:")) {
  errors.push(
    "seaweedfs-s3 must not mount static s3.json — credentials come from env via entrypoint.sh",
  );
}

if (!seaweedText.includes("entrypoint.sh")) {
  errors.push("seaweedfs-s3 must mount seaweedfs/entrypoint.sh");
}

if (!/BONDERY_PRIVATE_S3_ACCESS_KEY_ID/.test(seaweedText)) {
  errors.push("seaweedfs-s3 must pass BONDERY_PRIVATE_S3_ACCESS_KEY_ID from compose env");
}

if (mainText.includes("docker-compose.supabase.yml")) {
  errors.push("docker-compose.yml must not include docker-compose.supabase.yml");
}

/** Slice a top-level service block by name (YAML indentation-aware). */
function serviceBlock(name, source = text) {
  const start = source.search(new RegExp(`^  ${name}:\\s*$`, "m"));
  if (start === -1) {
    errors.push(`Missing service "${name}"`);
    return "";
  }
  const rest = source.slice(start + 1);
  const next = rest.search(/^ {2}[a-zA-Z0-9_-]+:\s*$/m);
  return next === -1 ? source.slice(start) : source.slice(start, start + 1 + next);
}

const webapp = serviceBlock("webapp", mainText);
const api = serviceBlock("api", mainText);
const redis = serviceBlock("redis", mainText);
const db = serviceBlock("db", postgresText);

const WEBAPP_ALLOWED_PRIVATE = new Set([
  "BONDERY_PRIVATE_POSTHOG_HOST",
  "BONDERY_PRIVATE_POSTHOG_KEY",
]);

if (webapp) {
  if (/^\s*env_file:/m.test(webapp)) {
    errors.push(
      "webapp must not use env_file (would load API PRIVATE_* / BONDERY_PRIVATE_* secrets)",
    );
  }
  const privateHits = [...webapp.matchAll(/\b(?:BONDERY_)?PRIVATE_[A-Z0-9_]+\b/g)]
    .map((m) => m[0])
    .filter((name) => !WEBAPP_ALLOWED_PRIVATE.has(name));
  if (privateHits.length > 0) {
    errors.push(
      `webapp must not reference PRIVATE_* / BONDERY_PRIVATE_* vars: ${[...new Set(privateHits)].join(", ")}`,
    );
  }
  if (webapp.includes("SUPABASE")) {
    errors.push("webapp must not reference Supabase env vars");
  }
  if (!webapp.includes("BONDERY_INFRA_WEBAPP_DOMAIN")) {
    errors.push("webapp must define a Traefik Host() rule using BONDERY_INFRA_WEBAPP_DOMAIN");
  }
  if (!/traefik\.enable=true/.test(webapp)) {
    errors.push("webapp must enable Traefik (traefik.enable=true)");
  }
  if (!webapp.includes("BONDERY_INFRA_INTERNAL_API_URL")) {
    errors.push("webapp must set BONDERY_INFRA_INTERNAL_API_URL for server-side API calls");
  }
  if (!/BONDERY_PUBLIC_API_URL:\s*https:\/\/\$\{BONDERY_INFRA_API_DOMAIN/.test(webapp)) {
    errors.push(
      "webapp must derive BONDERY_PUBLIC_API_URL from https:// + BONDERY_INFRA_API_DOMAIN",
    );
  }
}

if (api) {
  if (!api.includes("BONDERY_INFRA_API_DOMAIN")) {
    errors.push("api must define a Traefik Host() rule using BONDERY_INFRA_API_DOMAIN");
  }
  if (!/BONDERY_PUBLIC_API_URL:\s*https:\/\/\$\{BONDERY_INFRA_API_DOMAIN/.test(api)) {
    errors.push("api must derive BONDERY_PUBLIC_API_URL from https:// + BONDERY_INFRA_API_DOMAIN");
  }
  if (api.includes("SUPABASE")) {
    errors.push("api must not reference Supabase env vars");
  }
  if (!api.includes("DATABASE_URL:")) {
    errors.push("api must set DATABASE_URL for Prisma");
  }
  if (!/traefik\.enable=true/.test(api)) {
    errors.push("api must enable Traefik (traefik.enable=true)");
  }
  if (!/dokploy-network/.test(api) || !/internal/.test(api)) {
    errors.push("api must join both dokploy-network and internal");
  }
  if (!/db:\s*\n\s*condition:\s*service_healthy/.test(api)) {
    errors.push("api must depends_on db with condition: service_healthy");
  }
  if (/kong:\s*\n\s*condition:\s*service_healthy/.test(api)) {
    errors.push("api must not depends_on kong (Supabase stack removed)");
  }
}

if (redis) {
  if (/traefik\./.test(redis)) {
    errors.push("redis must not carry Traefik labels");
  }
  if (/dokploy-network/.test(redis)) {
    errors.push("redis must not join dokploy-network");
  }
  if (!/internal/.test(redis)) {
    errors.push("redis must join the private internal network");
  }
}

if (db) {
  if (/traefik\./.test(db)) {
    errors.push("db must not carry Traefik labels");
  }
  if (/dokploy-network/.test(db)) {
    errors.push("db must not join dokploy-network");
  }
  if (!/internal/.test(db)) {
    errors.push("db must join the private internal network");
  }
  if (!/healthcheck:/m.test(db)) {
    errors.push("db must define a healthcheck");
  }
}

if (errors.length > 0) {
  console.error("deploy/bondery compose checks failed:\n");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log("deploy/bondery compose checks passed");
