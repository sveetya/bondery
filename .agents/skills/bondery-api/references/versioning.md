# API versioning

## No URL path versioning

Bondery does **not** use `/api/v1` or `/v1` URL prefixes. Fastify routes mount at resource roots:

```
/contacts
/groups
/me/settings
```

Production: `https://api.usebondery.com/contacts` (no version segment).

The webapp BFF prepends `/api` on the webapp origin (`toBffApiPath("/contacts")` → `/api/contacts`). That `/api` segment is a **BFF routing prefix**, not an API version.

OpenAPI `info.version` in `apps/api/src/openapi/swagger-config.ts` is **documentation metadata only** (currently `1.0.0`) — not a runtime version gate.

## Coordinated deploy

Bondery owns API + webapp + mobile. Ship contract changes in one coordinated deploy:

- No silent aliases (`q` → use `search` only)
- No top-level `totalCount`/`limit`/`offset` on paginated responses — nest under `pagination`
- Update all clients and OpenAPI path docs together

See breaking-change rules in [api-design.md](./api-design.md).

## Non-breaking vs breaking changes

**Non-breaking** (no new URL version needed):

- Adding new fields to responses
- Adding new optional query parameters
- Adding new endpoints

**Breaking** (requires coordinated client + API deploy):

- Removing or renaming response fields
- Changing field types
- Changing URL structure or query param names
- Changing authentication method

## Protocol versioning (not URL)

Some clients use **header-based** protocol versioning:

| Client | Mechanism | On mismatch |
|--------|-----------|-------------|
| Mobile sync | `X-Bondery-Sync-Protocol`, SQLite schema headers | 426 Upgrade Required |
| Chrome extension | `X-Bondery-Extension-Version` below `MIN_EXTENSION_VERSION` | 426 Upgrade Required |

Implementation: `apps/api/src/lib/sync/protocol.ts`, `apps/api/src/lib/extension/version-check.ts`.

## Future public API

If third-party integrators require long-lived API stability, URL path versioning (e.g. `/api/v1` on BFF only) may be introduced. That is a **deferred decision** — not current practice. Until then, rely on coordinated monorepo deploys.

## Checklist

- [ ] Contract change classified as breaking vs non-breaking
- [ ] Breaking changes update API, all clients, and OpenAPI in same PR
- [ ] Sync/extension protocol changes bump version constants and handle 426 on clients
- [ ] No `/v1` path segments added without explicit product decision
