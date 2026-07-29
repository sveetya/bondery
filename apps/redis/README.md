# redis

Local Redis for API development: rate limiting, Better Auth secondary storage, sync wake pub/sub, and WebSocket tickets.

Uses port **26636** (`DEV_PORTS.REDIS` / `DEV_REDIS_URL` in `@bondery/schemas`).

Better Auth session and verification keys use prefix `bondery:auth:` (isolated from `sync:ws-ticket:*` and rate-limit keys).

Production and self-host Redis live in [`deploy/bondery/`](../../deploy/bondery/) — not this workspace.

**Redis is required** for local API development — start this container before `npm run dev` in `apps/api`.

## Commands

Run from this directory (`apps/redis`) or with `-w redis` from the repo root:

| Command | Description |
|---------|-------------|
| `npm run start` | Start Redis in Docker (detached) |
| `npm run stop` | Stop and remove the container |
| `npm run status` | Show container health |
| `npm run logs` | Tail Redis logs |

```bash
# From repo root
npm run start -w redis
npm run status -w redis
docker exec bondery-redis redis-cli ping   # → PONG
```

## API wiring

In `apps/api/.env.development.local` (default in `.env.development.example`):

```text
BONDERY_PRIVATE_REDIS_URL="redis://127.0.0.1:26636"
```

Full guide: [docs/contributing/local-setup.md](../../docs/contributing/local-setup.md#redis).
