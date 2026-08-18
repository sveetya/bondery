# PostHog flags, replay, and logs

**Status: not enabled in Bondery production code today.** Read this before adding SDK features beyond basic `capture`.

## Product analytics vs logs vs events

| Signal | Tool | Examples |
|--------|------|----------|
| User actions | PostHog **events** | `contacts:contact_create`, `signup_flow:user_create` |
| System behavior | PostHog **logs** (OTLP) | API request outcomes, retries, timeouts |
| UX debugging | **Session replay** (gated) | Visual repro — privacy review required |

Do not `capture()` infra failures that belong in logs:

- `database_connection_failed`
- `stripe_api_timeout`
- Step-level "entering function" noise at INFO

See [PostHog logging best practices](https://posthog.com/docs/logs/best-practices).

## Logs (when adopted)

- **Centralize** via OpenTelemetry → PostHog OTLP ingest
- **Wide events at INFO** — one rich log per request per service
- **Step logs at DEBUG** — granular tracing when investigating
- **Structured JSON** — queryable keys, not prose strings
- **Static attribute keys** — same cardinality rules as event properties
- **Business context:** `service`, `route`, `user_id` (UUID), `request_id`
- **Correlate** with product events via `distinct_id` / `request_id` — do not duplicate full payloads
- **Schema as API contract** — version deliberately

### What not to log

- Contact content, emails, passwords, tokens
- Full request/response bodies with PII
- See PostHog automatic PII scrubbing — do not rely on it alone

## Session replay

- Enable only with legal/privacy review (`bondery-legal`)
- Mask sensitive fields in UI
- Not a substitute for product events

## Feature flags

- Same PostHog project as analytics when enabled
- Document flag keys; do not use flags as implicit analytics

## Adoption checklist

- [ ] Product/legal sign-off before replay or new log pipelines
- [ ] Logs separated from product events
- [ ] No PII in log attributes
- [ ] Skill and `bondery-legal` registry updated
