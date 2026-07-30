# CI parity and verification tiers

Authoritative PR gate: [`.github/workflows/verify.yml`](../../../../.github/workflows/verify.yml).  
Workflow map: [`.github/workflows/README.md`](../../../../.github/workflows/README.md).

There is **no** root `npm run verify` — mirror CI by running the steps below or pushing and watching Actions.

## Tiers

| Tier | When | Typical commands |
|------|------|------------------|
| **0 — Pre-commit** | Automatic on commit | Husky → lint-staged: Biome write on staged files; OpenAPI regen if API/schema paths staged; env example regen if manifest / `scripts/env.ts` staged |
| **1 — Fast local** | After each coherent edit | Changed-file `biome check`, workspace `check-types`, targeted `test:*` |
| **2 — PR parity** | Before opening PR | Full `verify.yml` command sequence (below) |
| **3 — Staging** | Matches `main` deploy gates | `stage-webapp.yml`, `stage-api.yml` subsets |
| **4 — Smoke / release** | Tags, release branch | `smoke-bondery-stack.yml`, `deploy-website.yml`, `release-*.yml` |

Tier 2 is the default "am I ready for PR?" target when risk is standard or high.

## `verify.yml` local mirror (ordered)

Prerequisites for steps 11–12: Postgres on `127.0.0.1:54322` (or CI-equivalent), env vars from workflow comments.

```bash
npm ci
npx biome ci .
npm run check-dev-ports
npm run check-package-imports
npm run env -- --check
npm run check-doc-links
npm run check-doc-mdx-links
npm run check-openapi
# Docker required:
cp deploy/bondery/.env.example deploy/bondery/.env
docker compose -f deploy/bondery/docker-compose.yml config >/dev/null
node deploy/bondery/scripts/check-compose.mjs
npm run test:runtime-config -w webapp
npm run test:contracts
npm run check-types
npm run check-translations
npm run check-api-error-translations
npm run i18n:types:check
npm run i18n:status:check
node packages/translations/scripts/verify-i18next-hook-extraction.mjs
npm run i18n:lint
npm run check-error-docs
npm run check-user-facing-errors
npm run test:sync -w apps/api
# Postgres + OAuth env (see verify.yml L112–120):
npm run release-migrate -w @bondery/db
npm run test:api -w apps/api
npm run test:auth -w apps/api
```

## Staging workflows (not full verify)

**`stage-webapp.yml`** (on `main`, webapp paths):

- `npm run check-types -w webapp`
- `npm run test:theme -w webapp`, `test:sync`, `test:runtime-config`

**`stage-api.yml`** (on `main`, api paths):

- `npm run test:sync -w api`
- `npm run test:api -w api` (no Postgres service in workflow — narrower than verify)

## Not in CI (run locally when relevant)

| Check | Command |
|-------|---------|
| Playwright E2E | `npm run test:e2e -w webapp` |
| Mobile sync lint | `npm run check-sync-patterns -w mobile` |
| Mobile unit sync | `npm run test:sync -w mobile` |
| Extension patterns | `npm run check-extension-patterns -w chrome-extension` |
| Helpers unit tests | `npm test -w @bondery/helpers` |
| Webapp SSR smoke | `npm run smoke-ssr -w webapp` |
| Full monorepo build | `npm run build` |
| Expo doctor | `npx expo-doctor` in `apps/mobile` |

Document these as `SKIPPED` in PR parity reports unless the diff touches those areas — then run them and report results.

## Known repository gaps (do not treat as passing silently)

| Gap | Impact |
|-----|--------|
| Missing `check-schemas-imports:strict` npm script | Webapp `check-types` may fail until script is added |
| `transit` turbo task with no package script | Typecheck dependency ordering may be incomplete |
| Biome CI 2.5.0 vs local 2.5.3 | Rare formatter drift between local and Actions |
| `stage-api` without Postgres/`test:auth` | Staging gate narrower than verify |
| `verify` omits `test:theme` / `test:sync` for webapp | Stage-webapp covers; verify does not |

## Postgres setup for API integration tests

Match CI service image and env from `verify.yml`:

- Image: `postgis/postgis:17-3.5`
- `DATABASE_URL=postgresql://postgres:password@127.0.0.1:54322/bondery`
- OAuth test client env vars as in workflow L115–120

Without this, report `test:api` / `test:auth` as `BLOCKED`.

## Checklist

- [ ] Stated which tier was targeted (1–4)
- [ ] PR parity list compared to `verify.yml` when claiming CI alignment
- [ ] Postgres/Docker blockers called out if DB or compose steps skipped
- [ ] Non-CI checks run when diff warrants (mobile, e2e, extension, helpers)
