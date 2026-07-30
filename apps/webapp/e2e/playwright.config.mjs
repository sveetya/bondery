/**
 * Playwright E2E — webapp login / OAuth BFF
 *
 * ## Prerequisites
 *
 * - Playwright browser (once per machine): `npm run test:e2e:install -w webapp`
 * - WSL/Linux system libs (once, sudo): `npm run test:e2e:install-deps -w webapp`
 * - **Headed auth setup needs a display** (WSLg on Win11, VcXsrv + DISPLAY, or run from Windows).
 *   Headless specs (`unauth`, `oauth-callback`) do not need a display.
 * - API + webapp env files with GitHub OAuth and webapp OAuth client secrets (same as daily dev).
 * - Public URLs must match Playwright's host (default `127.0.0.1`, or set `E2E_PUBLIC_HOST=localhost`
 *   when reusing `dev:webapp-api` with localhost in `.env.development.local`).
 * - GitHub OAuth app callback: `http://127.0.0.1:26631/auth/callback/github`
 *   Run `npm run provision-oauth-clients:dev -w apps/api` after URL changes.
 *
 * ## Manual GitHub auth (storageState)
 *
 * Playwright cannot reuse your daily browser's GitHub session. Authenticate once in
 * Playwright's browser and save cookies to `e2e/.auth/user.json` (gitignored):
 *
 * ```bash
 * npm run test:e2e:auth-setup -w webapp
 * ```
 *
 * Re-run when sessions expire or after logout tests.
 *
 * ## Iteration workflow
 *
 * ```bash
 * # Terminal 1 — dev stack
 * npm run kill:dev && npm run dev:webapp-api
 *
 * # First time or expired auth
 * npm run test:e2e:auth-setup -w webapp
 *
 * # Debug full GitHub login (Inspector + optional pause)
 * E2E_REUSE_SERVER=1 npm run test:e2e:debug -w webapp -- login.github
 *
 * # Headed GitHub login regression
 * E2E_REUSE_SERVER=1 npm run test:e2e:github -w webapp -- --headed
 *
 * # Unauthenticated + OAuth callback specs (no GitHub)
 * E2E_REUSE_SERVER=1 npm run test:e2e -w webapp -- --project=unauth --project=oauth-callback
 * ```
 *
 * Set `E2E_REUSE_SERVER=1` to skip killing ports and reuse `dev:webapp-api` servers.
 * By default, orphaned listeners on 26631/26632 are cleared before tests start.
 * Set `E2E_PAUSE_GITHUB=1` to call `page.pause()` during the GitHub login spec.
 */

import { defineConfig, devices } from "@playwright/test";

const reuseExistingServer = process.env.E2E_REUSE_SERVER === "1";
const e2eHost = process.env.E2E_PUBLIC_HOST ?? "127.0.0.1";

const E2E_API_URL = `http://${e2eHost}:26631`;
const E2E_WEBAPP_URL = `http://${e2eHost}:26632`;
const MONOREPO_ROOT = "../../..";

const e2ePublicEnv = {
  BONDERY_PUBLIC_API_URL: E2E_API_URL,
  BONDERY_PUBLIC_WEBAPP_URL: E2E_WEBAPP_URL,
};

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  globalSetup: "./global-setup.mjs",
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      timeout: 300_000,
      use: {
        headless: false,
      },
    },
    {
      name: "github-login",
      testMatch: /login\.github\.spec\.ts/,
      timeout: 300_000,
      use: {
        screenshot: "only-on-failure",
        storageState: { cookies: [], origins: [] },
        video: "retain-on-failure",
      },
    },
    {
      dependencies: ["setup"],
      name: "auth",
      testMatch: /login\.authenticated\.spec\.ts/,
      use: {
        storageState: ".auth/user.json",
      },
    },
    {
      name: "unauth",
      testMatch: /login\.unauth\.spec\.ts/,
    },
    {
      name: "oauth-callback",
      testMatch: /oauth-callback\.spec\.ts/,
    },
  ],
  reporter: [["list"]],
  retries: process.env.CI ? 1 : 0,
  testDir: ".",
  tsconfig: "./tsconfig.json",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: E2E_WEBAPP_URL,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm run dev -w apps/api",
      cwd: MONOREPO_ROOT,
      env: e2ePublicEnv,
      reuseExistingServer,
      timeout: 180_000,
      url: `${E2E_API_URL}/health/live`,
    },
    {
      command: "npm run dev -w webapp",
      cwd: MONOREPO_ROOT,
      env: e2ePublicEnv,
      reuseExistingServer,
      timeout: 180_000,
      url: `${E2E_WEBAPP_URL}/api/health/live`,
    },
  ],
  workers: 1,
});
