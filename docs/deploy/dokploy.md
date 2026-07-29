# Dokploy deployment (product Compose + ops website)

Canonical production topology — **two** Compose apps:

| Host | Service | Stack |
|------|---------|--------|
| `app.usebondery.com` | `webapp` :26632 | [`deploy/bondery`](../../deploy/bondery/) Compose |
| `api.usebondery.com` | `api` :26631 | same Compose file |
| `storage.usebondery.com` | SeaweedFS S3 :8333 | same Compose — object storage |
| (internal) | `redis`, `db` | same Compose — **never** attach a domain |
| `usebondery.com` | `website` :26630 | [`deploy/ops`](../../deploy/ops/) Compose (Bondery prod only) |

Self-hosters use **only** [`deploy/bondery`](../../deploy/bondery/) (api + webapp + redis + Postgres + SeaweedFS). Marketing lives in ops and is not part of the self-host distribution. Guides: [`deploy/bondery/README.md`](../../deploy/bondery) · [`docs/deploy/self-host.md`](./self-host.md) · [`deploy/ops/README.md`](../../deploy/ops).

## Product Compose application (`deploy/bondery`)

| Setting | Value |
|---------|-------|
| Provider | **Docker Compose** |
| Compose path | `deploy/bondery/docker-compose.yml` (includes `docker-compose.postgres.yml` + `docker-compose.seaweedfs.yml`) |
| Domains | Traefik labels via `BONDERY_INFRA_WEBAPP_DOMAIN` / `BONDERY_INFRA_API_DOMAIN` / `BONDERY_INFRA_STORAGE_DOMAIN` |

### Environment

Copy [`deploy/bondery/.env.example`](../../deploy/bondery/.env.example) into Dokploy env (or a compose `.env`):

```bash
BONDERY_INFRA_API_DOMAIN=api.usebondery.com
BONDERY_INFRA_WEBAPP_DOMAIN=app.usebondery.com
BONDERY_INFRA_WEBSITE_DOMAIN=usebondery.com
BONDERY_INFRA_STORAGE_DOMAIN=storage.usebondery.com
BONDERY_INFRA_CHROME_EXTENSION_ID=lpcmokfekjjejnpobhbkgmjkodfhpmha
BONDERY_PRIVATE_REDIS_URL=redis://redis:6379
```

Plus Postgres/Better Auth secrets, API secrets, and OAuth vars from [`.env.example`](../../deploy/bondery/.env.example). First boot: `npm run db:migrate:deploy -w @bondery/db` then `provision-oauth-clients.ts`.

**Important:**

- Image tags: `production` (floating channel) is the default; pin semver when you want a fixed rollback target.
- Set hostnames only (`BONDERY_INFRA_*_DOMAIN`). Compose derives `https://…` URLs and Traefik `Host()` rules.
- Webapp never receives `PRIVATE_*` / `BONDERY_PRIVATE_*` — compose allowlists public vars only.
- Compose sets `BONDERY_INFRA_INTERNAL_API_URL=http://api:26631`.

### Health checks

| Service | Liveness | Notes |
|---------|----------|--------|
| `webapp` | `GET /api/live` | Do **not** use `/api/status` (proxies API) |
| `webapp` readiness | `GET /api/ready` | Runtime config valid |
| `api` | `GET /status` | Process up |
| `api` deps | `GET /health` | Redis / Postgres / storage / integrations |

### Isolated Deployments

Leave Dokploy **Isolated Deployments** off for the default Bondery app (one stack per host). Optional for operators running multiple Bondery instances on one Dokploy host — see Dokploy docs.

## Ops Compose application (`deploy/ops` — marketing website)

| Setting | Value |
|---------|-------|
| Provider | **Docker Compose** |
| Compose path | `deploy/ops/docker-compose.yml` |
| Image | `ghcr.io/usebondery/website:production` (hardcoded floating channel) |
| Domain | `BONDERY_INFRA_WEBSITE_DOMAIN` Traefik label → port `26630` |

**CI:** Push to the `release` branch (path-filtered) runs [`.github/workflows/deploy-website.yml`](../../.github/workflows/deploy-website.yml), which builds/pushes `:production` + `:sha-<short>`. No `website-X.Y.Z` tags. Optional Dokploy redeploy webhook: secret `BONDERY_OPS_DOKPLOY_WEBSITE_DEPLOY_WEBHOOK`.

```bash
BONDERY_INFRA_WEBAPP_DOMAIN=app.usebondery.com
BONDERY_INFRA_WEBSITE_DOMAIN=usebondery.com
```

Compose derives `BONDERY_PUBLIC_*_URL` from those domains. Health: `GET /api/live` (liveness), `GET /api/ready` (env valid).

**Cutover from Nixpacks:** stop the old Nixpacks/Railpack website app **before** deploying ops Compose (same Traefik Host). Details: [`deploy/ops/README.md`](../../deploy/ops).

## OAuth (Better Auth on API)

| Setting | Value |
|---------|-------|
| **Site URL** | `https://app.usebondery.com` (`BONDERY_INFRA_WEBAPP_DOMAIN`) |
| **Redirect URLs** | Webapp BFF + mobile deep links — provisioned via `provision-oauth-clients.ts` |
| Chrome extension | Derived from `BONDERY_INFRA_CHROME_EXTENSION_ID` → `https://{id}.chromiumapp.org/` |

### GitHub / LinkedIn OAuth apps

Authorization callback URL:

```
https://api.usebondery.com/auth/callback/github
https://api.usebondery.com/auth/callback/linkedin
```

(Replace host with your `BONDERY_INFRA_API_DOMAIN`.)

## Cutover (API-only Compose + separate webapp image → unified stack)

### Preflight

1. Record current image digests / env for API Compose and standalone webapp.
2. Keep the standalone webapp Dokploy app running as rollback until verified.
3. Redis volume continuity is optional (rate-limit / sync-wake / WS tickets only — disposable).

### Steps

1. Point the existing Compose app at `deploy/bondery/docker-compose.yml` (in-place preferred).
2. Set domains and secrets from `.env.example` (image tags optional — unset falls back to `:production`).
3. Deploy; wait until `redis`, `db`, and `api` `/status` OK.
4. Confirm Traefik routes: `api.usebondery.com` → `api:26631`, `app.usebondery.com` → `webapp:26632`. Do **not** route Redis or Postgres.
5. Stop the old standalone webapp app if it conflicts on the domain.
6. Smoke: `curl` live/ready/status/health; login; one authenticated mutation; sync/WebSocket if used.

### Rollback

1. Re-point `app.usebondery.com` to the preserved standalone webapp image app.
2. Restore previous image tags or digests and redeploy.
3. A fresh Redis volume on rollback is acceptable.

### After 24–48h healthy bake

1. Remove the old Dokploy webapp Docker Image application.

## API with external Redis

Advanced: run the API image alone with managed Redis — see [api-container.md](./api-container.md).
