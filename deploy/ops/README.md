# Bondery ops stack (marketing website)

**Bondery production only** — not part of the self-host product. Self-hosters use [`deploy/bondery`](../bondery/) (api + webapp + redis + Postgres + SeaweedFS).

Docs: [docs/contributing/dokploy.mdx](../../docs/contributing/dokploy.mdx)

## What this is

| Service | Image | Port | Notes |
|---------|-------|------|--------|
| `website` | `ghcr.io/usebondery/website:production` | 26630 | Floating CD channel; liveness `/health/live`, readiness `/health/ready` |

## Continuous deploy

1. Merge website/marketing changes to `main` (PRs run path-filtered `website-build` in [`.github/workflows/verify.yml`](../../.github/workflows/verify.yml) — pruned `turbo build --filter=website`, same recipe as Docker).
2. Promote: `git push origin main:release`.
3. [`.github/workflows/deploy-website.yml`](../../.github/workflows/deploy-website.yml) builds the Docker image and pushes `:production` + `:sha-<short>` (no separate host gate; release smoke validates the image).
4. Dokploy pulls `:production` (`pull_policy: always`) — configure a redeploy webhook (`BONDERY_OPS_DOKPLOY_WEBSITE_DEPLOY_WEBHOOK`) or redeploy manually. In Dokploy, set the Compose app branch to **`release`** (CI always sends `refs/heads/release` in the webhook payload, including manual workflow runs).

Host CI uses `node:latest`; the production image uses `node:22-alpine`. Release `smoke` is the Alpine/runtime fidelity check.

There are **no** `website-X.Y.Z` tags and **no** image-tag env var. Rollback by temporarily overriding the image to a known `:sha-<short>` or using Dokploy's previous deployment.

## Quick start (Dokploy)

| Setting | Value |
|---------|-------|
| Provider | **Docker Compose** |
| Compose path | `deploy/ops/docker-compose.yml` |
| Domain | `BONDERY_INFRA_WEBSITE_DOMAIN` (Traefik labels in compose) |

```bash
cd deploy/ops
cp .env.example .env
# Set BONDERY_INFRA_WEBAPP_DOMAIN + BONDERY_INFRA_WEBSITE_DOMAIN
docker compose up -d
```

Without Traefik (host port):

```bash
cp docker-compose.override.yml.example docker-compose.override.yml
docker compose up -d
curl -s http://localhost:26630/health/live
curl -s http://localhost:26630/health/ready
```

Policy lint:

```bash
node deploy/ops/scripts/check-compose.mjs
```

## Cutover from Nixpacks

1. Wait until `ghcr.io/usebondery/website:production` exists (first successful `deploy-website` run).
2. **Stop** the old Nixpacks/Railpack website Dokploy app (avoid Traefik `Host()` collision on `usebondery.com`).
3. Create this Compose app, set `.env` domains, deploy.
4. Smoke: `/health/live`, `/health/ready`, home page, blog.
5. Optionally set `BONDERY_OPS_DOKPLOY_WEBSITE_DEPLOY_WEBHOOK` for automatic redeploys after release pushes.

## Security

- Website receives only public URL env vars (no API secrets).
- Do not attach Redis or other product services to this stack.
