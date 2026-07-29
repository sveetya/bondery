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
```

Requires Docker Compose **v2.38+**. First boot applies migrations, OAuth client provisioning, platform admin promotion, and SeaweedFS buckets via `api` `pre_start` init containers — no manual steps.

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

## Bootstrap commands (local dev only)

| Command | When |
|---------|------|
| `npm run db:migrate:deploy -w @bondery/db` | Host-run API against local Postgres (Compose deploys migrate via `api` `pre_start`) |
| `npm run provision-oauth-clients:dev -w api` | After changing OAuth client env vars locally |
| `npm run bootstrap:seaweedfs` | Host-run dev without starting the `api` container (optional; API dev boot also ensures buckets) |

## Health gate

Before opening traffic:

```bash
curl -sf https://api.example.com/health
curl -sf https://app.example.com/api/ready
```

Manual: OAuth login, API key auth, avatar upload, reminder dispatch (`pg_cron`).

## Schema migrations after go-live

Schema changes ship in `packages/db/prisma/migrations/`. On Compose deployments, `api` `pre_start` runs `prisma migrate deploy` and `functions.sql` automatically when the `api` service is recreated (typically when you pull a new API image).

For host-run migrations outside Compose (e.g. manual ops against exposed Postgres):

```bash
DATABASE_URL="postgresql://postgres:$BONDERY_PRIVATE_POSTGRES_PASSWORD@127.0.0.1:54322/bondery" \
  npm run release-migrate -w @bondery/db
```

`/health` does **not** check for pending migrations — it probes live dependencies only.

## Upgrades

1. Test new api/webapp image tags on staging.
2. Redeploy Dokploy compose app (pulls new images; recreates `api` → `pre_start` applies pending migrations).
3. Verify `/health` and `/api/ready`.

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
