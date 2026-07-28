---
name: bondery-e2e-tests
description: >
  Bondery end-to-end testing — test pyramid, Playwright patterns for webapp,
  auth/OAuth setup, flaky-test strategies, and per-client test layout.
  Use when writing or debugging E2E tests, Playwright config, CI test jobs,
  test:e2e scripts, or planning test coverage for webapp, mobile, website, or API.
metadata:
  version: "1.0.0"
  namespace: bondery
---

# Bondery E2E Tests

## When to use

- Adding or changing Playwright specs in `apps/webapp/e2e/`
- Debugging flaky login, OAuth, or session tests
- Deciding unit vs integration vs E2E coverage for a feature
- Planning future test harnesses for mobile, website, chrome-extension, or API
- Writing CI workflows for browser tests

## Non-negotiables

- **Test pyramid:** unit and integration tests carry most coverage; E2E covers critical user paths only
- **Webapp E2E lives in** `apps/webapp/e2e/` with config at `e2e/playwright.config.mjs`
- **E2E URLs use `127.0.0.1`**, not `localhost` — ports `26631` (API) and `26632` (webapp)
- **Prefer `data-testid` locators** (`page.getByTestId(...)`) over brittle CSS selectors
- **No `waitForTimeout`** — wait for URL, response, or locator state
- **GitHub OAuth:** Playwright cannot reuse your daily browser session — use `test:e2e:auth-setup` for `storageState`
- **Workers = 1, fullyParallel = false** in webapp config — auth and port binding are serial today
- Do not add E2E tests for logic better covered by unit or API integration tests

## Test pyramid (Bondery)

| Layer | Where | What to test |
|-------|-------|--------------|
| Unit | `*.test.ts` next to source, package tests | Pure functions, Zod schemas, formatters |
| Integration | API route tests, DB tests, BFF handlers | Request/response contracts, auth middleware |
| E2E | `apps/webapp/e2e/*.spec.ts` (today) | Login, session, OAuth callback, critical flows |

See [references/test-pyramid.md](references/test-pyramid.md) for placement rules and anti-patterns.

## Current layout

```
apps/webapp/e2e/
├── playwright.config.mjs    # webServer, projects, ports
├── global-setup.mjs         # frees 26631/26632 unless E2E_REUSE_SERVER=1
├── auth.setup.ts            # manual GitHub login → .auth/user.json
├── login.unauth.spec.ts     # unauth project
├── login.github.spec.ts     # github-login project (full OAuth)
├── login.authenticated.spec.ts  # auth project (storageState)
└── oauth-callback.spec.ts   # oauth-callback project
```

Run commands (from repo root):

```bash
npm run test:e2e -w webapp                              # all projects
npm run test:e2e:auth-setup -w webapp -- --headed       # refresh .auth/user.json
E2E_REUSE_SERVER=1 npm run test:e2e -w webapp -- --project=unauth
```

Full workflow: [references/playwright-webapp.md](references/playwright-webapp.md).

## Decision tree

| Task | Read |
|------|------|
| Where tests belong (pyramid) | [references/test-pyramid.md](references/test-pyramid.md) |
| Webapp Playwright setup & projects | [references/playwright-webapp.md](references/playwright-webapp.md) |
| Per-client future layout | [references/per-client.md](references/per-client.md) |
| Flaky tests, quarantine, retries | [references/flaky-tests.md](references/flaky-tests.md) |
| CI, artifacts, reporters | [references/ci-artifacts.md](references/ci-artifacts.md) |

Full index: [references/README.md](references/README.md).

For API contract tests and route handlers, see `bondery-api`. For UI test IDs and error states, see `bondery-ux`.

## E2E checklist (before merge)

- [ ] Test targets a **critical user path** not already covered by unit/integration tests
- [ ] Locators use `data-testid` or role/name — no arbitrary CSS
- [ ] No `waitForTimeout`; waits are condition-based (URL, response, locator)
- [ ] Spec placed in correct Playwright **project** (`unauth`, `auth`, `github-login`, `oauth-callback`)
- [ ] OAuth/GitHub specs documented if they need manual `auth-setup` or env secrets
- [ ] `E2E_REUSE_SERVER=1` documented for local iteration against running `dev:webapp-api`
- [ ] New `data-testid` added to component if no stable locator exists
- [ ] Flaky test quarantined with `test.fixme` + issue link — not merged red
- [ ] CI job added or updated if introducing new project or env requirements
