# CI parity and verification tiers

Authoritative PR gate: [`.github/workflows/verify.yml`](../../../../.github/workflows/verify.yml).  
Workflow map: [`.github/workflows/README.md`](../../../../.github/workflows/README.md).

There is **no** root `pnpm run verify` — mirror CI by running the steps below or pushing and watching Actions.

## Tiers

| Tier | When | Typical commands |
|------|------|------------------|
| **0 — Pre-commit** | Automatic on commit | Husky → lint-staged: Biome write on staged files; OpenAPI regen if API/schema paths staged; env example regen if manifest / `scripts/env.ts` staged |
| **1 — Fast local** | After each coherent edit | Changed-file `biome check`, workspace `check:types`, targeted `test:*` |
| **2 — PR parity** | Before opening PR | Full `verify.yml` command sequence (below) |
| **3 — Staging** | Matches `main` deploy gates | `stage-webapp.yml`, `stage-api.yml` subsets |
| **4 — Smoke / release** | Tags, release branch | `smoke-bondery-stack.yml`, `deploy-website.yml`, `release-*.yml` |

Tier 2 is the default "am I ready for PR?" target when risk is standard or high.

## `verify.yml` local mirror (ordered)

```bash
pnpm install --frozen-lockfile
pnpm exec biome ci .
pnpm run check:package-imports
pnpm run env -- --check
pnpm run check-docs
pnpm run check:openapi
# Docker required:
cp deploy/bondery/.env.example deploy/bondery/.env
docker compose -f deploy/bondery/docker-compose.yml config >/dev/null
node deploy/bondery/scripts/check-compose.mjs
pnpm --filter webapp run test:runtime-config
pnpm run check:contracts
pnpm run check:types
pnpm run check:i18n
pnpm run check:api-errors
pnpm run test:api:sync
```

## Staging workflows (not full verify)

**`stage-webapp.yml`** (on `main`, webapp paths):

- `pnpm --filter webapp run check:types`
- `pnpm --filter webapp run test:theme`, `test:sync`, `test:runtime-config`

**`stage-api.yml`** (on `main`, api paths):

- `pnpm run test:api:sync`

## Optional local checks (not in CI)

| Check | Command |
|-------|---------|
| Playwright E2E | `pnpm --filter webapp run test:e2e` |
| Mobile sync lint | `pnpm --filter mobile run check-sync-patterns` |
| Mobile unit sync | `pnpm --filter mobile run test:sync` |
| Extension patterns | `pnpm --filter chrome-extension run check:extension-patterns` |
| Helpers unit tests | `pnpm --filter @bondery/helpers test` |
| Webapp SSR smoke | `pnpm --filter webapp run smoke-ssr` |
| Full monorepo build | `pnpm run build` |
| Expo doctor | `pnpm exec expo-doctor` in `apps/mobile` |

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
