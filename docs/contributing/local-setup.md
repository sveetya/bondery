# Local development setup

This guide walks you through setting up the full Bondery development environment on your machine. The recommended order follows the dependency chain: database first, then API, then the apps (including mobile pull sync).

**Environment variables:** edit root `.env.local` once, then sync — see [Environment configuration](environment.md).

```bash
npm install
npm run setup:dev
# edit .env.local (OAuth / optional integrations)
# start Postgres + Redis (see below)
npm run env
npm run dev
```

## Prerequisites

Make sure the following tools are installed before you begin:

| Tool | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org/) | ≥ 20 | LTS recommended |
| [npm](https://www.npmjs.com/) | ≥ 11 | Bundled with Node.js |
| [Docker](https://www.docker.com/) | latest | Required for local Postgres and Redis |

For mobile development you also need Expo tooling (installed via root `npm install`) and a native toolchain: **iOS** — Xcode + Simulator or a physical device; **Android** — Android Studio + emulator or USB debugging.

## 1. Clone and install

```bash
git clone https://github.com/usebondery/bondery.git
cd bondery
npm install
npm run setup:dev
```

This installs dependencies for all apps and packages in the monorepo in a single pass, then creates root `.env.local` from the example.

---

## 2. Postgres database

The local Postgres instance is the foundation everything else connects to. Schema is managed by **Prisma** in [`packages/db`](../../packages/db).

### Environment variables

`DATABASE_URL` and `BONDERY_PRIVATE_POSTGRES_PASSWORD` live in root `.env.local`. After editing, run `npm run env`. See [Environment configuration](environment.md).

### Start (Docker)

From the repo root (reads `BONDERY_PRIVATE_POSTGRES_PASSWORD` from `.env.local`):

```bash
npm run start:postgres
```

Postgres listens on **host port 54322** (`postgresql://postgres:<password>@127.0.0.1:54322/bondery` — password must match `BONDERY_PRIVATE_POSTGRES_PASSWORD` in `.env.local`).

Stop with `npm run stop:postgres`.

### Migrations

From the repo root (with `packages/db/.env.local` synced):

```bash
npm run db:migrate:dev -w @bondery/db    # apply migrations in dev
npm run db:functions -w @bondery/db      # apply SQL functions (extensions, RPCs)
```

### Useful commands

| Command | Description |
|---|---|
| `npm run db:migrate:dev -w @bondery/db` | Create/apply Prisma migrations |
| `npm run db:studio -w @bondery/db` | Prisma Studio GUI |
| `docker compose -f deploy/bondery/docker-compose.dev-db.yml down` | Stop local Postgres (or `npm run stop:postgres`) |

### Mobile sync (Postgres changelog)

Mobile offline sync uses **custom pull/bootstrap** endpoints on the API (`GET /api/sync/bootstrap`, `GET /api/sync/pull`) backed by `sync_change_log`. No separate sync service is required beyond Postgres + API.

For a fresh local DB: run migrations + `db:functions`, then restart the API.

### OAuth client provisioning

After migrations, provision Better Auth OAuth clients (webapp BFF + chrome extension):

```bash
cd apps/api
npx tsx --env-file=.env.development.local scripts/provision-oauth-clients.ts
```

---

## 2b. Object storage (SeaweedFS)

Avatar and logo uploads use the S3-compatible SeaweedFS gateway. Credentials live **only** in root `.env.local` (`BONDERY_PRIVATE_S3_ACCESS_KEY_ID` / `SECRET`); the `seaweedfs-s3` container renders its config from those vars at startup.

From the repo root:

```bash
npm run start:seaweedfs          # S3 gateway on http://127.0.0.1:8333
npm run bootstrap:seaweedfs      # optional — API dev boot also ensures buckets on start
```

Verify: `curl -s http://127.0.0.1:8333/status`

Stop with `npm run stop:seaweedfs`.

---

## 3. API server (`apps/api`)

### Environment variables

Prefer root `.env.local` + `npm run env` (see [Environment configuration](environment.md)). That writes `apps/api/.env.development.local`.

Also set `BONDERY_PRIVATE_BETTER_AUTH_SECRETS` and OAuth provider credentials in root `.env.local`. See [API keys (long-lived integration tokens)](#api-keys-long-lived-integration-tokens) below.

For mobile sync, set CORS for Expo web if needed:

```text
BONDERY_PUBLIC_EXTRA_ALLOWED_ORIGINS=http://localhost:26634
```

See [Mobile sync (Postgres changelog)](#mobile-sync-postgres-changelog). `BONDERY_PUBLIC_EXTRA_ALLOWED_ORIGINS` allows Expo web dev server CORS when testing mobile web.

#### Redis

Redis powers **rate limiting**, **Better Auth secondary storage** (`bondery:auth:*`), **mobile sync wake** (pub/sub), and **WebSocket ticket** storage in the API. Local Docker Redis is **required** for API development.

| Mode | `BONDERY_PRIVATE_REDIS_URL` | When to use |
|------|---------------------|-------------|
| **Local Docker (required)** | `redis://127.0.0.1:26636` | Normal local API work — matches production behavior |

`BONDERY_PRIVATE_REDIS_URL` is **required** in development and production. The health probe at `GET /health` reports Redis status.

##### Quick start — local Docker Redis

From the repo root (Docker must be running):

```bash
npm run start -w redis
```

Verify:

```bash
npm run status -w redis
# PING → PONG
docker exec bondery-redis redis-cli ping
```

Wire the API in `apps/api/.env.development.local` (also the default in `.env.development.example`):

```text
BONDERY_PRIVATE_REDIS_URL="redis://127.0.0.1:26636"
```

Port **26636** is `DEV_PORTS.REDIS` / `DEV_REDIS_URL` in [`packages/schemas/src/constants/dev-ports.ts`](../../packages/schemas/src/constants/dev-ports.ts). Stop with `npm run stop -w redis`.

> **Do not** leave a dead cloud URL (e.g. deleted Upstash) in `.env.development.local`. The API will try to connect on startup and fail with `ENOTFOUND` / `Connection is closed`.

##### Production / self-host

Use the canonical stack in [`deploy/bondery/`](../../deploy/bondery/) (webapp + API + bundled Redis). Default:

```text
BONDERY_PRIVATE_REDIS_URL="redis://redis:6379"
```

External Redis and Dokploy cutover: [docs/deploy/dokploy.md](../deploy/dokploy.md) · [docs/deploy/api-container.md](../deploy/api-container.md).

#### API keys (long-lived integration tokens)

API keys are managed by **Better Auth** on the API. No separate JWT signing JWK is required.

1. Ensure Postgres, Redis, and the API are running with valid `BONDERY_PRIVATE_BETTER_AUTH_SECRETS`.
2. Sign in to the webapp → **Settings** → **API keys** → create a key.
3. Test:

```bash
curl -H "Authorization: Bearer bondery_key_<keyId>_<secret>" \
  http://localhost:26631/api/contacts
```

See [Authentication](../../api/authentication.md) for access levels and allowed routes.

### Start

```bash
cd apps/api
npm run dev
```

The API server starts on **port 26631** with hot reload enabled.

---

## 4. Web application (`apps/webapp`)

### Environment variables

Filled by `npm run env` into `apps/webapp/.env.development.local` — see [Environment configuration](environment.md).

### Start

```bash
cd apps/webapp
npm run dev
```

The webapp starts on **port 26632**. Open [http://localhost:26632](http://localhost:26632) in your browser.

---

## 5. Marketing website (`apps/website`)

Uses `BONDERY_PUBLIC_WEBAPP_URL` / `BONDERY_PUBLIC_WEBSITE_URL` from env sync (client-bundled via `next.config.ts`).

### Start

```bash
cd apps/website
npm run dev
```

The website starts on **port 26630**. Open [http://localhost:26630](http://localhost:26630) in your browser.

---

## 6. Chrome extension (`apps/chrome-extension`)

### Environment variables

Filled by `npm run env`. Set `BONDERY_PUBLIC_OAUTH_CLIENT_ID` and `BONDERY_INFRA_CHROME_EXTENSION_ID` in root `.env.local` — see [Chrome Extension OAuth workflow](../../.agents/workflows/CHROME-EXTENSION-OAUTH.md) and [Environment configuration](environment.md).

### Start

```bash
cd apps/chrome-extension
npx wxt prepare   # only needed once after install
npx wxt            # or: npm run dev
```

Open `chrome://extensions` in Chrome, enable **Developer mode**, click **Load unpacked**, and select the generated `dist/chrome-mv3-dev` folder.

> **New extension ID?** Every developer machine gets a unique Chrome extension ID, which changes the OAuth redirect URI. See [.agents/workflows/CHROME-EXTENSION-OAUTH.md](../../.agents/workflows/CHROME-EXTENSION-OAUTH.md).

---

## 7. Mobile application (`apps/mobile`)

Run the mobile app against your local API stack, including offline sync. Requires Postgres, Redis, and the API (steps 2–3) first.

### Environment variables

Filled by `npm run env` into `apps/mobile/.env.local` (`BONDERY_PUBLIC_*`). See [Environment configuration](environment.md). Expo loads those into `app.config.ts` `extra`.

#### Physical device on the same Wi‑Fi

In root `.env.local`, replace `127.0.0.1` / `localhost` with your machine's LAN IP (e.g. `192.168.1.42`) for API URLs, then `npm run env`. The phone cannot reach your laptop's loopback interface.

Also ensure the API is reachable on the LAN and your firewall allows inbound connections on port `26631`.

#### Android emulator note

On Android emulators, `127.0.0.1` and `localhost` in env vars are **automatically rewritten** to `10.0.2.2` (the host loopback from the emulator). You can keep `127.0.0.1` in `.env.local`.

iOS Simulator can use `127.0.0.1` directly. Physical iOS devices need the LAN IP like Android hardware.

### Start

**Option A — API + mobile from repo root** (Postgres + Redis must already be running):

```bash
npm run mobile
```

**Option B — mobile only** (with Postgres, Redis, and API already running):

```bash
cd apps/mobile
npm run dev
```

Then press `i` for iOS Simulator, `a` for Android emulator, or scan the QR code with Expo Go / a dev client.

#### Native dev builds

For SQLite sync and background tasks, use a development build instead of Expo Go:

```bash
cd apps/mobile
npm run dev:prebuild    # regenerates android/ and ios/ — only when native deps change
npm run android:dev     # USB device or emulator
npm run ios             # iOS Simulator or device
```

### Verify sync

1. Sign in with GitHub or LinkedIn (same providers as the webapp).
2. Wait for the initial sync banner to clear — contacts should match your account.
3. Toggle airplane mode, edit a contact, then reconnect — changes should drain from the outbox and appear on web.

If sync requests return **426**, protocol or SQLite schema versions are mismatched — rebuild the app after pulling API/mobile changes.

If bootstrap or pull return **401**, confirm the mobile session token and API URL match your local stack.

### Mobile useful commands

| Command | Description |
|---|---|
| `npm run mobile` | Start API + Metro from repo root |
| `npm run check-env --workspace=mobile` | Validate required env vars |
| `npm run check-sync-patterns --workspace=mobile` | Lint tier-1 data access patterns |
| `npm run check-types --workspace=mobile` | TypeScript check |
| `adb pair` / `adb connect` | Pair wireless Android debugging (`android:pair` script) |

### Mobile troubleshooting

| Issue | Fix |
|---|---|
| `Missing BONDERY_PUBLIC_*` on start | Run `npm run env` from the repo root (or `npm run setup:dev`) |
| Network request failed on device | Use LAN IP, not `127.0.0.1`; check firewall |
| Empty contacts after login | API not running, or bootstrap failed — check API logs and mobile sync headers |
| OAuth redirect fails | Better Auth redirect URLs must include the Expo/dev client scheme |
| Metro `EMFILE` | Set `METRO_MAX_WORKERS=4` in `.env.local` |

See also [Sync architecture (mobile)](sync-architecture.md) and [apps/mobile/README.md](../../apps/mobile/README.md).

---

## Running everything at once

> **Before using these commands**, complete environment setup for each app in steps 2–7 above.

From the repo root, start infrastructure first (separate workspaces — run sequentially or in separate terminals):

```bash
# 1. Infrastructure
npm run start:postgres
npm run start:seaweedfs
npm run bootstrap:seaweedfs   # first time only
npm run start -w redis

# 2. App dev
npm run dev:webapp-api

# Or: api + webapp + website + chrome-extension
npm run dev:extension

# Or: api + mobile
npm run mobile
```

These scripts are defined in the root `package.json` and orchestrated by Turborepo (`turbo watch`).

### Production builds

From the **repo root**, use Turborepo to build apps (caching, correct workspace context, same as CI):

```bash
npx turbo build --filter=api
npx turbo build --filter=webapp
npx turbo build --filter=website
npx turbo build --filter=chrome-extension

# Everything that defines a build script
npx turbo build
```

Shortcuts in root `package.json`: `npm run build` (all apps), `npm run build:api`, `build:webapp`, `build:website`.

`turbo build` runs `^build` first, so workspace packages compile to `packages/*/dist` automatically. Apps consume compiled `dist/` via `package.json` exports — no `transpilePackages` or src aliases required.

### Local dev watch

```bash
npm run dev                    # turbo watch dev — all apps with a dev script
npm run dev:webapp-api         # webapp + api (usual local stack)
npm run dev:emails             # React Email preview only (port 26639)
npm run dev:webapp-api-emails  # webapp + api + React Email preview
npm run compile:packages       # one-shot package compile without starting dev servers
```

`dev:webapp-api` cold-starts packages via `compile` (`tsc` to `dist/`, no `rimraf`), then runs app dev servers with package `tsc --watch` companions (`with` in `apps/webapp/turbo.json` and `apps/api/turbo.json`). Production `build` + `^build` is unchanged.

Lint the whole repo from the root: `npm run lint` (Biome format, write fixes). CI runs `biome ci .` read-only.

---

## Quick reference

Port registry: [architecture.md](architecture.md#apps) (`npm run check-dev-ports` in CI).

| App | Source | Dev port | Start command (from app folder) |
|---|---|---|---|
| Postgres (dev) | [`deploy/bondery/docker-compose.dev-db.yml`](../../deploy/bondery/docker-compose.dev-db.yml) | 54322 | `npm run start:postgres` |
| SeaweedFS (dev) | [`deploy/bondery/docker-compose.seaweedfs.yml`](../../deploy/bondery/docker-compose.seaweedfs.yml) | 8333 | `npm run start:seaweedfs` |
| `redis` | [`apps/redis`](../../apps/redis) | 26636 | `npm run start -w redis` |
| `api` | [`apps/api`](https://github.com/usebondery/bondery/tree/main/apps/api) | 26631 | `npm run dev` |
| `webapp` | [`apps/webapp`](https://github.com/usebondery/bondery/tree/main/apps/webapp) | 26632 | `npm run dev` |
| `website` | [`apps/website`](https://github.com/usebondery/bondery/tree/main/apps/website) | 26630 | `npm run dev` |
| `mobile` | [`apps/mobile`](https://github.com/usebondery/bondery/tree/main/apps/mobile) | 26634 (Expo Metro) | `npm run dev` |
| `chrome-extension` | [`apps/chrome-extension`](https://github.com/usebondery/bondery/tree/main/apps/chrome-extension) | 26633 (WXT HMR) | `npx wxt` |
| `@bondery/emails` preview | [`packages/emails`](https://github.com/usebondery/bondery/tree/main/packages/emails) | 26639 | `npm run preview` |
