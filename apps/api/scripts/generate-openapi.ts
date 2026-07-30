/**
 * Generates openapi.yaml from the running Fastify server's Zod schemas.
 *
 * Usage: npx tsx scripts/generate-openapi.ts
 *
 * The generated file is consumed by GitBook via .gitbook.yaml.
 */

// Provide dummy values for required env vars so @fastify/env validation passes
// without needing a local .env file. None of these are used during spec generation.
process.env.BONDERY_PUBLIC_API_URL ??= "http://localhost:26631";
process.env.BONDERY_PUBLIC_WEBAPP_URL ??= "http://localhost:26632";
process.env.BONDERY_PUBLIC_STORAGE_URL ??= "http://127.0.0.1:8333";
process.env.BONDERY_PRIVATE_S3_ENDPOINT ??= "http://127.0.0.1:8333";
process.env.BONDERY_PRIVATE_S3_REGION ??= "eu-central-1";
process.env.BONDERY_PRIVATE_S3_ACCESS_KEY_ID ??= "bondery_access_key";
process.env.BONDERY_PRIVATE_S3_SECRET_ACCESS_KEY ??= "bondery_secret_key_change_me";
process.env.BONDERY_PRIVATE_EMAIL_HOST ??= "localhost";
process.env.BONDERY_PRIVATE_EMAIL_USER ??= "dummy";
process.env.BONDERY_PRIVATE_EMAIL_PASS ??= "dummy";
process.env.BONDERY_PRIVATE_EMAIL_ADDRESS ??= "dummy@localhost";
process.env.BONDERY_PRIVATE_EMAIL_PORT ??= "587";
process.env.BONDERY_PRIVATE_STRIPE_WEBHOOK_SECRET ??= "dummy";
process.env.BONDERY_PRIVATE_BETTER_AUTH_SECRETS ??=
  "1:dummy-better-auth-secret-for-openapi-generation-32";
process.env.BONDERY_PRIVATE_REDIS_URL ??= "redis://127.0.0.1:26636";
process.env.DATABASE_URL ??= "postgresql://dummy:dummy@127.0.0.1:5432/dummy";

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";
import { patchOpenApiErrorSchemas } from "./patch-openapi-error-schemas.js";
import { patchOpenApiRequestExamples } from "./patch-openapi-request-examples.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const { buildApp } = await import("../src/build-app.js");
  const server = await buildApp();
  await server.ready();

  const spec = server.swagger();
  patchOpenApiErrorSchemas(spec);
  patchOpenApiRequestExamples(spec);
  const yamlContent = stringify(spec, { lineWidth: 120 });

  const outputPath = resolve(__dirname, "..", "openapi.yaml");
  writeFileSync(outputPath, yamlContent, "utf-8");

  console.log(`OpenAPI spec written to ${outputPath}`);
  // Exit before Better Auth OAuth resource seeding races against server.close()
  // when DATABASE_URL points at a dummy host during spec generation.
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to generate OpenAPI spec:", err);
  process.exit(1);
});
