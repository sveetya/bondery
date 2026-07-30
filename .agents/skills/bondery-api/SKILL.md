---
name: bondery-api
description: >
  Bondery Fastify API contracts — transport wrappers, list pagination (offset/search/sort),
  resource-keyed responses, mutations, Stripe-style errors, route registration order,
  mobile sync, rate limits, and versioning. Use when adding or changing API routes,
  client API calls, OpenAPI, sync protocol, or API error codes.
metadata:
  version: "1.0.0"
  namespace: bondery
---

# Bondery API

## When to use

- Adding or changing Fastify routes, Zod schemas, or OpenAPI docs
- Implementing client HTTP calls (webapp BFF, mobile, chrome extension)
- Designing list endpoints, pagination, search, or sort behavior
- Create/update mutation responses or error codes
- Mobile offline sync (pull, outbox, materializers)
- Rate limiting or API versioning questions

## Non-negotiables

- Clients call the API through transport wrappers — never scattered raw `fetch` with duplicated auth
- Success responses are **resource-keyed** (`{ contact }`, `{ contacts, pagination }`) — not `{ data }`
- Errors use `{ error: { code, type, message, doc_url, ... } }` — catalog codes only, snake_case
- Paginated lists use **offset** pagination (`limit`, `offset`) — no cursor / `page_token` / `after_id`
- Query param is `search`, not `q`
- Create returns `201` + full resource object — see `references/api-mutations.md`
- Fastify routes use Zod + `fastify-zod-openapi` — not TypeBox
- Registration order is published doc order — see `references/api-route-ordering.md`

## Decision tree

| Task | Read |
|------|------|
| New list endpoint | [references/api-design.md](references/api-design.md) |
| Client HTTP call | [references/api-usage.md](references/api-usage.md) |
| Create/update response | [references/api-mutations.md](references/api-mutations.md) |
| Error codes (server) | [references/api-errors.md](references/api-errors.md) |
| Fastify route / OpenAPI | [references/fastify-routes.md](references/fastify-routes.md) |
| HTTP status codes | [references/status-codes.md](references/status-codes.md) |
| Doc sidebar order | [references/api-route-ordering.md](references/api-route-ordering.md) |
| Mobile sync | [references/sync-architecture.md](references/sync-architecture.md) |
| Health / liveness / readiness probes | [references/health-probes.md](references/health-probes.md) |
| Rate limits | [references/rate-limits.md](references/rate-limits.md) |
| Versioning policy | [references/versioning.md](references/versioning.md) |

Full index: [references/README.md](references/README.md).

For client error display and i18n, see the `bondery-ux` skill (`references/common/api-errors-display.md`). For E2E coverage of API-facing flows, see `bondery-e2e-tests`. For auth, tenant isolation, webhooks, uploads, and route security, see `bondery-security`.

## API design checklist (before merge)

- [ ] Resource URL follows Fastify conventions (plural, kebab-case, static-before-dynamic)
- [ ] Correct HTTP method + status code (not 200 for everything) — see `references/status-codes.md`
- [ ] Zod schema from `@bondery/schemas`; route exported as `AppRoutePlugin`
- [ ] `applyOpenApiRouteMeta(routeOptions, { area })` on every top-level route plugin
- [ ] `description` + `response` on every route schema (`withOkResponse` / `withCreatedResponse`)
- [ ] Paginated list uses nested `pagination` with server-computed `hasMore` (offset only)
- [ ] Create returns `201` + full resource object; mutations per `references/api-mutations.md`
- [ ] New error code → catalog + `/docs/api/errors/{code}` + `en`/`cs`/`de` translations
- [ ] `npm run generate-openapi -w apps/api` — confirm doc order in diff
- [ ] `npm run check-openapi` passes (includes route-order CI check)
- [ ] `check-route-errors`, `npm run check-api-errors` pass at repo root
- [ ] Auth, tenant scoping, webhooks, or uploads touched → `bondery-security` checklist satisfied
