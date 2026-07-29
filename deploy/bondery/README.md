# Bondery stack (webapp + API + Redis + Postgres + SeaweedFS)

Canonical Docker Compose distribution for **self-hosters** and **Bondery production** (Dokploy).

The marketing website is **not** in this stack — see [`deploy/ops`](../ops/) (Bondery production only). This folder still uses `BONDERY_INFRA_WEBSITE_DOMAIN` so api/webapp can derive `BONDERY_PUBLIC_WEBSITE_URL`.

Local development:

- Redis: **[`apps/redis`](../../apps/redis/)** (`npm run start -w redis`, port 26636)
- Postgres: **`deploy/bondery/docker-compose.dev-db.yml`** or `packages/db` migrations — not this Compose file

Docs: [docs/deploy/self-host.md](../../docs/deploy/self-host.md) · [docs/deploy/dokploy.md](../../docs/deploy/dokploy.md) · [docs/deploy/api-container.md](../../docs/deploy/api-container.md)

## Quick start

```bash
# One-time: shared Traefik network (Dokploy creates this; self-hosters create it once)
docker network create dokploy-network

cd deploy/bondery
cp .env.example .env
# Fill domains + secrets (see docs/deploy/self-host.md)
docker compose up -d

# First boot only — empty database
npm run db:migrate:deploy -w @bondery/db
cd apps/api && npx tsx --env-file=.env.development.local scripts/provision-oauth-clients.ts
```

Without Traefik (host ports):

```bash
cp docker-compose.override.yml.example docker-compose.override.yml
docker compose up -d
curl -s http://localhost:26631/status
curl -s http://localhost:26632/api/live
```

### Services

| Service | Image | Port | Notes |
|---------|-------|------|--------|
| `webapp` | `ghcr.io/usebondery/webapp` | 26632 | Liveness `/api/live` |
| `api` | `ghcr.io/usebondery/api` | 26631 | Better Auth + Prisma; waits for Redis + Postgres + SeaweedFS |
| `redis` | `redis:7.4-alpine` | internal | AOF + volume `redis-data` |
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

# Upgrade only API
BONDERY_INFRA_API_IMAGE_TAG=1.7.3 docker compose up -d --no-deps api
```

After releasing schema migrations, run `npm run db:migrate:deploy -w @bondery/db` against production Postgres (see [self-host.md](../../docs/deploy/self-host.md)).

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
