# Self-host Bondery

Run the full product stack on your own VPS: **api + webapp + redis + Postgres + SeaweedFS** via a single Compose entrypoint.

Docs: [dokploy.md](./dokploy.md) · [deploy/bondery/README.md](../../deploy/bondery)

## Requirements

| Profile | RAM | CPU | Disk |
|---------|-----|-----|------|
| Floor | 4–6 GB | 2 cores | 40 GB SSD |
| **Recommended** | **8 GB** | 4 cores | 80 GB SSD |
| Comfortable prod | 12–16 GB | 4 cores | 100 GB+ SSD |

Also needed: Docker + Compose v2, a domain with DNS for api / app / storage (and optional website), Traefik (Dokploy) or host-port override.

## Layout

```
deploy/bondery/
  docker-compose.yml              # Dokploy entrypoint (postgres + seaweedfs + api/webapp/redis)
  docker-compose.postgres.yml     # PostGIS
  docker-compose.seaweedfs.yml    # Object storage
  .env.example
```

Dokploy and CLI both use **`deploy/bondery/docker-compose.yml`** — no wrapper scripts.

## Quick start (greenfield)

```bash
docker network create dokploy-network   # once

cd deploy/bondery
cp .env.example .env
# Fill domains, generate secrets (see below), OAuth client IDs

docker compose up -d

# Publish Postgres for migrations (host-port mode) if not using Traefik-only:
cp docker-compose.override.yml.example docker-compose.override.yml
docker compose up -d db

# From repo root — apply Prisma migrations
DATABASE_URL="postgresql://postgres:$BONDERY_PRIVATE_POSTGRES_PASSWORD@127.0.0.1:54322/bondery" \
  npm run db:migrate:deploy -w @bondery/db

# Provision OAuth clients (webapp BFF + chrome extension)
cd apps/api && npx tsx --env-file=../../deploy/bondery/.env scripts/provision-oauth-clients.ts
```

Without Traefik (laptop / smoke):

```bash
cp docker-compose.override.yml.example docker-compose.override.yml
docker compose up -d
curl -sf http://localhost:26631/status
curl -sf http://localhost:26632/api/live
```

## Secrets

Operators use **`BONDERY_*` only**. See [`deploy/bondery/.env.example`](../../deploy/bondery/.env.example).

| Operator var | Purpose |
|--------------|---------|
| `BONDERY_PRIVATE_POSTGRES_PASSWORD` | Postgres password |
| `BONDERY_PRIVATE_BETTER_AUTH_SECRETS` | Better Auth signing secrets (`version:secret` format) |
| `BONDERY_PRIVATE_AUTH_*` | GitHub / LinkedIn OAuth for Better Auth |
| `BONDERY_PRIVATE_SERVICE_SECRET` | Internal service HMAC |
| `BONDERY_PUBLIC_WEBAPP_OAUTH_CLIENT_ID` + `BONDERY_PRIVATE_WEBAPP_OAUTH_CLIENT_SECRET` | Webapp BFF client |
| `BONDERY_PUBLIC_OAUTH_CLIENT_ID` | Chrome extension public client |
| `BONDERY_INFRA_CHROME_EXTENSION_ID` | Extension ID for redirect allow-list |
| `BONDERY_PRIVATE_S3_*` | SeaweedFS S3 credentials |

## OAuth

1. Set `BONDERY_PRIVATE_AUTH_GITHUB_*` and `BONDERY_PRIVATE_AUTH_LINKEDIN_*`.
2. In GitHub / LinkedIn apps, callback URL: `https://<BONDERY_INFRA_API_DOMAIN>/auth/callback/<provider>`.
3. Set `BONDERY_INFRA_CHROME_EXTENSION_ID` — provision script adds `https://{id}.chromiumapp.org/` redirect.

## Bootstrap commands

| Command | When |
|---------|------|
| `npm run db:migrate:deploy -w @bondery/db` | Empty or upgraded DB: apply Prisma migrations |
| `provision-oauth-clients.ts` | First boot or after rotating OAuth client secrets |
| `deploy/bondery/scripts/bootstrap-seaweedfs-buckets.mjs` | First boot: create S3 buckets |

## Health gate

Before opening traffic:

```bash
curl -sf https://api.example.com/health
curl -sf https://app.example.com/api/ready
```

Manual: OAuth login, API key auth, avatar upload, reminder dispatch (`pg_cron`).

## Schema migrations after go-live

**Migrations never run automatically** when you `docker compose up`. SQL in `packages/db/prisma/migrations/` is applied separately.

```bash
DATABASE_URL="postgresql://postgres:$BONDERY_PRIVATE_POSTGRES_PASSWORD@127.0.0.1:54322/bondery" \
  npm run db:migrate:deploy -w @bondery/db
```

Then redeploy api/webapp if application code changed.

## Upgrades

1. Test new api/webapp image tags on staging.
2. Redeploy Dokploy compose app.
3. Apply new SQL migrations with `db:migrate:deploy`.

## Backups

| Data | How |
|------|-----|
| Postgres | `docker compose exec -T db pg_dump -U postgres bondery > backup-$(date +%F).sql` |
| Storage files | SeaweedFS volume `seaweedfs-data` — snapshot the volume |
| Redis | Volume `redis-data` (AOF enabled in compose) |

Restore checklist:

1. Stop `api` and `webapp`.
2. Restore dump into `db`.
3. Restore storage volume archive if needed.
4. Start apps; verify `/health` and `/api/ready`.
