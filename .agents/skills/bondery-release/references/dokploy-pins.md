# Dokploy pins and env examples

Self-hosters and production should run **pinned semver image tags** for api/webapp, not floating `:production`.

## Manifest pins

Edit [`packages/helpers/src/env/manifest.ts`](../../../../packages/helpers/src/env/manifest.ts) — set `deployExample.value` on:

- `BONDERY_INFRA_API_IMAGE_TAG`
- `BONDERY_INFRA_WEBAPP_IMAGE_TAG`

If only one service changed in the release, bump only that pin; leave the other at the last tested compatible version.

**Do not** pin a website image tag — marketing uses floating `:production` on the ops stack.

## Regenerate deploy examples

```bash
pnpm run build -w @bondery/helpers
pnpm run env -- --write-examples
```

[`deploy/bondery/.env.example`](../../../../deploy/bondery/.env.example) will include commented pins:

```env
# BONDERY_INFRA_API_IMAGE_TAG=X.Y.Z
# BONDERY_INFRA_WEBAPP_IMAGE_TAG=X.Y.Z
```

Uncomment or set values to match manifest. Commit manifest + regenerated example on `main`, then promote to `release` if pins changed after the release push.

## Dokploy redeploy

| Stack | Compose path | Dokploy app |
|-------|--------------|-------------|
| Product (api + webapp) | `deploy/bondery` | Services webhook target |
| Marketing website | `deploy/ops` | Ops webhook target |

On Dokploy product Compose:

1. Set the same `BONDERY_INFRA_*_IMAGE_TAG` values in app env.
2. Redeploy **only the changed service** when possible:

```bash
docker compose up -d --no-deps webapp
# or
docker compose up -d --no-deps api
```

Website is a separate Dokploy app (`deploy/ops`).

## Record rollback pair

Before changing pins, note the previous `(BONDERY_INFRA_API_IMAGE_TAG, BONDERY_INFRA_WEBAPP_IMAGE_TAG)` pair in the PR or release notes. See [rollback-hotfix.md](rollback-hotfix.md).

## Pins checklist

- [ ] Pins match the semver tags that passed CI smoke
- [ ] `pnpm run env -- --write-examples` run after manifest edit
- [ ] `deploy/bondery/.env.example` committed
- [ ] Dokploy product env updated
- [ ] Only changed service(s) redeployed when possible
