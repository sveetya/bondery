# CI parity and verification tiers

Authoritative PR gate: [`.github/workflows/verify.yml`](../../../../.github/workflows/verify.yml).  
Workflow map: [`.github/workflows/README.md`](../../../../.github/workflows/README.md).

There is **no** root `npm run verify` — mirror CI by running the steps below or pushing and watching Actions.

## Tiers

| Tier | When | Typical commands |
|------|------|------------------|
| **0 — Pre-commit** | Automatic on commit | Husky → lint-staged: Biome write on staged files; OpenAPI regen if API/schema paths staged; env example regen if manifest / `scripts/env.ts` staged |
| **1 — Fast local** | After each coherent edit | Changed-file `biome check`, workspace `check:types`, targeted `test:*` |
| **2 — PR parity** | Before opening PR | Full `verify.yml` command sequence (below) |
| **3 — Staging** | Matches `main` deploy gates | `stage-webapp.yml`, `stage-api.yml` subsets |
| **4 — Smoke / release** | Tags, release branch | `release-*.yml` (smoke-gated), `deploy-website.yml`, `smoke-bondery-stack.yml` (manual) |

Tier 2 is the default "am I ready for PR?" target when risk is standard or high.

## `verify.yml` local mirror (ordered)

```bash
npm ci
npx biome ci .
npm run check:package-imports
npm run env -- --check
npm run check-docs
npm run check:openapi
# Docker required:
cp deploy/bondery/.env.example deploy/bondery/.env
docker compose -f deploy/bondery/docker-compose.yml config >/dev/null
node deploy/bondery/scripts/check-compose.mjs
npm run test:runtime-config -w webapp
npm run check:contracts
npm run check:types
npm run check:i18n
npm run check:api-errors
npm run test:api:sync
```

## Staging workflows (not full verify)

**`stage-webapp.yml`** (on `main`, webapp paths):

- `npm run check:types -w webapp`
- `npm run test:theme -w webapp`, `test:sync`, `test:runtime-config`

**`stage-api.yml`** (on `main`, api paths):

- `npm run test:api:sync`

## Optional local checks (not in CI)

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
| Biome CI 2.5.0 vs local 2.5.3 | Rare formatter drift between local and Actions |
| `stage-api` without `test:auth` | Auth suite local-only until repaired |
| `verify` omits `test:theme` / `test:sync` for webapp | Stage-webapp covers; verify does not |

## Checklist

- [ ] Stated which tier was targeted (1–4)
- [ ] PR parity list compared to `verify.yml` when claiming CI alignment
- [ ] Postgres/Docker blockers called out if DB or compose steps skipped
- [ ] Non-CI checks run when diff warrants (mobile, e2e, extension, helpers)
