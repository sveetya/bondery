/** Shared dummy env for API integration tests (no .env file required). */

import { DEV_REDIS_URL } from "@bondery/schemas/constants/dev-ports";

export function loadTestEnv(): void {
  process.env.BONDERY_PUBLIC_API_URL ??= "http://localhost:26631";
  process.env.BONDERY_PUBLIC_WEBAPP_URL ??= "http://localhost:26632";
  process.env.BONDERY_PUBLIC_WEBSITE_URL ??= "http://localhost:26630";
  process.env.BONDERY_PRIVATE_EMAIL_HOST ??= "localhost";
  process.env.BONDERY_PRIVATE_EMAIL_USER ??= "dummy";
  process.env.BONDERY_PRIVATE_EMAIL_PASS ??= "dummy";
  process.env.BONDERY_PRIVATE_EMAIL_ADDRESS ??= "dummy@localhost";
  process.env.BONDERY_PRIVATE_EMAIL_PORT ??= "587";
  process.env.BONDERY_PRIVATE_BETTER_AUTH_SECRETS ??=
    "1:dummy-better-auth-secret-for-integration-tests-32";
  process.env.DATABASE_URL ??= "postgresql://dummy:dummy@127.0.0.1:5432/dummy";
  process.env.BONDERY_PRIVATE_REDIS_URL ??= DEV_REDIS_URL;
  process.env.BONDERY_PUBLIC_WEBAPP_OAUTH_CLIENT_ID ??= "test-webapp-oauth-client";
  process.env.BONDERY_PRIVATE_WEBAPP_OAUTH_CLIENT_SECRET ??=
    "test-webapp-oauth-client-secret-32chars-min";
  process.env.BONDERY_PUBLIC_OAUTH_CLIENT_ID ??= "test-extension-oauth-client";
  process.env.BONDERY_INFRA_CHROME_EXTENSION_ID ??= "abcdefghijklmnopqrstuvwxyzabcdef";
  process.env.BONDERY_PUBLIC_STORAGE_URL ??= "http://127.0.0.1:8333";
  process.env.BONDERY_PRIVATE_S3_ENDPOINT ??= "http://127.0.0.1:8333";
  process.env.BONDERY_PRIVATE_S3_REGION ??= "eu-central-1";
  process.env.BONDERY_PRIVATE_S3_ACCESS_KEY_ID ??= "bondery_access_key";
  process.env.BONDERY_PRIVATE_S3_SECRET_ACCESS_KEY ??= "bondery_secret_key_change_me";
}
