# Dokploy pins and env examples

Self-hosters and production should pin **`BONDERY_INFRA_VERSION`** (not floating `:production`) so api and webapp move together.

## Manifest pin

Run `pnpm run sync-version` on release prep — it updates `deployExample.value` on `BONDERY_INFRA_VERSION` in [`packages/helpers/src/env/manifest.ts`](../../../../packages/helpers/src/env/manifest.ts) and regenerates [`deploy/bondery/.env.example`](../../../../deploy/bondery/.env.example).

For the marketing website ops stack, set `opsExample.value` on:

- `BONDERY_INFRA_WEBSITE_IMAGE_TAG`

## Regenerate deploy examples

```bash
pnpm run sync-version
# or after manual manifest edit:
pnpm --filter @bondery/helpers run build
pnpm run env:examples
```

[`deploy/bondery/.env.example`](../../../../deploy/bondery/.env.example) includes:

```env
# BONDERY_INFRA_VERSION=X.Y.Z
```

[`deploy/ops/.env.example`](../../../../deploy/ops/.env.example) may include:

```env
# BONDERY_INFRA_WEBSITE_IMAGE_TAG=X.Y.Z
```

## Dokploy redeploy

| Stack | Compose path | Dokploy app |
|-------|--------------|-------------|
| Product (api + webapp) | `deploy/bondery` | Services webhook target |
| Marketing website | `deploy/ops` | Ops webhook target |

On Dokploy product Compose:

1. Set `BONDERY_INFRA_VERSION=X.Y.Z` in app env (pins both container images).
2. Save env and redeploy **api + webapp together**:

```bash
docker compose up -d api webapp
```

Do not roll back or upgrade api/webapp independently in production.

Website is a separate Dokploy app (`deploy/ops`). Omit `BONDERY_INFRA_WEBSITE_IMAGE_TAG` for floating `:production`, or pin for rollback.

## Record rollback version

Before changing pins, note the previous `BONDERY_INFRA_VERSION` in the PR or release notes. For website, note the previous `BONDERY_INFRA_WEBSITE_IMAGE_TAG` (or `:production`). See [rollback-hotfix.md](rollback-hotfix.md).

## Pins checklist

- [ ] `BONDERY_INFRA_VERSION` matches semver tags that passed CI smoke
- [ ] `pnpm run sync-version` (or `env:examples`) run after manifest edit
- [ ] `deploy/bondery/.env.example` committed
- [ ] Dokploy product env updated
- [ ] api + webapp redeployed together
