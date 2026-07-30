# Health probes

Canonical paths for liveness and readiness across Bondery deployables.

## Naming rules

| Path | Host | Meaning |
|------|------|---------|
| `GET /health/live` | api, webapp, website | **This container** is running (no upstream dependency checks) |
| `GET /health/ready` | api, webapp, website | **This container** is ready to serve traffic |
| `GET /api/health/live` | webapp only | BFF proxy → Fastify `GET /health/live` |
| `GET /api/health/ready` | webapp only | BFF proxy → Fastify `GET /health/ready` |
| `GET /extension/manifest` | api | Chrome extension min version + store URL (not a health probe) |
| `GET /api/extension/manifest` | webapp | BFF proxy → `GET /extension/manifest` |

**Do not use:** root `/health`, `/status`, `/live`, `/ready`, or `/api/live` / `/api/ready` for container probes.

On the webapp, `/api/*` always means "relates to the Bondery API." Container self-health lives at `/health/*` on the webapp origin.

## Semantic split

| Probe | API | Webapp / website |
|-------|-----|------------------|
| **Liveness** | Process responds; zero dependency checks | Next.js process responds |
| **Readiness** | Postgres, Redis, storage, SMTP, integrations | Runtime env valid (`BONDERY_PUBLIC_*` not placeholders) |

- API readiness returns **503** when `status: unhealthy`; **200** for `ok` or `degraded`.
- Liveness must **never** return 503 for dependency failures — that causes restart storms.
- Do not put product metadata (extension versions, git SHA) on liveness routes.

## API implementation

Routes: [`apps/api/src/lib/health/routes.ts`](../../../apps/api/src/lib/health/routes.ts)

- `GET /health/live` — `rateLimit: false`
- `GET /health/ready` — `HEALTH_TIER` (5 req/min), 60s in-memory cache

Extension manifest: [`apps/api/src/routes/extension/manifest-route.ts`](../../../apps/api/src/routes/extension/manifest-route.ts)

Auth bypass: health paths and `/extension/manifest` skip extension version enforcement in [`version-check.ts`](../../../apps/api/src/lib/extension/version-check.ts).

## Webapp BFF

| Route file | Proxies |
|------------|---------|
| `app/api/health/live/route.ts` | `/health/live` |
| `app/api/health/ready/route.ts` | `/health/ready` |
| `app/api/extension/manifest/route.ts` | `/extension/manifest` |

Container probes (no BFF, no upstream calls):

| Route file | Checks |
|------------|--------|
| `app/health/live/route.ts` | Process up |
| `app/health/ready/route.ts` | `validateWebappRuntimeConfigAtStartup()` |

## Consumers

| Client | Endpoint |
|--------|----------|
| Docker / K8s (api) | `GET /health/live` on api host |
| Docker / K8s (webapp) | `GET /health/live` on webapp host |
| Unavailable page | `clientApiFetch("/api/health/ready")` |
| Chrome extension version check | `${apiUrl}/extension/manifest` |
| Mobile connectivity probe | `${API_URL}/health/live` |

## Security

- All probe and manifest routes are **public** and **unauthenticated**.
- Never rate-limit liveness probes (kubelet / Docker hit them every few seconds).
- API readiness is rate-limited (`HEALTH_TIER`); cache aggressively to avoid 429 on scrapers.

## Checklist (new health-related routes)

- [ ] Liveness has no dependency checks and `rateLimit: false`
- [ ] Readiness 503 only when this service should stop receiving traffic
- [ ] Webapp container probes under `/health/*`, not `/api/*`
- [ ] BFF API health under `/api/health/*`
- [ ] Extension config on `/extension/manifest`, not mixed into liveness
- [ ] `version-check.ts` bypass updated for new public paths
- [ ] Deploy docs and Docker HEALTHCHECK updated
