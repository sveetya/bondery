# Bondery stack (webapp + API + Redis + Postgres + SeaweedFS)

Canonical Docker Compose distribution for **self-hosters** and **Bondery production** (Dokploy).

The marketing website is **not** in this stack — see [`deploy/ops`](../ops/) (Bondery production only). This folder still uses `BONDERY_INFRA_WEBSITE_DOMAIN` so api/webapp can derive `BONDERY_PUBLIC_WEBSITE_URL`.

Local development:

- Redis: **`deploy/bondery/docker-compose.dev-redis.yml`** (`pnpm run start:redis`, port 26636)
- Postgres: **`deploy/bondery/docker-compose.dev-db.yml`** or `packages/db` migrations — not this Compose file

Docs: [docs/deploy/get-started.mdx](../../docs/deploy/get-started.mdx) · [docs/contributing/dokploy.mdx](../../docs/contributing/dokploy.mdx) · [docs/contributing/api-container.mdx](../../docs/contributing/api-container.mdx)

## Quick start

```bash
# One-time: shared Traefik network (Dokploy creates this; self-hosters create it once)
docker network create dokploy-network

cd deploy/bondery
cp .env.example .env
# Fill domains + secrets (see docs/deploy/get-started.mdx)
docker compose up -d
```

`deploy/bondery/.env.example` is **generated** from [`packages/helpers/src/env/manifest.ts`](../../packages/helpers/src/env/manifest.ts) (`deployExample` metadata). After changing deploy env vars in the manifest, run `pnpm run env -- --write-examples`.

Requires Docker Compose **v2.38+** (`pre_start` on `api`). First boot applies migrations, OAuth provisioning, and SeaweedFS buckets automatically via `api` init containers — no manual steps.

Without Traefik (host ports):

```bash
cp docker-compose.override.yml.example docker-compose.override.yml
docker compose up -d
curl -s http://localhost:26631/health/live
curl -s http://localhost:26632/health/live
```

### Services

| Service | Image | Port | Notes |
|---------|-------|------|--------|
| `webapp` | `ghcr.io/usebondery/webapp` | 26632 | Liveness `/health/live` |
| `api` | `ghcr.io/usebondery/api` | 26631 | Better Auth + Prisma; waits for Redis + Postgres + SeaweedFS |
| `redis` | `redis:8.10` | internal | AOF + volume `redis-data` |
| `db` | `postgis/postgis:17-3.5` | internal | Named volume `postgres-data` |
| `seaweedfs-*` | SeaweedFS | 8333 (Traefik) | S3 creds from `.env` → rendered at startup (`seaweedfs/entrypoint.sh`) |

Compose entrypoint: **`docker-compose.yml`** includes **`docker-compose.postgres.yml`** and **`docker-compose.seaweedfs.yml`**. Dokploy points at this path only.

### Networking

- `webapp` + `api` join external `dokploy-network` (Traefik).
- Postgres, Redis, and SeaweedFS join private `internal` only.
- Set hostnames (`BONDERY_INFRA_*_DOMAIN`); Compose derives `https://…` URLs.
- Webapp SSR uses `BONDERY_INFRA_INTERNAL_API_URL=http://api:26631`.

### Upgrades / rollback

```bash
# Upgrade only webapp (API + Redis + Postgres stay up)
BONDERY_INFRA_WEBAPP_IMAGE_TAG=1.7.3 docker compose up -d --no-deps webapp

# Upgrade only API (re-runs api pre_start when image changes)
BONDERY_INFRA_API_IMAGE_TAG=1.7.3 docker compose up -d --no-deps api
```

Schema migrations run automatically via `api` `pre_start` on deploy — no separate `db:migrate:deploy` step for Compose deployments.

### CI redeploy webhook (Bondery production)

After `api-*.*.*` / `webapp-*.*.*` release tags: GitHub Actions builds the semver image, runs compose smoke against that tag, promotes `:production` only on success, then calls `BONDERY_OPS_DOKPLOY_SERVICES_DEPLOY_WEBHOOK` (repository **variable**) with `refs/heads/release`. Configure the Dokploy Compose app branch to **`release`**. See [dokploy.mdx](../../docs/contributing/dokploy.mdx).

### Release smoke (local)

Reproduce the CI release smoke against a pulled GHCR tag:

```bash
docker network create dokploy-network || true
# docker login ghcr.io  # when pulling private images
node deploy/bondery/scripts/smoke-release.mjs --service webapp --tag 1.7.5
node deploy/bondery/scripts/smoke-release.mjs --service api --tag 1.7.5
```

### Image tags (api / webapp)

- **`production` (default):** floating channel (`pull_policy: always`).
- **Semver:** pin for frozen rollback.

## Advanced: external Redis

1. Do **not** start this compose Redis (or omit compose entirely).
2. Run `ghcr.io/usebondery/api:<semver>` alone with your secrets.
3. Set `BONDERY_PRIVATE_REDIS_URL` to your managed Redis (`rediss://…` when TLS is required).

## Security

- Never expose Redis or Postgres to the public internet.
- API secrets (`BONDERY_PRIVATE_*`) load only into the `api` service (`env_file`). Webapp receives an explicit allowlist.

## Resource limits (recommended)

On a **8 GB VPS** (recommended self-host profile), add `deploy.resources` to cap noisy neighbors. Tune for your host — these are starting points, not guarantees under Docker Compose without Swarm:

```yaml
# Example overrides — merge into docker-compose.override.yml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G
        reservations:
          memory: 512M
  webapp:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1G
  db:
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 3G
        reservations:
          memory: 1G
  redis:
    deploy:
      resources:
        limits:
          memory: 256M
```

SeaweedFS (`seaweedfs-*`) is I/O-heavy — allow 512M–1G per component on storage-heavy installs.

Requires Docker Compose **v2.38+** (`api` `pre_start`). CI enforces this via `node deploy/bondery/scripts/check-compose.mjs`.
