# Change path → verification commands

Map changed paths to workspaces, then run the **minimum** command set for that change. Expand to consumer workspaces when shared packages change.

**Workspace flags:** use each workspace's `package.json` `name` — `-w api`, `-w webapp`, `-w mobile`, `-w website`, `-w chrome-extension`, `-w @bondery/db`, `-w @bondery/schemas`, `-w @bondery/translations`. Do not use directory paths like `-w apps/api`. Match `verify.yml` when in doubt.

## Fast path (almost always)

```bash
git diff --check
git status --short
npx biome check --no-errors-on-unmatched --files-ignore-unknown=true <changed-files>
```

For PR parity on format/lint across the repo:

```bash
npx biome ci .
```

## Root gates (run when path matches)

| Changed paths | Commands |
|---------------|----------|
| Any TS/JS across monorepo | `npm run check-types` (or scoped `-w` only if change is isolated) |
| Package import patterns | `npm run check-package-imports` |
| `packages/helpers/src/env/**`, `.env.example`, turbo env | `npm run env -- --check` |
| `docs/**` (non-website) | `npm run check-docs` |
| `apps/website/**` MDX/docs | `npm run check-docs` |
| `apps/api/**` routes/schemas, `packages/schemas/**` | `npm run check-openapi`, `npm run check-contracts` |
| `packages/translations/**`, locale JSON, UI strings | `npm run check-i18n` |
| API error catalog/docs | `npm run check-api-errors` |
| `deploy/bondery/**` | `docker compose -f deploy/bondery/docker-compose.yml config`, `node deploy/bondery/scripts/check-compose.mjs` |

## `packages/schemas` (`@bondery/schemas`)

| Trigger | Commands |
|---------|----------|
| Any change | `npm run check-contracts`, `npm run check-types -w @bondery/schemas` |
| Public export surface | `npm run sync-exports` (review diff), `npm run build -w @bondery/schemas` |
| Consumers | `npm run check-types -w api`, `npm run check-types -w webapp`, `npm run check-types -w mobile` as applicable |

## `packages/helpers` (`@bondery/helpers`)

| Trigger | Commands |
|---------|----------|
| Any change | `npm run check-types -w @bondery/helpers`, `npm test -w @bondery/helpers` |
| Env manifest | `npm run env -- --check` |

## `packages/db` (`@bondery/db`)

| Trigger | Commands |
|---------|----------|
| Prisma schema/migrations | `npm run check-types -w @bondery/db`, `npm run db:generate -w @bondery/db` |
| Release/CI parity | `npm run release-migrate -w @bondery/db` (requires Postgres — see `ci-parity.md`) |
| After migration | `npm run test:auth -w api` when auth behavior depends on schema |

## `packages/translations` (`@bondery/translations`)

| Trigger | Commands |
|---------|----------|
| Locale files | Full translation block from `verify.yml` (see root table above) |
| Manifest / codegen | `npm run build -w @bondery/translations`, `npm run check-i18n-types` |

## `apps/api` (`api`)

| Trigger | Commands |
|---------|----------|
| Any TS change | `npm run check-types -w api` |
| Routes/OpenAPI | `npm run check-openapi-spec -w api` or root `npm run check-openapi` |
| Sync/Redis | `npm run test:sync -w api` |
| Auth/OAuth | `npm run test:auth -w api` (Postgres + migrate first) |
| Security-sensitive | `bondery-security` verification commands |

Policy scripts run inside `check-types` — see `apps/api/package.json`.

## `packages/emails` (`@bondery/emails`)

| Trigger | Commands |
|---------|----------|
| Template change | `npm run compile --workspace=@bondery/emails` |
| Preview (manual) | `npm run preview --workspace=@bondery/emails` |

When `apps/api/src/services/notifications/**` or `apps/api/src/lib/notifications/**` change, also run API typecheck. See [bondery-emails](../../bondery-emails/SKILL.md).

## `apps/webapp` (`webapp`)

| Trigger | Commands |
|---------|----------|
| Any TS/TSX | `npm run check-types -w webapp` |
| Theme | `npm run test:theme -w webapp` |
| Sync client | `npm run test:sync -w webapp` |
| Runtime config | `npm run test:runtime-config -w webapp` |
| Login/OAuth flows | `npm run test:e2e -w webapp` (local; see `bondery-e2e-tests`) |
| Production build confidence | `npm run build -w webapp`, optional `npm run smoke-ssr -w webapp` |

## `apps/website` (`website`)

| Trigger | Commands |
|---------|----------|
| Any change | `npm run check-types -w website` |
| MDX/docs content | `npm run check-docs` |
| Release build | `npx turbo build --filter=website^...`, `npm run build -w website` |

## `apps/mobile` (`mobile`)

| Trigger | Commands |
|---------|----------|
| Any TS/TSX | `npm run check-types -w mobile` |
| Tier-1 sync (`lib/sync`, `lib/domains`, repositories) | `npm run check-sync-patterns -w mobile` |
| Sync behavior | `npm run test:sync -w mobile` |
| Forms | `npm run audit:forms -w mobile` |
| Expo health (manual) | `npx expo-doctor` in `apps/mobile` |

Not in CI today — run locally when mobile changes.

## `apps/chrome-extension` (`chrome-extension`)

| Trigger | Commands |
|---------|----------|
| Any change | `npm run check-types -w chrome-extension` |
| Architecture/security patterns | `npm run check-extension-patterns -w chrome-extension` |
| Manifest/permissions/packaging | `npm run build -w chrome-extension` |

## Shared package consumers

When `packages/schemas`, `packages/helpers`, or `packages/translations` change, typecheck **downstream** workspaces that import them:

```bash
npm run check-types -w api
npm run check-types -w webapp
npm run check-types -w mobile
npm run check-types -w chrome-extension
npm run check-types -w website
```

Use Turbo filter when only one consumer is affected: `npm run check-types -- --filter=webapp...`

## Build commands (when output/bundle matters)

| Workspace | Command |
|-----------|---------|
| Full monorepo (high risk / release) | `npm run build` |
| API only | `npm run build:api` |
| Webapp only | `npm run build:webapp` |
| Website only | `npm run build:website` |
| Extension only | `npm run build:chrome-extension` |
| Shared packages | `npm run compile:packages` or `npm run build -w @bondery/schemas` |

## Checklist

- [ ] Every touched workspace has `check-types` (or documented why not)
- [ ] Shared-package changes include consumer typechecks
- [ ] High-risk boundaries (OpenAPI, i18n, migrations, auth) have matching gates
- [ ] Mutating generators noted and diffs reviewed
