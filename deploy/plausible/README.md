# Plausible Community Edition (marketing analytics)

**Bondery production only** — self-hosted, cookieless analytics for the marketing website (`usebondery.com`). Not part of the self-host product (`deploy/bondery`) or the website container stack (`deploy/ops`).

Product analytics remain on PostHog in the webapp only.

## What this is

| Service | Image | Notes |
|---------|-------|--------|
| `plausible` | `ghcr.io/plausible/community-edition:v3.2.1` | Web UI + event ingestion |
| `plausible_db` | `postgres:16-alpine` | Metadata |
| `plausible_events_db` | `clickhouse/clickhouse-server:24.12-alpine` | Event store |

Expect **~2 GB RAM** for Postgres + ClickHouse + Plausible on a small VPS.

## Prerequisites

- Docker + Docker Compose
- DNS `A`/`AAAA` for `BONDERY_INFRA_PLAUSIBLE_DOMAIN` (default `plausible.usebondery.com`)
- `docker network create dokploy-network` (shared with `deploy/ops` Traefik)

## Quick start (Dokploy)

| Setting | Value |
|---------|-------|
| Provider | **Docker Compose** |
| Compose path | `deploy/plausible/compose.yml` |
| Override | `deploy/plausible/compose.override.yml` (from `.example`) |
| Domain | `BONDERY_INFRA_PLAUSIBLE_DOMAIN` |

```bash
cd deploy/plausible
cp .env.example .env
cp compose.override.yml.example compose.override.yml

# Generate secrets (see .env.example comments)
# Set BASE_URL=https://<BONDERY_INFRA_PLAUSIBLE_DOMAIN>

docker compose up -d
```

1. Visit `BASE_URL` and create the first admin user.
2. In Plausible, add a site: **`usebondery.com`** (must match `BONDERY_PUBLIC_PLAUSIBLE_DOMAIN` on the website).
3. Set `DISABLE_REGISTRATION=invite_only` (default) after onboarding.

## Website integration

The marketing site (`deploy/ops`) loads the tracker when both are set:

| Variable | Example |
|----------|---------|
| `BONDERY_PUBLIC_PLAUSIBLE_DOMAIN` | `usebondery.com` |
| `BONDERY_PUBLIC_PLAUSIBLE_HOST` | `https://plausible.usebondery.com` |

`deploy/ops/docker-compose.yml` derives these from `BONDERY_INFRA_WEBSITE_DOMAIN` and `BONDERY_INFRA_PLAUSIBLE_DOMAIN`.

## Local smoke (no Traefik)

Expose Plausible on a host port by adding to `compose.override.yml`:

```yaml
services:
  plausible:
    ports:
      - "8000:80"
```

Set `BASE_URL=http://localhost:8000` in `.env`.

## Upgrades

Pin the image tag in `compose.yml` and follow [Plausible CE upgrade notes](https://github.com/plausible/community-edition/wiki). Back up Postgres and ClickHouse volumes before upgrading.

## Security

- Do not expose Postgres or ClickHouse ports publicly.
- Keep `DISABLE_REGISTRATION=invite_only` in production after the first admin exists.
- Plausible admin is separate from Bondery product auth.
