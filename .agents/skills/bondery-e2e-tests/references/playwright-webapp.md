# Playwright — webapp

Grounded in `apps/webapp/e2e/`. Read `playwright.config.mjs` header comments for the canonical local workflow.

## Prerequisites

- API + webapp env files with GitHub OAuth secrets (same as daily dev)
- Public URLs aligned to **127.0.0.1** (not `localhost`):
  - `BONDERY_PUBLIC_API_URL=http://127.0.0.1:26631`
  - `BONDERY_PUBLIC_WEBAPP_URL=http://127.0.0.1:26632`
- GitHub OAuth app callback: `http://127.0.0.1:26631/auth/callback/github`
- Run `pnpm run provision:oauth-clients` after URL changes

## Config highlights

| Setting | Value | Why |
|---------|-------|-----|
| `testDir` | `.` (e2e folder) | Specs colocated with config |
| `globalSetup` | `global-setup.mjs` | Frees ports 26631/26632 before webServer |
| `fullyParallel` | `false` | Serial auth + shared ports |
| `workers` | `1` | Same |
| `retries` | `1` in CI, `0` locally | CI flake tolerance |
| `webServer` | API + webapp dev servers | Health checks on `/health/live` (API) and `/api/health/live` (BFF) |
| `E2E_REUSE_SERVER` | Skip port kill + reuse running stack | Faster local iteration |

## Projects

| Project | Specs | Auth |
|---------|-------|------|
| `setup` | `auth.setup.ts` | Manual GitHub login → `.auth/user.json` |
| `github-login` | `login.github.spec.ts` | Fresh context; full OAuth flow |
| `auth` | `login.authenticated.spec.ts` | `storageState: .auth/user.json` |
| `unauth` | `login.unauth.spec.ts` | Empty storage |
| `oauth-callback` | `oauth-callback.spec.ts` | Empty storage |

`auth` project depends on `setup` — run auth-setup first or CI must produce `.auth/user.json`.

## Commands

```bash
# Terminal 1 — dev stack
pnpm run kill:dev && pnpm run dev:webapp-api

# First time or expired session
pnpm run test:e2e:auth-setup -w webapp -- --headed

# Unauthenticated specs (no GitHub)
E2E_REUSE_SERVER=1 pnpm run test:e2e -w webapp -- --project=unauth --project=oauth-callback

# Full GitHub login regression (headed)
E2E_REUSE_SERVER=1 pnpm run test:e2e:github -w webapp -- --headed

# Inspector debug
E2E_REUSE_SERVER=1 pnpm run test:e2e:debug -w webapp -- login.github
```

Set `E2E_PAUSE_GITHUB=1` to call `page.pause()` during the GitHub login spec.

## Locators

Existing test IDs:

- `login-github` — GitHub sign-in button on `/login`

Prefer adding `data-testid` to components over CSS selectors. Use `getByRole` for accessible buttons (e.g. sign out).

## Auth storage

- `.auth/user.json` is gitignored — produced by `auth.setup.ts`
- Session cookie name: `bondery_webapp_session`
- Re-run auth-setup when sessions expire or after logout E2E tests

## Adding a new spec

1. Choose the correct **project** in `playwright.config.mjs` (or add a new project if auth mode differs)
2. Create `feature-name.spec.ts` in `apps/webapp/e2e/`
3. Use `baseURL` from config — paths are relative (`/login`, `/app/home`)
4. For authenticated flows, depend on `setup` project or use `storageState`

## Page Object Model (optional)

For multi-step flows with many locators, extract a small POM class per feature area. Keep POMs in `apps/webapp/e2e/pages/` when introduced — not required for current login specs.

## Webapp Playwright checklist

- [ ] Spec in correct project (auth mode matches)
- [ ] Uses `getByTestId` or `getByRole` — no fragile CSS
- [ ] Waits on URL/locator, not fixed timeouts
- [ ] OAuth specs document manual auth-setup requirement
- [ ] `E2E_REUSE_SERVER=1` noted in PR if only unauth specs changed
